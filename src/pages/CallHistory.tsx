import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Video, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Call, Profile } from '@/types/database';

interface CallWithPartner extends Call {
  partner: Profile;
  isOutgoing: boolean;
}

const CallHistory = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallWithPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const loadCalls = async () => {
      const { data: callsData } = await supabase
        .from('calls')
        .select('*')
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!callsData) {
        setLoading(false);
        return;
      }

      // Get unique partner IDs
      const partnerIds = new Set<string>();
      callsData.forEach(call => {
        const partnerId = call.caller_id === user.id ? call.receiver_id : call.caller_id;
        partnerIds.add(partnerId);
      });

      // Load profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', Array.from(partnerIds));

      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach(p => {
        profilesMap.set(p.user_id, p as Profile);
      });

      // Combine calls with partner info
      const callsWithPartners: CallWithPartner[] = callsData.map(call => {
        const isOutgoing = call.caller_id === user.id;
        const partnerId = isOutgoing ? call.receiver_id : call.caller_id;
        return {
          ...(call as Call),
          partner: profilesMap.get(partnerId) || ({} as Profile),
          isOutgoing,
        };
      });

      setCalls(callsWithPartners);
      setLoading(false);
    };

    loadCalls();
  }, [user]);

  const getCallIcon = (call: CallWithPartner) => {
    if (call.status === 'missed') {
      return <PhoneMissed className="h-5 w-5 text-destructive" />;
    }
    if (call.isOutgoing) {
      return <PhoneOutgoing className="h-5 w-5 text-green-500" />;
    }
    return <PhoneIncoming className="h-5 w-5 text-primary" />;
  };

  const getCallStatus = (call: CallWithPartner) => {
    switch (call.status) {
      case 'missed':
        return 'Appel manqué';
      case 'rejected':
        return 'Appel refusé';
      case 'ended':
        if (call.started_at && call.ended_at) {
          const duration = Math.floor(
            (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000
          );
          const mins = Math.floor(duration / 60);
          const secs = duration % 60;
          return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return 'Terminé';
      case 'pending':
        return 'En attente';
      default:
        return call.status;
    }
  };

  const initiateCall = (partnerId: string, type: 'voice' | 'video') => {
    navigate(`/call/${partnerId}?type=${type}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8">Historique des appels</h1>

        {calls.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun appel dans l'historique</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => (
              <Card key={call.id} className="p-4 flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={call.partner.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {call.partner.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getCallIcon(call)}
                    <span className="font-medium truncate">
                      {call.partner.full_name || 'Utilisateur'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getCallStatus(call)}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(call.created_at), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => initiateCall(call.partner.user_id, 'voice')}
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => initiateCall(call.partner.user_id, 'video')}
                  >
                    <Video className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CallHistory;
