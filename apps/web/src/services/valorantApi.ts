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
        } catch {
            toast.error("Не удалось загрузить данные агентов");
            return [];
        }
    }
};
