import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const { toast } = useToast();
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const error = 'Geolocalização não suportada pelo navegador';
        setState(prev => ({ ...prev, error, loading: false }));
        toast({
          title: 'GPS não suportado',
          description: error,
          variant: 'destructive',
        });
        resolve(null);
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setState({
            lat: coords.lat,
            lng: coords.lng,
            loading: false,
            error: null,
          });
          resolve(coords);
        },
        (error) => {
          let errorMessage = 'Erro ao obter localização';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão de localização negada. Por favor, permita o acesso à sua localização.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível. Verifique se o GPS está ativado.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Tempo limite excedido ao obter localização.';
              break;
          }

          setState({
            lat: null,
            lng: null,
            loading: false,
            error: errorMessage,
          });
          
          toast({
            title: 'Erro de localização',
            description: errorMessage,
            variant: 'destructive',
          });
          
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, [toast]);

  return {
    ...state,
    requestLocation,
  };
}
