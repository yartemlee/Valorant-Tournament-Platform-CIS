import { useState } from 'react';
import { Trophy, Swords, Target, FlaskConical, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRankColorClass, getRankIconUrl } from '@/types/riot.types';

interface RankDisplayProps {
  currentRank?: string;
  currentRankTier?: number;
  peakRank?: string;
  peakRankTier?: number;
  wins?: number;
  gamesPlayed?: number;
  isDemo?: boolean;
}

function RankIcon({ tier, rank, size = 64 }: { tier?: number; rank?: string; size?: number }) {
  const [error, setError] = useState(false);

  if (tier != null && tier > 0 && !error) {
    return (
      <img
        src={getRankIconUrl(tier)}
        alt={rank || 'Rank'}
        width={size}
        height={size}
        className="object-contain drop-shadow-lg"
        onError={() => setError(true)}
      />
    );
  }

  return <Shield className="h-12 w-12 text-muted-foreground opacity-50" />;
}

export function RankDisplay({
  currentRank,
  currentRankTier,
  peakRank,
  peakRankTier,
  wins,
  gamesPlayed,
  isDemo,
}: RankDisplayProps) {
  const hasRankData = currentRank && currentRank !== 'Unranked';

  if (!hasRankData) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/30" />
        <div>
          <p className="text-lg font-medium text-muted-foreground">Unranked</p>
          <p className="text-xs text-muted-foreground/70">
            Нет данных о рейтинговых матчах
          </p>
        </div>
      </div>
    );
  }

  const currentColors = getRankColorClass(currentRank);
  const peakColors = peakRank ? getRankColorClass(peakRank) : null;

  const winRate =
    wins != null && gamesPlayed != null && gamesPlayed > 0
      ? Math.round((wins / gamesPlayed) * 100)
      : null;

  return (
    <div className="space-y-4">
      {isDemo && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <FlaskConical className="h-4 w-4 shrink-0 text-amber-400" />
          <span className="text-xs text-amber-400">
            Ранги присвоены случайным образом для демонстрации
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Current Rank */}
        <div
          className={cn(
            'relative overflow-hidden rounded-lg border p-4',
            currentColors.border,
            'bg-card/50'
          )}
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-0 opacity-[0.07]',
              currentColors.bg
            )}
          />
          <div className="relative flex items-center gap-4">
            <RankIcon tier={currentRankTier} rank={currentRank} />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Target className="h-3 w-3" />
                Текущий ранг
              </div>
              <p className={cn('text-lg font-bold leading-tight', currentColors.text)}>
                {currentRank}
              </p>
            </div>
          </div>
        </div>

        {/* Peak Rank */}
        {peakRank && peakColors && (
          <div
            className={cn(
              'relative overflow-hidden rounded-lg border p-4',
              peakColors.border,
              'bg-card/50'
            )}
          >
            <div
              className={cn(
                'pointer-events-none absolute inset-0 opacity-[0.07]',
                peakColors.bg
              )}
            />
            <div className="relative flex items-center gap-4">
              <RankIcon tier={peakRankTier} rank={peakRank} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Trophy className="h-3 w-3" />
                  Пиковый ранг
                </div>
                <p className={cn('text-lg font-bold leading-tight', peakColors.text)}>
                  {peakRank}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats bar */}
      {winRate !== null && (
        <div className="flex items-center gap-4 rounded-lg border bg-card/50 px-4 py-3 text-sm">
          <Swords className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="flex gap-4">
            <span>
              <span className="text-muted-foreground">Побед: </span>
              <span className="font-medium">{wins}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Игр: </span>
              <span className="font-medium">{gamesPlayed}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Winrate: </span>
              <span className="font-medium">{winRate}%</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
