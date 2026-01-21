import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIncomingCalls } from '@/hooks/useIncomingCalls';
import { useRingtone } from '@/hooks/useRingtone';
import { useToast } from '@/hooks/use-toast';

export const IncomingCallDialogNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { startRingtone, stopRingtone } = useRingtone();
  const { incomingCall, isLoading, error, acceptCall, rejectCall } = useIncomingCalls(
    user?.id || null
  );

  const isCallPage = location.pathname.startsWith('/call/');

  // Start ringtone when call arrives
  useEffect(() => {
    if (incomingCall && incomingCall.status === 'pending' && !isCallPage) {
      startRingtone();
    }
  }, [incomingCall?.id, incomingCall?.status, startRingtone, isCallPage]);

  // Stop ringtone when dialog closes
  useEffect(() => {
    return () => {
      stopRingtone();
    };
  }, [stopRingtone]);

  const handleAccept = async () => {
    try {
      stopRingtone();
      await new Promise((resolve) => setTimeout(resolve, 100));
      stopRingtone();

      await acceptCall();

      // Navigate to call page
      if (incomingCall) {
        navigate(
          `/call/${incomingCall.caller_id}?callId=${incomingCall.id}&type=${incomingCall.call_type || 'voice'}`
        );
      }
    } catch (err) {
      console.error('Error accepting call:', err);
      toast({
        title: 'Erreur',
        description: "Impossible d'accepter l'appel",
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    try {
      stopRingtone();
      await new Promise((resolve) => setTimeout(resolve, 100));
      stopRingtone();

      await rejectCall();
    } catch (err) {
      console.error('Error rejecting call:', err);
      toast({
        title: 'Erreur',
        description: "Impossible de refuser l'appel",
        variant: 'destructive',
      });
    }
  };

  if (!incomingCall || isCallPage) {
    return null;
  }

  const isOpen = incomingCall.status === 'pending';
  const caller = incomingCall.caller;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReject()}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center py-6">
          {/* Caller Avatar */}
          <div className="relative mb-6">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20 animate-pulse">
              <AvatarImage src={caller?.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {caller?.full_name?.charAt(0)?.toUpperCase() || '?'}
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

          {/* Caller Name */}
          <h2 className="font-display text-xl font-bold mb-1">
            {caller?.full_name || 'Utilisateur'}
          </h2>

          {/* Call Type */}
          <p className="text-muted-foreground mb-8">
            {incomingCall.call_type === 'video' ? 'Appel vidéo entrant...' : 'Appel vocal entrant...'}
          </p>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-500 mb-4">{error.message}</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-6">
            <Button
              variant="destructive"
              size="lg"
              className="h-16 w-16 rounded-full shadow-lg"
              onClick={handleReject}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <PhoneOff className="h-6 w-6" />
              )}
            </Button>
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
              onClick={handleAccept}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
