import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  pickupLocation?: { lat: number; lng: number; address: string } | null;
  dropoffLocation?: { lat: number; lng: number; address: string } | null;
  height?: string;
  className?: string;
}

export default function Map({ 
  onLocationSelect, 
  pickupLocation, 
  dropoffLocation, 
  height = "400px",
  className = ""
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const { toast } = useToast();
  
  const pickupMarker = useRef<google.maps.Marker | null>(null);
  const dropoffMarker = useRef<google.maps.Marker | null>(null);

  // Reverse geocode using our backend service
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps', {
        body: {
          action: 'reverse_geocode',
          lat,
          lng
        }
      });

      if (error) {
        console.error('Reverse geocoding error:', error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      return data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Use a public Google Maps key for basic map display (no API calls)
    // The actual geocoding will be done through our backend
    const loader = new Loader({
      apiKey: "AIzaSyD-_LgHcF9CdKJWs5Qk0KR8YT3q1yCz5rY", // This is a restricted public key for display only
      version: "weekly",
      libraries: ["places"]
    });

    loader.load().then(async () => {
      if (!mapContainer.current) return;

      try {
        // Initialize map
        map.current = new google.maps.Map(mapContainer.current, {
          center: { lat: 40.7128, lng: -74.006 }, // NYC default
          zoom: 13,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });

        // Add click handler for location selection
        map.current.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (!onLocationSelect || !e.latLng) return;
          
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          // Use our backend service for reverse geocoding
          const address = await reverseGeocode(lat, lng);
          onLocationSelect({ lat, lng, address });
        });

        // Get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              map.current?.setCenter({ lat: latitude, lng: longitude });
            },
            (error) => {
              console.log('Geolocation error:', error);
            }
          );
        }

        setIsMapReady(true);
        setIsLoading(false);

      } catch (error) {
        console.error('Map initialization error:', error);
        setIsLoading(false);
        toast({
          title: "Map Error",
          description: "Failed to initialize Google Maps.",
          variant: "destructive"
        });
      }
    }).catch((error) => {
      console.error('Google Maps API loading error:', error);
      setIsLoading(false);
      toast({
        title: "Map Loading Error",
        description: "Failed to load Google Maps.",
        variant: "destructive"
      });
    });
  }, [onLocationSelect, toast]);

  // Update pickup marker
  useEffect(() => {
    if (!map.current || !pickupLocation || !isMapReady) return;

    if (pickupMarker.current) {
      pickupMarker.current.setMap(null);
    }

    pickupMarker.current = new google.maps.Marker({
      position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
      map: map.current,
      title: `Pickup: ${pickupLocation.address}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#22c55e"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32)
      }
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="font-weight: 500;">Pickup: ${pickupLocation.address}</div>`
    });

    pickupMarker.current.addListener('click', () => {
      infoWindow.open(map.current, pickupMarker.current);
    });
  }, [pickupLocation, isMapReady]);

  // Update dropoff marker
  useEffect(() => {
    if (!map.current || !dropoffLocation || !isMapReady) return;

    if (dropoffMarker.current) {
      dropoffMarker.current.setMap(null);
    }

    dropoffMarker.current = new google.maps.Marker({
      position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
      map: map.current,
      title: `Dropoff: ${dropoffLocation.address}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 32)
      }
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="font-weight: 500;">Dropoff: ${dropoffLocation.address}</div>`
    });

    dropoffMarker.current.addListener('click', () => {
      infoWindow.open(map.current, dropoffMarker.current);
    });
  }, [dropoffLocation, isMapReady]);

  // Auto-fit to show both markers
  useEffect(() => {
    if (!map.current || !pickupLocation || !dropoffLocation || !isMapReady) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
    bounds.extend({ lat: dropoffLocation.lat, lng: dropoffLocation.lng });

    map.current.fitBounds(bounds, 50);
  }, [pickupLocation, dropoffLocation, isMapReady]);

  if (isLoading) {
    return (
      <Card className={`p-6 ${className} flex items-center justify-center`} style={{ height }}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading map...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border ${className}`} style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0" />
      {onLocationSelect && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-2 text-sm shadow-md">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Click map to select location
          </div>
        </div>
      )}
    </div>
  );
}