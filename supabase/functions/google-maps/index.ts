import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeocodeRequest {
  address: string;
}

interface ReverseGeocodeRequest {
  lat: number;
  lng: number;
}

interface GoogleMapsResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      }
    }
  }>;
  status: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, ...params } = await req.json();
    console.log('Google Maps request:', { action, params });

    let url = '';
    
    switch (action) {
      case 'geocode': {
        const { address } = params as GeocodeRequest;
        url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        break;
      }
      
      case 'reverse_geocode': {
        const { lat, lng } = params as ReverseGeocodeRequest;
        url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        break;
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use "geocode" or "reverse_geocode"' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    console.log('Making request to Google Maps API');
    const response = await fetch(url);
    const data: GoogleMapsResponse = await response.json();
    
    console.log('Google Maps API response status:', data.status);

    if (data.status !== 'OK') {
      console.error('Google Maps API error:', data.status);
      return new Response(
        JSON.stringify({ error: `Google Maps API error: ${data.status}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Transform the response to a simpler format
    const result = data.results[0];
    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No results found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const responseData = {
      address: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng
    };

    console.log('Returning transformed response:', responseData);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});