import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Clock, Star, User, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import RideBooking from "@/components/rider/RideBooking";

interface RiderDashboardProps {
  onBack: () => void;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  rating: number;
  total_ratings: number;
}

interface RideRequest {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  estimated_fare_min: number;
  estimated_fare_max: number;
  status: string;
  created_at: string;
  expires_at: string;
}

interface RecentRide {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  final_fare: number;
  status: string;
  created_at: string;
  driver: {
    full_name: string;
  } | null;
}

const RiderDashboard = ({ onBack }: RiderDashboardProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'overview' | 'booking'>('overview');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchActiveRequest();
      fetchRecentRides();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      console.log('RiderDashboard: Fetching profile for user:', user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      console.log('RiderDashboard: Profile fetched:', data);
      setProfile(data);
    } catch (error) {
      console.error('RiderDashboard: Error fetching profile:', error);
      setLoading(false);
    }
  };

  const fetchActiveRequest = async () => {
    if (!profile) return;
    
    try {
      console.log('RiderDashboard: Fetching active request for profile:', profile.id);
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('rider_id', profile.id)
        .eq('status', 'searching')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      console.log('RiderDashboard: Active request:', data);
      setActiveRequest(data);
    } catch (error) {
      console.error('RiderDashboard: Error fetching active request:', error);
    }
  };

  const fetchRecentRides = async () => {
    if (!profile) return;
    
    try {
      console.log('RiderDashboard: Fetching recent rides for profile:', profile.id);
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey(full_name)
        `)
        .eq('rider_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      console.log('RiderDashboard: Recent rides:', data);
      setRecentRides(data || []);
    } catch (error) {
      console.error('RiderDashboard: Error fetching recent rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRideRequested = (requestId: string) => {
    fetchActiveRequest(); // Refresh to show the new request
    setCurrentView('overview'); // Return to overview
  };

  const cancelActiveRequest = async () => {
    if (!activeRequest) return;

    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('id', activeRequest.id);

      if (error) throw error;
      setActiveRequest(null);
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'searching': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const timeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const minutes = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60));
    return Math.max(0, minutes);
  };

  if (currentView === 'booking') {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentView('overview')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Book a Ride</h1>
                <p className="text-muted-foreground">Request a ride and connect with drivers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {profile && (
            <RideBooking 
              profileId={profile.id} 
              onRideRequested={handleRideRequested}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Rider Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {profile?.full_name || 'Rider'}</p>
            </div>
            {profile && (
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="font-medium">{profile.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({profile.total_ratings})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Active Request */}
          {activeRequest && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-orange-600" />
                  Active Ride Request
                </CardTitle>
                <CardDescription>
                  Looking for drivers • Expires in {timeUntilExpiry(activeRequest.expires_at)} minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">From</p>
                      <p className="font-medium">{activeRequest.pickup_location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">To</p>
                      <p className="font-medium">{activeRequest.dropoff_location}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estimated Fare</p>
                      <p className="font-bold text-lg">
                        ${activeRequest.estimated_fare_min.toFixed(2)} - ${activeRequest.estimated_fare_max.toFixed(2)}
                      </p>
                    </div>
                    <Button variant="destructive" onClick={cancelActiveRequest}>
                      Cancel Request
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('booking')}>
              <CardContent className="p-6 text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Book a Ride</h3>
                <p className="text-muted-foreground">Request a ride and connect with available drivers</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Schedule Later</h3>
                <p className="text-muted-foreground">Plan your ride for a future date and time</p>
                <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Recent Rides */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Rides</CardTitle>
              <CardDescription>Your last 5 completed rides</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentRides.length > 0 ? (
                <div className="space-y-4">
                  {recentRides.map((ride) => (
                    <div key={ride.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          📍 {ride.pickup_location}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          🎯 {ride.dropoff_location}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(ride.created_at).toLocaleDateString()} • 
                          {ride.driver ? ` Driver: ${ride.driver.full_name}` : ' No driver assigned'}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(ride.status)}>
                          {ride.status}
                        </Badge>
                        {ride.final_fare && (
                          <div className="font-bold text-sm mt-1">
                            ${ride.final_fare.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rides yet. Book your first ride to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;