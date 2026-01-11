import { useState, useEffect } from 'react';
import { MapPin, Loader2, CheckCircle, AlertCircle, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/useGeolocation';

interface LocationCaptureProps {
  onLocationCaptured: (lat: number, lng: number) => void;
  required?: boolean;
  showAddress?: boolean;
}

export function LocationCapture({ 
  onLocationCaptured, 
  required = false,
  showAddress = true 
}: LocationCaptureProps) {
  const { lat, lng, loading, error, requestLocation } = useGeolocation();
  const [address, setAddress] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Reverse geocode to get address
  useEffect(() => {
    if (lat && lng && showAddress) {
      setAddressLoading(true);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ServicoJa/1.0 (servicoja.ao)',
          },
        }
      )
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            setAddress(data.display_name);
          }
        })
        .catch(console.error)
        .finally(() => setAddressLoading(false));
    }
  }, [lat, lng, showAddress]);

  // Notify parent when location is captured
  useEffect(() => {
    if (lat && lng) {
      onLocationCaptured(lat, lng);
    }
  }, [lat, lng, onLocationCaptured]);

  const handleCapture = async () => {
    await requestLocation();
  };

  if (lat && lng) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Localização capturada</span>
        </div>
        {showAddress && (
          <div className="text-sm text-muted-foreground">
            {addressLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                A obter endereço...
              </span>
            ) : address ? (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
            ) : (
              <span>
                Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            )}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCapture}
          disabled={loading}
        >
          <Navigation className="h-4 w-4 mr-2" />
          Atualizar localização
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
        <Navigation className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Captura de Localização GPS {required && <span className="text-destructive">*</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            A sua localização será usada para calcular distâncias e facilitar o encontro com clientes.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={handleCapture}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            A obter localização...
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4 mr-2" />
            Capturar Minha Localização
          </>
        )}
      </Button>
    </div>
  );
}
