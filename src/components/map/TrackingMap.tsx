import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// IMPORTANT: Add your Mapbox public token here or in .env as VITE_MAPBOX_TOKEN
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface TrackingMapProps {
  bookingId: string;
  clientLat: number;
  clientLng: number;
  clientAddress?: string;
  isWorker?: boolean;
  workerId?: string;
}

export function TrackingMap({ 
  bookingId, 
  clientLat, 
  clientLng, 
  clientAddress,
  isWorker = false,
  workerId 
}: TrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const workerMarker = useRef<mapboxgl.Marker | null>(null);
  const clientMarker = useRef<mapboxgl.Marker | null>(null);
  const { toast } = useToast();
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [workerLocation, setWorkerLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Update worker location in real-time
  useEffect(() => {
    if (!isWorker || !workerId) return;

    let watchId: number;

    const updateLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      // Update in database
      await supabase
        .from('worker_locations')
        .upsert({
          worker_id: workerId,
          lat: latitude,
          lng: longitude,
        }, { onConflict: 'worker_id' });

      setWorkerLocation({ lat: latitude, lng: longitude });
    };

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        updateLocation,
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isWorker, workerId]);

  // Subscribe to worker location changes (for client view)
  useEffect(() => {
    if (isWorker || !workerId) return;

    // Initial fetch
    const fetchLocation = async () => {
      const { data } = await supabase
        .from('worker_locations')
        .select('lat, lng')
        .eq('worker_id', workerId)
        .single();
      
      if (data) {
        setWorkerLocation({ lat: Number(data.lat), lng: Number(data.lng) });
      }
    };

    fetchLocation();

    // Subscribe to changes
    const channel = supabase
      .channel(`worker-location-${workerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_locations',
          filter: `worker_id=eq.${workerId}`
        },
        (payload: any) => {
          const loc = payload.new;
          if (loc) {
            setWorkerLocation({ lat: Number(loc.lat), lng: Number(loc.lng) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isWorker, workerId]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [clientLng, clientLat],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add client marker
    const clientEl = document.createElement('div');
    clientEl.className = 'w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center';
    clientEl.innerHTML = '<span class="text-white text-xs">📍</span>';

    clientMarker.current = new mapboxgl.Marker({ element: clientEl })
      .setLngLat([clientLng, clientLat])
      .setPopup(new mapboxgl.Popup().setHTML(`<p class="font-semibold">Cliente</p><p class="text-sm">${clientAddress || 'Localização do cliente'}</p>`))
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, [clientLat, clientLng, clientAddress]);

  // Update worker marker and route
  useEffect(() => {
    if (!map.current || !workerLocation) return;

    // Update or create worker marker
    if (workerMarker.current) {
      workerMarker.current.setLngLat([workerLocation.lng, workerLocation.lat]);
    } else {
      const workerEl = document.createElement('div');
      workerEl.className = 'w-10 h-10 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse';
      workerEl.innerHTML = '<span class="text-white text-lg">🚗</span>';

      workerMarker.current = new mapboxgl.Marker({ element: workerEl })
        .setLngLat([workerLocation.lng, workerLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="font-semibold">Profissional</p>'))
        .addTo(map.current);
    }

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds()
      .extend([clientLng, clientLat])
      .extend([workerLocation.lng, workerLocation.lat]);

    map.current.fitBounds(bounds, { padding: 80 });

    // Fetch and draw route
    fetchRoute(workerLocation.lat, workerLocation.lng, clientLat, clientLng);
  }, [workerLocation, clientLat, clientLng]);

  const fetchRoute = async (
    workerLat: number,
    workerLng: number,
    destLat: number,
    destLng: number
  ) => {
    if (!map.current || !MAPBOX_TOKEN) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${workerLng},${workerLat};${destLng},${destLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const distance = (route.distance / 1000).toFixed(1);
        const duration = Math.round(route.duration / 60);

        setRouteInfo({ distance: `${distance} km`, duration: `${duration} min` });

        // Draw route on map
        if (map.current.getSource('route')) {
          (map.current.getSource('route') as mapboxgl.GeoJSONSource).setData({
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          });
        } else {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: route.geometry,
            },
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 },
          });
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground text-center px-4">
          Mapa não disponível.<br />
          <span className="text-xs">Configure VITE_MAPBOX_TOKEN no ficheiro .env</span>
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="w-full h-64 md:h-80 rounded-lg overflow-hidden" />
      {routeInfo && (
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-semibold">📏 {routeInfo.distance}</p>
          <p className="text-sm text-muted-foreground">⏱️ {routeInfo.duration}</p>
        </div>
      )}
    </div>
  );
}