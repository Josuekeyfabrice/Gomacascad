import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Call as CallType } from '@/types/database';

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-ended';
  payload?: any;
  callId: string;
  senderId: string;
}

interface UseCallSignalingProps {
  userId: string | null;
  callId: string | null;
  enabled?: boolean;
}

interface UseCallSignalingReturn {
  call: CallType | null;
  isLoading: boolean;
  error: Error | null;
  sendSignalingMessage: (message: SignalingMessage) => Promise<void>;
  updateCallStatus: (status: 'pending' | 'accepted' | 'rejected' | 'ended') => Promise<void>;
  onSignalingMessage: (callback: (message: SignalingMessage) => void) => void;
}

export const useCallSignaling = ({
  userId,
  callId,
  enabled = true,
}: UseCallSignalingProps): UseCallSignalingReturn => {
  const [call, setCall] = useState<CallType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);
  const callbacksRef = useRef<Set<(message: SignalingMessage) => void>>(new Set());
  const isMountedRef = useRef(true);

  // Load initial call data
  useEffect(() => {
    if (!callId || !enabled) return;

    const loadCall = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('calls')
          .select('*')
          .eq('id', callId)
          .single();

        if (fetchError) throw fetchError;

        if (isMountedRef.current) {
          setCall(data as CallType);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Failed to load call'));
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadCall();
  }, [callId, enabled]);

  // Subscribe to call signaling messages
  useEffect(() => {
    if (!callId || !userId || !enabled) return;

    const channelName = `call-signaling-${callId}`;

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'broadcast',
        { event: 'signaling' },
        ({ payload }) => {
          if (!isMountedRef.current) return;
          const message = payload as SignalingMessage;
          callbacksRef.current.forEach((callback) => callback(message));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signaling',
          filter: `call_id=eq.${callId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          const message = payload.new as SignalingMessage;

          // Only process messages not sent by this user
          if (message.senderId !== userId) {
            callbacksRef.current.forEach((callback) => callback(message));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          const updatedCall = payload.new as CallType;
          setCall(updatedCall);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [callId, userId, enabled]);

  const sendSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      if (!callId || !userId) {
        throw new Error('Missing callId or userId');
      }

      try {
        // 1. Send via Broadcast for instant delivery
        if (channelRef.current) {
          await channelRef.current.send({
            type: 'broadcast',
            event: 'signaling',
            payload: { ...message, senderId: userId, callId }
          });
        }

        // 2. Persist in DB as fallback/history
        await supabase.from('call_signaling').insert({
          call_id: callId,
          sender_id: userId,
          type: message.type,
          payload: message.payload,
        });
      } catch (err) {
        console.error('Signaling error:', err);
      }
    },
    [callId, userId]
  );

  const updateCallStatus = useCallback(
    async (status: 'pending' | 'accepted' | 'rejected' | 'ended') => {
      if (!callId) {
        throw new Error('Missing callId');
      }

      try {
        const updateData: any = { status };

        if (status === 'accepted') {
          updateData.started_at = new Date().toISOString();
        } else if (status === 'ended') {
          updateData.ended_at = new Date().toISOString();
        }

        const { error } = await supabase
          .from('calls')
          .update(updateData)
          .eq('id', callId);

        if (error) throw error;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update call status';
        throw new Error(errorMsg);
      }
    },
    [callId]
  );

  const onSignalingMessage = useCallback((callback: (message: SignalingMessage) => void) => {
    callbacksRef.current.add(callback);

    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      callbacksRef.current.clear();
    };
  }, []);

  return {
    call,
    isLoading,
    error,
    sendSignalingMessage,
    updateCallStatus,
    onSignalingMessage,
  };
};
