import { FreeAgentCardWithProfile } from '@/types/common.types';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { valorantApi, ValorantAgent } from "@/services/valorantApi";
import { cn } from "@/lib/utils";
import { MapPin, User, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { agentProficiencyLevels, roleProficiencyLevels } from "@/constants/proficiency";

// Rank display mapping
const rankDisplayNames: Record<string, string> = {
    iron_1: "Iron 1", iron_2: "Iron 2", iron_3: "Iron 3",
    bronze_1: "Bronze 1", bronze_2: "Bronze 2", bronze_3: "Bronze 3",
    silver_1: "Silver 1", silver_2: "Silver 2", silver_3: "Silver 3",
    gold_1: "Gold 1", gold_2: "Gold 2", gold_3: "Gold 3",
    platinum_1: "Platinum 1", platinum_2: "Platinum 2", platinum_3: "Platinum 3",
    diamond_1: "Diamond 1", diamond_2: "Diamond 2", diamond_3: "Diamond 3",
    ascendant_1: "Ascendant 1", ascendant_2: "Ascendant 2", ascendant_3: "Ascendant 3",
    immortal_1: "Immortal 1", immortal_2: "Immortal 2", immortal_3: "Immortal 3",
    radiant: "Radiant",
};

// Rank colors for badges
const rankColors: Record<string, string> = {
    iron: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    bronze: "bg-amber-700/20 text-amber-600 border-amber-600/30",
    silver: "bg-slate-400/20 text-slate-300 border-slate-400/30",
    gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    platinum: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    diamond: "bg-purple-400/20 text-purple-300 border-purple-400/30",
    ascendant: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    immortal: "bg-red-500/20 text-red-400 border-red-500/30",
    radiant: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border-yellow-500/30",
};

// Role display names
const roleDisplayNames: Record<string, string> = {
    duelist: "Дуэлянт",
    initiator: "Инициатор",
    controller: "Специалист",
    sentinel: "Страж",
};

// Map internal role keys to API role display names (Russian)
const apiRoleMap: Record<string, string> = {
    duelist: "Дуэлянт",
    initiator: "Зачинщик",
    controller: "Специалист",
    sentinel: "Страж"
};

export type ViewMode = "grid" | "list";

interface FreeAgentCardProps {
    card: FreeAgentCardWithProfile;
    isOwnCard?: boolean;
    viewMode?: ViewMode;
    canInvite?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onInvite?: (player: { id: string; username: string; avatar_url?: string | null; rank?: string | null }) => void;
}

export function FreeAgentCard({ card, isOwnCard = false, viewMode = "grid", canInvite = false, onEdit, onDelete, onInvite }: FreeAgentCardProps) {
    const navigate = useNavigate();
    const [apiAgents, setApiAgents] = useState<ValorantAgent[]>([]);
    const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});
    const [isExpanded, setIsExpanded] = useState(viewMode === "list");

    useEffect(() => {
        const loadData = async () => {
            const fetchedAgents = await valorantApi.getAgents();
            setApiAgents(fetchedAgents);

            // Extract role icons
            const icons: Record<string, string> = {};
            Object.entries(apiRoleMap).forEach(([key, apiName]) => {
                const agent = fetchedAgents.find(a => a.role?.displayName === apiName);
                if (agent?.role?.displayIcon) {
                    icons[key] = agent.role.displayIcon;
                }
            });
            setRoleIcons(icons);
        };
        loadData();
    }, []);

    // Update expanded state when viewMode changes
    useEffect(() => {
        setIsExpanded(viewMode === "list");
    }, [viewMode]);

    const profile = card.profiles;
    const playerAgents = card.player_agents || [];
    const playerRoles = card.player_roles || [];

    // Get agent icon from API
    const getAgentIcon = (agentName: string): string | undefined => {
        const agent = apiAgents.find(a => a.displayName === agentName);
        return agent?.displayIcon;
    };

    // Get rank tier from rank value
    const getRankTier = (rank: string | null): string => {
        if (!rank) return "";
        const tier = rank.split("_")[0];
        return tier;
    };

    // Get border color based on agent skill level
    const getAgentBorderClass = (skillLevel: string): string => {
        switch (skillLevel) {
            case "main":
                return "ring-2 ring-purple-500 ring-offset-1 ring-offset-background";
            case "comfortable":
                return "ring-2 ring-green-500 ring-offset-1 ring-offset-background";
            default:
                return "ring-1 ring-border";
        }
    };

    // Get role proficiency label and color
    const getRoleProficiency = (comfortLevel: string) => {
        const level = roleProficiencyLevels.find(l => l.value === comfortLevel);
        return level || { label: comfortLevel, color: "text-muted-foreground" };
    };

    // Get agent proficiency label and color
    const getAgentProficiency = (skillLevel: string) => {
        const level = agentProficiencyLevels.find(l => l.value === skillLevel);
        return level || { label: skillLevel, color: "text-muted-foreground" };
    };

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (viewMode === "grid") {
            setIsExpanded(!isExpanded);
        }
    };

    // List view - full width card
    if (viewMode === "list") {
        return (
            <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-glow-primary transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardContent className="relative p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                        {/* Left: Avatar + Basic Info */}
                        <div className="flex items-center gap-4 lg:w-56 shrink-0">
                            <Avatar
                                className="h-14 w-14 border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-all shadow-lg ring-2 ring-background"
                                onClick={() => navigate(`/profile/${profile.username}`)}
                            >
                                <AvatarImage src={profile.avatar_url || ""} alt={profile.username} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                                    {profile.username?.slice(0, 2).toUpperCase() || "??"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <h3
                                    className="font-display font-semibold text-lg truncate cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => navigate(`/profile/${profile.username}`)}
                                >
                                    {profile.username}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {profile.rank && (
                                        <Badge
                                            variant="outline"
                                            className={cn("text-xs font-medium", rankColors[getRankTier(profile.rank)] || "bg-muted")}
                                        >
                                            {rankDisplayNames[profile.rank] || profile.rank}
                                        </Badge>
                                    )}
                                    {profile.country && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {profile.country}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Middle: Roles + Agents + Intro */}
                        <div className="flex-1 space-y-3 min-w-0">
                            <TooltipProvider delayDuration={0}>
                                {/* Roles */}
                                {playerRoles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {playerRoles
                                            .filter(r => r.comfort_level !== "not_played")
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
                                                                        "text-xs flex items-center gap-1.5 px-2.5 py-1",
                                                                        role.comfort_level === "perfect" && "bg-purple-500/20 text-purple-400 border-purple-500/30",
                                                                        role.comfort_level === "good" && "bg-green-500/20 text-green-400 border-green-500/30",
                                                                        role.comfort_level === "learning" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                                    )}
                                                                >
                                                                    {iconUrl && <img src={iconUrl} alt="" className="h-3.5 w-3.5 object-contain" />}
                                                                    {roleDisplayNames[role.role] || role.role}
                                                                </Badge>
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p className="text-xs font-medium">
                                                                {roleDisplayNames[role.role]}
                                                                <span className={proficiency.color}>{" – "}{proficiency.label}</span>
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
                                            .filter(a => a.skill_level !== "not_played")
                                            .sort((a, b) => {
                                                const order = { main: 0, comfortable: 1, not_played: 2 };
                                                return (order[a.skill_level as keyof typeof order] ?? 2) - (order[b.skill_level as keyof typeof order] ?? 2);
                                            })
                                            .map((agent) => {
                                                const icon = getAgentIcon(agent.agent_name);
                                                if (!icon) return null;
                                                const proficiency = getAgentProficiency(agent.skill_level);
                                                return (
                                                    <Tooltip key={agent.id}>
                                                        <TooltipTrigger asChild>
                                                            <div className={cn(
                                                                "relative w-8 h-8 rounded-lg overflow-hidden bg-muted cursor-default",
                                                                "transition-all duration-200 hover:scale-110 hover:z-10",
                                                                getAgentBorderClass(agent.skill_level)
                                                            )}>
                                                                <img src={icon} alt={agent.agent_name} className="w-full h-full object-cover" />
                                                            </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p className="text-xs font-medium">
                                                                {agent.agent_name}
                                                                <span className={proficiency.color}>{" – "}{proficiency.label}</span>
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            })}
                                    </div>
                                )}
                            </TooltipProvider>

                            {/* Intro */}
                            {card.intro && (
                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                    {card.intro}
                                </p>
                            )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex lg:flex-col gap-2 lg:w-36 shrink-0 lg:items-end">
                            {isOwnCard ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 lg:flex-none lg:w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                                        onClick={onEdit}
                                    >
                                        Редактировать
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={onDelete}
                                    >
                                        Удалить
                                    </Button>
                                </>
                            ) : (
                                <div className="flex lg:flex-col gap-2 w-full">
                                    {canInvite && onInvite && (
                                        <Button
                                            size="sm"
                                            className="flex-1 lg:flex-none lg:w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/25 transition-all"
                                            onClick={() => onInvite({
                                                id: profile.id,
                                                username: profile.username,
                                                avatar_url: profile.avatar_url,
                                                rank: profile.rank,
                                            })}
                                        >
                                            <UserPlus className="h-4 w-4 mr-2" />
                                            Пригласить
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 lg:flex-none lg:w-full border-border/50 hover:border-primary/40 hover:bg-primary/5"
                                        onClick={() => navigate(`/profile/${profile.username}`)}
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        Профиль
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Grid view - compact expandable card
    return (
        <Card className="group relative overflow-hidden bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-glow-primary transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardContent className="relative p-4 space-y-3">
                {/* Header: Avatar + Name + Expand button */}
                <div className="flex items-center gap-3">
                    <Avatar
                        className="h-10 w-10 border-2 border-border cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => navigate(`/profile/${profile.username}`)}
                    >
                        <AvatarImage src={profile.avatar_url || ""} alt={profile.username} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                            {profile.username?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <h3
                            className="font-display font-semibold text-sm truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => navigate(`/profile/${profile.username}`)}
                        >
                            {profile.username}
                        </h3>
                        <div className="flex items-center gap-1.5">
                            {profile.rank && (
                                <Badge
                                    variant="outline"
                                    className={cn("text-[10px] font-medium px-1.5 py-0", rankColors[getRankTier(profile.rank)] || "bg-muted")}
                                >
                                    {rankDisplayNames[profile.rank] || profile.rank}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={toggleExpand}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Intro - always visible */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {card.intro}
                </p>

                {/* Expanded content */}
                {isExpanded && (
                    <div className="space-y-3 pt-2 border-t border-border/50 animate-fade-in-up">
                        <TooltipProvider delayDuration={0}>
                            {/* Roles */}
                            {playerRoles.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {playerRoles
                                        .filter(r => r.comfort_level !== "not_played")
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
                                                                    "text-[10px] flex items-center gap-1",
                                                                    role.comfort_level === "perfect" && "bg-purple-500/20 text-purple-400 border-purple-500/30",
                                                                    role.comfort_level === "good" && "bg-green-500/20 text-green-400 border-green-500/30",
                                                                    role.comfort_level === "learning" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                                )}
                                                            >
                                                                {iconUrl && <img src={iconUrl} alt="" className="h-3 w-3 object-contain" />}
                                                                {roleDisplayNames[role.role] || role.role}
                                                            </Badge>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom">
                                                        <p className="text-xs font-medium">
                                                            {roleDisplayNames[role.role]}
                                                            <span className={proficiency.color}>{" – "}{proficiency.label}</span>
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
                                        .filter(a => a.skill_level !== "not_played")
                                        .sort((a, b) => {
                                            const order = { main: 0, comfortable: 1, not_played: 2 };
                                            return (order[a.skill_level as keyof typeof order] ?? 2) - (order[b.skill_level as keyof typeof order] ?? 2);
                                        })
                                        .map((agent) => {
                                            const icon = getAgentIcon(agent.agent_name);
                                            if (!icon) return null;
                                            const proficiency = getAgentProficiency(agent.skill_level);
                                            return (
                                                <Tooltip key={agent.id}>
                                                    <TooltipTrigger asChild>
                                                        <div className={cn(
                                                            "relative w-7 h-7 rounded overflow-hidden bg-muted cursor-default",
                                                            "transition-all duration-200 hover:scale-110 hover:z-10",
                                                            getAgentBorderClass(agent.skill_level)
                                                        )}>
                                                            <img src={icon} alt={agent.agent_name} className="w-full h-full object-cover" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom">
                                                        <p className="text-xs font-medium">
                                                            {agent.agent_name}
                                                            <span className={proficiency.color}>{" – "}{proficiency.label}</span>
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                </div>
                            )}
                        </TooltipProvider>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            {isOwnCard ? (
                                <>
                                    <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={onEdit}>
                                        Редактировать
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={onDelete}
                                    >
                                        Удалить
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {canInvite && onInvite && (
                                        <Button
                                            size="sm"
                                            className="flex-1 h-7 text-xs"
                                            onClick={() => onInvite({
                                                id: profile.id,
                                                username: profile.username,
                                                avatar_url: profile.avatar_url,
                                                rank: profile.rank,
                                            })}
                                        >
                                            <UserPlus className="h-3 w-3 mr-1" />
                                            Пригласить
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn("h-7 text-xs", canInvite ? "flex-1" : "w-full")}
                                        onClick={() => navigate(`/profile/${profile.username}`)}
                                    >
                                        <User className="h-3 w-3 mr-1" />
                                        Профиль
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
