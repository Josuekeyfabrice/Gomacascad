import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const VerifiedBadge = ({ size = 'md', showTooltip = true }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const badge = (
    <BadgeCheck 
      className={`${sizeClasses[size]} text-primary fill-primary/20`} 
    />
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help">{badge}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>Vendeur vérifié</p>
      </TooltipContent>
    </Tooltip>
  );
};
