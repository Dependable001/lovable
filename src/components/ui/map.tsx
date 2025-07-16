import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  mapboxToken: string;
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
  const map = useRef<mapboxgl.Map | null>(null);
  const [state, setState] = useState<MapComponentState>({
    mapboxToken: '',
    showTokenInput: true
  });
  const { toast } = useToast();
  
  const pickupMarker = useRef<mapboxgl.Marker | null>(null);
  const dropoffMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!state.mapboxToken || !mapContainer.current) return;

    try {
      mapboxgl.accessToken = state.mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-74.006, 40.7128], // NYC default
        zoom: 13,
        pitch: 0,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Add click handler for location selection
      map.current.on('click', async (e) => {
        if (!onLocationSelect) return;
        
        const { lng, lat } = e.lngLat;
        
        try {
          // Reverse geocoding to get address
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${state.mapboxToken}`
          );
          const data = await response.json();
          const address = data.features[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          
          onLocationSelect({ lat, lng, address });
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
            map.current?.setCenter([longitude, latitude]);
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
        description: "Failed to initialize map. Please check your Mapbox token.",
        variant: "destructive"
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [state.mapboxToken, onLocationSelect, toast]);

  // Update pickup marker
  useEffect(() => {
    if (!map.current || !pickupLocation) return;

    if (pickupMarker.current) {
      pickupMarker.current.remove();
    }

    pickupMarker.current = new mapboxgl.Marker({ color: '#22c55e' })
      .setLngLat([pickupLocation.lng, pickupLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<div class="font-medium">Pickup: ${pickupLocation.address}</div>`))
      .addTo(map.current);
  }, [pickupLocation]);

  // Update dropoff marker
  useEffect(() => {
    if (!map.current || !dropoffLocation) return;

    if (dropoffMarker.current) {
      dropoffMarker.current.remove();
    }

    dropoffMarker.current = new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([dropoffLocation.lng, dropoffLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<div class="font-medium">Dropoff: ${dropoffLocation.address}</div>`))
      .addTo(map.current);
  }, [dropoffLocation]);

  // Auto-fit to show both markers
  useEffect(() => {
    if (!map.current || !pickupLocation || !dropoffLocation) return;

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([pickupLocation.lng, pickupLocation.lat]);
    bounds.extend([dropoffLocation.lng, dropoffLocation.lat]);

    map.current.fitBounds(bounds, { padding: 50 });
  }, [pickupLocation, dropoffLocation]);

  const handleTokenSubmit = () => {
    if (!state.mapboxToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your Mapbox public token",
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
            Enter your Mapbox public token to enable the interactive map. 
            Get your token at <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
          </p>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="password"
              placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6InlvdXJ0b2tlbiJ9..."
              value={state.mapboxToken}
              onChange={(e) => setState(prev => ({ ...prev, mapboxToken: e.target.value }))}
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