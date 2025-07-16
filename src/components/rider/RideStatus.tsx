import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Clock, 
  MapPin, 
  Car, 
  Phone, 
  MessageCircle, 
  Star,
  Navigation,
  Timer,
  X,
  CheckCircle,
  AlertCircle,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { PaymentForm } from "@/components/payment/PaymentForm";

interface RideStatusProps {
  rideRequestId: string;
  onRequestCancelled?: () => void;
}

interface RideRequest {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  estimated_fare_min: number;
  estimated_fare_max: number;
  estimated_duration_minutes: number;
  status: string;
  created_at: string;
  expires_at: string;
  ride_type: string;
  payment_method: string;
  rider_notes: string;
}

interface Driver {
  id: string;
  full_name: string;
  rating: number;
  total_ratings: number;
  phone: string;
}

interface ActiveRide {
  id: string;
  status: string;
  driver_id: string;
  accepted_at: string;
  started_at: string;
  estimated_arrival_time?: string;
  driver: Driver;
}

export default function RideStatus({ rideRequestId, onRequestCancelled }: RideStatusProps) {
  const { toast } = useToast();
  
  const [rideRequest, setRideRequest] = useState<RideRequest | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showPayment, setShowPayment] = useState(false);

  // Fetch initial ride request data
  useEffect(() => {
    fetchRideRequest();
  }, [rideRequestId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!rideRequestId) return;

    // Subscribe to ride request updates
    const requestChannel = supabase
      .channel('ride-request-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ride_requests',
          filter: `id=eq.${rideRequestId}`
        },
        (payload) => {
          console.log('Ride request update:', payload);
          setRideRequest(payload.new as RideRequest);
        }
      )
      .subscribe();

    // Subscribe to ride updates (when a driver accepts)
    const rideChannel = supabase
      .channel('ride-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides'
        },
        (payload) => {
          const ride = payload.new as any;
          // Check if this ride is for our request
          if (ride && payload.eventType === 'INSERT') {
            // For now, we'll check if the ride was created around the same time as our request
            // In a real app, you'd have a direct relationship
            fetchActiveRide();
          } else if (ride && activeRide && ride.id === activeRide.id) {
            console.log('Active ride update:', payload);
            setActiveRide(prev => prev ? { ...prev, ...ride } : null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(requestChannel);
      supabase.removeChannel(rideChannel);
    };
  }, [rideRequestId, activeRide]);

  // Timer for request expiration
  useEffect(() => {
    if (!rideRequest?.expires_at) return;

    const updateTimer = () => {
      const expiryTime = new Date(rideRequest.expires_at).getTime();
      const now = new Date().getTime();
      const difference = expiryTime - now;
      
      if (difference <= 0) {
        setTimeLeft(0);
        return;
      }
      
      setTimeLeft(Math.floor(difference / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [rideRequest?.expires_at]);

  const fetchRideRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', rideRequestId)
        .single();

      if (error) throw error;
      setRideRequest(data);

      // Check if there's an active ride for this request
      await fetchActiveRide();
    } catch (error) {
      console.error('Error fetching ride request:', error);
      toast({
        title: "Error",
        description: "Failed to load ride details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveRide = async () => {
    try {
      // In a real app, you'd have a direct relationship between ride_requests and rides
      // For now, we'll look for recent rides that match our locations
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey(
            id,
            full_name,
            rating,
            total_ratings,
            phone
          )
        `)
        .eq('pickup_location', rideRequest?.pickup_location)
        .eq('dropoff_location', rideRequest?.dropoff_location)
        .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setActiveRide(data as ActiveRide);
      }
    } catch (error) {
      console.error('Error fetching active ride:', error);
    }
  };

  const handleCancelRequest = async () => {
    setCancelling(true);
    try {
      const { error } = await supabase
        .from('ride_requests')
        .update({ status: 'cancelled' })
        .eq('id', rideRequestId);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "Your ride request has been cancelled"
      });

      if (onRequestCancelled) {
        onRequestCancelled();
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel request",
        variant: "destructive"
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'searching':
        return <Timer className="h-5 w-5 text-orange-500 animate-pulse" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'en_route':
        return <Car className="h-5 w-5 text-blue-500" />;
      case 'arrived':
        return <Navigation className="h-5 w-5 text-purple-500" />;
      case 'in_progress':
        return <Car className="h-5 w-5 text-indigo-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'searching':
        return 'Looking for driver...';
      case 'accepted':
        return 'Driver assigned!';
      case 'en_route':
        return 'Driver is on the way';
      case 'arrived':
        return 'Driver has arrived';
      case 'in_progress':
        return 'Ride in progress';
      case 'cancelled':
        return 'Request cancelled';
      case 'completed':
        return 'Ride completed';
      default:
        return status;
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    fetchRideRequest();
    toast({
      title: "Payment Successful",
      description: "Your payment has been processed successfully!"
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rideRequest) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Ride request not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(activeRide?.status || rideRequest.status)}
              <div>
                <CardTitle className="text-lg">
                  {getStatusText(activeRide?.status || rideRequest.status)}
                </CardTitle>
                <CardDescription>
                  Request created {formatDistanceToNow(new Date(rideRequest.created_at))} ago
                </CardDescription>
              </div>
            </div>
            <Badge variant={
              (activeRide?.status || rideRequest.status) === 'searching' ? 'secondary' :
              (activeRide?.status || rideRequest.status) === 'cancelled' ? 'destructive' :
              'default'
            }>
              {(activeRide?.status || rideRequest.status).replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trip Details */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Pickup</p>
                <p className="text-sm text-muted-foreground">{rideRequest.pickup_location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium">Destination</p>
                <p className="text-sm text-muted-foreground">{rideRequest.dropoff_location}</p>
              </div>
            </div>
          </div>

          {/* Fare and Trip Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Fare</p>
              <p className="font-semibold">
                ${rideRequest.estimated_fare_min} - ${rideRequest.estimated_fare_max}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Duration</p>
              <p className="font-semibold">{rideRequest.estimated_duration_minutes} min</p>
            </div>
          </div>

          {/* Timer for searching requests */}
          {rideRequest.status === 'searching' && timeLeft > 0 && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">
                Request expires in {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {/* Driver Information */}
          {activeRide?.driver && (
            <Card className="bg-muted/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {activeRide.driver.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{activeRide.driver.full_name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">
                          {activeRide.driver.rating?.toFixed(1)} ({activeRide.driver.total_ratings} rides)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {rideRequest.status === 'searching' && (
              <Button 
                variant="destructive" 
                onClick={handleCancelRequest}
                disabled={cancelling}
                className="flex-1"
              >
                {cancelling ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Request
                  </>
                )}
              </Button>
            )}
            
            {activeRide && activeRide.status === 'arrived' && (
              <Button className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                I'm Ready
              </Button>
            )}

            {activeRide && activeRide.status === 'in_progress' && (
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => setShowPayment(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Complete Payment
              </Button>
            )}
          </div>

          {/* Additional Notes */}
          {rideRequest.rider_notes && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-1">Your Notes</p>
              <p className="text-sm text-muted-foreground">{rideRequest.rider_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
          </DialogHeader>
          {activeRide && (
            <PaymentForm
              rideId={activeRide.id}
              amount={rideRequest.estimated_fare_max}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={() => setShowPayment(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}