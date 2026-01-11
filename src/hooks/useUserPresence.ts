import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserPresence() {
  const { user } = useAuth();

  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString()
        }, { onConflict: 'user_id' });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set online when component mounts
    updatePresence(true);

    // Update presence more frequently (every 20 seconds) for better accuracy
    const interval = setInterval(() => {
      updatePresence(true);
    }, 20000);

    // Set offline when window is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence(false);
      } else {
        updatePresence(true);
      }
    };

    // Handle focus/blur for additional accuracy
    const handleFocus = () => updatePresence(true);
    const handleBlur = () => {
      // Don't immediately set offline on blur, just update last_seen
      updatePresence(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      // Best effort to set offline on unmount
      updatePresence(false);
    };
  }, [user, updatePresence]);
}
