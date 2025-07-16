import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Car, DollarSign, Clock, MapPin, Star, CheckCircle, XCircle, MessageCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DriverDashboardProps {
  onBack: () => void;
}

interface RideRequest {
  id: string;
  rider_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  estimated_distance_miles: number | null;
  estimated_duration_minutes: number | null;
  estimated_fare_min: number | null;
  estimated_fare_max: number | null;
  rider_notes: string | null;
  created_at: string;
  expires_at: string | null;
  profiles?: {
    full_name: string | null;
    rating: number | null;
  };
}

interface ActiveRide {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  status: string;
  final_fare: number | null;
  profiles?: {
    full_name: string | null;
    phone: string | null;
  } | null;
}

const DriverDashboard = ({ onBack }: DriverDashboardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isOnline, setIsOnline] = useState(false);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [activeRides, setActiveRides] = useState<ActiveRide[]>([]);
  const [customOffers, setCustomOffers] = useState<Record<string, string>>({});
  const [driverApplication, setDriverApplication] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayEarnings: 0,
    totalRides: 0,
    rating: 5.0,
    completionRate: 100
  });

  useEffect(() => {
    if (!user) return;
    
    fetchDriverStatus();
    fetchRideRequests();
    fetchActiveRides();
    fetchDriverStats();
    
    // Set up real-time subscriptions
    const requestsChannel = supabase
      .channel('ride-requests-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ride_requests',
        filter: 'status=eq.searching'
      }, (payload) => {
        console.log('Ride request update:', payload);
        fetchRideRequests();
      })
      .subscribe();

    const ridesChannel = supabase
      .channel('rides-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides'
      }, (payload) => {
        console.log('Ride update:', payload);
        fetchActiveRides();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(ridesChannel);
    };
  }, [user]);

  const fetchDriverStatus = async () => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Check driver application status
      const { data: applicationData } = await supabase
        .from('driver_applications')
        .select('*')
        .eq('driver_id', profileData.id)
        .maybeSingle();

      setDriverApplication(applicationData);
    } catch (error) {
      console.error('Error fetching driver status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRideRequests = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          profiles:rider_id (
            full_name,
            rating
          )
        `)
        .eq('status', 'searching')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRideRequests(data || []);
    } catch (error) {
      console.error('Error fetching ride requests:', error);
    }
  };

  const fetchActiveRides = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          status,
          final_fare,
          rider_id
        `)
        .eq('driver_id', profile.id)
        .in('status', ['pending', 'accepted', 'started'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match interface
      const transformedData: ActiveRide[] = (data || []).map(ride => ({
        id: ride.id,
        pickup_location: ride.pickup_location,
        dropoff_location: ride.dropoff_location,
        status: ride.status,
        final_fare: ride.final_fare,
        profiles: null // We'll fetch rider details separately if needed
      }));

      setActiveRides(transformedData);
    } catch (error) {
      console.error('Error fetching active rides:', error);
    }
  };

  const fetchDriverStats = async () => {
    if (!profile) return;

    try {
      // Get today's completed rides
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayRides, error } = await supabase
        .from('rides')
        .select('final_fare')
        .eq('driver_id', profile.id)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lte('completed_at', `${today}T23:59:59.999Z`);

      if (error) throw error;

      const todayEarnings = todayRides?.reduce((sum, ride) => sum + (ride.final_fare || 0), 0) || 0;
      const totalRides = todayRides?.length || 0;

      setStats(prev => ({
        ...prev,
        todayEarnings,
        totalRides,
        rating: profile.rating || 5.0
      }));
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, fareAmount: number) => {
    try {
      // Create a new ride
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .insert({
          rider_id: rideRequests.find(r => r.id === requestId)?.rider_id,
          driver_id: profile.id,
          pickup_location: rideRequests.find(r => r.id === requestId)?.pickup_location,
          dropoff_location: rideRequests.find(r => r.id === requestId)?.dropoff_location,
          pickup_lat: rideRequests.find(r => r.id === requestId)?.pickup_lat,
          pickup_lng: rideRequests.find(r => r.id === requestId)?.pickup_lng,
          dropoff_lat: rideRequests.find(r => r.id === requestId)?.dropoff_lat,
          dropoff_lng: rideRequests.find(r => r.id === requestId)?.dropoff_lng,
          estimated_fare_min: rideRequests.find(r => r.id === requestId)?.estimated_fare_min,
          estimated_fare_max: rideRequests.find(r => r.id === requestId)?.estimated_fare_max,
          final_fare: fareAmount,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (rideError) throw rideError;

      // Update the ride request status to completed
      const { error: updateError } = await supabase
        .from('ride_requests')
        .update({ status: 'completed' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast({
        title: "Ride Accepted!",
        description: `You've accepted the ride for $${fareAmount.toFixed(2)}`,
      });

      // Refresh data
      fetchRideRequests();
      fetchActiveRides();
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast({
        title: "Error",
        description: "Failed to accept ride request",
        variant: "destructive"
      });
    }
  };

  const handleMakeOffer = async (requestId: string) => {
    const offerAmount = parseFloat(customOffers[requestId]);
    if (!offerAmount || offerAmount <= 0) {
      toast({
        title: "Invalid Offer",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ride_offers')
        .insert({
          ride_id: requestId,
          driver_id: profile.id,
          offered_fare: offerAmount
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Offer Sent!",
        description: `Your offer of $${offerAmount.toFixed(2)} has been sent to the rider`,
      });

      setCustomOffers(prev => ({ ...prev, [requestId]: '' }));
    } catch (error) {
      console.error('Error making offer:', error);
      toast({
        title: "Error",
        description: "Failed to send offer",
        variant: "destructive"
      });
    }
  };

  // Redirect to onboarding if no application exists
  useEffect(() => {
    if (!loading && profile && !driverApplication) {
      navigate('/driver-onboarding');
    }
  }, [loading, profile, driverApplication, navigate]);

  // Show verification pending if application not approved
  if (!loading && driverApplication && driverApplication.status !== 'approved') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Driver Verification in Progress</CardTitle>
              <CardDescription>
                Your application is being reviewed
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800">Verification Required</h3>
                    <p className="text-amber-700 mt-1">
                      You cannot access the driver dashboard until your application is approved. 
                      Current status: <strong>{driverApplication.status.replace('_', ' ')}</strong>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <Button onClick={() => navigate('/driver-onboarding')}>
                  Check Application Status
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Return to Main Menu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Driver Dashboard</h1>
                <p className="text-muted-foreground">Accept rides and manage your earnings</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {isOnline ? "Online" : "Offline"}
                </span>
                <Switch checked={isOnline} onCheckedChange={setIsOnline} />
              </div>
              <Badge variant={isOnline ? "default" : "secondary"} className="px-3 py-1">
                {isOnline ? "Available" : "Unavailable"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                  <p className="text-2xl font-bold text-primary">${stats.todayEarnings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Car className="h-6 w-6 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rides Today</p>
                  <p className="text-2xl font-bold">{stats.totalRides}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="requests" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests">
              Ride Requests {rideRequests.length > 0 && `(${rideRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="active">
              Active Rides {activeRides.length > 0 && `(${activeRides.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {isOnline ? "Available Ride Requests" : "Go Online to Receive Requests"}
              </h2>
              <p className="text-muted-foreground">
                Accept rides at suggested prices or make your own offers
              </p>
            </div>

            {!isOnline ? (
              <Card className="text-center p-12">
                <CardContent>
                  <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">You're Currently Offline</h3>
                  <p className="text-muted-foreground mb-6">
                    Turn on your availability to start receiving ride requests from nearby riders.
                  </p>
                  <Button onClick={() => setIsOnline(true)}>
                    Go Online
                  </Button>
                </CardContent>
              </Card>
            ) : rideRequests.length === 0 ? (
              <Card className="text-center p-12">
                <CardContent>
                  <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Requests Available</h3>
                  <p className="text-muted-foreground">
                    New ride requests will appear here automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {rideRequests.map((request) => (
                  <Card key={request.id} className="border-border/50 hover:border-primary/50 transition-all">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="font-semibold text-primary">
                                {request.profiles?.full_name?.charAt(0) || 'R'}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold">{request.profiles?.full_name || 'Rider'}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{request.estimated_duration_minutes || 'N/A'} min</span>
                                <span>•</span>
                                <span>{request.estimated_distance_miles?.toFixed(1) || 'N/A'} miles</span>
                                {request.profiles?.rating && (
                                  <>
                                    <span>•</span>
                                    <Star className="h-4 w-4 text-amber-500" />
                                    <span>{request.profiles.rating.toFixed(1)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-muted-foreground">Pickup:</span>
                              <span className="font-medium">{request.pickup_location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <span className="text-muted-foreground">Destination:</span>
                              <span className="font-medium">{request.dropoff_location}</span>
                            </div>
                          </div>

                          {request.rider_notes && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-start gap-2">
                                <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <p className="text-sm">{request.rider_notes}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ${request.estimated_fare_min?.toFixed(2) || '0.00'} - ${request.estimated_fare_max?.toFixed(2) || '0.00'}
                            </div>
                            <p className="text-xs text-muted-foreground">Estimated fare range</p>
                          </div>

                          <div className="flex flex-col gap-3 min-w-[200px]">
                            {/* Custom Offer Input */}
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Your offer"
                                value={customOffers[request.id] || ''}
                                onChange={(e) => setCustomOffers(prev => ({ 
                                  ...prev, 
                                  [request.id]: e.target.value 
                                }))}
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMakeOffer(request.id)}
                                disabled={!customOffers[request.id] || parseFloat(customOffers[request.id]) <= 0}
                              >
                                Offer
                              </Button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleAcceptRequest(request.id, request.estimated_fare_max || 0)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept ${request.estimated_fare_max?.toFixed(2)}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Active Rides</h2>
              <p className="text-muted-foreground">
                Manage your current and upcoming rides
              </p>
            </div>

            {activeRides.length === 0 ? (
              <Card className="text-center p-12">
                <CardContent>
                  <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Active Rides</h3>
                  <p className="text-muted-foreground">
                    Accepted rides will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {activeRides.map((ride) => (
                  <Card key={ride.id} className="border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">
                            {ride.profiles?.full_name || 'Rider'}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-green-500" />
                              <span>{ride.pickup_location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-red-500" />
                              <span>{ride.dropoff_location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="mb-2">
                            {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                          </Badge>
                          <div className="text-2xl font-bold text-primary">
                            ${ride.final_fare?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DriverDashboard;