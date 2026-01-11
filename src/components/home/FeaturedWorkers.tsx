import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SERVICE_CATEGORIES } from '@/types';
import { getServiceIcon } from '@/lib/serviceIcons';
import { useWorkers } from '@/hooks/useWorkers';

export function FeaturedWorkers() {
  const navigate = useNavigate();
  const { workers, loading } = useWorkers();
  
  // Get top rated verified workers
  const featured = workers
    .filter(w => w.verification_status === 'verified' && w.is_available)
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 4);

  const getServiceName = (serviceType: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === serviceType)?.name || serviceType;
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl bg-card border border-border/50 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (featured.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Profissionais em Destaque
            </h2>
            <p className="text-lg text-muted-foreground">
              Os melhores avaliados da plataforma
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/services')}>
            Ver Todos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((worker, index) => {
            const Icon = getServiceIcon(worker.service_type as any);
            return (
              <div
                key={worker.id}
                onClick={() => navigate(`/worker/${worker.id}`)}
                className="group cursor-pointer rounded-2xl bg-card border border-border/50 overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Portfolio preview */}
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <Icon className="h-12 w-12 text-primary/50" />
                  </div>
                  
                  {/* Verified badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-success text-success-foreground gap-1">
                      <Shield className="h-3 w-3" />
                      Verificado
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                      <AvatarImage src={worker.profiles?.avatar_url || ''} alt={worker.profiles?.name || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {worker.profiles?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {worker.profiles?.name || 'Profissional'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {getServiceName(worker.service_type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {worker.profiles?.city || 'Luanda'}
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      {Number(worker.rating).toFixed(1)}
                      <span className="text-muted-foreground">({worker.review_count})</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm">
                      <span className="text-muted-foreground">A partir de </span>
                      <span className="font-bold text-primary">
                        {Number(worker.base_price).toLocaleString('pt-AO')} Kz
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
