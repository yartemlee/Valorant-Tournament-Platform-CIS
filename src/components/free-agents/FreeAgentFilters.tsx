import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { valorantApi } from "@/services/valorantApi";

export type ViewMode = "grid" | "list";

// Role options
const roleOptions = [
    { value: "duelist", label: "Дуэлянт", apiName: "Дуэлянт" },
    { value: "initiator", label: "Инициатор", apiName: "Зачинщик" },
    { value: "controller", label: "Специалист", apiName: "Специалист" },
    { value: "sentinel", label: "Страж", apiName: "Страж" },
];

// Rank options with colors
const rankOptions = [
    { value: "iron", label: "Iron", color: "text-gray-400" },
    { value: "bronze", label: "Bronze", color: "text-amber-600" },
    { value: "silver", label: "Silver", color: "text-slate-300" },
    { value: "gold", label: "Gold", color: "text-yellow-400" },
    { value: "platinum", label: "Platinum", color: "text-cyan-400" },
    { value: "diamond", label: "Diamond", color: "text-purple-300" },
    { value: "ascendant", label: "Ascendant", color: "text-emerald-400" },
    { value: "immortal", label: "Immortal", color: "text-red-400" },
    { value: "radiant", label: "Radiant", color: "text-yellow-300" },
];

export interface FreeAgentFilters {
    search: string;
    roles: string[];
    minRank: string;
}

interface FreeAgentFiltersProps {
    filters: FreeAgentFilters;
    onFiltersChange: (filters: FreeAgentFilters) => void;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export function FreeAgentFiltersPanel({
    filters,
    onFiltersChange,
    viewMode,
    onViewModeChange
}: FreeAgentFiltersProps) {
    const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadRoleIcons = async () => {
            const agents = await valorantApi.getAgents();
            const icons: Record<string, string> = {};
            roleOptions.forEach(role => {
                const agent = agents.find(a => a.role?.displayName === role.apiName);
                if (agent?.role?.displayIcon) {
                    icons[role.value] = agent.role.displayIcon;
                }
            });
            setRoleIcons(icons);
        };
        loadRoleIcons();
    }, []);

    const toggleRole = (role: string) => {
        const newRoles = filters.roles.includes(role)
            ? filters.roles.filter(r => r !== role)
            : [...filters.roles, role];
        onFiltersChange({ ...filters, roles: newRoles });
    };

    const resetFilters = () => {
        onFiltersChange({ search: "", roles: [], minRank: "" });
    };

    const hasActiveFilters = filters.search || filters.roles.length > 0 || filters.minRank;

    return (
        <div className="space-y-3">
            {/* Search Bar + View Toggle */}
            <div className="flex gap-2">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Поиск по никнейму..."
                        value={filters.search}
                        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                        className="pl-9 h-9 bg-card/50 border-border/50 focus:border-primary/50"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex rounded-md border border-border/50 overflow-hidden">
                    <button
                        onClick={() => onViewModeChange("grid")}
                        className={cn(
                            "px-3 h-9 flex items-center justify-center transition-colors",
                            viewMode === "grid"
                                ? "bg-primary text-primary-foreground"
                                : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card"
                        )}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onViewModeChange("list")}
                        className={cn(
                            "px-3 h-9 flex items-center justify-center transition-colors border-l border-border/50",
                            viewMode === "list"
                                ? "bg-primary text-primary-foreground"
                                : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card"
                        )}
                    >
                        <List className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Roles */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">Роли:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {roleOptions.map((role) => {
                            const isSelected = filters.roles.includes(role.value);
                            const iconUrl = roleIcons[role.value];

                            return (
                                <button
                                    key={role.value}
                                    onClick={() => toggleRole(role.value)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium",
                                        "transition-all duration-150 hover:scale-105 active:scale-95",
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-card/50 border-border/50 hover:border-primary/40 hover:bg-primary/10"
                                    )}
                                >
                                    {iconUrl && (
                                        <img
                                            src={iconUrl}
                                            alt=""
                                            className={cn("h-3.5 w-3.5 object-contain", !isSelected && "opacity-60")}
                                        />
                                    )}
                                    {role.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border/50 hidden sm:block" />

                {/* Rank */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider shrink-0">Ранг:</span>
                    <Select
                        value={filters.minRank || "all"}
                        onValueChange={(value) => onFiltersChange({ ...filters, minRank: value === "all" ? "" : value })}
                    >
                        <SelectTrigger className="w-36 h-8 text-xs bg-card/50 border-border/50">
                            <SelectValue placeholder="Любой" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <span className="text-muted-foreground">Любой</span>
                            </SelectItem>
                            {rankOptions.map((rank) => (
                                <SelectItem key={rank.value} value={rank.value}>
                                    <span className={rank.color}>{rank.label}+</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Reset */}
                {hasActiveFilters && (
                    <>
                        <div className="h-6 w-px bg-border/50 hidden sm:block" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Сбросить
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
