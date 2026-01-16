import { cn } from '@/lib/utils';
import { CheckCircle2, Shield } from 'lucide-react';
import { getRankColorClass } from '@/types/riot.types';

interface RankBadgeProps {
  rank: string;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function RankBadge({
  rank,
  isVerified = false,
  size = 'md',
  showIcon = true,
  className,
}: RankBadgeProps) {
  const colors = getRankColorClass(rank);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Shield className={cn(iconSizes[size], 'opacity-80')} />}
      <span>{rank}</span>
      {isVerified && (
        <CheckCircle2
          className={cn(iconSizes[size], 'text-green-500')}
          aria-label="Подтверждённый ранг"
        />
      )}
    </div>
  );
}
