import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

type Message = Database['public']['Tables']['messages']['Row'];

interface UserPresence {
  is_online: boolean;
  last_seen: string;
}

interface ChatWindowProps {
  bookingId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  onClose?: () => void;
  onDeleteChat?: () => void;
}

export function ChatWindow({ bookingId, otherUserId, otherUserName, otherUserAvatar, onClose, onDeleteChat }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if user is actually online (last_seen within 2 minutes)
  const isActuallyOnline = (presenceData: UserPresence | null): boolean => {
    if (!presenceData) return false;
    if (!presenceData.is_online) return false;
    
    const lastSeen = new Date(presenceData.last_seen).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000;
    
    return (now - lastSeen) < twoMinutes;
  };

  // Mark messages as read function
  const markMessagesAsRead = async () => {
    if (!user || !bookingId) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('booking_id', bookingId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
      
      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (err) {
      console.error('Error in markMessagesAsRead:', err);
    }
  };

  // Mark messages as read when opening the chat and continuously
  useEffect(() => {
    // Mark immediately on open
    markMessagesAsRead();
    
    // Re-mark as read every 2 seconds while chat is open
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        markMessagesAsRead();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [user, bookingId]);

  // Fetch user presence
  useEffect(() => {
    async function fetchPresence() {
      if (!otherUserId) return;
      
      const { data, error } = await supabase
        .from('user_presence')
        .select('is_online, last_seen')
        .eq('user_id', otherUserId)
        .maybeSingle();
      
      if (!error && data) {
        setPresence(data);
      }
    }

    fetchPresence();
    
    // Refresh every 30 seconds to update "last seen" calculation
    const refreshInterval = setInterval(fetchPresence, 30000);

    // Subscribe to presence changes
    const channel = supabase
      .channel(`presence-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${otherUserId}`
        },
        (payload) => {
          if (payload.new) {
            setPresence(payload.new as UserPresence);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, [otherUserId]);

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setMessages(data);
        // Mark as read after fetching
        setTimeout(markMessagesAsRead, 100);
      }
    }

    fetchMessages();
  }, [bookingId]);

  // Subscribe to new messages and mark as read immediately
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Mark as read immediately if from other user and chat is visible
          if (newMsg.sender_id !== user?.id && !newMsg.is_read && document.visibilityState === 'visible') {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, user?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase
      .from('messages')
      .insert({
        booking_id: bookingId,
        sender_id: user.id,
        content: messageText,
      });

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    }
    
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-AO', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastSeen = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `há ${minutes} min`;
    if (hours < 24) return `há ${hours}h`;
    if (days === 1) return 'ontem às ' + d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' }) + ' às ' + d.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusText = () => {
    if (!presence) return 'Offline';
    if (isActuallyOnline(presence)) return 'Online';
    return `Visto por último ${formatLastSeen(presence.last_seen)}`;
  };

  const userIsOnline = isActuallyOnline(presence);

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="relative shrink-0">
            <Avatar className="h-9 w-9 md:h-10 md:w-10">
              <AvatarImage src={otherUserAvatar} alt={otherUserName} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {otherUserName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {userIsOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 border-2 border-card rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm md:text-base truncate">{otherUserName}</h3>
            <p className={`text-xs ${userIsOnline ? 'text-green-500' : 'text-muted-foreground'} truncate`}>
              {getStatusText()}
            </p>
          </div>
        </div>
        {onDeleteChat && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onDeleteChat}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-3 md:p-4">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Nenhuma mensagem ainda.</p>
              <p className="text-sm">Envie uma mensagem para iniciar a conversa.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[75%] rounded-2xl px-3 md:px-4 py-2 md:py-2.5 shadow-sm ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p
                      className={`text-[10px] mt-1 text-right ${
                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 md:p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            placeholder="Escreva uma mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
            className="flex-1 text-sm md:text-base"
          />
          <Button 
            variant="hero" 
            size="icon" 
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
