import { cn } from "@/lib/utils";

// Role proficiency levels (5 levels)
export type RoleProficiencyLevel = "not_played" | "learning" | "average" | "good" | "perfect";

// Agent proficiency levels (2 levels)
export type AgentProficiencyLevel = "not_played" | "comfortable" | "main";

// Combined type for compatibility
export type ProficiencyLevel = RoleProficiencyLevel | AgentProficiencyLevel;

export const roleProficiencyLevels = [
    { value: "not_played" as const, label: "Не играл", color: "text-muted-foreground" },
    { value: "learning" as const, label: "Осваиваю", color: "text-yellow-500" },
    { value: "average" as const, label: "Средне", color: "text-blue-500" },
    { value: "good" as const, label: "Хорошо", color: "text-green-500" },
    { value: "perfect" as const, label: "Мейн", color: "text-purple-500" },
];

export const agentProficiencyLevels = [
    { value: "not_played" as const, label: "Не выбран", color: "text-muted-foreground" },
    { value: "comfortable" as const, label: "Комфортно", color: "text-green-500" },
    { value: "main" as const, label: "Мейн", color: "text-purple-500" },
];

// Legacy export for backward compatibility
export const proficiencyLevels = roleProficiencyLevels;

interface ProficiencySelectorProps {
    value: ProficiencyLevel;
    onChange: (value: ProficiencyLevel) => void;
    disabled?: boolean;
    className?: string;
    variant?: "role" | "agent";
}

export function ProficiencySelector({
    value,
    onChange,
    disabled = false,
    className,
    variant = "role",
}: ProficiencySelectorProps) {
    const levels = variant === "agent" ? agentProficiencyLevels : roleProficiencyLevels;

    return (
        <div className={cn("flex gap-1", className)}>
            {levels.slice(1).map((level) => (
                <button
                    key={level.value}
                    onClick={() => onChange(level.value as ProficiencyLevel)}
                    disabled={disabled}
                    className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                        "border-2 hover:scale-105",
                        value === level.value
                            ? level.value === "main"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500 shadow-lg shadow-purple-500/30"
                                : level.value === "comfortable"
                                    ? "bg-green-500/20 text-green-400 border-green-500 shadow-lg shadow-green-500/30"
                                    : "bg-primary/20 text-primary border-primary shadow-lg"
                            : "bg-card/50 border-border/50 hover:border-primary/30 text-muted-foreground",
                        disabled && "opacity-50 cursor-not-allowed hover:scale-100"
                    )}
                >
                    {level.label}
                </button>
            ))}
        </div>
    );
}
