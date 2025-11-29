import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Shield as ShieldIcon, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Profile, TeamMember } from "@/types/common.types";

interface TeamMemberWithProfile extends TeamMember {
  profiles: Profile | null;
}

interface TeamRosterSectionProps {
  members: TeamMemberWithProfile[];
  memberCount: number;
}

export function TeamRosterSection({ members, memberCount }: TeamRosterSectionProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Состав команды ({memberCount}/10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Участники */}
          {(members || []).map((member) => (
            <div
              key={member.id}
              className="group relative p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary hover:border-primary/30 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/profile/${member.profiles?.username || member.user_id}`)}
            >
              <div className="flex items-center gap-3">
                {/* Аватар */}
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={member.profiles?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {member.profiles?.username?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">
                      {member.profiles?.username || "Игрок"}
                    </p>
                    {/* Индикатор Riot ID */}
                    {member.profiles?.riot_id ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                  </div>

                  {member.profiles?.riot_id && (
                    <p className="text-sm text-muted-foreground truncate">
                      {member.profiles.riot_id}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    В команде с {new Date(member.joined_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                {/* Роль */}
                <Badge
                  variant={member.role === "captain" ? "default" : "secondary"}
                  className={
                    member.role === "captain"
                      ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30"
                      : member.role === "coach"
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border-blue-500/30"
                        : ""
                  }
                >
                  {member.role === "captain" ? (
                    <>
                      <Crown className="h-3 w-3 mr-1" />
                      Капитан
                    </>
                  ) : member.role === "coach" ? (
                    <>
                      <ShieldIcon className="h-3 w-3 mr-1" />
                      Тренер
                    </>
                  ) : (
                    "Игрок"
                  )}
                </Badge>
              </div>

              {/* Hover эффект */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>

        {(!members || members.length === 0) && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              В команде пока нет участников
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Капитан может пригласить игроков
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
