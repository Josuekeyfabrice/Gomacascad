import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSound } from '@/hooks/useNotificationSound';

export const useNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { playNotificationSound, playRingtone, stopRingtone } = useNotificationSound();
  const permissionGranted = useRef(false);
  const activeCallId = useRef<string | null>(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        permissionGranted.current = permission === 'granted';
      });
    } else if ('Notification' in window) {
      permissionGranted.current = Notification.permission === 'granted';
    }
  }, []);

  const showNotification = useCallback((
    title: string, 
    body: string, 
    options?: { 
      onClick?: () => void;
      playSound?: boolean;
      isCall?: boolean;
    }
  ) => {
    // Play sound
    if (options?.playSound !== false) {
      if (options?.isCall) {
        playRingtone();
      } else {
        playNotificationSound();
      }
    }

    // Show toast notification
    toast({
      title,
      description: body,
    });

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        requireInteraction: options?.isCall,
        tag: options?.isCall ? 'incoming-call' : 'message',
      });

      if (options?.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      // Auto close non-call notifications after 5 seconds
      if (!options?.isCall) {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }, [toast, playNotificationSound, playRingtone]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const message = payload.new as any;
          
          // Get sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', message.sender_id)
            .single();

          const senderName = sender?.full_name || 'Quelqu\'un';
          
          showNotification(
            'Nouveau message',
            `${senderName}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            {
              onClick: () => {
                window.location.href = '/messages';
              },
              playSound: true,
            }
          );
        }
      )
      .subscribe();

    // Subscribe to incoming calls
    const callsChannel = supabase
      .channel('calls-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as any;
          
          if (call.status === 'pending') {
            activeCallId.current = call.id;
            
            // Get caller info
            const { data: caller } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', call.caller_id)
              .single();

            const callerName = caller?.full_name || 'Quelqu\'un';
            const callTypeText = call.call_type === 'video' ? 'vidéo' : 'vocal';
            
            showNotification(
              'Appel entrant',
              `${callerName} vous appelle (${callTypeText})`,
              {
                isCall: true,
                playSound: true,
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const call = payload.new as any;
          
          // Stop ringtone when call is answered, rejected, or ended
          if (call.id === activeCallId.current) {
            if (call.status === 'accepted' || call.status === 'rejected' || call.status === 'ended') {
              stopRingtone();
              activeCallId.current = null;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(callsChannel);
      stopRingtone();
    };
  }, [user, showNotification, stopRingtone]);

  return { showNotification, stopRingtone };
};
