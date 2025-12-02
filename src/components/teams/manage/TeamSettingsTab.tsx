import { TeamWithMembers } from '@/types/common.types';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { logTeamActivity } from "@/lib/team-activity";
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
  team: TeamWithMembers;
  isOwner: boolean;
  isCaptain?: boolean;
  isCoach?: boolean;
}

export function TeamSettingsTab({ team, isOwner, isCaptain, isCoach }: TeamSettingsTabProps) {
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
    // Валидация на стороне клиента
    if (!formData.name.trim()) {
      toast.error("Название команды обязательно");
      return;
    }

    if (formData.name.trim().length < 3) {
      toast.error("Название команды должно содержать минимум 3 символа");
      return;
    }

    if (!formData.tag.trim()) {
      toast.error("Тег команды обязателен");
      return;
    }

    if (formData.tag.trim().length < 2) {
      toast.error("Тег команды должен содержать минимум 2 символа");
      return;
    }

    if (formData.logo_url && formData.logo_url.trim()) {
      try {
        new URL(formData.logo_url);
      } catch {
        toast.error("Некорректный URL логотипа");
        return;
      }
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: formData.name.trim(),
          tag: formData.tag.trim().toUpperCase(),
          description: formData.description.trim() || null,
          logo_url: formData.logo_url.trim() || null,
          is_recruiting: formData.is_recruiting,
        })
        .eq("id", team.id);

      if (error) {
        if (error.message.includes('policy') || error.message.includes('permission')) {
          toast.error("Управление доступно только капитану или тренеру команды");
          return;
        }
        throw error;
      }

      toast.success("Настройки команды обновлены");

      logTeamActivity({
        teamId: team.id,
        type: "team_updated",
        description: "Обновлены настройки команды",
        data: {
          name: formData.name,
          tag: formData.tag,
          is_recruiting: formData.is_recruiting
        }
      });

      queryClient.invalidateQueries({ queryKey: ["team-manage"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    } catch (error) {
      toast.error(error.message || "Не удалось обновить настройки команды");
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
        .from("team_invitations")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("team_id", team.id)
        .eq("status", "pending");
      if (invitesError) throw invitesError;

      // 3. Обнуляем current_team_id у всех участников
      const memberIds = team.team_members?.map((m) => m.user_id) || [];
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

      toast.success("Команда распущена. Все участники освобождены");

      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/teams");
    } catch (error) {
      toast.error(error.message || "Ошибка при распускании команды");
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
              placeholder="Введите название команды"
              minLength={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Минимум 3 символа
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Тег</Label>
            <Input
              id="tag"
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value.toUpperCase() })}
              maxLength={5}
              disabled={!isManager}
              placeholder="Например: TEST"
              minLength={2}
              required
            />
            <p className="text-xs text-muted-foreground">
              2-5 символов, только заглавные буквы
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">URL логотипа</Label>
            <Input
              id="logo_url"
              type="url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              disabled={!isManager}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Необязательно. Введите полный URL изображения
            </p>
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
              placeholder="Расскажите о вашей команде..."
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/400 символов
            </p>
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
