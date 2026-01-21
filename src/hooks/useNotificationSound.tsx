import { useCallback, useRef } from 'react';

const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const CALL_RINGTONE_URL = 'https://assets.mixkit.co/active_storage/sfx/1361/1361-preview.mp3';

export const useNotificationSound = () => {
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!notificationAudioRef.current) {
        notificationAudioRef.current = new Audio(NOTIFICATION_SOUND_URL);
        notificationAudioRef.current.volume = 0.5;
      }
      notificationAudioRef.current.currentTime = 0;
      notificationAudioRef.current.play().catch(console.log);
    } catch (e) {
      console.log('Error playing notification sound:', e);
    }
  }, []);

  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio(CALL_RINGTONE_URL);
        ringtoneAudioRef.current.volume = 0.7;
        ringtoneAudioRef.current.loop = true;
      }
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current.play().catch(console.log);
    } catch (e) {
      console.log('Error playing ringtone:', e);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    try {
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current.currentTime = 0;
      }
    } catch (e) {
      console.log('Error stopping ringtone:', e);
    }
  }, []);

  return {
    playNotificationSound,
    playRingtone,
    stopRingtone,
  };
};
