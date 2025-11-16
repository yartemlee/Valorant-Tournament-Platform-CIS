import { Button } from "@/components/ui/button";
import { Coins, LogOut, Settings, User, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { NotificationsDialog } from "./NotificationsDialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const TopBar = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await queryClient.clear();
    toast.success("Вы вышли из аккаунта");
    navigate("/");
  };

  // Счётчик личных уведомлений (приглашения и статусы заявок)
  const { data: notificationsCount } = useQuery({
    queryKey: ["notifications-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // Приглашения в команду
      const { count: invitesCount } = await supabase
        .from("team_invites")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", user.id)
        .eq("status", "pending");
      
      // Измененные статусы заявок (accepted/declined)
      const { count: applicationsCount } = await supabase
        .from("team_applications")
        .select("*", { count: "exact", head: true })
        .eq("from_user_id", user.id)
        .in("status", ["accepted", "declined"]);
      
      return (invitesCount || 0) + (applicationsCount || 0);
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const getUserInitials = () => {
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="w-full h-16 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-end px-6 flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* Token Balance */}
        {user && profile && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-lg shadow-glow-primary">
            <Coins className="h-5 w-5 text-primary-foreground" />
            <span className="font-bold text-primary-foreground">
              {profile.token_balance?.toLocaleString() || 0}
            </span>
          </div>
        )}

        {/* Auth Section */}
        {!user ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Войти
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-gradient-primary shadow-glow-primary hover:shadow-glow-primary hover:scale-105"
              onClick={() => navigate("/signup")}
            >
              Регистрация
            </Button>
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity relative">
                <Avatar className="h-10 w-10 border-2 border-primary shadow-glow-primary cursor-pointer">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                  <AvatarFallback className="bg-gradient-accent text-accent-foreground font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {notificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                    {notificationsCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.username || "Пользователь"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Профиль
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setNotificationsOpen(true)}>
                <Bell className="mr-2 h-4 w-4" />
                Уведомления
                {notificationsCount > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full px-2 py-0.5">
                    {notificationsCount}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile?tab=settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <NotificationsDialog 
        open={notificationsOpen} 
        onOpenChange={setNotificationsOpen} 
      />
    </header>
  );
};

export default TopBar;
