import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Conversation {
  odherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline?: boolean;
  bookingIds: string[]; // All bookings with this user
  latestBookingId: string; // Most recent booking for chat
}

export default function Messages() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Helper to check if user is actually online
  const isActuallyOnline = (is_online: boolean, last_seen?: string): boolean => {
    if (!is_online || !last_seen) return false;
    const lastSeenTime = new Date(last_seen).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    return (now - lastSeenTime) < twoMinutes;
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get archived chats for this user
      const { data: archivedChats } = await supabase
        .from('chat_archives')
        .select('booking_id')
        .eq('user_id', user.id);
      
      const archivedBookingIds = new Set((archivedChats || []).map(a => a.booking_id));

      // First check if user is a worker
      const { data: workerData } = await supabase
        .from('workers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch bookings where user is client (any active status)
      const { data: clientBookings, error: clientError } = await supabase
        .from('bookings')
        .select('id, client_id, worker_id, created_at')
        .eq('client_id', user.id)
        .in('status', ['accepted', 'in_progress', 'pending', 'completed']);

      if (clientError) {
        console.error('Error fetching client bookings:', clientError);
      }

      let workerBookings: any[] = [];
      if (workerData) {
        const { data, error: workerError } = await supabase
          .from('bookings')
          .select('id, client_id, worker_id, created_at')
          .eq('worker_id', workerData.id)
          .in('status', ['accepted', 'in_progress', 'pending', 'completed']);
        
        if (workerError) {
          console.error('Error fetching worker bookings:', workerError);
        }
        workerBookings = data || [];
      }

      // Combine bookings
      const allBookings = [...(clientBookings || []), ...workerBookings];
      
      // Remove duplicates and archived
      const uniqueBookings = allBookings
        .filter((booking, index, self) => 
          index === self.findIndex(b => b.id === booking.id)
        )
        .filter(booking => !archivedBookingIds.has(booking.id));

      // If no bookings, return early
      if (uniqueBookings.length === 0) {
        setConversations([]);
        setLoadingConversations(false);
        return;
      }

      // Get all worker IDs from bookings to fetch their user_ids in batch
      const workerIds = [...new Set(uniqueBookings.map(b => b.worker_id))];
      const { data: workersData } = await supabase
        .from('workers')
        .select('id, user_id')
        .in('id', workerIds);
      
      const workerUserMap = new Map((workersData || []).map(w => [w.id, w.user_id]));

      // Group bookings by other user (to avoid duplicate chats)
      const userBookingsMap = new Map<string, { bookingIds: string[]; latestBookingId: string; latestDate: string; workerId: string }>();

      for (const booking of uniqueBookings) {
        const isClient = booking.client_id === user.id;
        let otherUserId: string;

        if (isClient) {
          // Get worker's user_id from our map
          otherUserId = workerUserMap.get(booking.worker_id) || '';
        } else {
          otherUserId = booking.client_id;
        }

        if (!otherUserId) continue;

        const existing = userBookingsMap.get(otherUserId);
        if (existing) {
          existing.bookingIds.push(booking.id);
          if (new Date(booking.created_at) > new Date(existing.latestDate)) {
            existing.latestBookingId = booking.id;
            existing.latestDate = booking.created_at;
          }
        } else {
          userBookingsMap.set(otherUserId, {
            bookingIds: [booking.id],
            latestBookingId: booking.id,
            latestDate: booking.created_at,
            workerId: booking.worker_id,
          });
        }
      }

      // Batch fetch all profiles
      const allOtherUserIds = [...userBookingsMap.keys()];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', allOtherUserIds);
      
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

      // Batch fetch all presence
      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('user_id, is_online, last_seen')
        .in('user_id', allOtherUserIds);
      
      const presenceMap = new Map((presenceData || []).map(p => [p.user_id, p]));

      // Build conversations list (one per user)
      const convos: Conversation[] = [];
      
      for (const [otherUserId, data] of userBookingsMap) {
        const profile = profilesMap.get(otherUserId);
        const presence = presenceMap.get(otherUserId);
        
        const otherUserName = profile?.name || 'Usuário';
        const otherUserAvatar = profile?.avatar_url || undefined;
        const isOnline = isActuallyOnline(presence?.is_online || false, presence?.last_seen);

        // Get last message from any of the bookings with this user
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .in('booking_id', data.bookingIds)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Count unread messages from all bookings with this user
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('booking_id', data.bookingIds)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        convos.push({
          odherUserId: otherUserId,
          otherUserName,
          otherUserAvatar,
          lastMessage: lastMsg?.content,
          lastMessageTime: lastMsg?.created_at,
          unreadCount: count || 0,
          isOnline,
          bookingIds: data.bookingIds,
          latestBookingId: data.latestBookingId,
        });
      }

      // Sort by last message time
      convos.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

      setConversations(convos);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Refresh conversations when coming back to list
  useEffect(() => {
    if (!selectedUserId && user) {
      fetchConversations();
    }
  }, [selectedUserId, user]);

  const handleDeleteChat = async (odherUserId: string) => {
    setConversationToDelete(odherUserId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!conversationToDelete || !user) return;

    try {
      const convo = conversations.find(c => c.odherUserId === conversationToDelete);
      if (!convo) return;

      // Archive all bookings with this user
      for (const bookingId of convo.bookingIds) {
        await supabase
          .from('chat_archives')
          .upsert({
            user_id: user.id,
            booking_id: bookingId
          }, { onConflict: 'user_id,booking_id' });
      }

      setConversations(prev => prev.filter(c => c.odherUserId !== conversationToDelete));
      if (selectedUserId === conversationToDelete) {
        setSelectedUserId(null);
      }
      toast.success('Conversa removida');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Erro ao remover conversa');
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const formatTime = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      return d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
  };

  const selectedConvo = conversations.find(c => c.odherUserId === selectedUserId);

  if (loading) {
    return (
      <Layout showFooter={false}>
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">A carregar...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="container py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Mensagens</h1>

          <div className="flex gap-4 md:gap-6 h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className={`w-full md:w-80 flex-shrink-0 ${selectedUserId ? 'hidden md:block' : ''}`}>
              <div className="bg-card rounded-lg border border-border h-full overflow-hidden">
                {loadingConversations ? (
                  <div className="p-4 text-center text-muted-foreground">
                    A carregar conversas...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 md:p-8 text-center">
                    <MessageCircle className="h-10 md:h-12 w-10 md:w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Sem mensagens</h3>
                    <p className="text-sm text-muted-foreground">
                      As suas conversas aparecerão aqui quando tiver agendamentos ativos.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border overflow-y-auto h-full">
                    {conversations.map((convo) => (
                      <div
                        key={convo.odherUserId}
                        className={`relative group ${
                          selectedUserId === convo.odherUserId ? 'bg-accent' : ''
                        }`}
                      >
                        <button
                          onClick={() => setSelectedUserId(convo.odherUserId)}
                          className="w-full p-3 md:p-4 text-left hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <Avatar className="h-10 md:h-12 w-10 md:w-12">
                                <AvatarImage src={convo.otherUserAvatar} alt={convo.otherUserName} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {convo.otherUserName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {convo.isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 md:w-3 h-2.5 md:h-3 bg-green-500 border-2 border-card rounded-full" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm md:text-base truncate">{convo.otherUserName}</h3>
                                {convo.lastMessageTime && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatTime(convo.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs md:text-sm text-muted-foreground truncate pr-2">
                                  {convo.lastMessage || 'Nenhuma mensagem'}
                                </p>
                                {convo.unreadCount > 0 && (
                                  <Badge className="ml-2 bg-primary shrink-0">{convo.unreadCount}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(convo.odherUserId);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 ${!selectedUserId ? 'hidden md:flex' : ''}`}>
              {selectedConvo ? (
                <ChatWindow
                  bookingId={selectedConvo.latestBookingId}
                  otherUserId={selectedConvo.odherUserId}
                  otherUserName={selectedConvo.otherUserName}
                  otherUserAvatar={selectedConvo.otherUserAvatar}
                  onClose={() => setSelectedUserId(null)}
                  onDeleteChat={() => handleDeleteChat(selectedConvo.odherUserId)}
                />
              ) : (
                <div className="hidden md:flex items-center justify-center h-full bg-card rounded-lg border border-border">
                  <div className="text-center text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4" />
                    <p>Selecione uma conversa para começar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover a conversa da sua lista. As mensagens não serão apagadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChat} className="bg-destructive hover:bg-destructive/90">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
