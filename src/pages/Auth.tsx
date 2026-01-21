import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ForgotPassword } from '@/components/auth/ForgotPassword';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isSignUp) {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Compte existant',
              description: 'Un compte existe déjà avec cet email. Veuillez vous connecter.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erreur',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Compte créé !',
            description: 'Vous pouvez maintenant vous connecter.',
          });
          // Switch to login mode after successful signup
          setIsSignUp(false);
          setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        }
      } else {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Identifiants incorrects',
              description: 'Email ou mot de passe incorrect.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Erreur',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Connexion réussie',
            description: 'Bienvenue !',
          });
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
        <div className="w-full max-w-md">
          <ForgotPassword onBack={() => setIsForgotPassword(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6"
          asChild
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'accueil
          </Link>
        </Button>

        <Card className="shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-4">
              <span className="text-2xl font-bold text-primary-foreground">G</span>
            </div>
            <CardTitle className="text-2xl font-display">
              {isSignUp ? 'Créer un compte' : 'Connexion'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Rejoignez GOMACASCADE et commencez à acheter ou vendre'
                : 'Connectez-vous pour accéder à votre compte'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Jean Dupont"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+243 XXX XXX XXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                {!isSignUp && (
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs text-primary"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Mot de passe oublié ?
                  </Button>
                )}
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gradient-primary text-primary-foreground"
                disabled={loading}
              >
                {loading ? 'Chargement...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm space-y-3">
              {isSignUp ? (
                <p className="text-muted-foreground">
                  Vous avez déjà un compte ?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => setIsSignUp(false)}
                  >
                    Se connecter
                  </Button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Pas encore de compte ?{' '}
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => setIsSignUp(true)}
                  >
                    S'inscrire
                  </Button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
