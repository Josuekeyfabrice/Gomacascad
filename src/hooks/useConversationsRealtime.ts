import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Message, Profile } from '@/types/database';

interface Conversation {
  partnerId: string;
  partner: Profile;
  lastMessage: Message;
  unreadCount: number;
  lastMessageTime: string;
}

interface UseConversationsRealtimeReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
}

export const useConversationsRealtime = (userId: string | null): UseConversationsRealtimeReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Load initial conversations
  useEffect(() => {
    if (!userId) return;

    const loadConversations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all messages for this user
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('created_at', { ascending: false });

        if (messagesError) throw messagesError;

        if (!messagesData || messagesData.length === 0) {
          if (isMountedRef.current) {
            setConversations([]);
            setIsLoading(false);
          }
          return;
        }

        // Group by conversation partner
        const conversationMap = new Map<string, Message[]>();
        messagesData.forEach((msg: any) => {
          const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
          if (!conversationMap.has(partnerId)) {
            conversationMap.set(partnerId, []);
          }
          conversationMap.get(partnerId)!.push(msg);
        });

        // Fetch partner profiles
        const partnerIds = Array.from(conversationMap.keys());
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', partnerIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map<string, Profile>();
        profilesData?.forEach((profile: any) => {
          profileMap.set(profile.user_id, profile);
        });

        // Build conversations
        const builtConversations: Conversation[] = [];
        conversationMap.forEach((msgs, partnerId) => {
          const partner = profileMap.get(partnerId);
          if (partner) {
            const lastMessage = msgs[0]; // Already sorted by created_at desc
            const unreadCount = msgs.filter(
              (msg: any) => msg.receiver_id === userId && !msg.is_read
            ).length;

            builtConversations.push({
              partnerId,
              partner,
              lastMessage,
              unreadCount,
              lastMessageTime: lastMessage.created_at,
            });
          }
        });

        // Sort by last message time
        builtConversations.sort(
          (a, b) =>
            new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        );

        if (isMountedRef.current) {
          setConversations(builtConversations);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to load conversations'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadConversations();
  }, [userId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conversations-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`,
        },
        async (payload) => {
          if (!isMountedRef.current) return;

          const newMessage = payload.new as Message;
          const partnerId = newMessage.sender_id === userId ? newMessage.receiver_id : newMessage.sender_id;

          // Fetch partner profile if not already loaded
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', partnerId)
            .single();

          if (partnerProfile) {
            setConversations((prev) => {
              // Remove existing conversation with this partner
              const filtered = prev.filter((conv) => conv.partnerId !== partnerId);

              // Add updated conversation at the top
              return [
                {
                  partnerId,
                  partner: partnerProfile,
                  lastMessage: newMessage,
                  unreadCount:
                    newMessage.receiver_id === userId && !newMessage.is_read
                      ? 1
                      : 0,
                  lastMessageTime: newMessage.created_at,
                },
                ...filtered,
              ];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          const updatedMessage = payload.new as Message;
          const partnerId = updatedMessage.sender_id === userId ? updatedMessage.receiver_id : updatedMessage.sender_id;

          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.partnerId === partnerId && conv.lastMessage.id === updatedMessage.id) {
                return {
                  ...conv,
                  lastMessage: updatedMessage,
                  unreadCount:
                    updatedMessage.receiver_id === userId && !updatedMessage.is_read
                      ? conv.unreadCount + 1
                      : Math.max(0, conv.unreadCount - 1),
                };
              }
              return conv;
            })
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    conversations,
    isLoading,
    error,
  };
};
