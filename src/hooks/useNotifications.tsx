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
      duration: options?.isCall ? 30000 : 5000,
    });

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        requireInteraction: options?.isCall,
        tag: options?.isCall ? 'incoming-call' : 'notification',
      });

      if (options?.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      if (!options?.isCall) {
        setTimeout(() => notification.close(), 5000);
      }
    }
  }, [toast, playNotificationSound, playRingtone]);

  useEffect(() => {
    if (!user) return;

    // Listen to notifications table (Centralized)
    const notificationsChannel = supabase
      .channel('app-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;

          showNotification(
            notification.title,
            notification.message,
            {
              isCall: notification.type === 'call',
              playSound: true,
              onClick: () => {
                if (notification.type === 'message') window.location.href = '/messages';
                if (notification.type === 'call') window.location.href = `/call/${notification.data?.caller_id}`;
              }
            }
          );
        }
      )
      .subscribe();

    // Still listen for call updates to stop ringtone
    const callsUpdateChannel = supabase
      .channel('calls-status-notifications')
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
          if (call.status === 'accepted' || call.status === 'rejected' || call.status === 'ended') {
            stopRingtone();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(callsUpdateChannel);
      stopRingtone();
    };
  }, [user, showNotification, stopRingtone]);

  return { showNotification, stopRingtone };
};
