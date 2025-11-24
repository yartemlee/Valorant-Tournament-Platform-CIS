import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Award, TrendingUp, Medal } from "lucide-react";

interface TeamStatsSectionProps {
  teamId: string;
}

export function TeamStatsSection({ teamId }: TeamStatsSectionProps) {
  // TODO: В будущем подключить реальные данные из БД
  const stats = {
    tournamentsPlayed: 0,
    wins: 0,
    podiums: 0,
    winrate: 0,
    recentTournaments: [],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Статистика команды
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.tournamentsPlayed > 0 ? (
          <div className="space-y-6">
            {/* Основные метрики */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-secondary/50 border border-border">
                <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{stats.tournamentsPlayed}</p>
                <p className="text-xs text-muted-foreground">Турниров сыграно</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-secondary/50 border border-border">
                <Trophy className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-400">{stats.wins}</p>
                <p className="text-xs text-muted-foreground">Побед (🥇)</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-secondary/50 border border-border">
                <Award className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-400">{stats.podiums}</p>
                <p className="text-xs text-muted-foreground">Подиумов (Top-3)</p>
              </div>

              <div className="text-center p-4 rounded-lg bg-secondary/50 border border-border">
                <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-400">{stats.winrate}%</p>
                <p className="text-xs text-muted-foreground">Winrate</p>
              </div>
            </div>

            {/* Последние турниры */}
            {stats.recentTournaments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Medal className="h-4 w-4" />
                  Последние турниры
                </h3>
                <div className="space-y-2">
                  {stats.recentTournaments.map((tournament: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
                    >
                      <span className="text-sm">{tournament.name}</span>
                      <span className="text-sm font-semibold text-primary">
                        {tournament.placement} место
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Команда ещё не участвовала в турнирах
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Статистика появится после первого турнира
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
