import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, MessageSquare, Calendar, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotifications();

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setOpen(false);
    
    // Route based on notification type and status
    switch (notif.type) {
      case 'message':
        navigate('/messages');
        break;
      case 'booking':
        // New booking - go to bookings page
        if (profile?.user_type === 'worker') {
          navigate('/worker/bookings');
        } else {
          navigate('/client/bookings');
        }
        break;
      case 'review':
        // Review prompt - go to bookings to review
        if (profile?.user_type === 'worker') {
          navigate('/worker/bookings');
        } else {
          navigate('/client/bookings');
        }
        break;
      case 'status':
        // Status change - go to appropriate bookings page based on status
        if (notif.status === 'cancelled' || notif.status === 'rejected') {
          // Don't go to chat for cancelled/rejected
          if (profile?.user_type === 'worker') {
            navigate('/worker/bookings');
          } else {
            navigate('/client/bookings');
          }
        } else if (notif.status === 'accepted' || notif.status === 'in_progress') {
          // For accepted/in_progress, can go to bookings
          if (profile?.user_type === 'worker') {
            navigate('/worker/bookings');
          } else {
            navigate('/client/bookings');
          }
        } else {
          navigate('/messages');
        }
        break;
      default:
        navigate('/messages');
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60 * 1000) return 'Agora';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} min`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} h`;
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4 text-primary" />;
      case 'booking':
        return <Calendar className="h-4 w-4 text-success" />;
      case 'status':
        return <Calendar className="h-4 w-4 text-warning" />;
      case 'review':
        return <Star className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Notificações</h3>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-8 px-2 text-xs"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Marcar todas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Sem notificações</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 hover:bg-accent transition-colors cursor-pointer relative group ${
                    !notif.isRead ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5 p-2 rounded-full bg-muted">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notif.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {notif.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Delete button on hover */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  {/* Unread indicator */}
                  {!notif.isRead && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setOpen(false);
                navigate('/messages');
              }}
            >
              Ver todas as mensagens
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
