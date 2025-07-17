import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GOOGLE-MAPS] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Get Google Maps API key from env
    const googleMapsApiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!googleMapsApiKey) {
      throw new Error("Google Maps API key not found");
    }
    
    const { action, params } = await req.json();

    logStep("Request data received", { action });
    
    switch (action) {
      case "geocode": {
        // Convert address to lat/lng
        const { address } = params;
        if (!address) throw new Error("Address is required");
        
        const result = await geocodeAddress(address, googleMapsApiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      case "reverseGeocode": {
        // Convert lat/lng to address
        const { lat, lng } = params;
        if (!lat || !lng) throw new Error("Latitude and longitude are required");
        
        const result = await reverseGeocode(lat, lng, googleMapsApiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      case "directions": {
        // Get directions between two points
        const { origin, destination, mode = "driving" } = params;
        if (!origin || !destination) throw new Error("Origin and destination are required");
        
        const result = await getDirections(origin, destination, mode, googleMapsApiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      case "placeAutocomplete": {
        // Get place suggestions
        const { input, types = "address", components = "country:us" } = params;
        if (!input) throw new Error("Input is required");
        
        const result = await getPlaceAutocomplete(input, types, components, googleMapsApiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "placeDetails": {
        // Get details for a specific place
        const { placeId } = params;
        if (!placeId) throw new Error("Place ID is required");
        
        const result = await getPlaceDetails(placeId, googleMapsApiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      case "distanceMatrix": {
        // Get distance and duration between multiple origins and destinations
        const { origins, destinations, mode = "driving" } = params;
        if (!origins || !destinations) throw new Error("Origins and destinations are required");
        
        const result = await getDistanceMatrix(origins, destinations, mode, googleMapsApiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// Helper functions for Google Maps API

async function geocodeAddress(address: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== "OK") {
    throw new Error(`Geocoding failed: ${data.status}`);
  }
  
  return {
    results: data.results,
    location: data.results[0].geometry.location
  };
}

async function reverseGeocode(lat: number, lng: number, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== "OK") {
    throw new Error(`Reverse geocoding failed: ${data.status}`);
  }
  
  return {
    results: data.results,
    formattedAddress: data.results[0].formatted_address
  };
}

async function getDirections(origin: string, destination: string, mode: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== "OK") {
    throw new Error(`Directions failed: ${data.status}`);
  }
  
  return {
    routes: data.routes,
    legs: data.routes[0].legs,
    steps: data.routes[0].legs[0].steps,
    duration: data.routes[0].legs[0].duration,
    distance: data.routes[0].legs[0].distance
  };
}

async function getPlaceAutocomplete(input: string, types: string, components: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=${types}&components=${components}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Place autocomplete failed: ${data.status}`);
  }
  
  return {
    predictions: data.predictions,
    status: data.status
  };
}

async function getPlaceDetails(placeId: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== "OK") {
    throw new Error(`Place details failed: ${data.status}`);
  }
  
  return {
    result: data.result,
    location: data.result.geometry.location,
    address: data.result.formatted_address
  };
}

async function getDistanceMatrix(origins: string[], destinations: string[], mode: string, apiKey: string) {
  const originsStr = origins.map(o => encodeURIComponent(o)).join('|');
  const destinationsStr = destinations.map(d => encodeURIComponent(d)).join('|');
  
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsStr}&destinations=${destinationsStr}&mode=${mode}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== "OK") {
    throw new Error(`Distance matrix failed: ${data.status}`);
  }
  
  return {
    rows: data.rows,
    elements: data.rows.map((row: any) => row.elements)
  };
}