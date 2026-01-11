import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, MapPin, MessageSquare, Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Get unread count for mobile badge
  let unreadCount = 0;
  try {
    const { unreadCount: count } = useNotifications();
    unreadCount = count;
  } catch {
    // Context not available yet
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const userName = profile?.name || 'Usuário';
  const userCity = profile?.city || 'Luanda';
  const userType = profile?.user_type || 'client';
  const avatarUrl = profile?.avatar_url || '';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg gradient-primary">
            <span className="text-lg md:text-xl font-bold text-primary-foreground">S</span>
          </div>
          <span className="text-lg md:text-xl font-bold text-foreground">ServiçoJá</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Serviços
          </Link>
          <Link to="/how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Como Funciona
          </Link>
          {!user && (
            <Link to="/become-worker" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Seja um Profissional
            </Link>
          )}
        </nav>

        {/* User Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications Dropdown */}
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl} alt={userName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {userCity}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(userType === 'worker' ? '/worker/dashboard' : '/client/dashboard')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Meu Painel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/messages')}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Mensagens</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Administração</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Terminar Sessão</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button variant="hero" onClick={() => navigate('/register')}>
                Registar
              </Button>
            </>
          )}
        </div>

        {/* Mobile: Notifications + Menu */}
        <div className="flex md:hidden items-center gap-1">
          {user && <NotificationsDropdown />}
          <button
            className="p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container py-4 flex flex-col gap-3">
            <Link
              to="/services"
              className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Serviços
            </Link>
            <Link
              to="/how-it-works"
              className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Como Funciona
            </Link>
            {!user && (
              <Link
                to="/become-worker"
                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Seja um Profissional
              </Link>
            )}
            <div className="border-t border-border pt-3 mt-2">
              {user ? (
                <>
                  <Link
                    to={userType === 'worker' ? '/worker/dashboard' : '/client/dashboard'}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Meu Painel
                  </Link>
                  <Link
                    to="/messages"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors relative"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Mensagens
                    {unreadCount > 0 && (
                      <Badge className="ml-auto">{unreadCount > 9 ? '9+' : unreadCount}</Badge>
                    )}
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Administração
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-destructive hover:bg-accent rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Terminar Sessão
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  <Button variant="outline" onClick={() => { navigate('/login'); setIsMenuOpen(false); }}>
                    Entrar
                  </Button>
                  <Button variant="hero" onClick={() => { navigate('/register'); setIsMenuOpen(false); }}>
                    Registar
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
