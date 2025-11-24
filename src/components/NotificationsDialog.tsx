import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsDialog({ open, onOpenChange }: NotificationsDialogProps) {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // ПРИМЕЧАНИЕ: Real-time подписки вынесены в TopBar компонент,
  // который всегда монтирован и обеспечивает постоянные подписки.
  // Дублирование подписок здесь не требуется и может вызвать проблемы.

  // Личные приглашения в команды (toUserId = текущий пользователь)
  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ["my-team-invites", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_invitations")
        .select(`
          *,
          teams:team_id (
            id,
            name,
            tag,
            logo_url
          )
        `)
        .eq("invited_user_id", session?.user?.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!session?.user?.id,
  });

  // Мои заявки в команды (fromUserId = текущий пользователь)
  const { data: myApplications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["my-team-applications", session?.user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("team_applications")
        .select(`
          *,
          teams:team_id (
            id,
            name,
            tag,
            logo_url
          )
        `)
        .eq("applicant_id", session?.user?.id)
        .in("status", ["pending", "accepted", "rejected"])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!session?.user?.id,
  });

  const handleInviteResponse = async (inviteId: string, teamId: string, accept: boolean) => {
    try {
      if (accept) {
        // Используем RPC функцию для безопасного принятия приглашения
        const { data, error } = await (supabase.rpc as any)("accept_team_invitation", {
          invitation_id_input: inviteId,
        });

        if (error) throw error;

        const result = data as unknown as { success: boolean; error?: string };

        if (!result.success) {
          toast.error(result.error || "Не удалось принять приглашение");
          queryClient.invalidateQueries({ queryKey: ["my-team-invites"] });
          return;
        }

        toast.success("Приглашение принято, вы вступили в команду!");
      } else {
        // Используем RPC функцию для отклонения приглашения
        const { data, error } = await (supabase.rpc as any)("decline_team_invitation", {
          invitation_id_input: inviteId,
        });

        if (error) throw error;

        const result = data as unknown as { success: boolean; error?: string };

        if (!result.success) {
          toast.error(result.error || "Не удалось отклонить приглашение");
          return;
        }

        toast.success("Приглашение отклонено");
      }

      // Обновляем все связанные данные
      queryClient.invalidateQueries({ queryKey: ["my-team-invites"] });
      queryClient.invalidateQueries({ queryKey: ["my-team-applications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    } catch (error: any) {
      toast.error(error.message || "Произошла ошибка");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="default">На рассмотрении</Badge>;
      case "accepted":
        return <Badge className="bg-green-500">Принята</Badge>;
      case "rejected":
        return <Badge variant="destructive">Отклонена</Badge>;
      default:
        return null;
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from("team_applications")
        .delete()
        .eq("id", applicationId);

      if (error) throw error;

      toast.success("Уведомление удалено");
      queryClient.invalidateQueries({ queryKey: ["my-team-applications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    } catch (error: any) {
      toast.error("Не удалось удалить уведомление");
    }
  };

  const handleClearAllApplications = async () => {
    if (!myApplications || myApplications.length === 0) return;

    try {
      const applicationIds = myApplications
        .filter((app: any) => app.status !== "pending")
        .map((app: any) => app.id);

      if (applicationIds.length === 0) {
        toast.error("Нет завершенных уведомлений для удаления");
        return;
      }

      const { error } = await supabase
        .from("team_applications")
        .delete()
        .in("id", applicationIds);

      if (error) throw error;

      toast.success("Все уведомления удалены");
      queryClient.invalidateQueries({ queryKey: ["my-team-applications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    } catch (error: any) {
      toast.error("Не удалось очистить уведомления");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Уведомления</DialogTitle>
          <DialogDescription>
            Ваши личные уведомления о командах
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Приглашения в команды */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Приглашения в команды</h3>
            {invitesLoading ? (
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            ) : invites && invites.length > 0 ? (
              <div className="space-y-3">
                {invites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={invite.teams?.logo_url} alt={invite.teams?.name} />
                      <AvatarFallback>{invite.teams?.tag || "T"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{invite.teams?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(invite.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleInviteResponse(invite.id, invite.team_id, true)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Принять
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleInviteResponse(invite.id, invite.team_id, false)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Отклонить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет приглашений</p>
            )}
          </div>

          {/* Мои заявки */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Мои заявки</h3>
              {myApplications && myApplications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllApplications}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Очистить все
                </Button>
              )}
            </div>
            {applicationsLoading ? (
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            ) : myApplications && myApplications.length > 0 ? (
              <div className="space-y-3">
                {myApplications.map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={app.teams?.logo_url} alt={app.teams?.name} />
                      <AvatarFallback>{app.teams?.tag || "T"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{app.teams?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(app.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {getStatusBadge(app.status)}
                      {app.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteApplication(app.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Нет заявок</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
