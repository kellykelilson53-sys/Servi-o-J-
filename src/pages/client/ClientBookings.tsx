import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Calendar, Clock, MapPin, 
  MessageCircle, XCircle, Star, Trash2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_CATEGORIES } from '@/types';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ReviewDialog } from '@/components/review/ReviewDialog';
import type { Database } from '@/integrations/supabase/types';

type Booking = Database['public']['Tables']['bookings']['Row'];
type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingWithWorker extends Booking {
  worker_profile?: {
    name: string;
    phone: string;
    avatar_url: string | null;
  };
  worker_user_id?: string;
}

export default function ClientBookings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithWorker | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return;
      
      try {
        // Get bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Get worker IDs and fetch their profiles
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
              .select('id, name, phone, avatar_url')
              .in('id', userIds);

            const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

            const bookingsWithWorkers: BookingWithWorker[] = bookingsData.map(b => ({
              ...b,
              worker_profile: profilesMap.get(workerUserMap.get(b.worker_id) || '') as BookingWithWorker['worker_profile'],
              worker_user_id: workerUserMap.get(b.worker_id)
            }));

            setBookings(bookingsWithWorkers);
          }
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, [user]);

  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status } : b
      ));

      toast({
        title: 'Agendamento atualizado',
        description: status === 'cancelled' ? 'O agendamento foi cancelado.' : 'Status atualizado.',
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o agendamento.',
        variant: 'destructive',
      });
    }
  };

  const deleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.filter(b => b.id !== bookingId));

      toast({
        title: 'Agendamento eliminado',
        description: 'O agendamento foi removido.',
      });
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível eliminar o agendamento.',
        variant: 'destructive',
      });
    }
  };

  const getServiceName = (type: string) => {
    return SERVICE_CATEGORIES.find(c => c.id === type)?.name || type;
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      pending: { variant: 'secondary', label: 'Pendente', className: 'bg-warning/10 text-warning' },
      accepted: { variant: 'default', label: 'Aceite', className: 'bg-success/10 text-success' },
      rejected: { variant: 'destructive', label: 'Rejeitado' },
      in_progress: { variant: 'default', label: 'Em Progresso', className: 'bg-primary/10 text-primary' },
      completed: { variant: 'outline', label: 'Concluído' },
      cancelled: { variant: 'destructive', label: 'Cancelado' },
    };
    const { variant, label, className } = variants[status];
    return <Badge variant={variant} className={className}>{label}</Badge>;
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

  if (showChat && selectedBooking) {
    return (
      <Layout showFooter={false}>
        <div className="h-[calc(100vh-64px)]">
          <ChatWindow
            bookingId={selectedBooking.id}
            otherUserId={selectedBooking.worker_user_id || ''}
            otherUserName={selectedBooking.worker_profile?.name || 'Profissional'}
            otherUserAvatar={selectedBooking.worker_profile?.avatar_url || undefined}
            onClose={() => setShowChat(false)}
          />
        </div>
      </Layout>
    );
  }

  // Show review dialog
  const handleReviewSubmitted = (rating: number) => {
    if (selectedBooking) {
      setBookings(prev => prev.map(b =>
        b.id === selectedBooking.id ? { ...b, client_rating: rating } : b
      ));
    }
  };

  const renderBookingCard = (booking: BookingWithWorker, showActions = true) => (
    <Card key={booking.id}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={booking.worker_profile?.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {booking.worker_profile?.name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{booking.worker_profile?.name || 'Profissional'}</h3>
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
              {booking.location_address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {booking.location_address}
                </span>
              )}
            </div>
            {booking.notes && (
              <p className="text-sm text-muted-foreground italic">"{booking.notes}"</p>
            )}
          </div>

          <div className="text-right space-y-2">
            <p className="text-lg font-bold text-primary">
              {Number(booking.total_price).toLocaleString('pt-AO')} Kz
            </p>
            {showActions && (
              <div className="flex flex-wrap gap-2 justify-end">
                {['accepted', 'in_progress'].includes(booking.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowChat(true);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat
                  </Button>
                )}
                {booking.status === 'pending' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar agendamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser revertida. O profissional será notificado do cancelamento.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => updateBookingStatus(booking.id, 'cancelled')}>
                          Confirmar Cancelamento
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                {booking.status === 'completed' && !booking.client_rating && (
                  <Button 
                    variant="hero" 
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setShowReview(true);
                    }}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Avaliar
                  </Button>
                )}
                {['cancelled', 'rejected'].includes(booking.status) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar agendamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O registo será permanentemente removido do histórico.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteBooking(booking.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout showFooter={false}>
      {/* Review Dialog */}
      {selectedBooking && selectedBooking.worker_user_id && (
        <ReviewDialog
          open={showReview}
          onOpenChange={setShowReview}
          bookingId={selectedBooking.id}
          toUserId={selectedBooking.worker_user_id}
          toUserName={selectedBooking.worker_profile?.name || 'Profissional'}
          bookingRatingField="client_rating"
          updateWorkerAggregate={true}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
      <div className="bg-secondary/5 border-b border-border">
        <div className="container py-4">
          <button
            onClick={() => navigate('/client/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Voltar ao Dashboard
          </button>
        </div>
      </div>

      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Agendamentos</h1>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="relative">
              Pendentes
              {pendingBookings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                  {pendingBookings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">
              Activos
              {activeBookings.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-success text-success-foreground rounded-full">
                  {activeBookings.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Nenhum agendamento pendente</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quando fizer um agendamento, ele aparecerá aqui
                  </p>
                  <Button onClick={() => navigate('/services')}>
                    Buscar Serviços
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pendingBookings.map(booking => renderBookingCard(booking))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Nenhum serviço activo</h3>
                  <p className="text-sm text-muted-foreground">
                    Agendamentos aceites aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              activeBookings.map(booking => renderBookingCard(booking))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {historyBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Sem histórico</h3>
                  <p className="text-sm text-muted-foreground">
                    Serviços concluídos aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            ) : (
              historyBookings.map(booking => renderBookingCard(booking, true))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
