import { Crown, Monitor, Gamepad2, UserMinus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserDesktopStatus } from '@/hooks/useDesktopStatus';
import { cn } from '@/lib/utils';

interface MemberProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  valorant_rank: string | null;
}

interface LobbyMember {
  id: string;
  user_id: string;
  role: string;
  party_joined: boolean | null;
  profiles: MemberProfile | null;
}

interface LobbyMembersProps {
  members: LobbyMember[];
  ownerId: string;
  isOwner: boolean;
  partyCode: string | null;
  onKick?: (userId: string) => void;
}

export function LobbyMembers({
  members,
  ownerId,
  isOwner,
  partyCode,
  onKick,
}: LobbyMembersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Участники ({members.length})</span>
          {partyCode && (
            <Badge variant="outline" className="font-mono">
              {partyCode}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isOwner={member.user_id === ownerId}
            canKick={isOwner && member.user_id !== ownerId}
            onKick={onKick}
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface MemberCardProps {
  member: LobbyMember;
  isOwner: boolean;
  canKick: boolean;
  onKick?: (userId: string) => void;
}

function MemberCard({ member, isOwner, canKick, onKick }: MemberCardProps) {
  const { isOnline, isValorantRunning, valorantStatus } = useUserDesktopStatus(
    member.user_id
  );

  const profile = member.profiles;

  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-400';
    if (valorantStatus === 'in_game' || valorantStatus === 'in_pregame')
      return 'bg-red-500';
    if (isValorantRunning) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (valorantStatus === 'in_game') return 'В игре';
    if (valorantStatus === 'in_pregame') return 'Выбор агентов';
    if (isValorantRunning) return 'В меню';
    return 'Online';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-colors',
        'hover:bg-muted/50'
      )}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback>
            {profile?.username?.charAt(0).toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background',
            getStatusColor()
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {profile?.username || 'Пользователь'}
          </span>
          {isOwner && (
            <Crown className="h-4 w-4 text-yellow-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {profile?.valorant_rank && (
            <span>{profile.valorant_rank}</span>
          )}
          <span className="flex items-center gap-1">
            {isValorantRunning ? (
              <Gamepad2 className="h-3 w-3" />
            ) : isOnline ? (
              <Monitor className="h-3 w-3" />
            ) : null}
            {getStatusText()}
          </span>
        </div>
      </div>

      {member.party_joined && (
        <Badge variant="secondary" className="shrink-0">
          В party
        </Badge>
      )}

      {canKick && onKick && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onKick(member.user_id)}
        >
          <UserMinus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
