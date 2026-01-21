import { Signal } from 'lucide-react';
import { ConnectionQuality } from '@/hooks/useConnectionQuality';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SignalStrengthIndicatorProps {
  quality: ConnectionQuality;
  showDetails?: boolean;
}

export const SignalStrengthIndicator = ({ 
  quality, 
  showDetails = true 
}: SignalStrengthIndicatorProps) => {
  const { bars, label, color, rtt, packetLoss, jitter } = quality;

  const renderBars = () => (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((barIndex) => (
        <div
          key={barIndex}
          className={`w-1 rounded-sm transition-all duration-300 ${
            barIndex <= bars ? getBgColor() : 'bg-muted'
          }`}
          style={{ height: `${barIndex * 25}%` }}
        />
      ))}
    </div>
  );

  const getBgColor = () => {
    switch (quality.level) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-green-400';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  if (!showDetails) {
    return (
      <div className="flex items-center gap-1">
        <Signal className={`h-4 w-4 ${color}`} />
        {renderBars()}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm cursor-help">
            <Signal className={`h-3 w-3 ${color}`} />
            {renderBars()}
            <span className={`text-xs font-medium ${color}`}>{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            {rtt !== undefined && (
              <p>Latence: {Math.round(rtt)} ms</p>
            )}
            {packetLoss !== undefined && (
              <p>Perte de paquets: {packetLoss.toFixed(1)}%</p>
            )}
            {jitter !== undefined && (
              <p>Gigue: {Math.round(jitter)} ms</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
