import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Star, MapPin, Shield, Clock, Phone, MessageCircle, 
  Calendar, Heart, ChevronLeft, Home, Award, Briefcase 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SERVICE_CATEGORIES } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useWorkerById } from '@/hooks/useWorkers';
import { getServiceIcon } from '@/lib/serviceIcons';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { setRedirectUrl } from '@/hooks/useRedirectAfterLogin';

type PortfolioItem = Database['public']['Tables']['worker_portfolio']['Row'];

export default function WorkerProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { worker, loading, error } = useWorkerById(id || '');
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  
  // Fetch portfolio when worker is loaded
  useEffect(() => {
    async function fetchPortfolio() {
      if (!worker?.id) return;
      
      setLoadingPortfolio(true);
      const { data, error } = await supabase
        .from('worker_portfolio')
        .select('*')
        .eq('worker_id', worker.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPortfolio(data);
      }
      setLoadingPortfolio(false);
    }
    
    fetchPortfolio();
  }, [worker?.id]);

  if (loading) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="animate-pulse space-y-8">
            <div className="flex gap-6">
              <div className="w-28 h-28 rounded-full bg-muted" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !worker) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Profissional não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O profissional que procura não existe ou foi removido.
          </p>
          <Button onClick={() => navigate('/services')}>Ver todos os serviços</Button>
        </div>
      </Layout>
    );
  }

  const getServiceName = (type: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === type)?.name || type;
  };

  const ServiceIcon = getServiceIcon(worker.service_type as any);

  const handleLikePhoto = async (photoId: string) => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'É necessário ter conta para dar like.',
        variant: 'destructive',
      });
      setRedirectUrl(`/worker/${id}`);
      navigate('/login');
      return;
    }

    const wasLiked = likedPhotos.has(photoId);
    
    // Optimistic update
    setLikedPhotos(prev => {
      const newSet = new Set(prev);
      if (wasLiked) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });

    // Update portfolio state optimistically
    setPortfolio(prev => prev.map(item => 
      item.id === photoId 
        ? { ...item, likes: item.likes + (wasLiked ? -1 : 1) }
        : item
    ));

    // Persist to database
    const item = portfolio.find(p => p.id === photoId);
    if (item) {
      const newLikes = Math.max(0, item.likes + (wasLiked ? -1 : 1));
      const { error } = await supabase
        .from('worker_portfolio')
        .update({ likes: newLikes })
        .eq('id', photoId);
      
      if (error) {
        console.error('Error updating likes:', error);
        // Revert on error
        setLikedPhotos(prev => {
          const newSet = new Set(prev);
          if (wasLiked) {
            newSet.add(photoId);
          } else {
            newSet.delete(photoId);
          }
          return newSet;
        });
        setPortfolio(prev => prev.map(p => 
          p.id === photoId ? { ...p, likes: item.likes } : p
        ));
        toast({
          title: 'Erro',
          description: 'Não foi possível registar o like.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleBooking = () => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'É necessário ter conta para agendar serviços.',
        variant: 'destructive',
      });
      setRedirectUrl(`/booking/${worker.id}`);
      navigate('/login');
      return;
    }
    navigate(`/booking/${worker.id}`);
  };

  const handleContact = (type: 'call' | 'whatsapp') => {
    if (!user) {
      toast({
        title: 'Faça login',
        description: 'É necessário ter conta para contactar profissionais.',
        variant: 'destructive',
      });
      setRedirectUrl(`/worker/${id}`);
      navigate('/login');
      return;
    }
    
    const phone = worker.profiles?.phone;
    if (!phone) return;
    
    if (type === 'call') {
      window.location.href = `tel:+244${phone}`;
    } else {
      window.open(`https://wa.me/244${phone}`, '_blank');
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="bg-secondary/5 border-b border-border">
        <div className="container py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar
          </button>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                <AvatarImage 
                  src={worker.profiles?.avatar_url || ''} 
                  alt={worker.profiles?.name || ''} 
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                  {worker.profiles?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{worker.profiles?.name || 'Profissional'}</h1>
                  {worker.verification_status === 'verified' && (
                    <Badge className="bg-success text-success-foreground gap-1">
                      <Shield className="h-3 w-3" />
                      Verificado
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <ServiceIcon className="h-4 w-4" />
                    {getServiceName(worker.service_type)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {worker.profiles?.city || 'Angola'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-warning fill-warning" />
                    <span className="font-bold">{Number(worker.rating).toFixed(1)}</span>
                    <span className="text-muted-foreground">({worker.review_count} avaliações)</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-5 w-5" />
                    <span>{worker.completed_jobs} serviços</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {worker.offers_home_service && (
                <Badge variant="secondary" className="gap-1 px-3 py-1.5">
                  <Home className="h-4 w-4" />
                  Atendimento ao Domicílio
                </Badge>
              )}
              {Number(worker.rating) >= 4.5 && (
                <Badge variant="secondary" className="gap-1 px-3 py-1.5">
                  <Award className="h-4 w-4" />
                  Top Avaliado
                </Badge>
              )}
              {worker.is_available && (
                <Badge className="bg-success/10 text-success gap-1 px-3 py-1.5">
                  <Clock className="h-4 w-4" />
                  Disponível Agora
                </Badge>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start bg-muted/50 p-1">
                <TabsTrigger value="about">Sobre</TabsTrigger>
                <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
                <TabsTrigger value="reviews">Avaliações</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <div className="bg-card rounded-xl border border-border/50 p-6">
                  <h3 className="font-semibold text-lg mb-3">Descrição</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {worker.description || 'Nenhuma descrição disponível.'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-6">
                {loadingPortfolio ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                    <div className="animate-pulse text-muted-foreground">A carregar...</div>
                  </div>
                ) : portfolio.length === 0 ? (
                  <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                    <div className="text-4xl mb-3">📷</div>
                    <p className="text-muted-foreground">Nenhuma foto no portfólio</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {portfolio.map((item) => (
                      <div 
                        key={item.id} 
                        className="relative group rounded-xl overflow-hidden bg-card border border-border/50 aspect-square"
                      >
                        <img 
                          src={item.image_url} 
                          alt={item.description || 'Portfólio'} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikePhoto(item.id);
                              }}
                              className="flex items-center gap-1 text-white text-sm hover:scale-110 transition-transform"
                            >
                              <Heart 
                                className={`h-5 w-5 transition-colors ${likedPhotos.has(item.id) ? 'fill-red-500 text-red-500' : ''}`} 
                              />
                              <span>{item.likes}</span>
                            </button>
                            {item.description && (
                              <p className="text-white text-xs mt-1 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
                  <Star className="h-12 w-12 mx-auto mb-3 text-warning" />
                  <p className="text-lg font-semibold mb-1">{Number(worker.rating).toFixed(1)} de 5</p>
                  <p className="text-muted-foreground">Baseado em {worker.review_count} avaliações</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border/50 p-6 shadow-lg">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">Preço base</p>
                <p className="text-3xl font-bold text-primary">
                  {Number(worker.base_price).toLocaleString('pt-AO')} Kz
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  + {Number(worker.price_per_km).toLocaleString('pt-AO')} Kz/km (deslocação)
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleBooking}
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Agendar Serviço
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleContact('call')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleContact('whatsapp')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="font-medium mb-3">Informações</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Serviços feitos</span>
                    <span className="font-medium">{worker.completed_jobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Membro desde</span>
                    <span className="font-medium">
                      {new Date(worker.created_at).toLocaleDateString('pt-AO', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo de resposta</span>
                    <span className="font-medium">~15 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
