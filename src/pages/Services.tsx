import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, MapPin, Star, Shield, Filter, SlidersHorizontal } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SERVICE_CATEGORIES, ServiceType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkers } from '@/hooks/useWorkers';
import { getServiceIcon } from '@/lib/serviceIcons';
import { getMunicipalitiesByProvince, getProvinceNames } from '@/data/angolaData';
import { setRedirectUrl } from '@/hooks/useRedirectAfterLogin';

export default function Services() {
  const navigate = useNavigate();
  const { serviceType } = useParams();
  const { user, profile } = useAuth();
  
  // User's province from their profile, or default to 'Luanda' for non-logged users
  const userProvince = profile?.city || '';
  
  // For non-logged users, show all provinces option
  const [selectedProvince, setSelectedProvince] = useState<string>(userProvince || 'all');
  const municipalities = selectedProvince && selectedProvince !== 'all' 
    ? getMunicipalitiesByProvince(selectedProvince) 
    : [];
  
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceType | 'all'>(
    (serviceType as ServiceType) || 'all'
  );
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'reviews'>('rating');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch workers - pass empty string for city to get all workers when not filtered
  const cityFilter = selectedProvince !== 'all' ? selectedProvince : undefined;
  const { workers, loading } = useWorkers(
    cityFilter,
    selectedService !== 'all' ? selectedService : undefined,
    user?.id // Exclude current user's worker profile if logged in
  );

  const filteredWorkers = useMemo(() => {
    let filtered = workers;

    // Filter by search query (name or description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.profiles?.name?.toLowerCase().includes(query) ||
        w.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => Number(b.rating) - Number(a.rating));
        break;
      case 'price':
        filtered.sort((a, b) => Number(a.base_price) - Number(b.base_price));
        break;
      case 'reviews':
        filtered.sort((a, b) => Number(b.review_count) - Number(a.review_count));
        break;
    }

    return filtered;
  }, [workers, sortBy, searchQuery]);

  const getServiceName = (type: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === type)?.name || type;
  };

  const ServiceIcon = selectedService !== 'all' ? getServiceIcon(selectedService as ServiceType) : null;

  const handleViewProfile = (workerId: string) => {
    if (!user) {
      // Save the intended URL for redirect after login
      setRedirectUrl(`/worker/${workerId}`);
      navigate('/login');
    } else {
      navigate(`/worker/${workerId}`);
    }
  };

  return (
    <Layout>
      <div className="bg-secondary/5 border-b border-border">
        <div className="container py-8">
          <div className="flex items-center gap-3">
            {ServiceIcon && (
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ServiceIcon className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {selectedService !== 'all' 
                  ? getServiceName(selectedService)
                  : 'Todos os Serviços'}
              </h1>
              <p className="text-muted-foreground">
                {loading ? 'A carregar...' : `${filteredWorkers.length} profissionais encontrados`}
                {selectedProvince !== 'all' && ` em ${selectedProvince}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <div className="bg-card rounded-xl border border-border/50 p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar profissional..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedProvince} onValueChange={(v) => {
              setSelectedProvince(v);
              setSelectedMunicipality('all');
            }}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Província" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as províncias</SelectItem>
                {getProvinceNames().map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMunicipality} onValueChange={setSelectedMunicipality} disabled={selectedProvince === 'all'}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Município" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os municípios</SelectItem>
                {municipalities.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedService} onValueChange={(v) => setSelectedService(v as ServiceType | 'all')}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Serviço" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
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

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Ordenar" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Melhor avaliado</SelectItem>
                <SelectItem value="price">Menor preço</SelectItem>
                <SelectItem value="reviews">Mais avaliações</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border/50 overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Nenhum profissional encontrado</h2>
            <p className="text-muted-foreground mb-6">
              Não há profissionais disponíveis{selectedProvince !== 'all' ? ` em ${selectedProvince}` : ''} com os filtros selecionados.
            </p>
            <Button variant="outline" onClick={() => {
              setSelectedProvince('all');
              setSelectedMunicipality('all');
              setSelectedService('all');
              setSearchQuery('');
            }}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => {
              const Icon = getServiceIcon(worker.service_type as ServiceType);
              return (
                <div
                  key={worker.id}
                  onClick={() => handleViewProfile(worker.id)}
                  className="group cursor-pointer rounded-2xl bg-card border border-border/50 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                >
                  {/* Portfolio preview */}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                      <Icon className="h-12 w-12 text-primary/50" />
                    </div>
                    
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge className="bg-success text-success-foreground gap-1">
                        <Shield className="h-3 w-3" />
                        Verificado
                      </Badge>
                      {worker.is_available && (
                        <Badge variant="secondary" className="bg-background/90">
                          Disponível
                        </Badge>
                      )}
                    </div>

                    {worker.offers_home_service && (
                      <div className="absolute bottom-3 left-3">
                        <Badge variant="secondary" className="bg-background/90">
                          Ao Domicílio
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                        <AvatarImage src={worker.profiles?.avatar_url || ''} alt={worker.profiles?.name || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {worker.profiles?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {worker.profiles?.name || 'Profissional'}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Icon className="h-4 w-4" />
                          {getServiceName(worker.service_type)}
                        </p>
                      </div>
                    </div>

                    {worker.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {worker.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {worker.profiles?.city || 'Angola'}
                      </div>
                      <div className="flex items-center gap-1 font-medium">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        {Number(worker.rating).toFixed(1)}
                        <span className="text-muted-foreground">({worker.review_count})</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">A partir de</p>
                        <p className="font-bold text-lg text-primary">
                          {Number(worker.base_price).toLocaleString('pt-AO')} Kz
                        </p>
                      </div>
                      <Button variant="hero" size="sm">
                        Ver Perfil
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
