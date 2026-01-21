import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        setError('Veuillez entrer une adresse email valide');
        setLoading(false);
        return;
      }

      // Send password reset email via Supabase
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        // Don't reveal if email exists or not for security reasons
        setSubmitted(true);
        toast({
          title: "Email envoyé",
          description: "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
        });
      } else {
        setSubmitted(true);
        toast({
          title: "Email envoyé",
          description: "Veuillez vérifier votre boîte mail pour le lien de réinitialisation.",
        });
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'envoyer l'email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-4">
          <span className="text-2xl font-bold text-primary-foreground">G</span>
        </div>
        <CardTitle className="text-2xl font-display">
          Réinitialiser votre mot de passe
        </CardTitle>
        <CardDescription>
          Entrez votre adresse email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien'
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onBack}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </form>
        ) : (
          <div className="space-y-4 text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-green-600">Email envoyé !</h3>
            <p className="text-sm text-muted-foreground">
              Veuillez vérifier votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
            </p>
            <p className="text-xs text-muted-foreground">
              Le lien expire dans 24 heures.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la connexion
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
