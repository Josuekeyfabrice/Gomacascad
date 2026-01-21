import { useRef, useCallback } from 'react';

// Generate a ringtone using Web Audio API
const createRingtoneBuffer = async (audioContext: AudioContext): Promise<AudioBuffer> => {
  const sampleRate = audioContext.sampleRate;
  const duration = 2; // 2 seconds
  const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Create a WhatsApp-like melodic ringtone pattern
  const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (C Major chord)
  
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    
    // Melodic sequence
    const noteIndex = Math.floor(t * 4) % frequencies.length;
    const freq = frequencies[noteIndex];
    
    let sample = Math.sin(2 * Math.PI * freq * t) * 0.3;
    // Add some harmonics for a richer sound
    sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.1;
    
    // Envelope for each note
    const noteDuration = 0.25;
    const cycleTime = t % noteDuration;
    const envelope = Math.exp(-5 * cycleTime); // Fast decay
    
    data[i] = sample * envelope;
  }
  
  return buffer;
};

export const useRingtone = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRingtone = useCallback(async () => {
    // Stop any existing ringtone first
    if (isPlayingRef.current) {
      stopRingtone();
      // Wait a bit before starting new one
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    try {
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      // Create ringtone buffer (cache it)
      if (!bufferRef.current) {
        bufferRef.current = await createRingtoneBuffer(audioContext);
      }
      const buffer = bufferRef.current;
      
      const playRing = () => {
        if (!audioContextRef.current || !isPlayingRef.current) return;
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = 0.5;
        
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        source.start();
        sourceRef.current = source;
        gainNodeRef.current = gainNode;
      };
      
      isPlayingRef.current = true;
      playRing();
      
      // Loop the ringtone
      intervalRef.current = setInterval(() => {
        if (isPlayingRef.current) {
          playRing();
        }
      }, 2500); // Play every 2.5 seconds
      
    } catch (error) {
      console.error('Error playing ringtone:', error);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    // Clear any pending stop timeout
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    isPlayingRef.current = false;
    
    // Clear interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Stop all sources
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Source might already be stopped
      }
      sourceRef.current = null;
    }

    // Mute gain node
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current?.currentTime || 0);
      } catch (e) {
        // Gain node might be disconnected
      }
      gainNodeRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      try {
        const context = audioContextRef.current;
        if (context.state !== 'closed') {
          // Resume context if suspended
          if (context.state === 'suspended') {
            context.resume().catch(() => {});
          }
          
          // Close the context
          context.close().catch(() => {});
        }
      } catch (e) {
        // Context might already be closed
      }
      audioContextRef.current = null;
    }

    // Clear buffer
    bufferRef.current = null;
  }, []);

  return { startRingtone, stopRingtone };
};
