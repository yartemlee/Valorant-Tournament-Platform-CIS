import { toast } from "sonner";

const BASE_URL = "https://valorant-api.com/v1";

export interface ValorantAgent {
    uuid: string;
    displayName: string;
    description: string;
    displayIcon: string;
    displayIconSmall: string;
    bustPortrait: string;
    fullPortrait: string;
    killfeedPortrait: string;
    background: string;
    role: {
        uuid: string;
        displayName: string;
        description: string;
        displayIcon: string;
        assetPath: string;
    } | null;
    isPlayableCharacter: boolean;
}

let agentsCache: ValorantAgent[] | null = null;

export const valorantApi = {
    async getAgents(): Promise<ValorantAgent[]> {
        if (agentsCache) return agentsCache;

        try {
            const response = await fetch(`${BASE_URL}/agents?language=ru-RU&isPlayableCharacter=true`);
            if (!response.ok) throw new Error("Failed to fetch agents");

            const data = await response.json();
            agentsCache = data.data;
            return agentsCache || [];
        } catch (error) {
            console.error("Error fetching Valorant agents:", error);
            toast.error("Не удалось загрузить данные агентов");
            return [];
        }
    },

    async getAgentByName(name: string): Promise<ValorantAgent | undefined> {
        const agents = await this.getAgents();
        return agents.find(a => a.displayName.toLowerCase() === name.toLowerCase());
    },

    async getRoleIcon(roleName: string): Promise<string | undefined> {
        const agents = await this.getAgents();
        // Find an agent with this role to get the icon
        // Mapping English role names (from DB/Code) to Russian API response if needed, 
        // or just finding by matching logic.
        // The API returns localized role names if we ask for ru-RU.
        // But our code uses internal keys like 'duelist', 'initiator'.

        // Let's map internal keys to what we might find or just look for known agents of that role.
        const roleMap: Record<string, string> = {
            duelist: "Duelist",
            initiator: "Initiator",
            controller: "Controller",
            sentinel: "Sentinel"
        };

        // Actually, we should probably fetch with English to get standard role names for mapping, 
        // or handle the localization. 
        // Let's stick to the plan: fetch agents. 
        // Note: The user wants Russian UI but maybe English internal keys.
        // Let's try to find an agent with the role that matches our internal key logic.

        // Better approach: Hardcode one agent per role to grab the icon, or just filter.
        // However, the API returns role display names in Russian if we requested ru-RU.
        // "Дуэлянт", "Инициатор", "Специалист", "Страж".

        const russianRoleMap: Record<string, string> = {
            duelist: "Дуэлянт",
            initiator: "Инициатор",
            controller: "Специалист", // Controller is often translated as Specialist or Controller in different contexts, let's verify. 
            // Actually in Valorant RU: Controller -> Специалист, Sentinel -> Страж.
            sentinel: "Страж"
        };

        const targetRoleName = russianRoleMap[roleName.toLowerCase()];
        if (!targetRoleName) return undefined;

        const agent = agents.find(a => a.role?.displayName === targetRoleName);
        return agent?.role?.displayIcon;
    }
};
