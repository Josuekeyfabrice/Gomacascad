import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WebRTCSignaling, getRTCConfiguration, type SignalingMessage } from '@/utils/webrtc-signaling';
import { useConnectionQuality } from '@/hooks/useConnectionQuality';
import { SignalStrengthIndicator } from '@/components/calls/SignalStrengthIndicator';
import type { Profile, Call as CallType } from '@/types/database';

const MAX_RECONNECTION_ATTEMPTS = 3;
const RECONNECTION_DELAY = 2000;

const Call = () => {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const callType = searchParams.get('type') as 'voice' | 'video' || 'voice';
  const incomingCallId = searchParams.get('callId');

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [partner, setPartner] = useState<Profile | null>(null);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended' | 'reconnecting'>('connecting');
  const [call, setCall] = useState<CallType | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [isWebRTCReady, setIsWebRTCReady] = useState(false);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const signalingRef = useRef<WebRTCSignaling | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const hasCreatedOfferRef = useRef(false);
  const isReconnectingRef = useRef(false);
  const callRef = useRef<CallType | null>(null);
  const reconnectionAttemptsRef = useRef(0);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const callStatusRef = useRef<'connecting' | 'ringing' | 'connected' | 'ended' | 'reconnecting'>('connecting');
  const isInitializedRef = useRef(false);

  // Sync refs with state for stable access in callbacks
  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  useEffect(() => {
    reconnectionAttemptsRef.current = reconnectionAttempts;
  }, [reconnectionAttempts]);

  // Connection quality monitoring
  const connectionQuality = useConnectionQuality({
    peerConnection: peerConnectionRef.current,
    enabled: callStatus === 'connected',
  });

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (message.type === 'presence') {
      if ((message.payload as { status: string }).status === 'ready') {
        console.log('Partner is ready on signaling channel');
        if (user?.id === callRef.current?.caller_id && callStatusRef.current === 'connecting') {
          console.log('Initiating offer after partner ready');
          sendInitialOffer();
        }
      }
      return;
    }

    const pc = peerConnectionRef.current;
    if (!pc) {
      console.log('No peer connection yet, queuing message:', message.type);
      if (message.type === 'ice-candidate') {
        pendingCandidatesRef.current.push(message.payload as RTCIceCandidateInit);
      } else if (message.type === 'offer') {
        pendingOfferRef.current = message.payload as RTCSessionDescriptionInit;
      }
      return;
    }

    console.log('Handling signaling message:', message.type, 'PC state:', pc.signalingState);

    try {
      if (message.type === 'offer') {
        console.log('Received offer, current signaling state:', pc.signalingState);

        if (pc.signalingState !== 'stable') {
          console.log('Not in stable state, queuing offer');
          pendingOfferRef.current = message.payload as RTCSessionDescriptionInit;
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(message.payload as RTCSessionDescriptionInit));
        console.log('Remote description set, creating answer...');

        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding pending ICE candidate:', e);
          }
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await signalingRef.current?.sendAnswer(answer);

      } else if (message.type === 'answer') {
        console.log('Received answer, current signaling state:', pc.signalingState);

        if (pc.signalingState !== 'have-local-offer') {
          console.log('Not in have-local-offer state, ignoring answer');
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(message.payload as RTCSessionDescriptionInit));

        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding pending ICE candidate:', e);
          }
        }
        pendingCandidatesRef.current = [];

      } else if (message.type === 'ice-candidate') {
        const candidate = message.payload as RTCIceCandidateInit;
        console.log('Adding ICE candidate, current remote desc:', pc.remoteDescription?.type);

        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Successfully added ICE candidate');
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        } else {
          console.log('Buffering ICE candidate (no remote description yet)');
          pendingCandidatesRef.current.push(candidate);
        }
      }
    } catch (error) {
      console.error('CRITICAL: Error handling signaling message:', error);
    }
  }, [user?.id]); // Removed callStatus dependency

  // Reconnection logic
  const attemptReconnection = useCallback(async () => {
    if (isReconnectingRef.current || reconnectionAttemptsRef.current >= MAX_RECONNECTION_ATTEMPTS) {
      console.log('Max reconnection attempts reached or already reconnecting');
      return false;
    }

    isReconnectingRef.current = true;
    setCallStatus('reconnecting');
    setReconnectionAttempts(prev => prev + 1);

    console.log(`Attempting reconnection ${reconnectionAttemptsRef.current + 1}/${MAX_RECONNECTION_ATTEMPTS}`);

    try {
      // Close existing connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Wait before reconnecting
      await new Promise(resolve => setTimeout(resolve, RECONNECTION_DELAY));

      // Reinitialize WebRTC
      const currentCall = callRef.current;
      if (currentCall) {
        hasCreatedOfferRef.current = false;
        await initWebRTC(!incomingCallId, currentCall.id);

        toast({
          title: "Reconnexion réussie",
          description: "La connexion a été rétablie",
        });

        isReconnectingRef.current = false;
        return true;
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
    }

    isReconnectingRef.current = false;
    return false;
  }, [incomingCallId, toast]); // Removed call and reconnectionAttempts from dependencies

  // Initialize WebRTC
  const initWebRTC = useCallback(async (isInitiator: boolean, callId: string) => {
    if (!user || !userId) {
      console.error('Missing user or userId');
      return;
    }

    if (peerConnectionRef.current && !isReconnectingRef.current) {
      console.log('WebRTC already initialized');
      return;
    }

    console.log('Initializing WebRTC, isInitiator:', isInitiator, 'callId:', callId);

    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: callType === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        } : false,
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.error('Failed to get media with ideal constraints, trying fallback', e);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
      }
      localStreamRef.current = stream;

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
      }

      const configuration = getRTCConfiguration();
      const pc = new RTCPeerConnection(configuration);
      peerConnectionRef.current = pc;

      remoteStreamRef.current = new MediaStream();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);

        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
        } else {
          if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
          remoteStreamRef.current.addTrack(event.track);
        }

        if (remoteVideoRef.current && callType === 'video') {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStreamRef.current;
          remoteAudioRef.current.play().catch(err => {
            console.log('Audio play failed, waiting for interaction', err);
          });
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && signalingRef.current) {
          signalingRef.current.sendIceCandidate(event.candidate);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log('Connection state changed to:', pc.connectionState);
        setConnectionState(pc.connectionState);

        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
          setIsWebRTCReady(true);
          setReconnectionAttempts(0);

          if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
            remoteAudioRef.current.play().catch(console.log);
          }
        } else if (pc.connectionState === 'failed') {
          console.error('Connection failed, attempting reconnection...');
          attemptReconnection();
        } else if (pc.connectionState === 'disconnected') {
          toast({
            title: "Connexion instable",
            description: "Tentative de reconnexion...",
          });
          setTimeout(() => {
            if (peerConnectionRef.current?.connectionState === 'disconnected') {
              attemptReconnection();
            }
          }, 3000);
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);

        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setCallStatus('connected');
          setIsWebRTCReady(true);
        } else if (pc.iceConnectionState === 'failed') {
          attemptReconnection();
        }
      };

      // WebRTC initialization is now focused on media and tracks.
      // Signaling is handled by a separate Effect.

      // If we are the receiver and we just initialized (after accept), send READY
      if (!isInitiator && signalingRef.current) {
        console.log('Sending READY presence...');
        await signalingRef.current.sendPresence('ready');
      }

      // Check for pending offer (for the receiver)
      if (pendingOfferRef.current) {
        console.log('Processing buffered offer...');
        const offer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        for (const candidate of pendingCandidatesRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding pending candidate:', e);
          }
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await signalingRef.current?.sendAnswer(answer);
      }

    } catch (error) {
      console.error('WebRTC initialization error:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'accéder à la caméra/micro",
        variant: "destructive",
      });
    }
  }, [user, userId, callType, handleSignalingMessage, toast, attemptReconnection]);

  const sendInitialOffer = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !signalingRef.current || hasCreatedOfferRef.current) return;

    try {
      console.log('Initiating offer creation...');
      hasCreatedOfferRef.current = true;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      });

      await pc.setLocalDescription(offer);
      await signalingRef.current.sendOffer(offer);
    } catch (error) {
      console.error('Error creating initial offer:', error);
      hasCreatedOfferRef.current = false;
    }
  }, [callType]);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    signalingRef.current?.disconnect();
    signalingRef.current = null;

    pendingCandidatesRef.current = [];
    hasCreatedOfferRef.current = false;
    isReconnectingRef.current = false;
  }, []);

  // Initialize call
  useEffect(() => {
    if (!user || !userId || isInitializedRef.current) {
      if (!user || !userId) navigate('/messages');
      return;
    }

    const init = async () => {
      console.log('Starting call initialization...');
      isInitializedRef.current = true;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        setPartner(profileData as Profile);
      }

      if (incomingCallId) {
        const { data: callData } = await supabase
          .from('calls')
          .select('*')
          .eq('id', incomingCallId)
          .single();

        if (callData) {
          setCall(callData as CallType);
          setCallStatus('ringing');
        }
      } else {
        const { data: callData, error } = await supabase
          .from('calls')
          .insert({
            caller_id: user.id,
            receiver_id: userId,
            status: 'pending',
            call_type: callType,
          })
          .select()
          .single();

        if (error) {
          toast({
            title: "Erreur",
            description: "Impossible d'initier l'appel",
            variant: "destructive",
          });
          isInitializedRef.current = false;
          navigate('/messages');
          return;
        }

        setCall(callData as CallType);
        setCallStatus('ringing');

        // Send broadcast notification for instant call detection
        const channel = supabase.channel(`incoming-calls-${userId}`);
        await channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'new-call',
              payload: callData
            });
            supabase.removeChannel(channel);
          }
        });

        await initWebRTC(true, callData.id);
      }
    };

    init();

    return () => {
      // Logic for cleanup on unmount is handled by a separate Effect for stability
    };
  }, [user, userId, incomingCallId, navigate, toast]);

  // Dedicated cleanup effect for unmount
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up WebRTC...');
      cleanup();
    };
  }, [cleanup]);

  // Subscribe to call status changes
  useEffect(() => {
    if (!call) return;

    // Connect signaling as soon as call object is available
    const connectSignaling = async () => {
      if (!signalingRef.current && user && userId) {
        console.log('Connecting signaling channel early...');
        const signaling = new WebRTCSignaling(
          call.id,
          user.id,
          userId,
          handleSignalingMessage
        );
        signalingRef.current = signaling;
        try {
          await signaling.connect();
          console.log('Signaling connected successfully');
        } catch (err) {
          console.error('Signaling connection error:', err);
        }
      }
    };
    connectSignaling();

    const channel = supabase
      .channel(`call-status-${call.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calls',
          filter: `id=eq.${call.id}`,
        },
        async (payload) => {
          const updatedCall = payload.new as CallType;
          console.log('Received call update from Postgres:', updatedCall.status);
          setCall(updatedCall);

          if (updatedCall.status === 'accepted') {
            console.log('Call accepted by partner in DB');
            if (user?.id === updatedCall.caller_id) {
              setCallStatus('connecting');
            }
          } else if (updatedCall.status === 'rejected') {
            setCallStatus('ended');
            toast({
              title: "Appel refusé",
              description: "L'utilisateur a refusé l'appel",
            });
            setTimeout(() => navigate(`/messages?user=${userId}`), 2000);
          } else if (updatedCall.status === 'ended') {
            setCallStatus('ended');
            toast({
              title: "Appel terminé",
              description: "Retour à la messagerie",
            });
            setTimeout(() => navigate(`/messages?user=${userId}`), 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [call?.id, navigate, toast, user?.id, userId, handleSignalingMessage]); // Added deps

  // Call duration timer
  useEffect(() => {
    if (callStatus !== 'connected' || !isWebRTCReady) return;

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callStatus, isWebRTCReady]);

  const acceptCall = async () => {
    if (!call) return;

    // Optimistic UI state change
    setCallStatus('connecting');

    try {
      const { error } = await supabase
        .from('calls')
        .update({
          status: 'accepted',
          started_at: new Date().toISOString(),
        })
        .eq('id', call.id);

      if (error) throw error;

      console.log('Successfully accepted call in DB, initializing media...');
      await initWebRTC(false, call.id);
    } catch (error) {
      console.error('Error accepting call:', error);
      setCallStatus('ringing'); // Revert on failure
      toast({
        title: "Erreur",
        description: "Impossible d'accepter l'appel",
        variant: "destructive"
      });
    }
  };

  const rejectCall = async () => {
    if (!call) return;

    await supabase
      .from('calls')
      .update({ status: 'rejected' })
      .eq('id', call.id);

    cleanup();
    toast({
      title: "Appel refusé",
      description: "Retour à la messagerie",
    });
    navigate(`/messages?user=${userId}`);
  };

  const endCall = async () => {
    cleanup();

    if (call && callStatus !== 'ended') {
      await supabase
        .from('calls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', call.id);
    }

    toast({
      title: "Appel terminé",
      description: `Durée: ${formatDuration(callDuration)}`,
    });

    // Redirect to messages with the partner conversation open
    navigate(`/messages?user=${userId}`);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}: ${secs.toString().padStart(2, '0')}`;
  };

  const handleUserInteraction = () => {
    if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
      remoteAudioRef.current.play().catch(console.log);
    }
  };

  const handleManualReconnect = () => {
    setReconnectionAttempts(0);
    attemptReconnection();
  };

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" onClick={handleUserInteraction}>
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />

      {/* Video Area */}
      {callType === 'video' && callStatus === 'connected' && (
        <div className="flex-1 relative bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 w-32 h-24 rounded-lg object-cover border-2 border-background"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {formatDuration(callDuration)}
            </div>
            <SignalStrengthIndicator quality={connectionQuality} />
          </div>
        </div>
      )}

      {/* Voice Call / Connecting UI */}
      {(callType === 'voice' || callStatus !== 'connected') && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Avatar className="h-32 w-32 mb-6">
            <AvatarImage src={partner.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
              {partner.full_name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <h2 className="font-display text-2xl font-bold mb-2">
            {partner.full_name || 'Utilisateur'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {callStatus === 'connecting' && 'Connexion en cours...'}
            {callStatus === 'ringing' && (incomingCallId ? 'Appel entrant...' : 'Appel en cours...')}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'reconnecting' && `Reconnexion... (${reconnectionAttempts} / ${MAX_RECONNECTION_ATTEMPTS})`}
            {callStatus === 'ended' && 'Appel terminé'}
          </p>

          {/* Signal strength for voice calls */}
          {callStatus === 'connected' && (
            <div className="mb-4">
              <SignalStrengthIndicator quality={connectionQuality} />
            </div>
          )}

          {callStatus === 'ringing' && (
            <div className="flex items-center justify-center animate-pulse">
              <div className="h-4 w-4 rounded-full bg-primary mr-2" />
              <div className="h-4 w-4 rounded-full bg-primary mr-2" />
              <div className="h-4 w-4 rounded-full bg-primary" />
            </div>
          )}

          {callStatus === 'connecting' && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground">
                État: {connectionState}
              </p>
            </div>
          )}

          {callStatus === 'reconnecting' && (
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Tentative de reconnexion...
              </p>
              {reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualReconnect}
                >
                  Réessayer manuellement
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="p-8 flex items-center justify-center gap-6 bg-muted/50">
        {callStatus === 'ringing' && incomingCallId && (
          <>
            <Button
              variant="destructive"
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={rejectCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              size="lg"
              className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
              onClick={acceptCall}
            >
              <Phone className="h-6 w-6" />
            </Button>
          </>
        )}

        {(callStatus === 'connected' || callStatus === 'connecting' || callStatus === 'reconnecting' || (callStatus === 'ringing' && !incomingCallId)) && (
          <>
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="lg"
              className="h-14 w-14 rounded-full"
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>

            {callType === 'video' && (
              <Button
                variant={isVideoEnabled ? 'secondary' : 'destructive'}
                size="lg"
                className="h-14 w-14 rounded-full"
                onClick={toggleVideo}
              >
                {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            )}

            <Button
              variant="destructive"
              size="lg"
              className="h-16 w-16 rounded-full"
              onClick={endCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Call;
