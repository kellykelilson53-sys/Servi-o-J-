import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, MapPin, Star } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { SERVICE_CATEGORIES } from '@/types';
import { getServiceIcon } from '@/lib/serviceIcons';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];

interface BookingWithWorker extends Booking {
  worker_profile?: {
    name: string;
    avatar_url: string | null;
  };
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [bookings, setBookings] = useState<BookingWithWorker[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return;
      
      try {
        // Get recent bookings (limit 3)
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        if (bookingsError) throw bookingsError;

        if (bookingsData && bookingsData.length > 0) {
          const workerIds = [...new Set(bookingsData.map(b => b.worker_id))];
          
          // Get workers with their user_ids
          const { data: workersData } = await supabase
            .from('workers')
            .select('id, user_id')
            .in('id', workerIds);

          if (workersData) {
            const userIds = workersData.map(w => w.user_id);
            const workerUserMap = new Map(workersData.map(w => [w.id, w.user_id]));
            
            // Get profiles
            const { data: profilesData } = await supabase
              .from('profiles')
              .select('id, name, avatar_url')
              .in('id', userIds);

            const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

            const bookingsWithWorkers: BookingWithWorker[] = bookingsData.map(b => ({
              ...b,
              worker_profile: profilesMap.get(workerUserMap.get(b.worker_id) || '') as BookingWithWorker['worker_profile']
            }));

            setBookings(bookingsWithWorkers);
          }
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    }

    if (user) {
      fetchBookings();
    }
  }, [user]);

  if (loading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const getServiceName = (type: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === type)?.name || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Pendente</Badge>;
      case 'accepted':
        return <Badge className="bg-success/10 text-success">Aceite</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary/10 text-primary">Em Progresso</Badge>;
      case 'completed':
        return <Badge variant="secondary">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="container py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Olá, {profile?.name?.split(' ')[0] || 'Usuário'}!
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {profile?.city || 'Luanda'}
          </p>
        </div>

        {/* Quick Search */}
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-lg mb-1">Precisa de um serviço?</h2>
                <p className="text-muted-foreground">
                  Encontre profissionais verificados na sua cidade
                </p>
              </div>
              <Button variant="hero" onClick={() => navigate('/services')}>
                <Search className="h-4 w-4 mr-2" />
                Buscar Serviços
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Categories */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">Categorias Populares</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SERVICE_CATEGORIES.slice(0, 4).map((cat) => {
              const Icon = getServiceIcon(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/services/${cat.id}`)}
                  className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* My Bookings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Meus Agendamentos</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/client/bookings')}>
              Ver todos
            </Button>
          </div>

          {loadingBookings ? (
            <div className="animate-pulse text-muted-foreground text-center py-8">
              A carregar agendamentos...
            </div>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Nenhum agendamento</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não fez nenhum agendamento
                </p>
                <Button onClick={() => navigate('/services')}>
                  Buscar Serviços
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/client/bookings')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={booking.worker_profile?.avatar_url || ''} alt={booking.worker_profile?.name || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {booking.worker_profile?.name?.charAt(0) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{booking.worker_profile?.name || 'Profissional'}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getServiceName(booking.service_type)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.booking_date).toLocaleDateString('pt-AO')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.booking_time}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {Number(booking.total_price).toLocaleString('pt-AO')} Kz
                        </p>
                        {booking.status === 'completed' && !booking.client_rating && (
                          <Button variant="ghost" size="sm" className="mt-2">
                            <Star className="h-4 w-4 mr-1" />
                            Avaliar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
