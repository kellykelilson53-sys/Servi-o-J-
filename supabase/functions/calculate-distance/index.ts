import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine formula to calculate distance between two points
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Geocode address using Nominatim (OpenStreetMap) - fallback
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encodedAddress = encodeURIComponent(`${address}, Angola`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          'User-Agent': 'ServicoJa/1.0 (servicoja.ao)',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding request failed:', response.status);
      return null;
    }

    const results = await response.json();
    
    if (results && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Angola province center coordinates (fallback)
const PROVINCE_CENTERS: Record<string, { lat: number; lng: number }> = {
  'Luanda': { lat: -8.8368, lng: 13.2343 },
  'Benguela': { lat: -12.5763, lng: 13.4055 },
  'Huambo': { lat: -12.7761, lng: 15.7392 },
  'Huíla': { lat: -14.9167, lng: 13.5000 },
  'Cabinda': { lat: -5.5500, lng: 12.2000 },
  'Malanje': { lat: -9.5402, lng: 16.3410 },
  'Bié': { lat: -12.3833, lng: 16.9333 },
  'Uíge': { lat: -7.6089, lng: 15.0613 },
  'Zaire': { lat: -6.1349, lng: 12.3689 },
  'Bengo': { lat: -8.4500, lng: 13.5500 },
  'Cunene': { lat: -17.0667, lng: 15.7333 },
  'Namibe': { lat: -15.1961, lng: 12.1522 },
  'Moxico': { lat: -11.4300, lng: 22.4300 },
  'Cuanza Norte': { lat: -9.3000, lng: 14.9000 },
  'Cuanza Sul': { lat: -10.3333, lng: 14.2500 },
  'Cuando Cubango': { lat: -15.7500, lng: 18.5000 },
  'Lunda Norte': { lat: -7.7700, lng: 20.4300 },
  'Lunda Sul': { lat: -10.2500, lng: 20.4200 },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientAddress, clientLat, clientLng, workerId, workerCity } = await req.json();

    console.log('Distance calculation request:', { clientAddress, clientLat, clientLng, workerId, workerCity });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get worker's stored GPS location from database
    let workerLat: number | null = null;
    let workerLng: number | null = null;

    if (workerId) {
      const { data: worker, error } = await supabase
        .from('workers')
        .select('location_lat, location_lng')
        .eq('id', workerId)
        .single();

      if (!error && worker) {
        workerLat = worker.location_lat;
        workerLng = worker.location_lng;
        console.log('Worker stored location:', { workerLat, workerLng });
      }
    }

    // If worker doesn't have GPS stored, use city center as fallback
    if (workerLat === null || workerLng === null) {
      const cityCoords = PROVINCE_CENTERS[workerCity] || PROVINCE_CENTERS['Luanda'];
      workerLat = cityCoords.lat;
      workerLng = cityCoords.lng;
      console.log('Using city center fallback:', { workerCity, workerLat, workerLng });
    }

    // Get client coordinates
    let finalClientLat = clientLat;
    let finalClientLng = clientLng;
    let geocoded = false;

    // If client didn't provide GPS, try to geocode address
    if ((finalClientLat === null || finalClientLng === null) && clientAddress) {
      const clientCoords = await geocodeAddress(clientAddress);
      if (clientCoords) {
        finalClientLat = clientCoords.lat;
        finalClientLng = clientCoords.lng;
        geocoded = true;
        console.log('Geocoded client address:', clientCoords);
      }
    }

    // Calculate distance if we have both coordinates
    if (finalClientLat !== null && finalClientLng !== null && workerLat !== null && workerLng !== null) {
      const distance = haversineDistance(
        finalClientLat,
        finalClientLng,
        workerLat,
        workerLng
      );

      // Round to 1 decimal place
      const roundedDistance = Math.round(distance * 10) / 10;

      console.log('Calculated real distance:', roundedDistance, 'km');

      return new Response(
        JSON.stringify({
          distance_km: roundedDistance,
          client_lat: finalClientLat,
          client_lng: finalClientLng,
          worker_lat: workerLat,
          worker_lng: workerLng,
          geocoded: geocoded || (clientLat !== null && clientLng !== null),
          estimated: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: estimate distance based on typical city range (3-15km)
    const estimatedDistance = Math.floor(Math.random() * 12) + 3;
    
    console.log('Using estimated distance:', estimatedDistance, 'km');

    return new Response(
      JSON.stringify({
        distance_km: estimatedDistance,
        client_lat: finalClientLat,
        client_lng: finalClientLng,
        worker_lat: workerLat,
        worker_lng: workerLng,
        geocoded: false,
        estimated: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Distance calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
