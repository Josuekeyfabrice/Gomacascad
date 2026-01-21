import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Call as CallType, Profile } from '@/types/database';

interface IncomingCall extends CallType {
  caller?: Profile;
}

interface UseIncomingCallsReturn {
  incomingCall: IncomingCall | null;
  isLoading: boolean;
  error: Error | null;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  clearIncomingCall: () => void;
}

export const useIncomingCalls = (userId: string | null): UseIncomingCallsReturn => {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!userId) return;

    const handleNewCall = async (call: CallType) => {
      if (!isMountedRef.current) return;
      try {
        const { data: callerProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', call.caller_id)
          .single();

        if (profileError) throw profileError;

        if (isMountedRef.current) {
          setIncomingCall({
            ...call,
            caller: callerProfile,
          });
        }
      } catch (err) {
        console.error('Error fetching caller profile:', err);
        if (isMountedRef.current) {
          setIncomingCall(call as IncomingCall);
        }
      }
    };

    const channel = supabase
      .channel(`incoming-calls-${userId}`)
      .on(
        'broadcast',
        { event: 'new-call' },
        ({ payload }) => {
          if (payload.receiver_id === userId) {
            handleNewCall(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${userId},status=eq.pending`,
        },
        (payload) => handleNewCall(payload.new as CallType)
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          if (!isMountedRef.current) return;

          const updatedCall = payload.new as CallType;

          // Clear incoming call if it's no longer pending
          if (
            incomingCall &&
            incomingCall.id === updatedCall.id &&
            updatedCall.status !== 'pending'
          ) {
            setIncomingCall(null);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, incomingCall?.id]);

  const acceptCall = useCallback(async () => {
    if (!incomingCall) {
      throw new Error('No incoming call to accept');
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('calls')
        .update({
          status: 'accepted',
          started_at: new Date().toISOString(),
        })
        .eq('id', incomingCall.id);

      if (updateError) throw updateError;

      if (isMountedRef.current) {
        setIncomingCall(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to accept call';
      if (isMountedRef.current) {
        setError(new Error(errorMsg));
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [incomingCall]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) {
      throw new Error('No incoming call to reject');
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('calls')
        .update({ status: 'rejected' })
        .eq('id', incomingCall.id);

      if (updateError) throw updateError;

      if (isMountedRef.current) {
        setIncomingCall(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reject call';
      if (isMountedRef.current) {
        setError(new Error(errorMsg));
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [incomingCall]);

  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    incomingCall,
    isLoading,
    error,
    acceptCall,
    rejectCall,
    clearIncomingCall,
  };
};
