import { PlayerRole, PlayerAgent, Profile } from '@/types/common.types';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelector } from "./RoleSelector";
import { RankDisplay } from "./RankDisplay";
import { MedalsDisplay } from "./MedalsDisplay";
import { toast } from "sonner";

interface ProfileTabProps {
  profile: Profile;
  isOwnProfile: boolean;
}


export function ProfileTab({ profile, isOwnProfile }: ProfileTabProps) {
  const [roles, setRoles] = useState<PlayerRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        // Load roles
        const { data: rolesData } = await supabase
          .from("player_roles")
          .select("*")
          .eq("user_id", profile.id);

        setRoles((rolesData as unknown as PlayerRole[]) || []);
      } catch (error) {
        toast.error("Ошибка загрузки данных профиля");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [profile.id]);

  if (loading) {
    return <div className="animate-pulse">Загрузка...</div>;
  }

  return (
    <div className="flex gap-6">
      {/* Left Side - Ranks and About */}
      <div className="flex-1 space-y-6">
        {/* Ranks Section */}
        <Card>
          <CardHeader>
            <CardTitle>Ранги(В разработке)</CardTitle>
          </CardHeader>
          <CardContent>
            <RankDisplay
              currentRank={profile.rank}
            />
          </CardContent>
        </Card>

        {/* About Me Section */}
        <Card>
          <CardHeader>
            <CardTitle>О себе</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {profile.bio || (isOwnProfile ? "Расскажите о себе в настройках профиля" : "")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Roles & Agents (30% width) */}
      <div className="w-[30%] flex-shrink-0">
        {(profile.show_roles || isOwnProfile) ? (
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Игровые роли и агенты</CardTitle>
            </CardHeader>
            <CardContent>
              <RoleSelector
                userId={profile.id}
                roles={roles}
                onUpdate={setRoles}
                isEditable={isOwnProfile}
              />
            </CardContent>
          </Card>
        ) : (
          <Card className="sticky top-6">
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>Пользователь скрыл игровые роли</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
