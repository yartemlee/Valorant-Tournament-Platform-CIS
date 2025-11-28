import { TeamWithMembers } from '@/types/common.types';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings, UserPlus, Users, Calendar } from "lucide-react";
import { LeaveTeamButton } from "./LeaveTeamButton";
import { PhantomPlayersControls } from "./PhantomPlayersControls";

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
  onPhantomUpdate?: () => void;
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
  onPhantomUpdate,
}: TeamHeroSectionProps) {
  const isFull = memberCount >= 10;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-background via-background to-primary/5 p-8">
      {/* Неоновый эффект */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
      
      <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        {/* Левая часть: лого + инфо */}
        <div className="flex gap-6 items-start">
          {/* Логотип */}
          {team.logo_url ? (
            <img
              src={team.logo_url}
              alt={team.name}
              className="h-24 w-24 rounded-xl object-cover border-2 border-primary/30 shadow-lg"
            />
          ) : (
            <div className="h-24 w-24 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30 shadow-lg">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          )}

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
      
      {/* Phantom Players Controls for Captain */}
      {isCaptain && onPhantomUpdate && (
        <div className="mt-6 pt-6 border-t border-border relative z-10">
          <p className="text-sm text-muted-foreground mb-3">
            Инструменты для тестирования состава
          </p>
          <PhantomPlayersControls 
            teamId={team.id} 
            onUpdate={onPhantomUpdate}
          />
        </div>
      )}
    </div>
  );
}
