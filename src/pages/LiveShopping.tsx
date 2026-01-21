import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Video, Play, Users, Heart, MessageSquare, Share2, AlertCircle, Radio, X, Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { liveStreamService } from '@/services/liveStream';
import { LivePlayer } from '@/components/live/LivePlayer';
import { LiveChat } from '@/components/live/LiveChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface LiveSession {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  status: 'live' | 'scheduled' | 'ended';
  start_time: string;
  viewers_count: number;
  likes_count: number;
  featured_products: string[] | null;
  thumbnail_url?: string | null;
  seller?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

import { WebRTCSignaling, getRTCConfiguration } from '@/utils/webrtc-signaling';

const LiveShopping = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [liveStreams, setLiveStreams] = useState<LiveSession[]>([]);
  const [scheduledStreams, setScheduledStreams] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);
  const [isHostMode, setIsHostMode] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [newLiveTitle, setNewLiveTitle] = useState('');

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<{ [key: string]: RTCPeerConnection }>({});
  const signalingRef = useRef<WebRTCSignaling | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  // WebRTC Signaling for Live
  useEffect(() => {
    if (!activeSession || !user) return;

    const isHost = activeSession.seller_id === user.id;

    // Pour le Shopping Live, on utilise le sessionId comme callId pour la signalisation
    const signaling = new WebRTCSignaling(
      activeSession.id,
      user.id,
      isHost ? 'all' : activeSession.seller_id, // Les spectateurs contactent le vendeur
      async (message) => {
        if (isHost) {
          handleSignalingAsHost(message);
        } else {
          handleSignalingAsViewer(message);
        }
      }
    );

    signaling.connect().then(() => {
      console.log("Signaling connected for Live Shopping");
      if (!isHost) {
        // Le spectateur se manifeste
        signaling.sendPresence('ready');
      }
    });

    signalingRef.current = signaling;

    return () => {
      signaling.disconnect();
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
      peerConnectionsRef.current = {};
    };
  }, [activeSession, user?.id]);

  const handleSignalingAsHost = async (message: any) => {
    if (message.type === 'presence' && message.payload.status === 'ready') {
      // Un nouveau spectateur est là, on lui envoie un offer
      const viewerId = message.from;
      const pc = createPeerConnection(viewerId, true);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      signalingRef.current?.sendOffer(offer, viewerId);
    } else if (message.type === 'answer') {
      const pc = peerConnectionsRef.current[message.from];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
    } else if (message.type === 'ice-candidate') {
      const pc = peerConnectionsRef.current[message.from];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(message.payload));
    }
  };

  const handleSignalingAsViewer = async (message: any) => {
    if (message.type === 'offer') {
      const pc = createPeerConnection(message.from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      signalingRef.current?.sendAnswer(answer);
    } else if (message.type === 'ice-candidate') {
      const pc = peerConnectionsRef.current[message.from];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(message.payload));
    }
  };

  const createPeerConnection = (partnerId: string, isHost: boolean) => {
    const pc = new RTCPeerConnection(getRTCConfiguration());
    peerConnectionsRef.current[partnerId] = pc;

    if (isHost && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingRef.current?.sendIceCandidate(event.candidate, partnerId);
      }
    };

    pc.ontrack = (event) => {
      if (!isHost && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    return pc;
  };

  const loadSessions = async () => {
    try {
      const lives = await liveStreamService.getLiveSessions();
      const scheduled = await liveStreamService.getScheduledSessions();
      setLiveStreams(lives as any[]);
      setScheduledStreams(scheduled as any[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startHosting = async () => {
    if (!user || !newLiveTitle.trim()) return;

    try {
      const session = await liveStreamService.createSession(user.id, newLiveTitle, "");
      setActiveSession(session as any);
      setIsHostMode(true);
      setShowStartModal(false);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (hostVideoRef.current) hostVideoRef.current.srcObject = stream;

    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de démarrer le live", variant: "destructive" });
    }
  };

  const stopHosting = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setIsHostMode(false);
    setActiveSession(null);
    loadSessions();
  };

  if (activeSession) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col overflow-hidden">
        <header className="p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setActiveSession(null)} className="text-white hover:bg-white/10">
              <X className="h-6 w-6" />
            </Button>
            <div>
              <h2 className="font-bold">{activeSession.title}</h2>
              <p className="text-xs text-white/60">
                Par {activeSession.seller?.full_name || "Vendeur"}
              </p>
            </div>
          </div>
          <Badge className="bg-red-500 animate-pulse border-none">LIVE</Badge>
        </header>

        <main className="flex-1 relative flex flex-col md:flex-row gap-4 p-4">
          <div className="flex-[3] relative rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl">
            {isHostMode ? (
              <video ref={hostVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <LivePlayer stream={remoteStream} viewers={activeSession.viewers_count} />
            )}

            {/* Host Controls */}
            {isHostMode && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <Button className="rounded-full bg-red-500 hover:bg-red-600 px-8 py-6 font-bold" onClick={stopHosting}>
                  Terminer le Direct
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 h-[400px] md:h-auto">
            <LiveChat sessionId={activeSession.id} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-black mb-2 flex items-center gap-3">
                <Video className="h-10 w-10 text-primary" />
                Live Shopping
              </h1>
              <p className="text-muted-foreground text-lg">
                Vendez et achetez en direct avec vos vendeurs préférés.
              </p>
            </div>
            {user && (
              <Button
                onClick={() => setShowStartModal(true)}
                className="gradient-primary text-white h-12 px-6 rounded-2xl font-bold shadow-lg shadow-primary/20"
              >
                <Radio className="mr-2 h-5 w-5" />
                Démarrer un Live
              </Button>
            )}
          </div>

          <Tabs defaultValue="live" className="w-full">
            <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-200">
              <TabsTrigger value="live" className="rounded-xl px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                En direct ({liveStreams.length})
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="rounded-xl px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md">
                Programmés ({scheduledStreams.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="mt-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                </div>
              ) : liveStreams.length === 0 ? (
                <Card className="bg-white border-dashed rounded-[3rem] py-20">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <Video className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Aucun direct pour le moment</h3>
                    <p className="text-muted-foreground max-w-xs">
                      Soyez le premier à lancer une session Live Shopping à Goma !
                    </p>
                    <Button variant="outline" className="mt-8 rounded-2xl px-8 h-11 border-gray-200" onClick={() => setShowStartModal(true)}>
                      Lancer mon live
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveStreams.map((stream) => (
                    <Card key={stream.id} className="group cursor-pointer overflow-hidden border-none rounded-[2rem] shadow-sm hover:shadow-xl transition-all" onClick={() => setActiveSession(stream)}>
                      <div className="relative aspect-video">
                        <img src={stream.thumbnail_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"} className="h-full w-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className="bg-red-500 border-none px-2 py-0.5 font-bold">LIVE</Badge>
                          <Badge variant="secondary" className="bg-black/40 text-white backdrop-blur-sm border-none">
                            <Users className="h-3 w-3 mr-1" /> {stream.viewers_count}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                            {stream.seller?.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold line-clamp-1">{stream.title}</p>
                            <p className="text-sm text-muted-foreground">{stream.seller?.full_name}</p>
                          </div>
                        </div>
                        <Button className="w-full rounded-2xl bg-gray-100 text-gray-900 hover:bg-primary hover:text-white transition-all font-bold group-hover:bg-primary group-hover:text-white">
                          Regarder le Live
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scheduled" className="mt-8">
              <Card className="bg-white border-dashed rounded-[3rem] py-20">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <Play className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground">Aucun live programmé prochainement</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showStartModal} onOpenChange={setShowStartModal}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Lancer mon Live Shopping</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-4">
              <div className="relative aspect-video rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center overflow-hidden">
                <Camera className="h-12 w-12 text-zinc-700 mb-2" />
                <p className="text-sm text-zinc-500">Aperçu caméra bientôt prêt</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Titre de votre session</label>
                <Input
                  placeholder="Ex: Arrivage nouveaux articles Mode Hiver"
                  className="h-12 rounded-2xl border-gray-200 focus:ring-primary"
                  value={newLiveTitle}
                  onChange={(e) => setNewLiveTitle(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full h-12 rounded-2xl gradient-primary text-white font-bold text-lg" onClick={startHosting}>
              Passer au Direct !
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default LiveShopping;
