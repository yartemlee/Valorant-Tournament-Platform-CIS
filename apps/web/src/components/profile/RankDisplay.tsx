import { Trophy, Swords, Target } from 'lucide-react';
import { RankBadge } from './RankBadge';

interface RankDisplayProps {
  currentRank?: string;
  currentRankTier?: number;
  peakRank?: string;
  peakRankTier?: number;
  isVerified?: boolean;
  wins?: number;
  gamesPlayed?: number;
}

export function RankDisplay({
  currentRank,
  peakRank,
  isVerified,
  wins,
  gamesPlayed,
}: RankDisplayProps) {
  const hasRankData = currentRank || peakRank;

  if (!hasRankData) {
    return (
      <div className="p-4 rounded-lg border bg-card/50">
        <RankBadge rank="Unranked" size="lg" />
        <p className="mt-2 text-xs text-muted-foreground">
          Нет данных о рейтинговых матчах
        </p>
      </div>
    );
  }

  const winRate =
    wins != null && gamesPlayed != null && gamesPlayed > 0
      ? Math.round((wins / gamesPlayed) * 100)
      : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentRank && (
          <div className="p-4 rounded-lg border bg-card/50 space-y-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Текущий ранг
            </div>
            <RankBadge rank={currentRank} isVerified={isVerified} size="lg" />
          </div>
        )}

        {peakRank && (
          <div className="p-4 rounded-lg border bg-card/50 space-y-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Trophy className="h-3.5 w-3.5" />
              Пиковый ранг
            </div>
            <RankBadge rank={peakRank} size="lg" />
          </div>
        )}
      </div>

      {winRate !== null && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-lg border bg-card/50 text-sm">
          <Swords className="h-4 w-4 text-muted-foreground shrink-0" />
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
