import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationCounts {
  unreadMessages: number;
  pendingCalls: number;
}

export const useNotificationCounts = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingCalls: 0,
  });

  const fetchCounts = async () => {
    if (!user) {
      setCounts({ unreadMessages: 0, pendingCalls: 0 });
      return;
    }

    // Fetch unread messages count
    const { count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);

    // Fetch pending calls count
    const { count: callsCount } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    setCounts({
      unreadMessages: messagesCount || 0,
      pendingCalls: callsCount || 0,
    });
  };

  useEffect(() => {
    fetchCounts();

    if (!user) return;

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel('messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // Subscribe to calls changes
    const callsChannel = supabase
      .channel('calls-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(callsChannel);
    };
  }, [user]);

  return { counts, refetch: fetchCounts };
};
