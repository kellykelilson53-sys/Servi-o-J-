import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Clock, MapPin, User,
  CheckCircle, XCircle, MessageCircle, Star
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_CATEGORIES } from '@/types';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ReviewDialog } from '@/components/review/ReviewDialog';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingWithClient extends Booking {
  client_profile?: {
    name: string;
    phone: string;
    avatar_url: string | null;
  };
}

export default function WorkerBookings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithClient | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchWorkerAndBookings() {
      if (!user) return;
      
      try {
        // Get worker ID
        const { data: workerData, error: workerError } = await supabase
          .from('workers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (workerError) throw workerError;
        if (!workerData) return;

        setWorkerId(workerData.id);

        // Get bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('worker_id', workerData.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Get client profiles
        if (bookingsData && bookingsData.length > 0) {
          const clientIds = [...new Set(bookingsData.map(b => b.client_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, name, phone, avatar_url')
            .in('id', clientIds);

          const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
          
          const bookingsWithClients: BookingWithClient[] = bookingsData.map(b => ({
            ...b,
            client_profile: profilesMap.get(b.client_id) as BookingWithClient['client_profile']
          }));

          setBookings(bookingsWithClients);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkerAndBookings();
  }, [user]);

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      // If completing, update worker earnings
      if (status === 'completed' && workerId) {
        const booking = bookings.find(b => b.id === bookingId);
        if (booking) {
          const { data: workerData } = await supabase
            .from('workers')
            .select('total_earnings, completed_jobs')
            .eq('id', workerId)
            .single();

          if (workerData) {
            await supabase
              .from('workers')
              .update({
                total_earnings: Number(workerData.total_earnings) + Number(booking.total_price),
                completed_jobs: workerData.completed_jobs + 1,
              })
              .eq('id', workerId);
          }
        }
      }

      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status } : b
      ));

      const messages: Record<BookingStatus, { title: string; description: string }> = {
        pending: { title: 'Pedido pendente', description: 'O pedido está pendente.' },
        accepted: { title: 'Pedido aceite!', description: 'O cliente será notificado.' },
        rejected: { title: 'Pedido rejeitado', description: 'O cliente será notificado da rejeição.' },
        in_progress: { title: 'Serviço iniciado!', description: 'O cliente foi notificado.' },
        completed: { title: '🎉 Serviço concluído!', description: 'Os ganhos foram adicionados à sua conta.' },
        cancelled: { title: 'Pedido cancelado', description: 'O pedido foi cancelado.' },
      };

      toast({
        title: messages[status].title,
        description: messages[status].description,
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o pedido.',
        variant: 'destructive',
      });
    }
  };

  const getServiceName = (type: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === type)?.name || type;
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pendente' },
      accepted: { variant: 'default', label: 'Aceite' },
      rejected: { variant: 'destructive', label: 'Rejeitado' },
      in_progress: { variant: 'default', label: 'Em Progresso' },
      completed: { variant: 'outline', label: 'Concluído' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => ['accepted', 'in_progress'].includes(b.status));
  const historyBookings = bookings.filter(b => ['completed', 'rejected', 'cancelled'].includes(b.status));

  if (authLoading || loading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

  // Show chat view
  if (showChat && selectedBooking) {
    return (
      <Layout showFooter={false}>
        <div className="h-[calc(100vh-64px)]">
          <ChatWindow
            bookingId={selectedBooking.id}
            otherUserId={selectedBooking.client_id}
            otherUserName={selectedBooking.client_profile?.name || 'Cliente'}
            otherUserAvatar={selectedBooking.client_profile?.avatar_url || undefined}
            onClose={() => setShowChat(false)}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      {/* Review Dialog */}
      {selectedBooking && (
        <ReviewDialog
          open={showReview}
          onOpenChange={setShowReview}
          bookingId={selectedBooking.id}
          toUserId={selectedBooking.client_id}
          toUserName={selectedBooking.client_profile?.name || 'Cliente'}
          bookingRatingField="worker_rating"
          updateWorkerAggregate={false}
          onReviewSubmitted={(rating) => {
            setBookings(prev => prev.map(b =>
              b.id === selectedBooking.id ? { ...b, worker_rating: rating } : b
            ));
          }}
        />
      )}
      <div className="bg-secondary/5 border-b border-border">
        <div className="container py-4">
          <button
            onClick={() => navigate('/worker/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar ao Dashboard
          </button>
        </div>
      </div>

      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              Pendentes
              {pendingBookings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {pendingBookings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Nenhum pedido pendente</h3>
                  <p className="text-sm text-muted-foreground">
                    Novos pedidos aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={booking.client_profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {booking.client_profile?.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{booking.client_profile?.name || 'Cliente'}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{getServiceName(booking.service_type)}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.booking_date).toLocaleDateString('pt-AO')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.booking_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {booking.location_address || 'Endereço não informado'}
                          </span>
                        </div>
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground italic">"{booking.notes}"</p>
                        )}
                      </div>

                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold text-primary">
                          {Number(booking.total_price).toLocaleString('pt-AO')} Kz
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'accepted')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aceitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Nenhum serviço activo</h3>
                  <p className="text-sm text-muted-foreground">
                    Serviços aceites aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={booking.client_profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {booking.client_profile?.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{booking.client_profile?.name || 'Cliente'}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(booking.booking_date).toLocaleDateString('pt-AO')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {booking.booking_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {booking.location_address}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowChat(true);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Mensagem
                        </Button>
                        {booking.status === 'accepted' && (
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                          >
                            Iniciar
                          </Button>
                        )}
                        {booking.status === 'in_progress' && (
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {historyBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Sem histórico</h3>
                  <p className="text-sm text-muted-foreground">
                    Serviços concluídos aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              historyBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={booking.client_profile?.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {booking.client_profile?.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{booking.client_profile?.name || 'Cliente'}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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

                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold">
                          {Number(booking.total_price).toLocaleString('pt-AO')} Kz
                        </p>
                        {booking.status === 'completed' && !booking.worker_rating && (
                          <Button 
                            variant="hero" 
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowReview(true);
                            }}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Avaliar Cliente
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
