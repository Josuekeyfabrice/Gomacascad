import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-lg">
              <img src="/pwa-192x192.png" alt="GOMACASCADE" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Installer GOMACASCADE</h1>
            <p className="text-muted-foreground">
              Installez notre application pour une meilleure expérience
            </p>
          </div>

          {isInstalled ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 text-primary">
                  <CheckCircle className="w-12 h-12" />
                  <div>
                    <h3 className="text-xl font-semibold">Application installée !</h3>
                    <p className="text-muted-foreground">
                      GOMACASCADE est déjà installée sur votre appareil.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : isIOS ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Installation sur iPhone/iPad
                </CardTitle>
                <CardDescription>
                  Suivez ces étapes pour installer l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Appuyez sur le bouton Partager</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Share className="w-5 h-5" />
                      <span>En bas de Safari</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Sélectionnez "Sur l'écran d'accueil"</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <PlusSquare className="w-5 h-5" />
                      <span>Dans le menu qui s'affiche</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Appuyez sur "Ajouter"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'application sera ajoutée à votre écran d'accueil
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : deferredPrompt ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Installer l'application
                </CardTitle>
                <CardDescription>
                  Cliquez sur le bouton ci-dessous pour installer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleInstallClick}
                  size="lg"
                  className="w-full gradient-primary"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Installer GOMACASCADE
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
                  Installation sur Android
                </CardTitle>
                <CardDescription>
                  Suivez ces étapes pour installer l'application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Ouvrez le menu du navigateur</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Appuyez sur les 3 points en haut à droite
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Sélectionnez "Installer l'application"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ou "Ajouter à l'écran d'accueil"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Confirmez l'installation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      L'application sera ajoutée à votre écran d'accueil
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Accès rapide</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Lancez l'app depuis votre écran d'accueil
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Fonctionne hors-ligne</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Consultez vos favoris sans connexion
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Restez informé des nouveaux messages
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Install;
