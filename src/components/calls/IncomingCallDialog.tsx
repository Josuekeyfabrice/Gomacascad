import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRingtone } from '@/hooks/useRingtone';
import type { Profile } from '@/types/database';

interface IncomingCall {
  id: string;
  caller_id: string;
  call_type?: 'voice' | 'video';
  status: string;
}

export const IncomingCallDialog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { startRingtone, stopRingtone } = useRingtone();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [caller, setCaller] = useState<Profile | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Subscribe to incoming calls
    const channel = supabase
      .channel('incoming-calls-dialog')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calls',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const call = payload.new as IncomingCall;
          console.log('Incoming call received:', call);
          
          if (call.status === 'pending') {
            setIncomingCall(call);
            
            // Get caller info
            const { data: callerData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', call.caller_id)
              .single();

            if (callerData) {
              setCaller(callerData as Profile);
            }
            
            setIsOpen(true);
            startRingtone();
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
          const call = payload.new as IncomingCall;
          console.log('Call updated:', call);
          
          // Close dialog if call is no longer pending
          if (call.id === incomingCall?.id && call.status !== 'pending') {
            setIsOpen(false);
            setIncomingCall(null);
            setCaller(null);
            stopRingtone();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, incomingCall?.id]);

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    console.log('Accepting call:', incomingCall.id);
    
    // Stop ringtone immediately and ensure it's fully stopped
    stopRingtone();
    
    // Double-check that ringtone is stopped after a short delay
    setTimeout(() => {
      stopRingtone();
    }, 100);
    
    // Update call status in database
    try {
      await supabase
        .from('calls')
        .update({ status: 'accepted' })
        .eq('id', incomingCall.id);
    } catch (error) {
      console.error('Error updating call status:', error);
    }
    
    // Navigate to call page with callId
    navigate(`/call/${incomingCall.caller_id}?callId=${incomingCall.id}&type=${incomingCall.call_type || 'voice'}`);
    setIsOpen(false);
    setIncomingCall(null);
    setCaller(null);
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    
    console.log('Rejecting call:', incomingCall.id);
    
    // Stop ringtone immediately
    stopRingtone();
    
    // Double-check that ringtone is stopped
    setTimeout(() => {
      stopRingtone();
    }, 100);
    
    try {
      await supabase
        .from('calls')
        .update({ status: 'rejected' })
        .eq('id', incomingCall.id);
    } catch (error) {
      console.error('Error rejecting call:', error);
    }

    setIsOpen(false);
    setIncomingCall(null);
    setCaller(null);
  };

  if (!incomingCall || !caller) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && rejectCall()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center py-6">
          <div className="relative mb-6">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20 animate-pulse">
              <AvatarImage src={caller.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {caller.full_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
              {incomingCall.call_type === 'video' ? (
                <Video className="h-4 w-4 text-white" />
              ) : (
                <Phone className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
          
          <h2 className="font-display text-xl font-bold mb-1">
            {caller.full_name || 'Utilisateur'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {incomingCall.call_type === 'video' ? 'Appel vidéo entrant...' : 'Appel vocal entrant...'}
          </p>

          <div className="flex items-center gap-6">
            <Button
              variant="destructive"
              size="lg"
              className="h-16 w-16 rounded-full shadow-lg"
              onClick={rejectCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
              onClick={acceptCall}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
