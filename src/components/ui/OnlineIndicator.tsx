import { cn } from '@/lib/utils';

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const OnlineIndicator = ({ isOnline, size = 'md', className }: OnlineIndicatorProps) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <span
      className={cn(
        'rounded-full border-2 border-background',
        sizeClasses[size],
        isOnline ? 'bg-green-500' : 'bg-muted-foreground',
        className
      )}
      title={isOnline ? 'En ligne' : 'Hors ligne'}
    />
  );
};
