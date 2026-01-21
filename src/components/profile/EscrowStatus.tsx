import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

interface EscrowStatusProps {
  userId: string;
}

export const EscrowStatus = ({ userId }: EscrowStatusProps) => {
  // This component is a placeholder for future escrow/transaction functionality
  // The transactions table needs to be created in the database first
  
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground">Aucune transaction sécurisée en cours.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Les transactions sécurisées seront bientôt disponibles.
        </p>
      </CardContent>
    </Card>
  );
};
