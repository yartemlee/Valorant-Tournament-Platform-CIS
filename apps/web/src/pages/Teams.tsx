import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { queryKeys } from "@/services/queryKeys";
import { fetchTeams } from "@/services/teams";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Plus } from "lucide-react";
import { TeamCard } from "@/components/teams/TeamCard";
import { useToast } from "@/hooks/useToast";
import { useRealtimeTeams } from "@/hooks/useRealtimeTeams";

const Teams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { authLoading: sessionLoading } = useAuth();

  const { profile } = useCurrentUserProfile();

  // Real-time подписка на все команды для автоматического обновления списка
  useRealtimeTeams({ watchAll: true });

  // Get all teams
  const filters = { status: statusFilter, search: searchQuery ?? "" };
  const { data: teams, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.teams.list(filters),
    enabled: !sessionLoading,
    queryFn: () => fetchTeams(filters),
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    retry: 1,
    networkMode: "always",
  });

  const handleCreateTeam = () => {
    if (!profile?.riot_id) {
      toast({
        title: "Riot ID не привязан",
        description: "Чтобы создать команду, привяжите Riot ID.",
        variant: "destructive",
      });
      return;
    }

    if (profile?.current_team_id) {
      toast({
        title: "Вы уже в команде",
        description: "Чтобы создать новую команду, сначала покиньте текущую.",
        variant: "destructive",
      });
      return;
    }

    navigate("/teams/create");
  };

  const canCreateTeam = !!profile?.riot_id && !profile?.current_team_id;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 p-8 overflow-y-auto gradient-mesh">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl font-display font-bold tracking-tight">Команды</h1>
              </div>
              <Button onClick={handleCreateTeam} disabled={!canCreateTeam}>
                <Plus className="h-4 w-4 mr-2" />
                Создать команду
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или тегу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все команды</SelectItem>
                  <SelectItem value="recruiting">Открыт набор</SelectItem>
                  <SelectItem value="closed">Набор закрыт</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Teams Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Загрузка…</div>
            ) : isError ? (
              <div className="text-center py-12 space-y-4">
                <Users className="h-16 w-16 mx-auto text-destructive opacity-50" />
                <h3 className="text-xl font-semibold">Не удалось загрузить команды</h3>
                <p className="text-muted-foreground">
                  Попробуйте обновить страницу или зайдите позже.
                </p>
                <Button onClick={() => refetch()}>
                  Повторить попытку
                </Button>
              </div>
            ) : !teams || teams.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Users className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold">Команд пока нет</h3>
                <p className="text-muted-foreground">
                  Создайте свою команду и участвуйте в турнирах
                </p>
                {canCreateTeam && (
                  <Button onClick={handleCreateTeam}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать команду
                  </Button>
                )}
              </div>
            ) : (() => {
              // Separate user's team from other teams
              const myTeam = teams.find(t => t.id === profile?.current_team_id);
              const otherTeams = teams.filter(t => t.id !== profile?.current_team_id);
              const sortedTeams = myTeam ? [myTeam, ...otherTeams] : otherTeams;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedTeams.map((team, index) => (
                    <div
                      key={team.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${0.2 + index * 0.05}s` }}
                    >
                      <TeamCard
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        team={team as any}
                        isUserTeam={team.id === profile?.current_team_id}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Teams;
