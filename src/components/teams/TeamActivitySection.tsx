import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, UserPlus, UserMinus, Trophy, Target } from "lucide-react";

interface TeamActivitySectionProps {
  teamId: string;
}

export function TeamActivitySection({ teamId }: TeamActivitySectionProps) {
  // TODO: В будущем подключить реальные события из БД
  const activities: any[] = [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "member_joined":
        return <UserPlus className="h-4 w-4 text-green-400" />;
      case "member_left":
        return <UserMinus className="h-4 w-4 text-orange-400" />;
      case "tournament_joined":
        return <Target className="h-4 w-4 text-blue-400" />;
      case "tournament_won":
        return <Trophy className="h-4 w-4 text-yellow-400" />;
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
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="mt-0.5 p-2 rounded-lg bg-background border border-border">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.createdAt).toLocaleDateString('ru-RU', {
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
