import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Navigation,
  Car,
  Zap,
  Send,
  AlertCircle,
  CheckCircle,
  Timer,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { formatDistanceToNow } from "date-fns";

interface AvailableRidesProps {
  driverId: string;
}

interface RideRequest {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  estimated_fare_min: number;
  estimated_fare_max: number;
  estimated_distance_miles: number;
  estimated_duration_minutes: number;
  status: string;
  created_at: string;
  expires_at: string;
  ride_type: string;
  payment_method: string;
  rider_notes: string;
  rider: {
    full_name: string;
    rating: number;
    total_ratings: number;
  };
}

interface RideOffer {
  id: string;
  ride_id: string;
  offered_fare: number;
  status: string;
  created_at: string;
}

export default function AvailableRides({ driverId }: AvailableRidesProps) {
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  const fetchingRef = useRef(false);
  
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [myOffers, setMyOffers] = useState<RideOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offerAmounts, setOfferAmounts] = useState<Record<string, string>>({});
  const [submittingOffers, setSubmittingOffers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!driverId) {
      console.error('AvailableRides: No driverId provided');
      setLoading(false);
      return;
    }
    
    console.log('AvailableRides: Setting up for driver', driverId);
    
    // Initial fetch
    fetchAvailableRides();
    fetchMyOffers();
    
    // Setup subscriptions with proper cleanup
    const cleanup = setupRealTimeSubscriptions();
    
    // Cleanup function
    return () => {
      console.log('AvailableRides: Cleaning up subscriptions');
      cleanup();
    };
  }, [driverId]);

  const fetchAvailableRides = async () => {
    if (!driverId) {
      console.error('Cannot fetch rides: No driverId');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching available rides for driver:', driverId);
      
      const { data, error } = await supabase
        .from('ride_requests')
        .select(`
          *,
          rider:profiles!ride_requests_rider_id_fkey(
            full_name,
            rating,
            total_ratings
          )
        `)
        .eq('status', 'searching')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Available rides loaded:', data?.length || 0);
      setRides(data || []);
    } catch (error: any) {
      console.error('Error fetching available rides:', error);
      toast({
        title: "Error",
        description: "Failed to load available rides: " + (error.message || 'Unknown error'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMyOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('ride_offers')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['pending', 'accepted']);

      if (error) throw error;
      setMyOffers(data || []);
    } catch (error) {
      console.error('Error fetching my offers:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    if (!driverId) {
      console.error('Cannot setup subscriptions: No driverId');
      return () => {};
    }

    console.log('Setting up real-time subscriptions for driver:', driverId);

    try {
      // Subscribe to ride request changes
      const requestsChannel = supabase
        .channel(`available-rides-${driverId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ride_requests'
          },
          (payload) => {
            console.log('Ride request update:', payload.eventType, payload);
            
            // Debounce the fetch to prevent excessive calls
            setTimeout(() => {
              if (payload.eventType === 'INSERT') {
                const newRequest = payload.new as any;
                if (newRequest?.status === 'searching') {
                  console.log('New ride request detected, fetching available rides');
                  fetchAvailableRides();
                }
              } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                console.log('Ride request updated/deleted, refreshing list');
                fetchAvailableRides();
              }
            }, 100);
          }
        )
        .subscribe((status) => {
          console.log('Ride requests subscription status:', status);
        });

      // Subscribe to ride offer changes
      const offersChannel = supabase
        .channel(`ride-offers-${driverId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ride_offers',
            filter: `driver_id=eq.${driverId}`
          },
          (payload) => {
            console.log('Ride offer update:', payload.eventType, payload);
            
            // Debounce the fetch to prevent excessive calls
            setTimeout(() => {
              fetchMyOffers();
            }, 100);
          }
        )
        .subscribe((status) => {
          console.log('Ride offers subscription status:', status);
        });

      // Return cleanup function
      return () => {
        console.log('Cleaning up real-time subscriptions');
        supabase.removeChannel(requestsChannel);
        supabase.removeChannel(offersChannel);
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      return () => {};
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAvailableRides();
    fetchMyOffers();
  };

  const submitOffer = async (rideId: string) => {
    const offerAmount = parseFloat(offerAmounts[rideId]);
    
    if (!offerAmount || offerAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid fare amount",
        variant: "destructive"
      });
      return;
    }

    setSubmittingOffers(prev => ({ ...prev, [rideId]: true }));
    
    try {
      const { error } = await supabase
        .from('ride_offers')
        .insert({
          ride_id: rideId,
          driver_id: driverId,
          offered_fare: offerAmount,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Offer Submitted!",
        description: `Your offer of $${offerAmount} has been sent to the rider`
      });

      // Clear the input
      setOfferAmounts(prev => ({ ...prev, [rideId]: '' }));
      
    } catch (error: any) {
      console.error('Error submitting offer:', error);
      toast({
        title: "Failed to Submit Offer",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setSubmittingOffers(prev => ({ ...prev, [rideId]: false }));
    }
  };

  const calculateDistance = (ride: RideRequest): number => {
    // Simple distance calculation (in a real app, use a proper routing service)
    return ride.estimated_distance_miles || 0;
  };

  const getTimeLeft = (expiresAt: string): string => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasExistingOffer = (rideId: string): RideOffer | undefined => {
    return myOffers.find(offer => offer.ride_id === rideId);
  };

  const getRideTypeIcon = (rideType: string) => {
    switch (rideType) {
      case 'premium':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'shared':
        return <Car className="h-4 w-4 text-blue-500" />;
      default:
        return <Car className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Available Rides
            </CardTitle>
            <CardDescription>
              {rides.length} ride{rides.length !== 1 ? 's' : ''} looking for drivers
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rides.length === 0 ? (
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Available Rides</h3>
            <p className="text-muted-foreground">
              Check back soon for new ride requests in your area
            </p>
          </div>
        ) : (
          rides.map((ride) => {
            const existingOffer = hasExistingOffer(ride.id);
            const isSubmitting = submittingOffers[ride.id];
            const timeLeft = getTimeLeft(ride.expires_at);
            
            return (
              <Card key={ride.id} className="border-l-4 border-l-primary/50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header with rider info and time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {ride.rider.full_name?.split(' ').map(n => n[0]).join('') || 'R'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{ride.rider.full_name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span>{ride.rider.rating?.toFixed(1)} ({ride.rider.total_ratings} rides)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {timeLeft}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(ride.created_at))} ago
                        </p>
                      </div>
                    </div>

                    {/* Route information */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Pickup</p>
                          <p className="text-sm text-muted-foreground">{ride.pickup_location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Destination</p>
                          <p className="text-sm text-muted-foreground">{ride.dropoff_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Trip details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="font-semibold">{ride.estimated_distance_miles?.toFixed(1)} mi</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-semibold">{ride.estimated_duration_minutes} min</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Suggested</p>
                        <p className="font-semibold">${ride.estimated_fare_min} - ${ride.estimated_fare_max}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Type</p>
                        <div className="flex items-center justify-center gap-1">
                          {getRideTypeIcon(ride.ride_type)}
                          <span className="font-semibold capitalize">{ride.ride_type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment method and notes */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="capitalize">{ride.payment_method}</span>
                      </div>
                      {ride.rider_notes && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <AlertCircle className="h-4 w-4" />
                          <span>Has notes</span>
                        </div>
                      )}
                    </div>

                    {/* Notes section */}
                    {ride.rider_notes && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">Rider Notes:</p>
                        <p className="text-sm text-muted-foreground">{ride.rider_notes}</p>
                      </div>
                    )}

                    {/* Offer section */}
                    {existingOffer ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Offer Submitted: ${existingOffer.offered_fare}</span>
                        </div>
                        <Badge variant={existingOffer.status === 'accepted' ? 'default' : 'secondary'}>
                          {existingOffer.status}
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            placeholder="Enter your fare offer"
                            value={offerAmounts[ride.id] || ''}
                            onChange={(e) => setOfferAmounts(prev => ({ ...prev, [ride.id]: e.target.value }))}
                            min="0"
                            step="0.01"
                            className="text-center"
                          />
                        </div>
                        <Button
                          onClick={() => submitOffer(ride.id)}
                          disabled={isSubmitting || !offerAmounts[ride.id]}
                          className="flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send Offer
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Navigation className="h-4 w-4 mr-2" />
                        View Route
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Clock className="h-4 w-4 mr-2" />
                        ETA Calculator
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}