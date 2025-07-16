import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, DollarSign, Clock, CreditCard, Banknote, Navigation, Loader2, AlertCircle, Map as MapIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Map from "@/components/ui/map";

interface RideBookingProps {
  profileId: string;
  onRideRequested?: (requestId: string) => void;
}

interface FareEstimate {
  min_fare: number;
  max_fare: number;
  estimated_distance: number;
  estimated_duration: number;
}

interface LocationSuggestion {
  id: string;
  description: string;
  lat?: number;
  lng?: number;
}

export default function RideBooking({ profileId, onRideRequested }: RideBookingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{lat: number; lng: number} | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<{lat: number; lng: number} | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [rideType, setRideType] = useState('standard');
  const [riderNotes, setRiderNotes] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [fareEstimate, setFareEstimate] = useState<FareEstimate | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationSuggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<LocationSuggestion[]>([]);
  const [mapPickupLocation, setMapPickupLocation] = useState<{lat: number; lng: number; address: string} | null>(null);
  const [mapDropoffLocation, setMapDropoffLocation] = useState<{lat: number; lng: number; address: string} | null>(null);
  const [locationSelectionMode, setLocationSelectionMode] = useState<'pickup' | 'dropoff' | null>(null);

  // Mock location search (in real app, use Google Places API or Mapbox Geocoding)
  const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
    if (query.length < 3) return [];
    
    // Mock suggestions based on common locations
    const mockSuggestions = [
      { id: '1', description: `${query} - Main Street`, lat: 40.7128, lng: -74.0060 },
      { id: '2', description: `${query} - Downtown Area`, lat: 40.7589, lng: -73.9851 },
      { id: '3', description: `${query} - Airport`, lat: 40.6413, lng: -73.7781 },
      { id: '4', description: `${query} - Shopping Center`, lat: 40.7505, lng: -73.9934 },
      { id: '5', description: `${query} - Business District`, lat: 40.7549, lng: -73.9840 }
    ];
    
    return mockSuggestions.filter(s => 
      s.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  const handlePickupChange = async (value: string) => {
    setPickup(value);
    if (value.length >= 3) {
      const suggestions = await searchLocations(value);
      setPickupSuggestions(suggestions);
    } else {
      setPickupSuggestions([]);
    }
  };

  const handleDropoffChange = async (value: string) => {
    setDropoff(value);
    if (value.length >= 3) {
      const suggestions = await searchLocations(value);
      setDropoffSuggestions(suggestions);
    } else {
      setDropoffSuggestions([]);
    }
  };

  const selectPickupSuggestion = (suggestion: LocationSuggestion) => {
    setPickup(suggestion.description);
    setPickupCoords(suggestion.lat && suggestion.lng ? { lat: suggestion.lat, lng: suggestion.lng } : null);
    setPickupSuggestions([]);
  };

  const selectDropoffSuggestion = (suggestion: LocationSuggestion) => {
    setDropoff(suggestion.description);
    setDropoffCoords(suggestion.lat && suggestion.lng ? { lat: suggestion.lat, lng: suggestion.lng } : null);
    setDropoffSuggestions([]);
  };

  const handleMapLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    if (locationSelectionMode === 'pickup') {
      setMapPickupLocation(location);
      setPickup(location.address);
      setPickupCoords({ lat: location.lat, lng: location.lng });
      setLocationSelectionMode(null);
    } else if (locationSelectionMode === 'dropoff') {
      setMapDropoffLocation(location);
      setDropoff(location.address);
      setDropoffCoords({ lat: location.lat, lng: location.lng });
      setLocationSelectionMode(null);
    }
  };

  // Calculate fare estimate when both locations are set
  useEffect(() => {
    if (pickupCoords && dropoffCoords) {
      estimateFare();
    }
  }, [pickupCoords, dropoffCoords]);

  const estimateFare = async () => {
    if (!pickupCoords || !dropoffCoords) return;

    setEstimating(true);
    try {
      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        pickupCoords.lat, pickupCoords.lng,
        dropoffCoords.lat, dropoffCoords.lng
      );

      // Get fare estimate from database function
      const { data, error } = await supabase.rpc('calculate_estimated_fare', {
        distance_miles: distance
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setFareEstimate({
          min_fare: Number(data[0].min_fare),
          max_fare: Number(data[0].max_fare),
          estimated_distance: distance,
          estimated_duration: Math.round(distance * 2.5) // Mock: ~2.5 mins per mile
        });
      }
    } catch (error) {
      console.error('Error estimating fare:', error);
      toast({
        title: "Estimation Error",
        description: "Unable to calculate fare estimate",
        variant: "destructive"
      });
    } finally {
      setEstimating(false);
    }
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const toRad = (value: number): number => {
    return value * Math.PI / 180;
  };

  // Submit ride request
  const handleSubmitRequest = async () => {
    if (!pickup || !dropoff || !pickupCoords || !dropoffCoords || !fareEstimate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ride_requests')
        .insert({
          rider_id: profileId,
          pickup_location: pickup,
          dropoff_location: dropoff,
          pickup_lat: pickupCoords.lat,
          pickup_lng: pickupCoords.lng,
          dropoff_lat: dropoffCoords.lat,
          dropoff_lng: dropoffCoords.lng,
          estimated_distance_miles: fareEstimate.estimated_distance,
          estimated_duration_minutes: fareEstimate.estimated_duration,
          estimated_fare_min: fareEstimate.min_fare,
          estimated_fare_max: fareEstimate.max_fare,
          payment_method: paymentMethod,
          ride_type: rideType,
          rider_notes: riderNotes || null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ride Requested!",
        description: "Looking for available drivers in your area..."
      });

      if (onRideRequested && data) {
        onRideRequested(data.id);
      }

      // Reset form
      setPickup("");
      setDropoff("");
      setPickupCoords(null);
      setDropoffCoords(null);
      setRiderNotes("");
      setFareEstimate(null);
      setMapPickupLocation(null);
      setMapDropoffLocation(null);

    } catch (error) {
      console.error('Error creating ride request:', error);
      toast({
        title: "Request Failed",
        description: "Unable to submit ride request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Book a Ride
          </CardTitle>
          <CardDescription>
            Enter your pickup and destination to request a ride
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Selection with Map */}
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address Form
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                Interactive Map
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Pickup Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    Pickup Location
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Enter pickup address"
                      value={pickup}
                      onChange={(e) => handlePickupChange(e.target.value)}
                      className="pl-3"
                    />
                    {pickupSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-background border border-t-0 rounded-b-lg shadow-lg max-h-48 overflow-y-auto">
                        {pickupSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
                            onClick={() => selectPickupSuggestion(suggestion)}
                          >
                            {suggestion.description}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dropoff Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    Destination
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="Enter destination address"
                      value={dropoff}
                      onChange={(e) => handleDropoffChange(e.target.value)}
                      className="pl-3"
                    />
                    {dropoffSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-10 bg-background border border-t-0 rounded-b-lg shadow-lg max-h-48 overflow-y-auto">
                        {dropoffSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
                            onClick={() => selectDropoffSuggestion(suggestion)}
                          >
                            {suggestion.description}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="map" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={locationSelectionMode === 'pickup' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocationSelectionMode('pickup')}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-green-600" />
                    Select Pickup
                  </Button>
                  <Button
                    type="button"
                    variant={locationSelectionMode === 'dropoff' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocationSelectionMode('dropoff')}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-red-600" />
                    Select Dropoff
                  </Button>
                </div>
                
                <Map
                  onLocationSelect={handleMapLocationSelect}
                  pickupLocation={mapPickupLocation}
                  dropoffLocation={mapDropoffLocation}
                  height="400px"
                />
                
                {(mapPickupLocation || mapDropoffLocation) && (
                  <div className="space-y-2 text-sm">
                    {mapPickupLocation && (
                      <div className="flex items-center gap-2 text-green-600">
                        <MapPin className="h-4 w-4" />
                        Pickup: {mapPickupLocation.address}
                      </div>
                    )}
                    {mapDropoffLocation && (
                      <div className="flex items-center gap-2 text-red-600">
                        <MapPin className="h-4 w-4" />
                        Dropoff: {mapDropoffLocation.address}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Ride Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ride Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ride Type</label>
              <Select value={rideType} onValueChange={setRideType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={(value: 'card' | 'cash') => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Credit Card
                    </div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Notes (Optional)</label>
            <Textarea
              placeholder="Any special instructions for your driver..."
              value={riderNotes}
              onChange={(e) => setRiderNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Fare Estimate */}
          {fareEstimate && (
            <Card className="bg-muted/20">
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-semibold mb-2 flex items-center justify-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Estimated Fare
                  </h3>
                  {estimating ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calculating...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-primary mb-2">
                        ${fareEstimate.min_fare.toFixed(2)} - ${fareEstimate.max_fare.toFixed(2)}
                      </div>
                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{fareEstimate.estimated_distance.toFixed(1)} miles</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>~{fareEstimate.estimated_duration} mins</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmitRequest}
            disabled={!pickup || !dropoff || !pickupCoords || !dropoffCoords || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting Ride...
              </>
            ) : (
              "Request Ride"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">How it works:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Enter your pickup and destination using the form or interactive map</li>
                <li>• Get an estimated fare based on distance</li>
                <li>• Drivers will see your request and submit offers</li>
                <li>• Choose the best offer and enjoy your ride!</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}