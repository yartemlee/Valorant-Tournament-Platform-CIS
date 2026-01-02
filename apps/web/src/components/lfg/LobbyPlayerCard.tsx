import { Crown } from 'lucide-react';
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
    'Iron': 'from-zinc-600/60',
    'Bronze': 'from-amber-800/60',
    'Silver': 'from-slate-400/60',
    'Gold': 'from-yellow-500/60',
    'Platinum': 'from-cyan-400/60',
    'Diamond': 'from-purple-400/60',
    'Ascendant': 'from-emerald-400/60',
    'Immortal': 'from-red-500/60',
    'Radiant': 'from-yellow-300/60',
};

function getRankTier(rank: string | null): string {
    if (!rank) return 'from-zinc-600/60';
    const tier = rank.split(' ')[0];
    return RANK_COLORS[tier] || 'from-zinc-600/60';
}

export function LobbyPlayerCard({ member, isOwner }: LobbyPlayerCardProps) {
    const { isOnline, isValorantRunning, valorantStatus } = useUserDesktopStatus(
        member.user_id
    );

    const profile = member.profiles;
    const rankColor = getRankTier(profile?.rank ?? null);

    const getStatusInfo = () => {
        if (!isOnline) return { text: 'Оффлайн', color: 'bg-gray-500', borderColor: 'border-border' };
        if (member.party_joined) return { text: 'В лобби', color: 'bg-green-500', borderColor: 'border-green-500/50' };
        if (valorantStatus === 'in_game') return { text: 'В игре', color: 'bg-yellow-500', borderColor: 'border-yellow-500/50' };
        if (valorantStatus === 'in_pregame') return { text: 'Выбор агента', color: 'bg-orange-500', borderColor: 'border-orange-500/50' };
        if (isValorantRunning) return { text: 'В меню', color: 'bg-green-400', borderColor: 'border-green-400/50' };
        return { text: 'Онлайн', color: 'bg-yellow-500', borderColor: 'border-yellow-500/50' };
    };

    const status = getStatusInfo();

    // Default avatar placeholder
    const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || 'U'}&backgroundColor=1a1a2e`;

    return (
        <div
            className={cn(
                'relative aspect-[3/4] rounded-xl overflow-hidden',
                'border',
                status.borderColor,
                'bg-card',
                'transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
                'group cursor-default'
            )}
        >
            {/* Avatar as full background */}
            <div className="absolute inset-0">
                <img
                    src={avatarUrl}
                    alt={profile?.username || 'Player'}
                    className="w-full h-full object-cover"
                />
                {/* Gradient overlays */}
                <div className={cn(
                    'absolute inset-0 bg-gradient-to-t',
                    rankColor,
                    'via-transparent to-transparent'
                )} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>

            {/* Owner crown */}
            {isOwner && (
                <div className="absolute top-2 left-2 z-10">
                    <div className="p-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/40 backdrop-blur-sm">
                        <Crown className="h-4 w-4 text-yellow-400" />
                    </div>
                </div>
            )}

            {/* Status indicator (top right) */}
            <div className="absolute top-2 right-2 z-10">
                <span className={cn('h-3 w-3 rounded-full inline-block ring-2 ring-black/50', status.color)} />
            </div>

            {/* Bottom content */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
                {/* Player name */}
                <p className="text-base font-bold text-white truncate">
                    {profile?.username || 'Пользователь'}
                </p>
                {/* Rank */}
                {profile?.rank && (
                    <p className="text-sm text-gray-300 mt-0.5">
                        {profile.rank}
                    </p>
                )}

                {/* Status bar */}
                <div className={cn(
                    'mt-2 py-1.5 px-2 rounded-md text-center text-xs font-medium uppercase tracking-wider',
                    'flex items-center justify-center gap-1.5',
                    status.color === 'bg-green-500' ? 'bg-green-500/20 text-green-400' :
                        status.color === 'bg-yellow-500' ? 'bg-yellow-500/20 text-yellow-400' :
                            status.color === 'bg-orange-500' ? 'bg-orange-500/20 text-orange-400' :
                                status.color === 'bg-green-400' ? 'bg-green-400/20 text-green-300' :
                                    'bg-muted text-muted-foreground'
                )}>
                    <span className={cn('inline-block h-1.5 w-1.5 rounded-full', status.color)} />
                    {status.text}
                </div>
            </div>
        </div>
    );
}
