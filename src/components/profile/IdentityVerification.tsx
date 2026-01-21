import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Camera, FileText, Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useProfile } from '@/hooks/useProfile';

export const IdentityVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    loading,
    error,
    verificationStep,
    uploadIDDocument,
    uploadSelfie,
    processVerification,
    resetVerification,
  } = useIdentityVerification();
  const [step, setStep] = useState<'start' | 'upload_id' | 'selfie' | 'processing' | 'success'>('start');

  const handleStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Starting verification process...");
    setStep('upload_id');
  };
  
  const handleUploadID = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const success = await uploadIDDocument(file, user.id);
    if (success) {
      setStep('selfie');
      toast({
        title: "Document reçu",
        description: "Nous avons reçu votre pièce d'identité. Passons à l'étape suivante.",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'uploader le document",
        variant: "destructive",
      });
    }
  };

  const { profile, refreshProfile } = useProfile();

  const handleSelfie = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const success = await uploadSelfie(file, user.id);
    if (success) {
      setStep('processing');
      const result = await processVerification(user.id);
      
      if (result.success) {
        // Force profile refresh to update UI immediately
        if (refreshProfile) await refreshProfile();
        
        setStep('success');
        toast({
          title: "Vérification réussie",
          description: result.message,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive",
        });
        resetVerification();
        setStep('start');
      }
    } else {
      toast({
        title: "Erreur",
        description: "Impossible d'uploader le selfie",
        variant: "destructive",
      });
    }
  };

  const isAlreadyVerified = profile?.is_verified;

  return (
    <Card className={`mt-8 border-primary/20 ${isAlreadyVerified ? 'bg-green-50/50 border-green-200' : 'bg-primary/5'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className={`h-5 w-5 ${isAlreadyVerified ? 'text-green-600' : 'text-primary'}`} />
            {isAlreadyVerified ? 'Compte Vérifié' : 'Vérification d\'Identité IA'}
          </CardTitle>
          {!isAlreadyVerified && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Nouveau
            </Badge>
          )}
          {isAlreadyVerified && (
            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
              Certifié
            </Badge>
          )}
        </div>
        <CardDescription>
          {isAlreadyVerified 
            ? 'Votre identité a été confirmée. Vous bénéficiez d\'une visibilité accrue.' 
            : 'Utilisez notre intelligence artificielle pour vérifier votre compte instantanément.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(step === 'start' && !isAlreadyVerified) && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La vérification renforce la confiance des acheteurs et vous donne accès au badge **Vendeur Vérifié**.
            </p>
            <Button 
              type="button"
              onClick={handleStart} 
              className="w-full gradient-primary text-white relative z-10"
            >
              Commencer la vérification
            </Button>
          </div>
        )}
        {isAlreadyVerified && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-green-600">Identité Confirmée</h3>
            <p className="text-sm text-muted-foreground">
              Votre badge de confiance est actif sur toutes vos annonces et votre profil public.
            </p>
            <div className="flex items-center gap-2 justify-center p-3 bg-white rounded-lg border border-green-100 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span className="text-sm font-bold text-green-700 uppercase tracking-wider">Vendeur Certifié Goma-Connect</span>
            </div>
          </div>
        )}

        {step === 'upload_id' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold">Étape 1 : Pièce d'identité</h3>
            <p className="text-sm text-muted-foreground">
              Prenez une photo nette de votre carte d'électeur ou passeport.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadID}
              className="hidden"
            />
            <Button 
              type="button"
              onClick={() => {
                console.log("Triggering file input click");
                fileInputRef.current?.click();
              }} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              Sélectionner une photo
            </Button>
          </div>
        )}

        {step === 'selfie' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-bold">Étape 2 : Selfie de contrôle</h3>
            <p className="text-sm text-muted-foreground">
              Positionnez votre visage dans le cadre pour la comparaison faciale.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleSelfie}
              className="hidden"
              id="selfie-input"
            />
            <Button 
              onClick={() => document.getElementById('selfie-input')?.click()} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
              Prendre un selfie
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-4 text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="font-bold">Analyse en cours...</h3>
            <p className="text-sm text-muted-foreground">
              Notre IA compare votre selfie avec votre pièce d'identité. Cela prend quelques secondes.
            </p>
            {error && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-green-600">Identité Vérifiée !</h3>
            <p className="text-sm text-muted-foreground">
              Félicitations ! Votre badge de confiance sera affiché sur toutes vos annonces.
            </p>
            <div className="flex items-center gap-2 justify-center p-2 bg-green-50 rounded-lg border border-green-100">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Vendeur Certifié Goma-Connect</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
