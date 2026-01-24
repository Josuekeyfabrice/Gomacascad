import { supabase } from '@/integrations/supabase/client';

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'presence';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | { status: 'ready' };
  from: string;
  to: string;
  callId: string;
}

export class WebRTCSignaling {
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private callId: string;
  private userId: string;
  private partnerId: string;
  private onMessage: (message: SignalingMessage) => void;

  constructor(
    callId: string,
    userId: string,
    partnerId: string,
    onMessage: (message: SignalingMessage) => void
  ) {
    this.callId = callId;
    this.userId = userId;
    this.partnerId = partnerId;
    this.onMessage = onMessage;
  }

  async connect(): Promise<void> {
    const channelName = `webrtc-signaling-${this.callId}`;
    console.log('Connecting to signaling channel:', channelName);

    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }
      }
    });

    return new Promise((resolve, reject) => {
      if (!this.channel) return reject(new Error('Channel not initialized'));

      this.channel
        .on('broadcast', { event: 'signaling' }, ({ payload }) => {
          const message = payload as SignalingMessage;
          console.log('Received signaling message:', message.type, 'from:', message.from, 'to:', message.to);

          if (message.to === this.userId || this.partnerId === 'all') {
            this.onMessage(message);
          }
        })
        .subscribe((status, err) => {
          console.log('Signaling channel status:', status, err);
          if (status === 'SUBSCRIBED') {
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            const errorMsg = err?.message || `Failed to subscribe to signaling channel: ${status}`;
            reject(new Error(errorMsg));
          }
        });
    });
  }

  async sendOffer(offer: RTCSessionDescriptionInit, to?: string) {
    if (!this.channel) return;

    const message: SignalingMessage = {
      type: 'offer',
      payload: offer,
      from: this.userId,
      to: to || this.partnerId,
      callId: this.callId,
    };

    console.log('Sending offer to:', to || this.partnerId);
    await this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message,
    });
  }

  async sendAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.channel) return;

    const message: SignalingMessage = {
      type: 'answer',
      payload: answer,
      from: this.userId,
      to: this.partnerId,
      callId: this.callId,
    };

    console.log('Sending answer to:', this.partnerId);
    await this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message,
    });
  }

  async sendIceCandidate(candidate: RTCIceCandidate, to?: string) {
    if (!this.channel) return;

    const message: SignalingMessage = {
      type: 'ice-candidate',
      payload: candidate.toJSON(),
      from: this.userId,
      to: to || this.partnerId,
      callId: this.callId,
    };

    console.log('Sending ICE candidate to:', to || this.partnerId);
    await this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message,
    });
  }

  async sendPresence(status: 'ready') {
    if (!this.channel) return;

    const message: SignalingMessage = {
      type: 'presence',
      payload: { status },
      from: this.userId,
      to: this.partnerId,
      callId: this.callId,
    };

    console.log('Sending presence:', status, 'to:', this.partnerId);
    await this.channel.send({
      type: 'broadcast',
      event: 'signaling',
      payload: message,
    });
  }

  disconnect() {
    if (this.channel) {
      console.log('Disconnecting from signaling channel');
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// WebRTC configuration with STUN and free TURN servers for better connectivity
export const getRTCConfiguration = (): RTCConfiguration => ({
  iceServers: [
    // Google STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Open Relay TURN servers (free public TURN servers)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    // Additional free TURN servers
    {
      urls: 'turn:relay.metered.ca:80',
      username: 'free',
      credential: 'free',
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: 'free',
      credential: 'free',
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all', // Use both relay and direct connections
  bundlePolicy: 'max-bundle', // Bundle all media into one connection
  rtcpMuxPolicy: 'require', // Multiplex RTP and RTCP on same port
});
