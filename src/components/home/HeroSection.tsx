import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Shield, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CITIES, SERVICE_CATEGORIES, City, ServiceType } from '@/types';
import { getServiceIcon } from '@/lib/serviceIcons';

export function HeroSection() {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState<City | ''>('');
  const [selectedService, setSelectedService] = useState<ServiceType | ''>('');

  const handleSearch = () => {
    if (selectedCity && selectedService) {
      navigate(`/services/${selectedService}?city=${selectedCity}`);
    } else if (selectedCity) {
      navigate(`/services?city=${selectedCity}`);
    } else {
      navigate('/services');
    }
  };

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative py-16 md:py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Shield className="h-4 w-4" />
            Profissionais Verificados em Angola
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Encontre o{' '}
            <span className="text-gradient">profissional ideal</span>
            {' '}perto de si
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Barbeiros, electricistas, canalizadores, limpeza e muito mais. 
            Serviços de qualidade com profissionais verificados na sua cidade.
          </p>

          {/* Search Box */}
          <div className="bg-card rounded-2xl p-4 md:p-6 shadow-lg border border-border/50 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Select value={selectedCity} onValueChange={(v) => setSelectedCity(v as City)}>
                  <SelectTrigger className="h-12 md:h-14 text-base">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <SelectValue placeholder="Selecione sua cidade" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select value={selectedService} onValueChange={(v) => setSelectedService(v as ServiceType)}>
                  <SelectTrigger className="h-12 md:h-14 text-base">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-muted-foreground" />
                      <SelectValue placeholder="Que serviço precisa?" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => {
                      const Icon = getServiceIcon(cat.id);
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="hero" size="xl" onClick={handleSearch} className="md:w-auto">
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </Button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <span>Identidade Verificada</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>Agenda Flexível</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              <span>Avaliações Reais</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
