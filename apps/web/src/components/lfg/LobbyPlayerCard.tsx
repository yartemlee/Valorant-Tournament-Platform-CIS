import { Crown, Monitor, Gamepad2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserDesktopStatus } from '@/hooks/useDesktopStatus';
import { cn } from '@/lib/utils';

interface MemberProfile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    rank: string | null;
}

interface LobbyMember {
    id: string;
    user_id: string;
    role: string;
    party_joined: boolean | null;
    profiles: MemberProfile | null;
}

interface LobbyPlayerCardProps {
    member: LobbyMember;
    isOwner: boolean;
}

// Map rank names to tier colors for the glow effect
const RANK_COLORS: Record<string, string> = {
    'Iron': 'from-zinc-600/40',
    'Bronze': 'from-amber-800/40',
    'Silver': 'from-slate-400/40',
    'Gold': 'from-yellow-500/40',
    'Platinum': 'from-cyan-400/40',
    'Diamond': 'from-purple-400/40',
    'Ascendant': 'from-emerald-400/40',
    'Immortal': 'from-red-500/40',
    'Radiant': 'from-yellow-300/40',
};

function getRankTier(rank: string | null): string {
    if (!rank) return 'from-zinc-600/40';
    const tier = rank.split(' ')[0];
    return RANK_COLORS[tier] || 'from-zinc-600/40';
}

export function LobbyPlayerCard({ member, isOwner }: LobbyPlayerCardProps) {
    const { isOnline, isValorantRunning, valorantStatus } = useUserDesktopStatus(
        member.user_id
    );

    const profile = member.profiles;
    const rankColor = getRankTier(profile?.rank);

    const getStatusInfo = () => {
        if (!isOnline) return { text: 'Offline', color: 'bg-gray-500', icon: null };
        if (member.party_joined) return { text: 'В лобби', color: 'bg-primary', icon: Users };
        if (valorantStatus === 'in_game') return { text: 'В матче', color: 'bg-red-500', icon: Gamepad2 };
        if (valorantStatus === 'in_pregame') return { text: 'Выбор агентов', color: 'bg-orange-500', icon: Gamepad2 };
        if (isValorantRunning) return { text: 'В меню', color: 'bg-green-500', icon: Gamepad2 };
        return { text: 'Online', color: 'bg-yellow-500', icon: Monitor };
    };

    const status = getStatusInfo();
    const StatusIcon = status.icon;

    // Default avatar placeholder
    const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'U'}&backgroundColor=1a1a2e`;

    return (
        <div
            className={cn(
                'relative w-[140px] h-[180px] rounded-xl overflow-hidden',
                'border border-border/50 bg-card/50',
                'transition-all duration-300 hover:scale-105 hover:shadow-glow-primary',
                'group cursor-default'
            )}
        >
            {/* Avatar as background banner */}
            <div className="absolute inset-0">
                <img
                    src={avatarUrl}
                    alt={profile?.username || 'Player'}
                    className="w-full h-full object-cover"
                />
                {/* Gradient fade to bottom */}
                <div className={cn(
                    'absolute inset-0 bg-gradient-to-t',
                    rankColor,
                    'via-transparent to-transparent'
                )} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Owner crown */}
            {isOwner && (
                <div className="absolute top-2 left-2 z-10">
                    <div className="p-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                        <Crown className="h-3 w-3 text-yellow-400" />
                    </div>
                </div>
            )}

            {/* Status indicator */}
            <div className="absolute top-2 right-2 z-10">
                <div className={cn(
                    'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
                    'bg-black/60 backdrop-blur-sm border border-white/10',
                    'text-white'
                )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', status.color)} />
                    {StatusIcon && <StatusIcon className="h-2.5 w-2.5" />}
                </div>
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                {/* Player name */}
                <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                    {profile?.username || 'Пользователь'}
                </p>

                {/* Rank badge */}
                {profile?.rank && (
                    <Badge
                        variant="secondary"
                        className="mt-1 text-[10px] px-1.5 py-0 bg-black/50 border-white/10 text-white/90"
                    >
                        {profile.rank}
                    </Badge>
                )}
            </div>

            {/* Party joined indicator */}
            {member.party_joined && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
            )}
        </div>
    );
}
