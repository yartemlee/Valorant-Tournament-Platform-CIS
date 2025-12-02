import { Profile } from '@/types/common.types';
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, MessageCircle, Trash2 } from "lucide-react";
import { SocialLinks } from "./SocialLinks";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getCountryByCode } from "@/lib/countries";
import { CountryFlag } from "@/components/CountryFlag";
import { AvatarEditorDialog } from "./AvatarEditorDialog";

interface ProfileHeaderProps {
  profile: Profile;
  isOwnProfile: boolean;
  isTeamMember?: boolean;
  onProfileUpdate: (profile: Profile) => void;
}

export function ProfileHeader({ profile, isOwnProfile, isTeamMember, onProfileUpdate }: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];

      // Validate file size (max 5MB for initial selection)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5MB");
        return;
      }

      // Validate file type
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

      // Reset input
      event.target.value = '';
    }
  };

  const handleSaveCroppedImage = async (blob: Blob) => {
    try {
      setUploading(true);
      setIsEditorOpen(false);

      const fileExt = 'jpg'; // We export as jpeg
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Update local state
      onProfileUpdate({
        ...profile,
        avatar_url: publicUrl
      });

      toast.success("Аватар успешно обновлен");
      setSelectedImage(null);

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error("Ошибка при загрузке аватара");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Вы уверены, что хотите удалить аватар?")) return;

    try {
      setUploading(true);

      // Update profile to remove avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Update local state
      onProfileUpdate({
        ...profile,
        avatar_url: null
      });

      toast.success("Аватар удален");

    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error("Ошибка при удалении аватара");
    } finally {
      setUploading(false);
    }
  };

  // Use profile medals directly instead of tournament_medals table
  const medalsGold = profile.medals_gold || 0;
  const medalsSilver = profile.medals_silver || 0;
  const medalsBronze = profile.medals_bronze || 0;

  return (
    <div className="bg-card rounded-lg border p-6 shadow-sm relative">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Avatar Section */}
        <div className="relative group flex-shrink-0">
          <Avatar className="h-24 w-24 lg:h-32 lg:w-32 ring-2 ring-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>

          {isOwnProfile && (
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

              {profile.avatar_url && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleDeleteAvatar}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Info Section - Vertical Layout */}
        <div className="flex-1 space-y-1.5">
          <h1 className="text-2xl lg:text-3xl font-bold">{profile.username}</h1>

          {profile.riot_id && (
            <div className="text-muted-foreground">
              ({profile.riot_id})
            </div>
          )}

          {profile.country && (
            <div className="flex items-center gap-2 text-sm">
              <CountryFlag code={profile.country} size={24} />
              <span className="text-muted-foreground">
                {getCountryByCode(profile.country)?.nameRu || profile.country}
              </span>
            </div>
          )}

          {profile.status && (
            <p className="text-sm text-muted-foreground">{profile.status}</p>
          )}



          {!profile.riot_id && isOwnProfile && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md border border-destructive/20 mt-2">
              ⚠️ Привяжите Riot ID, чтобы участвовать в турнирах
            </div>
          )}
        </div>

        {/* Social Links and Actions */}
        <div className="flex flex-col gap-3 items-start lg:items-end">
          <SocialLinks
            profile={profile}
            isTeamMember={isTeamMember}
            isOwnProfile={isOwnProfile}
          />

          {!isOwnProfile && (
            <Button variant="default" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Написать
            </Button>
          )}
        </div>
      </div>

      {/* Medals in bottom-right corner */}
      <div className="absolute bottom-4 right-6 flex items-center gap-3 text-sm">
        <div className={`flex items-center gap-1 ${medalsGold === 0 ? 'opacity-40' : ''}`}>
          <span className="text-lg">🥇</span>
          <span className="font-medium">{medalsGold}</span>
        </div>
        <span className="text-muted-foreground">|</span>
        <div className={`flex items-center gap-1 ${medalsSilver === 0 ? 'opacity-40' : ''}`}>
          <span className="text-lg">🥈</span>
          <span className="font-medium">{medalsSilver}</span>
        </div>
        <span className="text-muted-foreground">|</span>
        <div className={`flex items-center gap-1 ${medalsBronze === 0 ? 'opacity-40' : ''}`}>
          <span className="text-lg">🥉</span>
          <span className="font-medium">{medalsBronze}</span>
        </div>
      </div>

      <AvatarEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageSrc={selectedImage}
        onSave={handleSaveCroppedImage}
      />
    </div>
  );
}
