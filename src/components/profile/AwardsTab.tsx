import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target } from "lucide-react";
import { toast } from "sonner";
import { UserAchievement } from "@/types/common.types";

interface AwardsTabProps {
  userId: string;
}


export function AwardsTab({ userId }: AwardsTabProps) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const { data, error } = await supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from("user_achievements" as any)
          .select(`
            *,
            achievement:achievements(*)
          `)
          .eq("user_id", userId);

        if (error) throw error;
        setAchievements(data || []);
      } catch (error) {
        toast.error("Ошибка загрузки наград");
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [userId]);

  const filteredAchievements = filter === "all"
    ? achievements
    : achievements.filter(a => a.achievement?.category === filter);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "tournaments": return Trophy;
      case "activity": return Star;
      case "special": return Target;
      default: return Trophy;
    }
  };

  if (loading) {
    return <div className="animate-pulse">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="tournaments">Турниры</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
          <TabsTrigger value="special">Специальные</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredAchievements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {filter === "all"
                ? "Наград пока нет. Участвуйте в турнирах и будьте активны на платформе!"
                : "В этой категории наград пока нет"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((userAch) => {
                const ach = userAch.achievement;
                if (!ach) return null;

                const Icon = getCategoryIcon(ach.category);

                return (
                  <Card
                    key={userAch.id}
                    className="group hover:shadow-lg transition-all cursor-pointer"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-lg">{ach.name}</CardTitle>
                      <CardDescription className="text-sm">{ach.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>
                          Получено: {new Date(userAch.earned_at).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        {userAch.tournament_name && (
                          <div className="font-medium text-foreground">
                            {userAch.tournament_name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
