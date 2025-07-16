import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  pickupLocation?: { lat: number; lng: number; address: string } | null;
  dropoffLocation?: { lat: number; lng: number; address: string } | null;
  height?: string;
  className?: string;
}

interface MapComponentState {
  googleApiKey: string;
  showTokenInput: boolean;
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
  const [state, setState] = useState<MapComponentState>({
    googleApiKey: '',
    showTokenInput: true
  });
  const { toast } = useToast();
  
  const pickupMarker = useRef<google.maps.Marker | null>(null);
  const dropoffMarker = useRef<google.maps.Marker | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!state.googleApiKey || !mapContainer.current) return;

    const loader = new Loader({
      apiKey: state.googleApiKey,
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

        // Initialize geocoder
        geocoder.current = new google.maps.Geocoder();

        // Add click handler for location selection
        map.current.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (!onLocationSelect || !e.latLng) return;
          
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          
          try {
            // Reverse geocoding to get address
            if (geocoder.current) {
              geocoder.current.geocode(
                { location: { lat, lng } },
                (results, status) => {
                  if (status === 'OK' && results?.[0]) {
                    const address = results[0].formatted_address;
                    onLocationSelect({ lat, lng, address });
                  } else {
                    onLocationSelect({ 
                      lat, 
                      lng, 
                      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` 
                    });
                  }
                }
              );
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            onLocationSelect({ 
              lat, 
              lng, 
              address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` 
            });
          }
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

      } catch (error) {
        console.error('Map initialization error:', error);
        toast({
          title: "Map Error",
          description: "Failed to initialize Google Maps. Please check your API key.",
          variant: "destructive"
        });
      }
    }).catch((error) => {
      console.error('Google Maps API loading error:', error);
      toast({
        title: "Map Loading Error",
        description: "Failed to load Google Maps API. Please check your API key.",
        variant: "destructive"
      });
    });

    return () => {
      // Google Maps cleanup is handled automatically
    };
  }, [state.googleApiKey, onLocationSelect, toast]);

  // Update pickup marker
  useEffect(() => {
    if (!map.current || !pickupLocation) return;

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

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="font-weight: 500;">Pickup: ${pickupLocation.address}</div>`
    });

    pickupMarker.current.addListener('click', () => {
      infoWindow.open(map.current, pickupMarker.current);
    });
  }, [pickupLocation]);

  // Update dropoff marker
  useEffect(() => {
    if (!map.current || !dropoffLocation) return;

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

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="font-weight: 500;">Dropoff: ${dropoffLocation.address}</div>`
    });

    dropoffMarker.current.addListener('click', () => {
      infoWindow.open(map.current, dropoffMarker.current);
    });
  }, [dropoffLocation]);

  // Auto-fit to show both markers
  useEffect(() => {
    if (!map.current || !pickupLocation || !dropoffLocation) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
    bounds.extend({ lat: dropoffLocation.lat, lng: dropoffLocation.lng });

    map.current.fitBounds(bounds, 50);
  }, [pickupLocation, dropoffLocation]);

  const handleTokenSubmit = () => {
    if (!state.googleApiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Google Maps API key",
        variant: "destructive"
      });
      return;
    }
    
    setState(prev => ({ ...prev, showTokenInput: false }));
  };

  if (state.showTokenInput) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Map Configuration</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your Google Maps API key to enable the interactive map. 
            Get your API key at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Cloud Console</a>
          </p>
          <div className="space-y-2">
            <Label htmlFor="google-api-key">Google Maps API Key</Label>
            <Input
              id="google-api-key"
              type="password"
              placeholder="AIzaSyBdVl-cTICSwYKpe92FcFj9M..."
              value={state.googleApiKey}
              onChange={(e) => setState(prev => ({ ...prev, googleApiKey: e.target.value }))}
              onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
            />
          </div>
          <Button onClick={handleTokenSubmit} className="w-full">
            <Navigation className="h-4 w-4 mr-2" />
            Load Map
          </Button>
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