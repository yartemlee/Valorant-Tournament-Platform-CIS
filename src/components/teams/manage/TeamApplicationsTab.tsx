import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Users, Send } from "lucide-react";
import { InvitePlayerDialog } from "../InvitePlayerDialog";
import type { Session } from "@supabase/supabase-js";

interface TeamApplicationsTabProps {
  teamId: string;
  session: Session | null;
}

export function TeamApplicationsTab({ teamId, session }: TeamApplicationsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: applications, isLoading: applicationsLoading, error: applicationsError } = useQuery({
    queryKey: ["team-applications", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_applications")
        .select(`
          *,
          from_user:profiles!from_user_id (
            id,
            username,
            avatar_url,
            riot_id,
            riot_tag
          )
        `)
        .eq("team_id", teamId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!session?.user,
    retry: (failureCount, error: any) => {
      // Retry only on network errors
      return failureCount < 2 && (!error?.code || error.code === 'PGRST301');
    },
  });

  // Realtime подписка на изменения заявок
  useEffect(() => {
    const channel = supabase
      .channel('team-applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_applications',
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["team-applications", teamId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);

  const { data: invites, isLoading: invitesLoading, error: invitesError } = useQuery({
    queryKey: ["team-invites-sent", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invites")
        .select(`
          *,
          to_user:profiles!to_user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq("team_id", teamId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching invites:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!session?.user,
    retry: (failureCount, error: any) => {
      // Retry only on network errors
      return failureCount < 2 && (!error?.code || error.code === 'PGRST301');
    },
  });

  const handleApplicationResponse = async (applicationId: string, userId: string, accept: boolean) => {
    setProcessingId(applicationId);
    try {
      if (accept) {
        // Проверяем лимит участников команды
        const { count } = await supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("team_id", teamId);

        if (count && count >= 10) {
          toast({
            title: "В команде уже максимум участников (10)",
            variant: "destructive",
          });
          return;
        }

        // Проверяем, не состоит ли пользователь уже в другой команде
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("current_team_id")
          .eq("id", userId)
          .single();

        if (userProfile?.current_team_id) {
          toast({
            title: "Игрок уже состоит в другой команде",
            description: "Заявка автоматически отклонена",
            variant: "destructive",
          });
          // Отклоняем заявку автоматически
          await supabase
            .from("team_applications")
            .update({ status: "cancelled" })
            .eq("id", applicationId);
          queryClient.invalidateQueries({ queryKey: ["team-applications"] });
          return;
        }

        // Add user to team (триггер автоматически отменит другие заявки/приглашения)
        const { error: memberError } = await supabase.from("team_members").insert({
          team_id: teamId,
          user_id: userId,
          team_role: "player",
        });
        if (memberError) throw memberError;

        // Update user's current team
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ current_team_id: teamId })
          .eq("id", userId);
        if (profileError) throw profileError;
      }

      // Update application status
      const { error } = await supabase
        .from("team_applications")
        .update({ status: accept ? "accepted" : "declined" })
        .eq("id", applicationId);

      if (error) throw error;

      toast({
        title: accept ? "Заявка принята" : "Заявка отклонена",
        description: accept ? "Игрок добавлен в команду" : undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["team-applications"] });
      queryClient.invalidateQueries({ queryKey: ["team-applications-count"] });
      queryClient.invalidateQueries({ queryKey: ["team-manage"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    } catch (error: any) {
      console.error("Error handling application response:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обработать заявку",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("team_invites")
        .update({ status: "cancelled" })
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: "Приглашение отменено",
      });

      queryClient.invalidateQueries({ queryKey: ["team-invites-sent"] });
      queryClient.invalidateQueries({ queryKey: ["team-applications-count"] });
    } catch (error: any) {
      console.error("Error canceling invite:", error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отменить приглашение",
        variant: "destructive",
      });
    }
  };

  // Если сессия еще не загружена, показываем загрузку
  if (!session) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Загрузка...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Заявки от игроков
          </CardTitle>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <Send className="h-4 w-4 mr-2" />
            Пригласить игрока
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {applicationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : applicationsError ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Не удалось загрузить заявки</p>
              <p className="text-sm text-muted-foreground">
                {applicationsError instanceof Error ? applicationsError.message : "Попробуйте обновить страницу"}
              </p>
            </div>
          ) : applications && applications.length > 0 ? (
            applications.map((app: any) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={app.from_user?.avatar_url} />
                    <AvatarFallback>
                      {app.from_user?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{app.from_user?.username || "Unknown"}</p>
                    {app.from_user?.riot_id && (
                      <p className="text-sm text-muted-foreground">
                        {app.from_user.riot_id}
                        {app.from_user.riot_tag && `#${app.from_user.riot_tag}`}
                      </p>
                    )}
                    {app.note && (
                      <p className="text-sm text-muted-foreground mt-1">{app.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApplicationResponse(app.id, app.from_user_id, true)}
                    disabled={processingId === app.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Принять
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplicationResponse(app.id, app.from_user_id, false)}
                    disabled={processingId === app.id}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Отклонить
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">Нет новых заявок</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Отправленные приглашения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invitesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : invitesError ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Не удалось загрузить приглашения</p>
              <p className="text-sm text-muted-foreground">
                {invitesError instanceof Error ? invitesError.message : "Попробуйте обновить страницу"}
              </p>
            </div>
          ) : invites && invites.length > 0 ? (
            invites.map((invite: any) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={invite.to_user?.avatar_url} />
                    <AvatarFallback>
                      {invite.to_user?.username?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{invite.to_user?.username || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      Приглашение от {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelInvite(invite.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Отменить
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Нет отправленных приглашений
            </p>
          )}
        </CardContent>
      </Card>

      <InvitePlayerDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        teamId={teamId}
      />
    </div>
  );
}
