import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'message' | 'booking' | 'status' | 'review';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  bookingId?: string;
  status?: string; // booking status for routing
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notif: Omit<Notification, 'id' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [workerId, setWorkerId] = useState<string | null>(null);

  // Fetch worker ID if user is a worker
  useEffect(() => {
    async function fetchWorkerId() {
      if (!user) {
        setWorkerId(null);
        return;
      }
      
      const { data } = await supabase
        .from('workers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setWorkerId(data?.id || null);
    }
    
    fetchWorkerId();
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Get all booking IDs where user is client or worker
      const { data: clientBookings } = await supabase
        .from('bookings')
        .select('id, worker_id')
        .eq('client_id', user.id);

      let workerBookings: { id: string; client_id: string }[] = [];
      if (workerId) {
        const { data } = await supabase
          .from('bookings')
          .select('id, client_id')
          .eq('worker_id', workerId);
        workerBookings = data || [];
      }

      const allBookingIds = [
        ...(clientBookings || []).map(b => b.id),
        ...workerBookings.map(b => b.id)
      ];

      if (allBookingIds.length === 0) {
        setNotifications([]);
        return;
      }

      // Fetch unread messages (without FK join - messages has no FK to profiles)
      const { data: unreadMessages, error: msgError } = await supabase
        .from('messages')
        .select('id, booking_id, content, created_at, sender_id')
        .in('booking_id', allBookingIds)
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (msgError) {
        console.error('Error fetching messages:', msgError);
      }

      // Fetch sender profiles separately
      const senderIds = [...new Set((unreadMessages || []).map(m => m.sender_id))];
      let profilesMap = new Map<string, string>();
      
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', senderIds);
        
        profilesMap = new Map((profiles || []).map(p => [p.id, p.name]));
      }

      const messageNotifs: Notification[] = (unreadMessages || []).map((msg) => ({
        id: `msg-${msg.id}`,
        type: 'message' as const,
        title: 'Nova mensagem',
        description: `${profilesMap.get(msg.sender_id) || 'Alguém'}: ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`,
        timestamp: msg.created_at,
        isRead: false,
        bookingId: msg.booking_id,
      }));

      setNotifications(messageNotifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user, workerId]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [user, workerId, fetchNotifications]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('global-messages-notif')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const message = payload.new as any;
          if (message.sender_id === user.id) return;

          // Check if user is part of this booking
          const { data: booking } = await supabase
            .from('bookings')
            .select('client_id, worker_id')
            .eq('id', message.booking_id)
            .single();

          if (!booking) return;

          const isClient = booking.client_id === user.id;
          let isWorker = false;
          
          if (workerId) {
            isWorker = booking.worker_id === workerId;
          }

          if (!isClient && !isWorker) return;

          // Get sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', message.sender_id)
            .single();

          const newNotif: Notification = {
            id: `msg-${message.id}`,
            type: 'message',
            title: 'Nova mensagem',
            description: `${senderProfile?.name || 'Alguém'}: ${message.content.substring(0, 40)}${message.content.length > 40 ? '...' : ''}`,
            timestamp: message.created_at,
            isRead: false,
            bookingId: message.booking_id,
          };
          
          setNotifications(prev => {
            // Avoid duplicates
            if (prev.some(n => n.id === newNotif.id)) return prev;
            return [newNotif, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        async (payload) => {
          const message = payload.new as any;
          // If message is marked as read, remove its notification
          if (message.is_read) {
            setNotifications(prev => prev.filter(n => n.id !== `msg-${message.id}`));
          }
        }
      )
      .subscribe();

    // Subscribe to booking changes
    const bookingsChannel = supabase
      .channel('global-bookings-notif')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        async (payload) => {
          const booking = payload.new as any;
          const oldBooking = payload.old as any;

          // INSERT - new booking for worker
          if (payload.eventType === 'INSERT') {
            if (workerId && booking.worker_id === workerId) {
              const newNotif: Notification = {
                id: `new-booking-${booking.id}`,
                type: 'booking',
                title: 'Novo pedido!',
                description: 'Você recebeu um novo pedido de serviço',
                timestamp: booking.created_at,
                isRead: false,
                bookingId: booking.id,
                status: booking.status,
              };
              setNotifications(prev => [newNotif, ...prev]);
            }
            return;
          }

          // UPDATE - status changes
          if (payload.eventType === 'UPDATE' && oldBooking?.status !== booking.status) {
            const isClient = booking.client_id === user.id;
            const isWorker = workerId && booking.worker_id === workerId;

            if (!isClient && !isWorker) return;

            let title = '';
            let description = '';
            let shouldNotify = false;
            let notifType: 'status' | 'review' = 'status';

            switch (booking.status) {
              case 'accepted':
                if (isClient) {
                  title = 'Pedido aceite!';
                  description = 'O profissional aceitou o seu pedido';
                  shouldNotify = true;
                }
                break;
              case 'rejected':
                if (isClient) {
                  title = 'Pedido rejeitado';
                  description = 'O profissional rejeitou o seu pedido';
                  shouldNotify = true;
                }
                break;
              case 'in_progress':
                if (isClient) {
                  title = 'Serviço iniciado';
                  description = 'O profissional está a caminho';
                  shouldNotify = true;
                }
                break;
              case 'completed':
                // Notify BOTH client and worker
                if (isClient) {
                  title = '🎉 Serviço concluído!';
                  description = 'Avalie o profissional agora!';
                  notifType = 'review';
                  shouldNotify = true;
                } else if (isWorker) {
                  title = '🎉 Serviço concluído!';
                  description = 'Avalie o cliente agora!';
                  notifType = 'review';
                  shouldNotify = true;
                }
                break;
              case 'cancelled':
                title = 'Pedido cancelado';
                description = 'O pedido foi cancelado';
                shouldNotify = true;
                break;
            }

            if (shouldNotify) {
              const notifId = `booking-${booking.id}-${booking.status}-${isClient ? 'client' : 'worker'}`;
              setNotifications(prev => {
                if (prev.some(n => n.id === notifId)) return prev;
                return [{
                  id: notifId,
                  type: notifType,
                  title,
                  description,
                  timestamp: booking.updated_at,
                  isRead: false,
                  bookingId: booking.id,
                  status: booking.status,
                }, ...prev];
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [user, workerId]);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'isRead'>) => {
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    if (!user) return;

    // Mark all messages as read in database
    const { data: clientBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('client_id', user.id);

    let workerBookings: { id: string }[] = [];
    if (workerId) {
      const { data } = await supabase
        .from('bookings')
        .select('id')
        .eq('worker_id', workerId);
      workerBookings = data || [];
    }

    const allBookingIds = [
      ...(clientBookings || []).map(b => b.id),
      ...workerBookings.map(b => b.id)
    ];

    if (allBookingIds.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .in('booking_id', allBookingIds)
        .neq('sender_id', user.id);
    }
  }, [user, workerId]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      refreshNotifications: fetchNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
