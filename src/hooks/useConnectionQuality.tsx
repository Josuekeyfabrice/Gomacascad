import { useState, useEffect, useCallback, useRef } from 'react';

export interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
  label: string;
  color: string;
  bars: number;
  rtt?: number;
  packetLoss?: number;
  jitter?: number;
}

interface UseConnectionQualityOptions {
  peerConnection: RTCPeerConnection | null;
  enabled: boolean;
}

export const useConnectionQuality = ({ 
  peerConnection, 
  enabled 
}: UseConnectionQualityOptions) => {
  const [quality, setQuality] = useState<ConnectionQuality>({
    level: 'disconnected',
    label: 'Déconnecté',
    color: 'text-muted-foreground',
    bars: 0,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBytesReceivedRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  const analyzeStats = useCallback(async () => {
    if (!peerConnection) return;

    try {
      const stats = await peerConnection.getStats();
      let rtt = 0;
      let packetLoss = 0;
      let jitter = 0;
      let packetsReceived = 0;
      let packetsLost = 0;
      let bytesReceived = 0;

      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime * 1000 || 0; // Convert to ms
        }
        
        if (report.type === 'inbound-rtp' && report.kind === 'audio') {
          jitter = report.jitter * 1000 || 0; // Convert to ms
          packetsReceived = report.packetsReceived || 0;
          packetsLost = report.packetsLost || 0;
          bytesReceived = report.bytesReceived || 0;
        }
      });

      // Calculate packet loss percentage
      const totalPackets = packetsReceived + packetsLost;
      if (totalPackets > 0) {
        packetLoss = (packetsLost / totalPackets) * 100;
      }

      // Calculate bitrate
      const now = Date.now();
      const timeDiff = now - lastTimestampRef.current;
      const bytesDiff = bytesReceived - lastBytesReceivedRef.current;
      const bitrate = timeDiff > 0 ? (bytesDiff * 8) / timeDiff : 0; // kbps

      lastBytesReceivedRef.current = bytesReceived;
      lastTimestampRef.current = now;

      // Determine quality level
      let newQuality: ConnectionQuality;

      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        newQuality = {
          level: 'disconnected',
          label: 'Déconnecté',
          color: 'text-destructive',
          bars: 0,
          rtt,
          packetLoss,
          jitter,
        };
      } else if (rtt < 100 && packetLoss < 1 && jitter < 20) {
        newQuality = {
          level: 'excellent',
          label: 'Excellent',
          color: 'text-green-500',
          bars: 4,
          rtt,
          packetLoss,
          jitter,
        };
      } else if (rtt < 200 && packetLoss < 3 && jitter < 50) {
        newQuality = {
          level: 'good',
          label: 'Bon',
          color: 'text-green-400',
          bars: 3,
          rtt,
          packetLoss,
          jitter,
        };
      } else if (rtt < 400 && packetLoss < 8 && jitter < 100) {
        newQuality = {
          level: 'fair',
          label: 'Moyen',
          color: 'text-yellow-500',
          bars: 2,
          rtt,
          packetLoss,
          jitter,
        };
      } else {
        newQuality = {
          level: 'poor',
          label: 'Faible',
          color: 'text-red-500',
          bars: 1,
          rtt,
          packetLoss,
          jitter,
        };
      }

      setQuality(newQuality);
    } catch (error) {
      console.error('Error getting connection stats:', error);
    }
  }, [peerConnection]);

  useEffect(() => {
    if (!enabled || !peerConnection) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial analysis
    analyzeStats();

    // Update every 2 seconds
    intervalRef.current = setInterval(analyzeStats, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, peerConnection, analyzeStats]);

  return quality;
};
