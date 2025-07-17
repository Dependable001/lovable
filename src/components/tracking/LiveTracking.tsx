import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, Route } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

interface LiveTrackingProps {
  rideId: string;
  driverId: string;
  isDriver?: boolean;
  pickupLocation: { lat: number; lng: number; address: string };
  dropoffLocation: { lat: number; lng: number; address: string };
}

export const LiveTracking: React.FC<LiveTrackingProps> = ({
  rideId,
  driverId,
  isDriver = false,
  pickupLocation,
  dropoffLocation
}) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isDriver) {
      startLocationTracking();
    } else {
      subscribeToDriverLocation();
    }

    return () => {
      stopLocationTracking();
    };
  }, [rideId, driverId, isDriver]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location tracking",
        variant: "destructive"
      });
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: DriverLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: new Date().toISOString()
        };

        setDriverLocation(location);
        updateLocationInDatabase(location);
      },
      (error) => {
        console.error('Location error:', error);
        toast({
          title: "Location error",
          description: "Failed to get current location",
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  const updateLocationInDatabase = async (location: DriverLocation) => {
    try {
      await supabase
        .from('driver_locations')
        .upsert({
          driver_id: driverId,
          ride_id: rideId,
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading,
          speed: location.speed,
          updated_at: location.timestamp
        });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const subscribeToDriverLocation = () => {
    const channel = supabase
      .channel(`driver-location-${rideId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const location = payload.new as any;
          setDriverLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            heading: location.heading,
            speed: location.speed,
            timestamp: location.updated_at
          });

          // Calculate estimated arrival time
          calculateEstimatedArrival(location);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateEstimatedArrival = (location: DriverLocation) => {
    // Simple distance calculation and ETA estimation
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      pickupLocation.lat,
      pickupLocation.lng
    );

    // Assume average speed of 30 mph in city
    const averageSpeed = 30; // mph
    const eta = (distance / averageSpeed) * 60; // minutes
    setEstimatedArrival(Math.round(eta));
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

  const stopLocationTracking = () => {
    setIsTracking(false);
  };

  const openInMaps = (destination: { lat: number; lng: number }) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Tracking
          </CardTitle>
          {isDriver && (
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? "Tracking Active" : "Tracking Inactive"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Driver Location Status */}
        {driverLocation && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Driver Location</p>
                <p className="text-sm text-muted-foreground">
                  Updated {new Date(driverLocation.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
            {estimatedArrival && !isDriver && (
              <div className="text-right">
                <p className="font-medium text-primary">{estimatedArrival} min</p>
                <p className="text-xs text-muted-foreground">ETA</p>
              </div>
            )}
          </div>
        )}

        {/* Route Information */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium">Pickup Location</p>
              <p className="text-sm text-muted-foreground">{pickupLocation.address}</p>
            </div>
            {isDriver && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInMaps(pickupLocation)}
              >
                <Route className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="h-3 w-3 bg-red-500 rounded-full"></div>
            <div className="flex-1">
              <p className="font-medium">Dropoff Location</p>
              <p className="text-sm text-muted-foreground">{dropoffLocation.address}</p>
            </div>
            {isDriver && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInMaps(dropoffLocation)}
              >
                <Route className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Speed and Heading (for drivers) */}
        {isDriver && driverLocation && (
          <div className="grid grid-cols-2 gap-4">
            {driverLocation.speed !== undefined && (
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{Math.round(driverLocation.speed * 2.237)}</p>
                <p className="text-sm text-muted-foreground">mph</p>
              </div>
            )}
            {driverLocation.heading !== undefined && (
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{Math.round(driverLocation.heading)}°</p>
                <p className="text-sm text-muted-foreground">heading</p>
              </div>
            )}
          </div>
        )}

        {!driverLocation && !isDriver && (
          <div className="text-center py-8 text-muted-foreground">
            <Navigation className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Waiting for driver location...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};