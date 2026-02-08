import { PlayerRole, Profile } from '@/types/common.types';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelector } from "./RoleSelector";
import { RankDisplay } from "./RankDisplay";
import { FEATURES } from "@/config/features";
import { toast } from "sonner";

interface RiotRankCacheRow {
  peak_rank: string | null;
  peak_tier: number | null;
  wins: number | null;
  games_played: number | null;
}

interface ProfileTabProps {
  profile: Profile;
  isOwnProfile: boolean;
}


export function ProfileTab({ profile, isOwnProfile }: ProfileTabProps) {
  const [roles, setRoles] = useState<PlayerRole[]>([]);
  const [rankCache, setRankCache] = useState<RiotRankCacheRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const promises: Promise<unknown>[] = [];

        // Load roles
        const rolesPromise = supabase
          .from("player_roles")
          .select("*")
          .eq("user_id", profile.id)
          .then(({ data }) => {
            setRoles((data as unknown as PlayerRole[]) || []);
          });
        promises.push(rolesPromise);

        // Load riot rank cache if puuid exists
        if (profile.riot_puuid) {
          const rankPromise = supabase
            .from("riot_rank_cache")
            .select("peak_rank, peak_tier, wins, games_played")
            .eq("puuid", profile.riot_puuid)
            .order("fetched_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => {
              setRankCache(data);
            });
          promises.push(rankPromise);
        }

        await Promise.all(promises);
      } catch {
        toast.error("Не удалось загрузить данные профиля");
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [profile.id, profile.riot_puuid]);

  if (loading) {
    return <div className="animate-pulse">Загрузка...</div>;
  }

  const currentRank = profile.official_rank || profile.rank || undefined;
  const currentRankTier = profile.official_rank_tier ?? undefined;

  return (
    <div className="flex gap-6">
      {/* Left Side - Ranks and About */}
      <div className="flex-1 space-y-6">
        {/* Ranks Section */}
        {FEATURES.SHOW_OFFICIAL_RANK && (
          <Card>
            <CardHeader>
              <CardTitle>Ранги</CardTitle>
            </CardHeader>
            <CardContent>
              <RankDisplay
                currentRank={currentRank}
                currentRankTier={currentRankTier}
                peakRank={rankCache?.peak_rank ?? undefined}
                peakRankTier={rankCache?.peak_tier ?? undefined}
                isVerified={profile.riot_verified ?? false}
                wins={rankCache?.wins ?? undefined}
                gamesPlayed={rankCache?.games_played ?? undefined}
              />
            </CardContent>
          </Card>
        )}

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
