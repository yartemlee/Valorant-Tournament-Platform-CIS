import { useState, useRef } from "react";
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
import { Trash2, Upload, X } from "lucide-react";

interface TeamSettingsTabProps {
  team: any;
  isOwner: boolean;
  isCoach?: boolean;
}

export function TeamSettingsTab({ team, isOwner, isCoach }: TeamSettingsTabProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(team.logo_url || "");
  const [formData, setFormData] = useState({
    name: team.name,
    tag: team.tag,
    description: team.description || "",
    logo_url: team.logo_url || "",
    is_recruiting: team.is_recruiting,
  });

  const isManager = isOwner || isCoach;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Ошибка",
        description: "Файл превышает допустимый размер (5 МБ)",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Ошибка",
        description: "Поддерживаются только JPG, PNG и WEBP",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${team.id}-${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("team-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("team-logos")
        .getPublicUrl(fileName);

      setLogoPreview(publicUrl);
      setFormData({ ...formData, logo_url: publicUrl });

      toast({
        title: "Логотип загружен",
        description: "Не забудьте сохранить изменения",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setFormData({ ...formData, logo_url: "" });
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update({
          name: formData.name,
          tag: formData.tag,
          description: formData.description || null,
          logo_url: formData.logo_url || null,
          is_recruiting: formData.is_recruiting,
        })
        .eq("id", team.id);

      if (error) throw error;

      toast({
        title: "Настройки обновлены",
        description: "Изменения сохранены",
      });

      queryClient.invalidateQueries({ queryKey: ["team-manage"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    } catch (error: any) {
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
      // Update all members' current_team_id to null
      const memberIds = team.team_members?.map((m: any) => m.user_id) || [];
      if (memberIds.length > 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ current_team_id: null })
          .in("id", memberIds);
        if (profileError) throw profileError;
      }

      // Delete team (cascade will handle members)
      const { error } = await supabase.from("teams").delete().eq("id", team.id);

      if (error) throw error;

      toast({
        title: "Команда распущена",
        description: "Все участники освобождены",
      });

      navigate("/teams");
    } catch (error: any) {
      toast({
        title: "Ошибка",
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
            <Label>Логотип команды</Label>
            {logoPreview ? (
              <div className="relative w-32 h-32 rounded-lg border-2 border-border overflow-hidden group">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
                {isManager && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute top-2 right-2 p-1 bg-destructive/80 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            {isManager && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Загрузка..." : "Загрузить логотип"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG или WEBP, до 5 МБ
                </p>
              </>
            )}
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

      {isOwner && (
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