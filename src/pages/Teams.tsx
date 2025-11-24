import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Plus } from "lucide-react";
import { TeamCard } from "@/components/teams/TeamCard";
import { useToast } from "@/hooks/use-toast";
import { useRealtimeTeams } from "@/hooks/useRealtimeTeams";

const Teams = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { session, authLoading: sessionLoading } = useAuth();

  // Real-time подписка на все команды для автоматического обновления списка
  useRealtimeTeams({ watchAll: true });

  // Get user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Get all teams using simple select (no nested joins)
  const { data: teams, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["teams", { status: statusFilter, search: searchQuery ?? "" }],
    enabled: !sessionLoading,
    queryFn: async () => {
      console.time('fetchTeams');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      try {
        let query = supabase
          .from('teams')
          .select('id, name, tag, logo_url, is_recruiting, created_at')
          .abortSignal(controller.signal);

        // Apply status filter
        if (statusFilter === 'recruiting') {
          query = query.eq('is_recruiting', true);
        } else if (statusFilter === 'closed') {
          query = query.eq('is_recruiting', false);
        }

        // Apply search filter
        if (searchQuery && searchQuery.trim()) {
          query = query.or(`name.ilike.%${searchQuery}%,tag.ilike.%${searchQuery}%`);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error) {
          console.error('fetchTeams failed:', error);
          throw error;
        }
        
        console.timeEnd('fetchTeams');
        return data || [];
      } catch (error) {
        console.error('fetchTeams exception:', error);
        console.timeEnd('fetchTeams');
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    },
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    retry: 1,
    networkMode: 'always',
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
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Команды</h1>
              </div>
              <Button onClick={handleCreateTeam} disabled={!canCreateTeam}>
                <Plus className="h-4 w-4 mr-2" />
                Создать команду
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
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
                  {sortedTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      isUserTeam={team.id === profile?.current_team_id}
                    />
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
