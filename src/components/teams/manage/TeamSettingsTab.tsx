import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface TeamSettingsTabProps {
  team: any;
  isOwner: boolean;
  isCaptain?: boolean;
  isCoach?: boolean;
}

export function TeamSettingsTab({ team, isOwner, isCaptain, isCoach }: TeamSettingsTabProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: team.name,
    tag: team.tag,
    description: team.description || "",
    logo_url: team.logo_url || "",
    is_recruiting: team.is_recruiting,
  });

  const isManager = isCaptain || isCoach;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // Use secure RPC that validates captain role
      const { data, error } = await supabase.rpc('update_team_settings', {
        team_id_input: team.id,
        new_name: formData.name,
        new_tag: formData.tag,
        new_logo_url: formData.logo_url || null,
        new_description: formData.description || null,
        new_is_recruiting: formData.is_recruiting,
      });

      if (error) {
        if (error.message.includes('not_captain')) {
          toast({
            title: "Нет прав",
            description: "Управление доступно только капитану команды.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Настройки команды обновлены",
      });

      queryClient.invalidateQueries({ queryKey: ["team-manage"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    } catch (error: any) {
      console.error("Update team settings error:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisband = async () => {
    try {
      // 1. Отменяем все активные заявки в эту команду
      const { error: applicationsError } = await supabase
        .from("team_applications")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("team_id", team.id)
        .eq("status", "pending");
      if (applicationsError) throw applicationsError;

      // 2. Отменяем все активные приглашения от этой команды
      const { error: invitesError } = await supabase
        .from("team_invites")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("team_id", team.id)
        .eq("status", "pending");
      if (invitesError) throw invitesError;

      // 3. Обнуляем current_team_id у всех участников
      const memberIds = team.team_members?.map((m: any) => m.user_id) || [];
      if (memberIds.length > 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ current_team_id: null })
          .in("id", memberIds);
        if (profileError) throw profileError;
      }

      // 4. Удаляем всех участников команды
      const { error: membersError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", team.id);
      if (membersError) throw membersError;

      // 5. Удаляем участие команды в турнирах
      const { error: tournamentsError } = await supabase
        .from("tournament_participants")
        .delete()
        .eq("team_id", team.id);
      if (tournamentsError) console.warn("Failed to remove tournament participations:", tournamentsError);

      // 6. Удаляем саму команду
      const { error } = await supabase.from("teams").delete().eq("id", team.id);
      if (error) throw error;

      toast({
        title: "Команда распущена",
        description: "Команда полностью удалена, все участники освобождены",
      });

      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/teams");
    } catch (error: any) {
      toast({
        title: "Ошибка при распускании команды",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Информация о команде</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isManager}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Тег</Label>
            <Input
              id="tag"
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
              maxLength={5}
              disabled={!isManager}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">URL логотипа</Label>
            <Input
              id="logo_url"
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              disabled={!isManager}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              maxLength={400}
              disabled={!isManager}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="is_recruiting">Открыть набор</Label>
              <p className="text-sm text-muted-foreground">
                Другие игроки смогут подавать заявки
              </p>
            </div>
            <Switch
              id="is_recruiting"
              checked={formData.is_recruiting}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_recruiting: checked })
              }
              disabled={!isManager}
            />
          </div>

          {isManager && (
            <Button onClick={handleUpdate} disabled={isUpdating} className="w-full">
              {isUpdating ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          )}
        </CardContent>
      </Card>

      {isCaptain && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Опасная зона</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Распустить команду
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Команда "{team.name}" будет распущена, и все участники будут освобождены. Это
                    действие нельзя отменить.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisband}>Распустить</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
