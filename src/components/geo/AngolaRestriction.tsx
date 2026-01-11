import { useState, useEffect, ReactNode } from 'react';
import { MapPin, AlertTriangle, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AngolaRestrictionProps {
  children: ReactNode;
}

export function AngolaRestriction({ children }: AngolaRestrictionProps) {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countryName, setCountryName] = useState<string>('');

  useEffect(() => {
    async function checkLocation() {
      try {
        // Use free IP geolocation API
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) throw new Error('Failed to fetch location');
        
        const data = await response.json();
        const country = data.country_code?.toUpperCase();
        setCountryName(data.country_name || '');
        
        // Allow if in Angola or if detection failed
        if (country === 'AO' || !country) {
          setIsAllowed(true);
        } else {
          // Check localStorage for dev bypass
          const bypass = localStorage.getItem('angola_bypass');
          if (bypass === 'true') {
            setIsAllowed(true);
          } else {
            setIsAllowed(false);
          }
        }
      } catch (error) {
        console.warn('Location check failed, allowing access:', error);
        // Allow access if detection fails (fail-open for UX)
        setIsAllowed(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkLocation();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">A verificar localização...</p>
        </div>
      </div>
    );
  }

  if (isAllowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <span className="text-3xl font-bold text-primary-foreground">S</span>
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-6 rounded-full bg-warning/10">
              <Globe className="h-16 w-16 text-warning" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              Serviço Disponível Apenas em Angola
            </h1>
            <p className="text-muted-foreground">
              O ServiçoJá está atualmente disponível apenas para utilizadores em Angola.
              Detectámos que você está a aceder de{' '}
              <span className="font-semibold text-foreground">{countryName || 'fora de Angola'}</span>.
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3 text-left">
              <MapPin className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Por que esta restrição?</p>
                <p className="text-sm text-muted-foreground">
                  Os nossos serviços e profissionais estão localizados exclusivamente em Angola.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-left">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="font-medium">Está em Angola?</p>
                <p className="text-sm text-muted-foreground">
                  Se está em Angola e vê esta mensagem, pode ser um erro de detecção. Tente usar uma rede diferente.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} ServiçoJá. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
