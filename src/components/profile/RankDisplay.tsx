interface RankDisplayProps {
  currentRank?: string;
  peakRank?: string;
}

export function RankDisplay({ currentRank, peakRank }: RankDisplayProps) {
  if (!currentRank && !peakRank) {
    return (
      <div className="text-sm text-muted-foreground">
        Ранги будут отображаться после привязки Riot ID
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {currentRank && (
        <div className="p-4 rounded-lg border bg-card/50">
          <div className="text-sm text-muted-foreground mb-1">Текущий ранг</div>
          <div className="text-xl font-bold">{currentRank}</div>
        </div>
      )}
      
      {peakRank && (
        <div className="p-4 rounded-lg border bg-card/50">
          <div className="text-sm text-muted-foreground mb-1">Пиковый ранг</div>
          <div className="text-xl font-bold">{peakRank}</div>
        </div>
      )}
    </div>
  );
}