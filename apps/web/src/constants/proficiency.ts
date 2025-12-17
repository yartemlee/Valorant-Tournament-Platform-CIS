// Role proficiency levels (5 levels)
export type RoleProficiencyLevel = "not_played" | "learning" | "average" | "good" | "perfect";

// Agent proficiency levels (2 levels)
export type AgentProficiencyLevel = "not_played" | "comfortable" | "main";

// Combined type for compatibility
export type ProficiencyLevel = RoleProficiencyLevel | AgentProficiencyLevel;

export const roleProficiencyLevels = [
    { value: "not_played" as const, label: "Не играю", color: "text-muted-foreground" },
    { value: "learning" as const, label: "Иногда", color: "text-yellow-500" },
    { value: "good" as const, label: "Часто", color: "text-green-500" },
    { value: "perfect" as const, label: "Мейн", color: "text-purple-500" },
];

export const agentProficiencyLevels = [
    { value: "not_played" as const, label: "Не играю", color: "text-muted-foreground" },
    { value: "comfortable" as const, label: "Играю", color: "text-green-500" },
    { value: "main" as const, label: "Мейн", color: "text-purple-500" },
];

// Legacy export for backward compatibility
export const proficiencyLevels = roleProficiencyLevels;
