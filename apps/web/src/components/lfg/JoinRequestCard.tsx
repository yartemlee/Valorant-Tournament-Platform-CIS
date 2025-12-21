import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { valorantApi, ValorantAgent } from '@/services/valorantApi';
import { agentProficiencyLevels, roleProficiencyLevels } from '@/constants/proficiency';

// Role display names
const roleDisplayNames: Record<string, string> = {
    duelist: 'Дуэлянт',
    initiator: 'Инициатор',
    controller: 'Специалист',
    sentinel: 'Страж',
};

// Map internal role keys to API role display names (Russian)
const apiRoleMap: Record<string, string> = {
    duelist: 'Дуэлянт',
    initiator: 'Зачинщик',
    controller: 'Специалист',
    sentinel: 'Страж',
};

// Rank colors for badges
const rankColors: Record<string, string> = {
    iron: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    bronze: 'bg-amber-700/20 text-amber-600 border-amber-600/30',
    silver: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
    gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    platinum: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    diamond: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
    ascendant: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    immortal: 'bg-red-500/20 text-red-400 border-red-500/30',
    radiant: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30',
};

interface PlayerRole {
    id: string;
    role: string;
    comfort_level: string;
}

interface PlayerAgent {
    id: string;
    agent_name: string;
    skill_level: string;
}

interface JoinRequestProfile {
    id: string;
    username: string;
    avatar_url?: string | null;
    rank?: string | null;
    player_roles?: PlayerRole[];
    player_agents?: PlayerAgent[];
}

interface JoinRequest {
    id: string;
    lobby_id: string;
    requester_id: string;
    message?: string | null;
    status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
    created_at: string;
    profiles?: JoinRequestProfile;
}

interface JoinRequestCardProps {
    request: JoinRequest;
    onAccept: (requestId: string) => void;
    onReject: (requestId: string) => void;
    isProcessing?: boolean;
}

export function JoinRequestCard({
    request,
    onAccept,
    onReject,
    isProcessing = false,
}: JoinRequestCardProps) {
    const [apiAgents, setApiAgents] = useState<ValorantAgent[]>([]);
    const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});

    const profile = request.profiles;
    const playerAgents = profile?.player_agents || [];
    const playerRoles = profile?.player_roles || [];

    useEffect(() => {
        const loadData = async () => {
            const fetchedAgents = await valorantApi.getAgents();
            setApiAgents(fetchedAgents);

            // Extract role icons
            const icons: Record<string, string> = {};
            Object.entries(apiRoleMap).forEach(([key, apiName]) => {
                const agent = fetchedAgents.find((a) => a.role?.displayName === apiName);
                if (agent?.role?.displayIcon) {
                    icons[key] = agent.role.displayIcon;
                }
            });
            setRoleIcons(icons);
        };
        loadData();
    }, []);

    // Get agent icon from API
    const getAgentIcon = (agentName: string): string | undefined => {
        const agent = apiAgents.find((a) => a.displayName === agentName);
        return agent?.displayIcon;
    };

    // Get rank tier from rank value
    const getRankTier = (rank: string | null): string => {
        if (!rank) return '';
        const tier = rank.split('_')[0].split(' ')[0].toLowerCase();
        return tier;
    };

    // Get border color based on agent skill level
    const getAgentBorderClass = (skillLevel: string): string => {
        switch (skillLevel) {
            case 'main':
                return 'ring-2 ring-purple-500 ring-offset-1 ring-offset-background';
            case 'comfortable':
                return 'ring-2 ring-green-500 ring-offset-1 ring-offset-background';
            default:
                return 'ring-1 ring-border';
        }
    };

    // Get role proficiency label and color
    const getRoleProficiency = (comfortLevel: string) => {
        const level = roleProficiencyLevels.find((l) => l.value === comfortLevel);
        return level || { label: comfortLevel, color: 'text-muted-foreground' };
    };

    // Get agent proficiency label and color
    const getAgentProficiency = (skillLevel: string) => {
        const level = agentProficiencyLevels.find((l) => l.value === skillLevel);
        return level || { label: skillLevel, color: 'text-muted-foreground' };
    };

    if (!profile) return null;

    return (
        <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-glow-primary transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardContent className="relative p-4 sm:p-5">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Left: Avatar + Basic Info */}
                    <div className="flex items-center gap-4 lg:w-56 shrink-0">
                        <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-lg ring-2 ring-background">
                            <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                                {profile.username?.slice(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-display font-semibold text-lg truncate">
                                {profile.username}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {profile.rank && (
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-xs font-medium',
                                            rankColors[getRankTier(profile.rank)] || 'bg-muted'
                                        )}
                                    >
                                        {profile.rank}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Middle: Roles + Agents + Message */}
                    <div className="flex-1 space-y-3 min-w-0">
                        <TooltipProvider delayDuration={0}>
                            {/* Roles */}
                            {playerRoles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {playerRoles
                                        .filter((r) => r.comfort_level !== 'not_played')
                                        .map((role) => {
                                            const proficiency = getRoleProficiency(role.comfort_level);
                                            const iconUrl = roleIcons[role.role];
                                            return (
                                                <Tooltip key={role.id}>
                                                    <TooltipTrigger asChild>
                                                        <div className="cursor-help">
                                                            <Badge
                                                                variant="secondary"
                                                                className={cn(
                                                                    'text-xs flex items-center gap-1.5 px-2.5 py-1',
                                                                    role.comfort_level === 'perfect' &&
                                                                    'bg-purple-500/20 text-purple-400 border-purple-500/30',
                                                                    role.comfort_level === 'good' &&
                                                                    'bg-green-500/20 text-green-400 border-green-500/30',
                                                                    role.comfort_level === 'learning' &&
                                                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                                )}
                                                            >
                                                                {iconUrl && (
                                                                    <img
                                                                        src={iconUrl}
                                                                        alt=""
                                                                        className="h-3.5 w-3.5 object-contain"
                                                                    />
                                                                )}
                                                                {roleDisplayNames[role.role] || role.role}
                                                            </Badge>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom">
                                                        <p className="text-xs font-medium">
                                                            {roleDisplayNames[role.role]}
                                                            <span className={proficiency.color}>
                                                                {' – '}
                                                                {proficiency.label}
                                                            </span>
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                </div>
                            )}

                            {/* Agents */}
                            {playerAgents.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {playerAgents
                                        .filter((a) => a.skill_level !== 'not_played')
                                        .sort((a, b) => {
                                            const order = { main: 0, comfortable: 1, not_played: 2 };
                                            return (
                                                (order[a.skill_level as keyof typeof order] ?? 2) -
                                                (order[b.skill_level as keyof typeof order] ?? 2)
                                            );
                                        })
                                        .map((agent) => {
                                            const icon = getAgentIcon(agent.agent_name);
                                            if (!icon) return null;
                                            const proficiency = getAgentProficiency(agent.skill_level);
                                            return (
                                                <Tooltip key={agent.id}>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={cn(
                                                                'relative w-8 h-8 rounded-lg overflow-hidden bg-muted cursor-default',
                                                                'transition-all duration-200 hover:scale-110 hover:z-10',
                                                                getAgentBorderClass(agent.skill_level)
                                                            )}
                                                        >
                                                            <img
                                                                src={icon}
                                                                alt={agent.agent_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom">
                                                        <p className="text-xs font-medium">
                                                            {agent.agent_name}
                                                            <span className={proficiency.color}>
                                                                {' – '}
                                                                {proficiency.label}
                                                            </span>
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                </div>
                            )}
                        </TooltipProvider>

                        {/* Message */}
                        {request.message && (
                            <p className="text-sm text-muted-foreground leading-relaxed italic">
                                "{request.message}"
                            </p>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex lg:flex-col gap-2 lg:w-36 shrink-0 lg:items-end">
                        <Button
                            size="sm"
                            className="flex-1 lg:flex-none lg:w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-lg hover:shadow-green-500/25 transition-all"
                            onClick={() => onAccept(request.id)}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Check className="h-4 w-4 mr-2" />
                            )}
                            Принять
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 lg:flex-none lg:w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
                            onClick={() => onReject(request.id)}
                            disabled={isProcessing}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Отклонить
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
