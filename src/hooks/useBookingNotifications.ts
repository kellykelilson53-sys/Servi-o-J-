import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type BookingStatus = Database['public']['Enums']['booking_status'];

interface BookingNotification {
  id: string;
  status: BookingStatus;
  worker_id: string;
  client_id: string;
}

export function useBookingNotifications() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Subscribe to bookings changes
    const channel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          const booking = payload.new as BookingNotification;
          
          // Check if we're the worker receiving a new booking
          if (profile?.user_type === 'worker') {
            // Get worker ID for current user
            const { data: workerData } = await supabase
              .from('workers')
              .select('id')
              .eq('user_id', user.id)
              .single();
            
            if (workerData && booking.worker_id === workerData.id) {
              // Get client name
              const { data: clientProfile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', booking.client_id)
                .single();

              if (!notifiedRef.current.has(booking.id)) {
                notifiedRef.current.add(booking.id);
                toast({
                  title: '🔔 Novo Pedido!',
                  description: `${clientProfile?.name || 'Um cliente'} solicitou seu serviço.`,
                });
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        async (payload) => {
          const booking = payload.new as BookingNotification;
          const notificationKey = `${booking.id}-${booking.status}`;
          
          if (notifiedRef.current.has(notificationKey)) return;
          
          // Notifications for clients
          if (booking.client_id === user.id) {
            const { data: workerData } = await supabase
              .from('workers')
              .select('user_id')
              .eq('id', booking.worker_id)
              .single();

            if (workerData) {
              const { data: workerProfile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', workerData.user_id)
                .single();

              const workerName = workerProfile?.name || 'O profissional';

              notifiedRef.current.add(notificationKey);

              switch (booking.status) {
                case 'accepted':
                  toast({
                    title: '✅ Pedido Aceite!',
                    description: `${workerName} aceitou o seu pedido.`,
                  });
                  break;
                case 'rejected':
                  toast({
                    title: '❌ Pedido Rejeitado',
                    description: `${workerName} rejeitou o seu pedido.`,
                    variant: 'destructive',
                  });
                  break;
                case 'in_progress':
                  toast({
                    title: '🚀 Serviço Iniciado!',
                    description: `${workerName} iniciou o serviço.`,
                  });
                  break;
                case 'completed':
                  toast({
                    title: '🎉 Serviço Concluído!',
                    description: `${workerName} concluiu o serviço. Avalie a experiência!`,
                  });
                  break;
              }
            }
          }

          // Notifications for workers
          if (profile?.user_type === 'worker') {
            const { data: workerData } = await supabase
              .from('workers')
              .select('id')
              .eq('user_id', user.id)
              .single();

            if (workerData && booking.worker_id === workerData.id) {
              const { data: clientProfile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', booking.client_id)
                .single();

              const clientName = clientProfile?.name || 'O cliente';

              notifiedRef.current.add(notificationKey);

              if (booking.status === 'cancelled') {
                toast({
                  title: '⚠️ Pedido Cancelado',
                  description: `${clientName} cancelou o agendamento.`,
                  variant: 'destructive',
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Subscribe to messages
    const messagesChannel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const message = payload.new as { id: string; booking_id: string; sender_id: string; content: string };
          
          // Don't notify for own messages
          if (message.sender_id === user.id) return;

          // Check if we're part of this booking
          const { data: booking } = await supabase
            .from('bookings')
            .select('client_id, worker_id')
            .eq('id', message.booking_id)
            .single();

          if (!booking) return;

          // Check if we're client or worker
          const isClient = booking.client_id === user.id;
          let isWorker = false;

          if (!isClient) {
            const { data: workerData } = await supabase
              .from('workers')
              .select('id')
              .eq('user_id', user.id)
              .single();
            
            isWorker = workerData?.id === booking.worker_id;
          }

          if (isClient || isWorker) {
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', message.sender_id)
              .single();

            const notificationKey = `msg-${message.id}`;
            if (!notifiedRef.current.has(notificationKey)) {
              notifiedRef.current.add(notificationKey);
              toast({
                title: `💬 Nova mensagem`,
                description: `${senderProfile?.name || 'Alguém'}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, profile, toast]);
}
