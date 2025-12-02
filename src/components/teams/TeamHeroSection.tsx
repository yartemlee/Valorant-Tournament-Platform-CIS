import { TeamWithMembers } from '@/types/common.types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings, UserPlus, Users, Calendar } from "lucide-react";
import { LeaveTeamButton } from "./LeaveTeamButton";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AvatarEditorDialog } from "../profile/AvatarEditorDialog";
import { Camera, Trash2 } from "lucide-react";

interface TeamHeroSectionProps {
  team: TeamWithMembers;
  memberCount: number;
  canApply: boolean;
  isOwner: boolean;
  isMember: boolean;
  isApplying: boolean;
  isManager?: boolean;
  isCaptain?: boolean;
  currentUserId?: string;
  userProfile?: unknown;
  onApply: () => void;
  onManage: () => void;
}

export function TeamHeroSection({
  team,
  memberCount,
  canApply,
  isOwner,
  isMember,
  isApplying,
  isManager,
  isCaptain,
  currentUserId,
  userProfile,
  onApply,
  onManage,
}: TeamHeroSectionProps) {
  const isFull = memberCount >= 10;
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5MB");
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error("Пожалуйста, загрузите изображение");
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result as string);
        setIsEditorOpen(true);
      });
      reader.readAsDataURL(file);
      event.target.value = '';
    }
  };

  const handleSaveCroppedImage = async (blob: Blob) => {
    try {
      setUploading(true);
      setIsEditorOpen(false);

      const fileExt = 'png';
      const fileName = `teams/${team.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: publicUrl })
        .eq('id', team.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["team", team.id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });

      toast.success("Логотип команды обновлен");
      setSelectedImage(null);

    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Ошибка при загрузке логотипа");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm("Вы уверены, что хотите удалить логотип?")) return;

    try {
      setUploading(true);

      const { error: updateError } = await supabase
        .from('teams')
        .update({ logo_url: null })
        .eq('id', team.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["team", team.id] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });

      toast.success("Логотип удален");

    } catch (error) {
      console.error('Error deleting logo:', error);
      toast.error("Ошибка при удалении логотипа");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-8">
      {/* Неоновый эффект */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />

      <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        {/* Левая часть: лого + инфо */}
        <div className="flex gap-6 items-start">
          {/* Логотип */}
          {/* Логотип */}
          <div className="relative group">
            {team.logo_url ? (
              <div className="h-24 w-24 rounded-full border-2 border-primary/30 shadow-lg bg-background flex items-center justify-center overflow-hidden">
                <img
                  src={team.logo_url}
                  alt={team.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-lg">
                <span className="text-2xl font-bold text-primary">
                  {team.tag.replace(/[aeiouаеёиоуыэюя]/gi, '').slice(0, 2).toUpperCase() || team.tag.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}

            {isManager && (
              <>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                  <Camera className="h-8 w-8 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploading}
                  />
                </label>

                {team.logo_url && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleDeleteLogo}
                    disabled={uploading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Название и метаданные */}
          <div className="space-y-3">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">{team.name}</h1>
              <p className="text-xl text-muted-foreground font-mono">[{team.tag}]</p>
            </div>

            {/* Статусы */}
            <div className="flex flex-wrap gap-2">
              {team.is_recruiting && !isFull ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30">
                  <Users className="h-3 w-3 mr-1" />
                  Набор открыт
                </Badge>
              ) : (
                <Badge variant="secondary" className="opacity-60">
                  <Users className="h-3 w-3 mr-1" />
                  Набор закрыт
                </Badge>
              )}

              <Badge variant="outline" className="border-primary/30">
                {memberCount} / 10 игроков
              </Badge>

              {isFull && (
                <Badge variant="destructive" className="opacity-80">
                  Полный состав
                </Badge>
              )}

              <Badge variant="outline" className="border-muted">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(team.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </Badge>
            </div>

            {/* Описание */}
            {team.description && (
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                {team.description}
              </p>
            )}
          </div>
        </div>

        {/* Правая часть: кнопки действий */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          {/* Only captain and coach can manage - no separate "owner" role */}
          {isManager && (
            <Button onClick={onManage} size="lg" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Управление командой
            </Button>
          )}

          {!isCaptain && isMember && currentUserId && (
            <LeaveTeamButton
              teamId={team.id}
              userId={currentUserId}
              isCaptain={!!isCaptain}
            />
          )}

          {canApply && (
            <Button onClick={onApply} disabled={isApplying} size="lg" className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              {isApplying ? "Отправка..." : "Подать заявку"}
            </Button>
          )}

          {!canApply && !isMember && userProfile?.current_team_id && (
            <p className="text-xs text-muted-foreground text-center leading-relaxed px-2">
              Вы уже состоите в команде. Чтобы вступить в другую — сначала покиньте текущую.
            </p>
          )}
        </div>
      </div>



      <AvatarEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageSrc={selectedImage}
        onSave={handleSaveCroppedImage}
        outputFormat="image/png"
      />
    </div >
  );
}
