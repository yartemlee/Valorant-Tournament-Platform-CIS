import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Medal {
  id: string;
  placement: number;
  tournament_name: string;
  tournament_date: string;
}

interface MedalsDisplayProps {
  medals: Medal[];
}

const medalEmojis = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export function MedalsDisplay({ medals }: MedalsDisplayProps) {
  if (medals.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Медалей пока нет. Участвуйте в турнирах, чтобы получить награды!
      </div>
    );
  }

  const medalCounts = medals.reduce((acc, medal) => {
    acc[medal.placement] = (acc[medal.placement] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-4">
      {/* Medal counts */}
      <div className="flex gap-6">
        {[1, 2, 3].map(place => {
          const count = medalCounts[place] || 0;
          if (count === 0) return null;

          return (
            <div key={place} className="flex items-center gap-2">
              <span className="text-3xl">{medalEmojis[place as keyof typeof medalEmojis]}</span>
              <span className="text-2xl font-bold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Medal details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {medals.map((medal) => (
          <TooltipProvider key={medal.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{medalEmojis[medal.placement as keyof typeof medalEmojis]}</span>
                    <span className="font-medium text-sm line-clamp-1">{medal.tournament_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(medal.tournament_date).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{medal.tournament_name}</p>
                <p className="text-sm text-muted-foreground">
                  {medal.placement === 1 ? "Победа" : medal.placement === 2 ? "2 место" : "3 место"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(medal.tournament_date).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
