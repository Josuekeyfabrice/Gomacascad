import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState = ({
  message = 'Chargement...',
  fullScreen = false,
  size = 'md',
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="flex items-center justify-center py-12">
        {content}
      </CardContent>
    </Card>
  );
};
