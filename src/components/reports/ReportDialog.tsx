import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const REPORT_REASONS = [
  { value: 'fake', label: 'Annonce frauduleuse ou fausse' },
  { value: 'inappropriate', label: 'Contenu inapproprié' },
  { value: 'spam', label: 'Spam ou publicité' },
  { value: 'scam', label: 'Arnaque ou escroquerie' },
  { value: 'other', label: 'Autre raison' },
];

interface ReportDialogProps {
  productId?: string;
  userId?: string;
  trigger?: React.ReactNode;
}

export const ReportDialog = ({ productId, userId, trigger }: ReportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour signaler',
        variant: 'destructive',
      });
      return;
    }

    if (!reason) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une raison',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_product_id: productId || null,
        reported_user_id: userId || null,
        reason,
        description: description.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Signalement envoyé',
        description: 'Merci, notre équipe examinera votre signalement.',
      });
      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le signalement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive">
            <Flag className="h-4 w-4" />
            Signaler
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler {productId ? 'cette annonce' : 'cet utilisateur'}</DialogTitle>
          <DialogDescription>
            Aidez-nous à maintenir la communauté saine en signalant les contenus suspects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Raison du signalement *</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              placeholder="Décrivez le problème..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/500
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !reason}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
