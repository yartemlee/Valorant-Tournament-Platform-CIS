import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings } from "lucide-react";
import { TeamRosterTab } from "@/components/teams/manage/TeamRosterTab";
import { TeamApplicationsTab } from "@/components/teams/manage/TeamApplicationsTab";
import { TeamSettingsTab } from "@/components/teams/manage/TeamSettingsTab";

const TeamManage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: team, isLoading } = useQuery({
    queryKey: ["team-manage", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("teams")
        .select(`
          *,
          team_members (
            id,
            user_id,
            team_role,
            joined_at,
            profiles:user_id (
              username,
              avatar_url,
              riot_id,
              riot_tag
            )
          )
        `)
        .eq("id", id)
        .single();
      return data;
    },
    refetchInterval: 2000, // Проверяем доступ каждые 2 секунды
  });

  const isOwner = session?.user?.id === team?.owner_id;
  const userMember = team?.team_members?.find((m: any) => m.user_id === session?.user?.id);
  const isCaptain = userMember?.team_role === "captain";
  const isCoach = userMember?.team_role === "coach";
  // Доступ только для владельца, капитана или тренера
  const isManager = isOwner || isCaptain || isCoach;

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

  // Проверяем права доступа: только владелец, капитан или тренер могут управлять
  if (!team || !isManager) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Нет доступа к управлению командой</p>
              <p className="text-sm text-muted-foreground">
                Только владелец, капитан или тренер могут управлять командой
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/teams/${id}`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Управление командой</h1>
                  <p className="text-muted-foreground">{team.name}</p>
                </div>
              </div>
            </div>

            <Tabs defaultValue="roster" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="roster">Состав</TabsTrigger>
                <TabsTrigger value="applications">Заявки</TabsTrigger>
                <TabsTrigger value="settings">Настройки</TabsTrigger>
              </TabsList>

              <TabsContent value="roster" className="space-y-4">
                <TeamRosterTab team={team} isOwner={isOwner} isCoach={isCoach} />
              </TabsContent>

              <TabsContent value="applications" className="space-y-4">
                <TeamApplicationsTab teamId={team.id} session={session} />
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <TeamSettingsTab team={team} isOwner={isOwner} isCoach={isCoach} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeamManage;
