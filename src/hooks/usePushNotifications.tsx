import { useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const usePushNotifications = () => {
  const { user } = useAuth();

  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  const subscribeToPush = useCallback(async (registration: ServiceWorkerRegistration) => {
    try {
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        // Note: In production, you'd need a VAPID key from your server
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          // In production, use your VAPID public key:
          // applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      console.log('Push subscription:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }, []);

  // Show local notification (for when app is in foreground)
  const showLocalNotification = useCallback(async (
    title: string, 
    options: NotificationOptions & { data?: Record<string, unknown> }
  ) => {
    const registration = await navigator.serviceWorker.ready;
    
    await registration.showNotification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    } as NotificationOptions);
  }, []);

  // Initialize push notifications
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      const registration = await registerServiceWorker();
      if (!registration) return;

      const hasPermission = await requestPermission();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return;
      }

      // Optional: Subscribe to push (requires VAPID key)
      // const subscription = await subscribeToPush(registration);
    };

    init();
  }, [user, registerServiceWorker, requestPermission]);

  // Listen for incoming calls and messages when app is in background
  useEffect(() => {
    if (!user) return;

    // Subscribe to incoming calls
    const callsChannel = supabase
      .channel('push-calls')
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
          
          if (call.status === 'pending' && document.hidden) {
            // Get caller info
            const { data: caller } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', call.caller_id)
              .single();

            const callerName = caller?.full_name || 'Quelqu\'un';

            await showLocalNotification('Appel entrant', {
              body: `${callerName} vous appelle`,
              tag: 'incoming-call',
              requireInteraction: true,
              data: {
                type: 'call',
                callId: call.id,
                callerId: call.caller_id,
                callType: call.call_type || 'voice',
              },
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('push-messages')
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
          
          if (document.hidden) {
            // Get sender info
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', message.sender_id)
              .single();

            const senderName = sender?.full_name || 'Quelqu\'un';

            await showLocalNotification('Nouveau message', {
              body: `${senderName}: ${message.content.substring(0, 100)}`,
              tag: 'message',
              data: {
                type: 'message',
                senderId: message.sender_id,
                url: '/messages',
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(callsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, showLocalNotification]);

  return { requestPermission, showLocalNotification };
};
