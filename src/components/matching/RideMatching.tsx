import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, DollarSign, Car } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Driver {
  id: string;
  full_name: string;
  rating: number;
  total_ratings: number;
  distance: number;
  estimated_arrival: number;
  vehicle?: {
    make: string;
    model: string;
    color: string;
    license_plate: string;
  };
}

interface RideMatchingProps {
  rideRequestId: string;
  pickupLocation: { lat: number; lng: number };
  estimatedFare: { min: number; max: number };
  onDriverSelected: (driverId: string) => void;
}

export const RideMatching: React.FC<RideMatchingProps> = ({
  rideRequestId,
  pickupLocation,
  estimatedFare,
  onDriverSelected
}) => {
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    findNearbyDrivers();
    setupRealtimeSubscription();
  }, [rideRequestId]);

  const findNearbyDrivers = async () => {
    try {
      setIsLoading(true);
      
      // Get drivers with active subscriptions and vehicles
      const { data: drivers, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          rating,
          total_ratings,
          vehicles!vehicles_driver_id_fkey(
            make,
            model,
            color,
            license_plate,
            is_active,
            is_verified
          )
        `)
        .eq('role', 'driver')
        .gte('rating', 4.0); // Only show highly rated drivers

      if (error) throw error;

      // Filter drivers with active vehicles and calculate distances
      const driversWithDistance = await Promise.all(
        drivers?.filter(driver => 
          driver.vehicles && 
          driver.vehicles.length > 0 && 
          driver.vehicles.some((v: any) => v.is_active && v.is_verified)
        ).map(async (driver) => {
          // Simulate driver location (in real app, get from driver_locations table)
          const driverLat = pickupLocation.lat + (Math.random() - 0.5) * 0.1;
          const driverLng = pickupLocation.lng + (Math.random() - 0.5) * 0.1;
          
          const distance = calculateDistance(
            pickupLocation.lat,
            pickupLocation.lng,
            driverLat,
            driverLng
          );

          // Only include drivers within 10 miles
          if (distance > 10) return null;

          const estimatedArrival = Math.round((distance / 30) * 60); // Assume 30 mph average

          return {
            id: driver.id,
            full_name: driver.full_name || 'Driver',
            rating: driver.rating || 5.0,
            total_ratings: driver.total_ratings || 0,
            distance: Math.round(distance * 10) / 10,
            estimated_arrival: estimatedArrival,
            vehicle: driver.vehicles?.[0]
          };
        }) || []
      );

      // Filter out null results and sort by distance
      const validDrivers = driversWithDistance
        .filter(driver => driver !== null)
        .sort((a, b) => a!.distance - b!.distance);

      setAvailableDrivers(validDrivers as Driver[]);
    } catch (error) {
      console.error('Error finding drivers:', error);
      toast({
        title: "Error finding drivers",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to new ride offers
    const channel = supabase
      .channel(`ride-offers-${rideRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ride_offers',
          filter: `ride_id=eq.${rideRequestId}`,
        },
        (payload) => {
          // Handle new offer
          toast({
            title: "New ride offer received!",
            description: `Driver offered $${payload.new.offered_fare}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const selectDriver = async (driverId: string) => {
    try {
      setSelectedDriver(driverId);
      
      // Create a ride from the request
      const { data: request } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('id', rideRequestId)
        .single();

      if (!request) throw new Error('Ride request not found');

      const { data: ride, error } = await supabase
        .from('rides')
        .insert({
          rider_id: request.rider_id,
          driver_id: driverId,
          pickup_location: request.pickup_location,
          dropoff_location: request.dropoff_location,
          pickup_lat: request.pickup_lat,
          pickup_lng: request.pickup_lng,
          dropoff_lat: request.dropoff_lat,
          dropoff_lng: request.dropoff_lng,
          estimated_fare_min: request.estimated_fare_min,
          estimated_fare_max: request.estimated_fare_max,
          payment_method: request.payment_method,
          ride_type: request.ride_type,
          rider_notes: request.rider_notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update request status
      await supabase
        .from('ride_requests')
        .update({ status: 'matched' })
        .eq('id', rideRequestId);

      onDriverSelected(driverId);
      
      toast({
        title: "Driver assigned!",
        description: "Your ride has been confirmed",
      });
    } catch (error: any) {
      toast({
        title: "Failed to assign driver",
        description: error.message,
        variant: "destructive"
      });
      setSelectedDriver(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Finding nearby drivers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableDrivers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No drivers available</h3>
          <p className="text-muted-foreground">
            Try expanding your search area or wait a few minutes
          </p>
          <Button 
            variant="outline" 
            onClick={findNearbyDrivers}
            className="mt-4"
          >
            Refresh Search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Drivers</CardTitle>
        <p className="text-sm text-muted-foreground">
          Found {availableDrivers.length} drivers nearby
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableDrivers.map((driver) => (
          <div
            key={driver.id}
            className="border rounded-lg p-4 space-y-3 hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {driver.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold">{driver.full_name}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{driver.rating.toFixed(1)}</span>
                  <span>({driver.total_ratings} rides)</span>
                </div>
              </div>
              <Badge variant="secondary">
                {driver.distance} mi
              </Badge>
            </div>

            {driver.vehicle && (
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4" />
                <span>{driver.vehicle.color} {driver.vehicle.make} {driver.vehicle.model}</span>
                <Badge variant="outline" className="text-xs">
                  {driver.vehicle.license_plate}
                </Badge>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{driver.estimated_arrival} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>${estimatedFare.min} - ${estimatedFare.max}</span>
                </div>
              </div>
              <Button
                onClick={() => selectDriver(driver.id)}
                disabled={selectedDriver !== null}
                size="sm"
              >
                {selectedDriver === driver.id ? 'Selected' : 'Select Driver'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};