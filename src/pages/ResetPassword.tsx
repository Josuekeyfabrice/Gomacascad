import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid token from the URL
    const token = searchParams.get('token');
    if (!token) {
      setIsValidToken(false);
      toast({
        title: "Lien invalide",
        description: "Le lien de réinitialisation est invalide ou a expiré.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate passwords
      if (!password || password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      // Update password via Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        toast({
          title: "Erreur",
          description: updateError.message,
          variant: "destructive",
        });
      } else {
        setSubmitted(true);
        toast({
          title: "Succès",
          description: "Votre mot de passe a été réinitialisé avec succès.",
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      toast({
        title: "Erreur",
        description: err.message || "Impossible de réinitialiser le mot de passe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="font-bold text-lg mb-2">Lien invalide</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
                </p>
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full gradient-primary text-primary-foreground"
                >
                  Retour à la connexion
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-4">
              <span className="text-2xl font-bold text-primary-foreground">G</span>
            </div>
            <CardTitle className="text-2xl font-display">
              Nouveau mot de passe
            </CardTitle>
            <CardDescription>
              Entrez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-green-600">Mot de passe réinitialisé !</h3>
                <p className="text-sm text-muted-foreground">
                  Votre mot de passe a été changé avec succès. Vous allez être redirigé vers la page de connexion.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
