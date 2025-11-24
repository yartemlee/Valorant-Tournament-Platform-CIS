import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, Users, Send } from "lucide-react";
import { InvitePlayerDialog } from "../InvitePlayerDialog";
import { useRealtimeTeamInvitations } from "@/hooks/useRealtimeTeamInvitations";
import { useRealtimeTeamApplications } from "@/hooks/useRealtimeTeamApplications";
import type { Session } from "@supabase/supabase-js";

interface TeamApplicationsTabProps {
  teamId: string;
  session: Session | null;
}

export function TeamApplicationsTab({ teamId, session }: TeamApplicationsTabProps) {
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
          from_user:profiles!applicant_id (
            id,
            username,
            avatar_url,
            riot_id
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

  // Real-time подписки для автоматического обновления заявок и приглашений
  useRealtimeTeamApplications({ 
    userId: session?.user?.id, 
    managedTeamIds: [teamId] 
  });
  useRealtimeTeamInvitations({ 
    userId: session?.user?.id, 
    managedTeamIds: [teamId] 
  });

  const { data: invites, isLoading: invitesLoading, error: invitesError } = useQuery({
    queryKey: ["team-invites-sent", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select(`
          *,
          to_user:profiles!invited_user_id (
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
        // Используем RPC функцию для безопасного принятия заявки
        const { data, error } = await supabase.rpc("accept_team_application", {
          application_id_input: applicationId,
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string };

        if (!result.success) {
          toast.error(result.error || "Не удалось принять заявку");
          queryClient.invalidateQueries({ queryKey: ["team-applications"] });
          return;
        }

        toast.success("Заявка принята. Игрок добавлен в команду");
      } else {
        // Используем RPC функцию для отклонения заявки
        const { data, error } = await supabase.rpc("decline_team_application", {
          application_id_input: applicationId,
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string };

        if (!result.success) {
          toast.error(result.error || "Не удалось отклонить заявку");
          return;
        }

        toast.success("Заявка отклонена");
      }

      queryClient.invalidateQueries({ queryKey: ["team-applications"] });
      queryClient.invalidateQueries({ queryKey: ["team-applications-count"] });
      queryClient.invalidateQueries({ queryKey: ["team-manage"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    } catch (error: any) {
      toast.error(error.message || "Не удалось обработать заявку");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("id", inviteId);

      if (error) throw error;

      toast.success("Приглашение отменено");

      queryClient.invalidateQueries({ queryKey: ["team-invites-sent"] });
      queryClient.invalidateQueries({ queryKey: ["team-applications-count"] });
    } catch (error: any) {
      toast.error(error.message || "Не удалось отменить приглашение");
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
                    onClick={() => handleApplicationResponse(app.id, app.applicant_id, true)}
                    disabled={processingId === app.id}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Принять
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApplicationResponse(app.id, app.applicant_id, false)}
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
