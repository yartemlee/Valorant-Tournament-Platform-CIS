import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, UserPlus, UserMinus, Trophy, Target, Settings, Crown, Shield, Image as ImageIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

interface TeamActivitySectionProps {
  teamId: string;
}

export function TeamActivitySection({ teamId }: TeamActivitySectionProps) {
  const queryClient = useQueryClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["team-activity", teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_activity_logs")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`team-activity-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_activity_logs",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["team-activity", teamId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, queryClient]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "member_joined":
        return <UserPlus className="h-4 w-4 text-green-400" />;
      case "member_left":
      case "member_kicked":
        return <UserMinus className="h-4 w-4 text-orange-400" />;
      case "tournament_joined":
        return <Target className="h-4 w-4 text-blue-400" />;
      case "tournament_won":
        return <Trophy className="h-4 w-4 text-yellow-400" />;
      case "role_updated":
        return <Shield className="h-4 w-4 text-purple-400" />;
      case "captain_transferred":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "team_updated":
        return <Settings className="h-4 w-4 text-gray-400" />;
      case "logo_updated":
        return <ImageIcon className="h-4 w-4 text-pink-400" />;
      default:
        return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Активность
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="mt-0.5 p-2 rounded-lg bg-background border border-border">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Здесь будут отображаться события вашей команды
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Добавления участников, участие в турнирах и победы
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
