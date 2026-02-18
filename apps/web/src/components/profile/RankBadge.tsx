import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Shield } from 'lucide-react';
import { getRankColorClass, getRankIconUrl } from '@/types/riot.types';

interface RankBadgeProps {
  rank: string;
  tier?: number;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function RankBadge({
  rank,
  tier,
  isVerified = false,
  size = 'md',
  showIcon = true,
  className,
}: RankBadgeProps) {
  const colors = getRankColorClass(rank);
  const [iconError, setIconError] = useState(false);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const fallbackIconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const renderIcon = () => {
    if (!showIcon) return null;

    if (tier != null && tier > 0 && !iconError) {
      return (
        <img
          src={getRankIconUrl(tier)}
          alt={rank}
          width={iconSizes[size]}
          height={iconSizes[size]}
          className="object-contain"
          onError={() => setIconError(true)}
        />
      );
    }

    return <Shield className={cn(fallbackIconSizes[size], 'opacity-80')} />;
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
      {renderIcon()}
      <span>{rank}</span>
      {isVerified && (
        <CheckCircle2
          className={cn(fallbackIconSizes[size], 'text-green-500')}
          aria-label="Подтверждённый ранг"
        />
      )}
    </div>
  );
}
