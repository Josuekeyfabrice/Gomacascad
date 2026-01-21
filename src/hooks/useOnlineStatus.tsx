import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useOnlineStatus = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updateStatus = async (isOnline: boolean) => {
      await supabase
        .from('profiles')
        .update({ 
          is_online: isOnline, 
          last_seen: new Date().toISOString() 
        })
        .eq('user_id', user.id);
    };

    // Set online when component mounts
    updateStatus(true);

    // Set offline when window closes or user leaves
    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${user.id}`,
        JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Heartbeat to keep online status
    const heartbeat = setInterval(() => {
      updateStatus(true);
    }, 30000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(heartbeat);
      updateStatus(false);
    };
  }, [user]);
};

