import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, MessageCircle } from "lucide-react";
import { SocialLinks } from "./SocialLinks";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileHeaderProps {
  profile: any;
  isOwnProfile: boolean;
  onProfileUpdate: (profile: any) => void;
}

export function ProfileHeader({ profile, isOwnProfile, onProfileUpdate }: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}-${Math.random()}.${fileExt}`;

      // Upload to Supabase storage (assuming you have an avatars bucket)
      // For now, we'll just show a toast
      toast.success("Загрузка аватара скоро будет доступна");
      
    } catch (error: any) {
      toast.error("Ошибка загрузки аватара");
    } finally {
      setUploading(false);
    }
  };

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode) return null;
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
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
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-2xl">
              {profile.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          
          {isOwnProfile && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="h-8 w-8 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Info Section - Vertical Layout */}
        <div className="flex-1 space-y-1.5">
          <h1 className="text-2xl lg:text-3xl font-bold">{profile.username}</h1>
          
          {profile.riot_id && profile.riot_tag && (
            <div className="text-muted-foreground">
              ({profile.riot_id}#{profile.riot_tag})
            </div>
          )}
          
          {profile.country && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xl">{getCountryFlag(profile.country)}</span>
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
          {profile.show_social_links && (
            <SocialLinks profile={profile} />
          )}
          
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
    </div>
  );
}