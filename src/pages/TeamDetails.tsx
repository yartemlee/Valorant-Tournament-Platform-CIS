import { Profile, Tournament, Match } from '@/types/common.types';
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import { TeamHeroSection } from "@/components/teams/TeamHeroSection";
import { TeamRosterSection } from "@/components/teams/TeamRosterSection";
import { TeamStatsSection } from "@/components/teams/TeamStatsSection";
import { TeamActivitySection } from "@/components/teams/TeamActivitySection";
import { TeamManageDialog } from "@/components/teams/TeamManageDialog";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useRealtimeTeamMembers } from "@/hooks/useRealtimeTeamMembers";
import { useRealtimeTeams } from "@/hooks/useRealtimeTeams";

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isApplying, setIsApplying] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  const {
    id: currentUserId,
    profile,
    current_team_id,
    isCaptainOfThisTeam,
    isMemberOfThisTeam,
    isCoachOfThisTeam,
    isManager,
    refetch: refetchUserProfile
  } = useCurrentUserProfile(id);

  // Real-time подписки для автоматического обновления
  useRealtimeTeamMembers({ teamId: id });
  useRealtimeTeams({ teamId: id });

  const { data: team, isLoading } = useQuery({
    queryKey: ["team", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          team_members (
            id,
            user_id,
            role,
            joined_at,
            profiles (
              username,
              avatar_url,
              riot_id
            )
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching team:", error);
        return null;
      }

      // Ensure team_members is always an array
      if (data) {
        data.team_members = data.team_members || [];
      }

      return data;
    },
    enabled: !!id,
  });

  const isOwner = currentUserId === team?.captain_id;
  const teamMembers = team?.team_members || [];
  const memberCount = teamMembers.length;
  const isFull = memberCount >= 10;

  const handleApply = async () => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы подать заявку",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    try {
      // Fresh DB check перед отправкой заявки
      const { data: freshProfile, error: profileError } = await supabase
        .from("profiles")
        .select("current_team_id")
        .eq("id", currentUserId)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error("Не удалось проверить статус команды");
      }

      if (freshProfile.current_team_id) {
        toast({
          title: "Вы уже состоите в команде",
          description: "Чтобы вступить в другую — сначала покиньте текущую.",
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        setIsApplying(false);
        return;
      }

      // Используем безопасный RPC для подачи заявки с DB-валидацией
      const { error } = await (supabase.rpc as any)('rpc_apply_to_team', {
        target_team_id: id!,
        note: null
      });

      if (error) {
        console.error("RPC error:", error);

        // Обрабатываем известные ошибки с понятными сообщениями
        if (error.message?.includes('already_in_team')) {
          toast({
            title: "Вы уже состоите в команде",
            description: "Чтобы вступить в другую — сначала покиньте текущую.",
            variant: "destructive",
          });
          queryClient.invalidateQueries({ queryKey: ["profile"] });
          return;
        }

        if (error.message?.includes('duplicate_pending')) {
          toast({
            title: "Вы уже подали заявку в эту команду",
            description: "Ожидайте ответа от капитана команды",
          });
          return;
        }

        if (error.message?.includes('not_authenticated')) {
          toast({
            title: "Требуется авторизация",
            description: "Войдите, чтобы подать заявку",
            variant: "destructive",
          });
          return;
        }

        if (error.message?.includes('team_not_recruiting')) {
          toast({
            title: "Набор в команду закрыт",
            description: "Эта команда больше не принимает новых участников",
            variant: "destructive",
          });
          queryClient.invalidateQueries({ queryKey: ["teams"] });
          return;
        }

        if (error.message?.includes('team_full')) {
          toast({
            title: "Команда заполнена",
            description: "В команде уже максимальное количество участников (10)",
            variant: "destructive",
          });
          queryClient.invalidateQueries({ queryKey: ["teams"] });
          return;
        }

        if (error.code === '42501') {
          toast({
            title: "Не удалось отправить заявку",
            description: "Проверьте, что вы не состоите в команде.",
            variant: "destructive",
          });
          return;
        }

        // Неизвестная ошибка
        throw error;
      }

      toast({
        title: "Заявка отправлена",
        description: "Ожидайте ответа от капитана команды",
      });

      // Обновляем все связанные кэши
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teams"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["team", id] }),
        queryClient.invalidateQueries({ queryKey: ["team-applications", id] }),
        queryClient.invalidateQueries({ queryKey: ["team-applications-count"] }),
      ]);
    } catch (error) {
      console.error("Application process error:", error);
      toast({
        title: "Ошибка при отправке заявки",
        description: "Не удалось отправить заявку. Попробуйте ещё раз.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-8 flex items-center justify-center">
            <p className="text-muted-foreground">Загрузка...</p>
          </main>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-8 flex items-center justify-center">
            <p className="text-muted-foreground">Команда не найдена</p>
          </main>
        </div>
      </div>
    );
  }

  const canApply = currentUserId &&
    !current_team_id &&
    !isMemberOfThisTeam &&
    team.is_recruiting &&
    !isFull;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Кнопка назад */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/teams")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к командам
            </Button>

            {/* Hero секция */}
            <TeamHeroSection
              team={team}
              memberCount={memberCount}
              canApply={canApply}
              isOwner={isOwner}
              isMember={isMemberOfThisTeam}
              isApplying={isApplying}
              isManager={isManager}
              isCaptain={isCaptainOfThisTeam}
              currentUserId={currentUserId}
              userProfile={profile}
              onApply={handleApply}
              onManage={() => setManageDialogOpen(true)}
              onPhantomUpdate={() => queryClient.invalidateQueries({ queryKey: ["team", id] })}
            />

            {/* Сетка из 3 блоков */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Состав команды - занимает 2 колонки */}
              <div className="lg:col-span-2">
                <TeamRosterSection
                  members={teamMembers}
                  memberCount={memberCount}
                />
              </div>

              {/* Правая колонка: статистика и активность */}
              <div className="space-y-6">
                <TeamStatsSection teamId={team.id} />
                <TeamActivitySection teamId={team.id} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Модальное окно управления */}
      <TeamManageDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        team={team}
        isOwner={isOwner}
        isCaptain={isCaptainOfThisTeam}
        isCoach={isCoachOfThisTeam}
        onCaptainTransferred={() => {
          setManageDialogOpen(false);
          refetchUserProfile();
        }}
      />
    </div>
  );
};

export default TeamDetails;
