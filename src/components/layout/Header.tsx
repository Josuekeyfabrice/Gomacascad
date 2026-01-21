import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Heart, MessageCircle, User, Plus, LogOut, Phone, Shield, Download, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { DataSaverToggle } from '@/components/ui/DataSaverToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const { counts } = useNotificationCounts();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    };

    checkAdminRole();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <span className="text-xl font-bold text-primary-foreground">G</span>
            </div>
            <span className="hidden font-display text-xl font-bold text-foreground sm:inline-block">
              GOMA<span className="text-primary">CASCADE</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden flex-1 max-w-md mx-8 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4"
              />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
            {showInstallBtn && (
              <Button variant="ghost" size="sm" onClick={handleInstall} className="gap-2 text-primary">
                <Download className="h-4 w-4" />
                Installer
              </Button>
            )}
            <ThemeToggle />
            {user ? (
              <>
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/favorites">
                    <Heart className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="relative">
                  <Link to="/messages">
                    <MessageCircle className="h-5 w-5" />
                    {counts.unreadMessages > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                        {counts.unreadMessages > 9 ? '9+' : counts.unreadMessages}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <NotificationCenter />
                <Button className="gap-2 gradient-primary text-primary-foreground" asChild>
                  <Link to="/sell">
                    <Plus className="h-4 w-4" />
                    Vendre
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Mon Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wallet" className="cursor-pointer">
                        <Wallet className="mr-2 h-4 w-4" />
                        Mon Portefeuille
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/verify-seller" className="cursor-pointer text-primary font-semibold">
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Devenir Vérifié
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-products" className="cursor-pointer">
                        Mes Annonces
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/call-history" className="cursor-pointer">
                        <Phone className="mr-2 h-4 w-4" />
                        Historique d'appels
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-primary">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Connexion</Link>
                </Button>
                <Button className="gradient-primary text-primary-foreground" asChild>
                  <Link to="/auth?mode=signup">S'inscrire</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="pb-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t bg-background md:hidden animate-fade-in">
          <nav className="container mx-auto flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between py-2 px-3 rounded-md">
              <span className="text-sm font-medium">Mode Sombre</span>
              <ThemeToggle />
            </div>
            <div className="px-3 py-2">
              <DataSaverToggle />
            </div>
            {showInstallBtn && (
              <Button variant="outline" className="justify-start text-primary" onClick={handleInstall}>
                <Download className="mr-2 h-5 w-5" />
                Installer l'application
              </Button>
            )}
            {user ? (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/favorites" onClick={() => setIsMenuOpen(false)}>
                    <Heart className="mr-2 h-5 w-5" />
                    Favoris
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start relative" asChild>
                  <Link to="/messages" onClick={() => setIsMenuOpen(false)}>
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Messages
                    {counts.unreadMessages > 0 && (
                      <Badge className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                        {counts.unreadMessages > 9 ? '9+' : counts.unreadMessages}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <User className="mr-2 h-5 w-5" />
                    Mon Profil
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/wallet" onClick={() => setIsMenuOpen(false)}>
                    <Wallet className="mr-2 h-5 w-5" />
                    Mon Portefeuille
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start text-primary font-semibold" asChild>
                  <Link to="/verify-seller" onClick={() => setIsMenuOpen(false)}>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Devenir Vérifié
                  </Link>
                </Button>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/my-products" onClick={() => setIsMenuOpen(false)}>
                    Mes Annonces
                  </Link>
                </Button>
                {isAdmin && (
                  <Button variant="ghost" className="justify-start text-primary" asChild>
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Shield className="mr-2 h-5 w-5" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button className="justify-start gradient-primary text-primary-foreground" asChild>
                  <Link to="/sell" onClick={() => setIsMenuOpen(false)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Vendre
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-destructive"
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="justify-start" asChild>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    Connexion
                  </Link>
                </Button>
                <Button className="gradient-primary text-primary-foreground" asChild>
                  <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                    S'inscrire
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
