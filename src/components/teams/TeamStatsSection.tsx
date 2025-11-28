import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Target, Award, TrendingUp, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface TeamStatsSectionProps {
  teamId: string;
}

export function TeamStatsSection({ teamId }: TeamStatsSectionProps) {
  // Загружаем данные команды с медалями
  const { data: team } = useQuery({
    queryKey: ["team-medals", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select("medals_gold, medals_silver, medals_bronze")
        .eq("id", teamId)
        .single();
      return data;
    },
    enabled: !!teamId,
  });

  // TODO: В будущем подключить реальные данные о турнирах из БД
  const stats = {
    tournamentsPlayed: 0,
    wins: team?.medals_gold || 0,
    podiums: (team?.medals_gold || 0) + (team?.medals_silver || 0) + (team?.medals_bronze || 0),
    winrate: 0,
    recentTournaments: [],
  };

  // Проверяем, есть ли хоть какие-то медали
  const hasMedals = stats.podiums > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Статистика команды
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasMedals ? (
          <div className="space-y-6">
            {/* Медали команды */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Medal className="h-4 w-4" />
                Медали команды
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {/* Золотые медали */}
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20">
                  <div className="text-4xl mb-2">🥇</div>
                  <p className="text-3xl font-bold text-yellow-500">{team?.medals_gold || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Золото</p>
                </div>

                {/* Серебряные медали */}
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-400/10 to-gray-500/10 border border-gray-400/20">
                  <div className="text-4xl mb-2">🥈</div>
                  <p className="text-3xl font-bold text-gray-400">{team?.medals_silver || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Серебро</p>
                </div>

                {/* Бронзовые медали */}
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-600/10 to-orange-700/10 border border-orange-600/20">
                  <div className="text-4xl mb-2">🥉</div>
                  <p className="text-3xl font-bold text-orange-600">{team?.medals_bronze || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">Бронза</p>
                </div>
              </div>
            </div>

            {/* Основные метрики */}
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {/* Последние турниры */}
            {stats.recentTournaments.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Medal className="h-4 w-4" />
                  Последние турниры
                </h3>
                <div className="space-y-2">
                  {stats.recentTournaments.map((tournament, i: number) => (
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
