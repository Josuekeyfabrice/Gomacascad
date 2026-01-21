import { useState, useEffect } from 'react';
import { Database, ZapOff, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export const DataSaverToggle = () => {
  const [isDataSaver, setIsDataSaver] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('data-saver') === 'true';
    setIsDataSaver(saved);
  }, []);

  const toggleDataSaver = (checked: boolean) => {
    setIsDataSaver(checked);
    localStorage.setItem('data-saver', checked.toString());
    
    toast({
      title: checked ? "Mode Économie activé" : "Mode Économie désactivé",
      description: checked 
        ? "Les images et vidéos seront optimisées pour économiser vos data." 
        : "Retour à la qualité maximale.",
    });
    
    // Reload to apply changes across the app
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isDataSaver ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
          {isDataSaver ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        </div>
        <div>
          <Label htmlFor="data-saver" className="font-bold cursor-pointer">Économie de données</Label>
          <p className="text-[10px] text-muted-foreground">Idéal pour les connexions faibles à Goma</p>
        </div>
      </div>
      <Switch
        id="data-saver"
        checked={isDataSaver}
        onCheckedChange={toggleDataSaver}
      />
    </div>
  );
};
