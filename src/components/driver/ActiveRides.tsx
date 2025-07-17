import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Navigation, 
  Phone, 
  MessageCircle, 
  Star,
  Clock,
  Car,
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ActiveRidesProps {
  driverId: string;
}

interface ActiveRide {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  final_fare: number;
  status: string;
  accepted_at: string;
  started_at: string;
  completed_at: string;
  distance_miles: number;
  duration_minutes: number;
  payment_method: string;
  rider_notes: string;
  driver_notes: string;
  rider: {
    id: string;
    full_name: string;
    rating: number;
    total_ratings: number;
    phone: string;
  };
}

export default function ActiveRides({ driverId }: ActiveRidesProps) {
  const { toast } = useToast();
  
  const [activeRides, setActiveRides] = useState<ActiveRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [driverNotes, setDriverNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!driverId) {
      console.error('ActiveRides: No driverId provided');
      setLoading(false);
      return;
    }
    
    console.log('ActiveRides: Setting up for driver', driverId);
    fetchActiveRides();
    const cleanup = setupRealTimeSubscriptions();
    
    return cleanup;
  }, [driverId]);

  const fetchActiveRides = async () => {
    if (!driverId) {
      console.error('Cannot fetch rides: No driverId');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching active rides for driver:', driverId);
      
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          rider:profiles!rides_rider_id_fkey(
            id,
            full_name,
            rating,
            total_ratings,
            phone
          )
        `)
        .eq('driver_id', driverId)
        .in('status', ['accepted', 'en_route', 'arrived', 'in_progress'])
        .order('accepted_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Active rides loaded:', data?.length || 0);
      setActiveRides(data || []);
    } catch (error: any) {
      console.error('Error fetching active rides:', error);
      toast({
        title: "Error",
        description: "Failed to load active rides: " + (error.message || 'Unknown error'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeSubscriptions = () => {
    const channel = supabase
      .channel('active-rides-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rides',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          console.log('Active ride update:', payload);
          fetchActiveRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateRideStatus = async (rideId: string, newStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [rideId]: true }));
    
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add timestamp fields based on status
      switch (newStatus) {
        case 'en_route':
          updateData.accepted_at = new Date().toISOString();
          break;
        case 'arrived':
          // Keep existing accepted_at
          break;
        case 'in_progress':
          updateData.started_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          if (driverNotes[rideId]) {
            updateData.driver_notes = driverNotes[rideId];
          }
          break;
      }

      const { error } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', rideId);

      if (error) throw error;

      const statusMessages = {
        'en_route': 'On your way to pickup',
        'arrived': 'Arrived at pickup location',
        'in_progress': 'Ride started',
        'completed': 'Ride completed successfully'
      };

      toast({
        title: "Status Updated",
        description: statusMessages[newStatus as keyof typeof statusMessages] || `Status updated to ${newStatus}`
      });

    } catch (error: any) {
      console.error('Error updating ride status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update ride status",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [rideId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-blue-500';
      case 'en_route': return 'bg-yellow-500';
      case 'arrived': return 'bg-orange-500';
      case 'in_progress': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'en_route':
        return <Car className="h-5 w-5 text-yellow-500" />;
      case 'arrived':
        return <MapPin className="h-5 w-5 text-orange-500" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-green-500" />;
      case 'completed':
        return <Square className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'accepted':
        return { text: 'Head to Pickup', nextStatus: 'en_route' };
      case 'en_route':
        return { text: 'Arrived at Pickup', nextStatus: 'arrived' };
      case 'arrived':
        return { text: 'Start Ride', nextStatus: 'in_progress' };
      case 'in_progress':
        return { text: 'Complete Ride', nextStatus: 'completed' };
      default:
        return null;
    }
  };

  const openNavigation = (ride: ActiveRide) => {
    const destination = ride.status === 'in_progress' 
      ? `${ride.dropoff_lat},${ride.dropoff_lng}`
      : `${ride.pickup_lat},${ride.pickup_lng}`;
    
    // Try to open in Google Maps app, fallback to web
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(googleMapsUrl, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Active Rides
        </CardTitle>
        <CardDescription>
          {activeRides.length} active ride{activeRides.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeRides.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Rides</h3>
            <p className="text-muted-foreground">
              Your accepted rides will appear here
            </p>
          </div>
        ) : (
          activeRides.map((ride) => {
            const nextAction = getNextAction(ride.status);
            const isUpdating = updatingStatus[ride.id];
            
            return (
              <Card key={ride.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header with status and rider info */}
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
                          {getStatusIcon(ride.status)}
                          {ride.status.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(ride.accepted_at))} ago
                        </p>
                      </div>
                    </div>

                    {/* Route information */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className={`h-5 w-5 mt-0.5 ${
                          ride.status === 'in_progress' ? 'text-gray-400' : 'text-green-600'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Pickup</p>
                          <p className="text-sm text-muted-foreground">{ride.pickup_location}</p>
                        </div>
                        {ride.status !== 'in_progress' && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className={`h-5 w-5 mt-0.5 ${
                          ride.status === 'in_progress' ? 'text-red-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Destination</p>
                          <p className="text-sm text-muted-foreground">{ride.dropoff_location}</p>
                        </div>
                        {ride.status === 'in_progress' && (
                          <Badge variant="destructive">Current</Badge>
                        )}
                      </div>
                    </div>

                    {/* Trip details */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Fare</p>
                        <p className="font-semibold">${ride.final_fare}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="font-semibold">{ride.distance_miles || 'TBD'} mi</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Payment</p>
                        <p className="font-semibold capitalize">{ride.payment_method}</p>
                      </div>
                    </div>

                    {/* Rider notes */}
                    {ride.rider_notes && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-sm font-medium mb-1">Rider Notes:</p>
                        <p className="text-sm text-muted-foreground">{ride.rider_notes}</p>
                      </div>
                    )}

                    {/* Driver notes for completion */}
                    {ride.status === 'in_progress' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Trip Notes (Optional)</label>
                        <Textarea
                          placeholder="Add any notes about the trip..."
                          value={driverNotes[ride.id] || ''}
                          onChange={(e) => setDriverNotes(prev => ({ ...prev, [ride.id]: e.target.value }))}
                          rows={2}
                        />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNavigation(ride)}
                        className="flex items-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        Navigate
                      </Button>
                      
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Call
                      </Button>
                      
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Message
                      </Button>

                      {nextAction && (
                        <Button
                          onClick={() => updateRideStatus(ride.id, nextAction.nextStatus)}
                          disabled={isUpdating}
                          className="flex items-center gap-2 ml-auto"
                        >
                          {isUpdating ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Updating...
                            </>
                          ) : (
                            <>
                              {nextAction.nextStatus === 'completed' && (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              {nextAction.text}
                            </>
                          )}
                        </Button>
                      )}
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
