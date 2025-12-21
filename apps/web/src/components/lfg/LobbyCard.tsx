import { Users, Gamepad2, MapPin, Lock, Mic } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { LFGLobbyWithMembers } from '@/hooks/useLFGLobbies';

interface LobbyCardProps {
  lobby: LFGLobbyWithMembers;
  onJoin: (lobbyId: string) => void;
  onView: (lobbyId: string) => void;
  onRequestJoin?: (lobbyId: string) => void;
  isJoining?: boolean;
  isRequesting?: boolean;
  hasRequestPending?: boolean;
  isMyLobby?: boolean;
}

const GAME_MODE_LABELS: Record<string, string> = {
  competitive: 'Рейтинговый',
  unrated: 'Обычный',
  spike_rush: 'Spike Rush',
  deathmatch: 'Deathmatch',
  swiftplay: 'Swiftplay',
  custom: 'Кастом',
};

const REGION_LABELS: Record<string, string> = {
  eu: 'Европа',
  na: 'Северная Америка',
  kr: 'Корея',
  ap: 'Азия',
  latam: 'Латинская Америка',
  br: 'Бразилия',
};

export function LobbyCard({ lobby, onJoin, onView, onRequestJoin, isJoining, isRequesting, hasRequestPending, isMyLobby }: LobbyCardProps) {
  const isFull = lobby.current_size >= lobby.max_size;
  const slots = `${lobby.current_size}/${lobby.max_size}`;
  const ownerProfile = lobby.owner_profile;
  const isPrivate = lobby.is_private;

  const getJoinButtonText = () => {
    if (isJoining) return 'Вступаем...';
    if (isRequesting) return 'Отправка...';
    if (hasRequestPending) return 'Заявка отправлена';
    if (isFull) return 'Лобби полное';
    if (isPrivate) return 'Подать заявку';
    return 'Вступить';
  };

  const handleJoinClick = () => {
    if (isPrivate && onRequestJoin) {
      onRequestJoin(lobby.id);
    } else {
      onJoin(lobby.id);
    }
  };

  return (
    <Card
      className={cn(
        'group transition-all hover:border-primary/50',
        isMyLobby && 'border-primary bg-primary/5'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate">{lobby.title}</h3>
              {lobby.is_private && (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
            {ownerProfile && (
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={ownerProfile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {ownerProfile.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground truncate">
                  {ownerProfile.username}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span
              className={cn(
                'text-sm font-medium',
                isFull ? 'text-orange-500' : 'text-green-500'
              )}
            >
              {slots}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-2">
        {lobby.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 break-words">
            {lobby.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <Gamepad2 className="h-3 w-3" />
            {GAME_MODE_LABELS[lobby.game_mode] || lobby.game_mode}
          </Badge>

          {lobby.region && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {REGION_LABELS[lobby.region] || lobby.region}
            </Badge>
          )}

          {lobby.voice_required && (
            <Badge variant="outline" className="gap-1">
              <Mic className="h-3 w-3" />
              Голосовой чат
            </Badge>
          )}

          {lobby.min_rank && (
            <Badge variant="outline">
              {lobby.min_rank}
              {lobby.max_rank && lobby.max_rank !== lobby.min_rank
                ? ` - ${lobby.max_rank}`
                : '+'}
            </Badge>
          )}
        </div>

        {/* Members preview */}
        {lobby.lfg_lobby_members && lobby.lfg_lobby_members.length > 0 && (
          <div className="flex items-center gap-1 mt-3">
            <div className="flex -space-x-2">
              {lobby.lfg_lobby_members.slice(0, 5).map((member) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={member.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {member.profiles?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {lobby.lfg_lobby_members.length > 5 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{lobby.lfg_lobby_members.length - 5}
              </span>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        {isMyLobby ? (
          <Button className="w-full" onClick={() => onView(lobby.id)}>
            Открыть лобби
          </Button>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onView(lobby.id)}
            >
              Подробнее
            </Button>
            <Button
              className="flex-1"
              disabled={isFull || isJoining || isRequesting || hasRequestPending}
              onClick={handleJoinClick}
              variant={isPrivate ? 'secondary' : 'default'}
            >
              {getJoinButtonText()}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
