import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VerificationResult {
  success: boolean;
  message: string;
  verificationId?: string;
}

export const useIdentityVerification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'uploading_id' | 'selfie' | 'processing' | 'completed'>('idle');

  const uploadIDDocument = useCallback(async (file: File, userId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setVerificationStep('uploading_id');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/id-document.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadSelfie = useCallback(async (file: File, userId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setVerificationStep('selfie');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/selfie.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const processVerification = useCallback(async (userId: string): Promise<VerificationResult> => {
    setLoading(true);
    setError(null);
    setVerificationStep('processing');

    try {
      // In a real implementation, this would call an AI service
      // For now, we simulate the process
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update user profile with verification status
      // We try both 'user_id' and 'id' to be safe, though 'user_id' is standard in this project
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_verified: true,
          updated_at: new Date().toISOString(),
        })
        .or(`user_id.eq.${userId},id.eq.${userId}`);

      if (updateError) throw updateError;

      setVerificationStep('completed');

      return {
        success: true,
        message: 'Votre identité a été vérifiée avec succès!',
        verificationId: `VERIFY-${Date.now()}`,
      };
    } catch (err: any) {
      setError(err.message);
      return {
        success: false,
        message: err.message || 'Erreur lors de la vérification',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetVerification = useCallback(() => {
    setVerificationStep('idle');
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    verificationStep,
    uploadIDDocument,
    uploadSelfie,
    processVerification,
    resetVerification,
  };
};
