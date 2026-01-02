import { TeamWithMembers } from '@/types/common.types';
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { TeamHeroSection } from "@/components/teams/TeamHeroSection";
import { TeamRosterSection } from "@/components/teams/TeamRosterSection";
import { TeamStatsSection } from "@/components/teams/TeamStatsSection";
import { TeamActivitySection } from "@/components/teams/TeamActivitySection";
import { TeamManageDialog } from "@/components/teams/TeamManageDialog";
import { ApplyToTeamDialog } from "@/components/teams/ApplyToTeamDialog";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useRealtimeTeamMembers } from "@/hooks/useRealtimeTeamMembers";
import { useRealtimeTeams } from "@/hooks/useRealtimeTeams";

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const isApplying = false; // State managed by ApplyToTeamDialog

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

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      let query = supabase.from("teams").select(`
        *,
        team_members(
          id,
          user_id,
          role,
          joined_at,
          profiles(
            username,
            avatar_url,
            riot_id
          )
        )
          `);

      if (isUuid) {
        query = query.eq("id", id);
      } else {
        query = query.eq("slug", id);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        return null;
      }

      // Ensure team_members is always an array
      if (data) {
        data.team_members = data.team_members || [];
      }

      return data as unknown as TeamWithMembers;
    },
    enabled: !!id,
  });

  const isOwner = currentUserId === team?.captain_id;
  const teamMembers = team?.team_members || [];
  const memberCount = teamMembers.length;
  const isFull = memberCount >= 10;



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
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
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
              canApply={!!canApply}
              isOwner={isOwner}
              isMember={isMemberOfThisTeam}
              isApplying={isApplying}
              isManager={isManager}
              isCaptain={isCaptainOfThisTeam}
              currentUserId={currentUserId}
              userProfile={profile ?? undefined}
              onApply={() => setApplyDialogOpen(true)}
              onManage={() => setManageDialogOpen(true)}
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

      {/* Диалог подачи заявки */}
      {team && (
        <ApplyToTeamDialog
          open={applyDialogOpen}
          onOpenChange={setApplyDialogOpen}
          team={{
            id: team.id,
            name: team.name,
            tag: team.tag,
            logo_url: team.logo_url,
          }}
        />
      )}
    </div>
  );
};

export default TeamDetails;
