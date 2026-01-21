import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message } from '@/types/database';

interface UseMessagingRealtimeProps {
  userId: string | null;
  partnerId: string | null;
  enabled?: boolean;
}

interface UseMessagingRealtimeReturn {
  messages: Message[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (text: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
}

export const useMessagingRealtime = ({
  userId,
  partnerId,
  enabled = true,
}: UseMessagingRealtimeProps): UseMessagingRealtimeReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Load initial messages
  useEffect(() => {
    if (!userId || !partnerId || !enabled) return;

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .or(
            `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
          )
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        if (isMountedRef.current) {
          setMessages((data as Message[]) || []);
        }

        // Mark received messages as read
        if (data && data.length > 0) {
          const unreadIds = data
            .filter((msg: any) => msg.receiver_id === userId && !msg.is_read)
            .map((msg: any) => msg.id);

          if (unreadIds.length > 0) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .in('id', unreadIds);
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to load messages'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadMessages();
  }, [userId, partnerId, enabled]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId || !partnerId || !enabled) return;

    const channelName = `messages-${[userId, partnerId].sort().join('-')}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId}))`,
        },
        (payload) => {
          if (isMountedRef.current) {
            const newMessage = payload.new as Message;
            setMessages((prev) => [...prev, newMessage]);

            // Auto-mark as read if receiver
            if (newMessage.receiver_id === userId && !newMessage.is_read) {
              supabase
                .from('messages')
                .update({ is_read: true })
                .eq('id', newMessage.id)
                .catch(console.error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId}))`,
        },
        (payload) => {
          if (isMountedRef.current) {
            const updatedMessage = payload.new as Message;
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId}))`,
        },
        (payload) => {
          if (isMountedRef.current) {
            const deletedMessage = payload.old as Message;
            setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, partnerId, enabled]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!userId || !partnerId || !text.trim()) {
        throw new Error('Invalid message data');
      }

      try {
        const { error } = await supabase.from('messages').insert({
          sender_id: userId,
          receiver_id: partnerId,
          content: text.trim(),
          is_read: false,
        });

        if (error) throw error;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to send message';
        throw new Error(errorMsg);
      }
    },
    [userId, partnerId]
  );

  const markAsRead = useCallback(
    async (messageIds: string[]) => {
      if (messageIds.length === 0) return;

      try {
        const { error } = await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', messageIds);

        if (error) throw error;
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
      }
    },
    []
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId)
          .eq('sender_id', userId);

        if (error) throw error;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete message';
        throw new Error(errorMsg);
      }
    },
    [userId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    markAsRead,
    deleteMessage,
  };
};
