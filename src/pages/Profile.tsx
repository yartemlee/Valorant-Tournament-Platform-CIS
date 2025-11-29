import { Profile as ProfileType, Tournament, Match } from '@/types/common.types';
import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTab } from "@/components/profile/ProfileTab";
import { AwardsTab } from "@/components/profile/AwardsTab";
import { SettingsTab } from "@/components/profile/SettingsTab";
import { toast } from "sonner";

import { User } from "@supabase/supabase-js";

export default function Profile() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [currentUserTeamId, setCurrentUserTeamId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // If username is provided, load that profile, otherwise load current user's profile
        let targetUserId = user?.id;

        if (username && username !== user?.id) {
          const { data: targetProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("username", username)
            .single();

          targetUserId = targetProfile?.id;
        }

        if (!targetUserId) {
          // If no user and no username, redirect to login
          if (!user) {
            navigate("/login");
            return;
          }
          toast.error("Профиль не найден");
          return;
        }

        setIsOwnProfile(user?.id === targetUserId);

        // Load profile data
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", targetUserId)
          .single();

        if (error) throw error;
        setProfile(profileData);

        // If viewing someone else's profile, check if we are in the same team
        if (user && user.id !== targetUserId && profileData.current_team_id) {
          const { data: currentUserProfile } = await supabase
            .from("profiles")
            .select("current_team_id")
            .eq("id", user.id)
            .single();

          if (currentUserProfile) {
            console.log("Checking team membership:", {
              currentUserTeam: currentUserProfile.current_team_id,
              targetUserTeam: profileData.current_team_id,
              match: currentUserProfile.current_team_id === profileData.current_team_id
            });
            setCurrentUserTeamId(currentUserProfile.current_team_id);
          }
        }

      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Ошибка загрузки профиля");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, navigate]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-pulse">Загрузка...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <div className="flex-1 flex items-center justify-center">
            <div>Профиль не найден</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <ProfileHeader
              profile={profile}
              isOwnProfile={isOwnProfile}
              isTeamMember={currentUserTeamId === profile.current_team_id && !!profile.current_team_id}
              onProfileUpdate={setProfile}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${isOwnProfile ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="profile">Профиль</TabsTrigger>
                <TabsTrigger value="awards">Награды</TabsTrigger>
                <TabsTrigger value="stats">Статистика</TabsTrigger>
                {isOwnProfile && <TabsTrigger value="settings">Настройки</TabsTrigger>}
              </TabsList>

              <TabsContent value="profile" className="mt-6">
                <ProfileTab profile={profile} isOwnProfile={isOwnProfile} />
              </TabsContent>

              <TabsContent value="awards" className="mt-6">
                <AwardsTab userId={profile.id} />
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <div className="text-center py-12 text-muted-foreground">
                  Статистика турниров скоро будет доступна
                </div>
              </TabsContent>

              {isOwnProfile && (
                <TabsContent value="settings" className="mt-6">
                  <SettingsTab profile={profile} onProfileUpdate={setProfile} />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
