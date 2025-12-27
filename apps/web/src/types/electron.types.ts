export type ValorantGameStatus = 'MENUS' | 'PREGAME' | 'INGAME' | 'UNKNOWN';

export interface ValorantLobbyInfo {
    lobbyId: string;
    matchId?: string;
    queueId?: string;
    members: Array<{
        puuid: string;
        gameName?: string;
        tagLine?: string;
        teamId?: string;
        characterId?: string;
    }>;
}

export interface ValorantMatchStats {
    matchId: string;
    queueId: string;
    mapId: string;
    gameLength: number;
    isCompleted: boolean;
    teams: Array<{
        teamId: string;
        won: boolean;
        roundsWon: number;
        roundsLost: number;
    }>;
}

export interface LFGPartyInfo {
    partyId: string;
    inviteCode: string | null;
    size: number;
    maxSize: number;
    isOwner: boolean;
    members: Array<{
        puuid: string;
        gameName?: string;
        tagLine?: string;
        isReady: boolean;
    }>;
}

export interface DesktopHeartbeatData {
    isOnline: boolean;
    valorantRunning: boolean;
    valorantStatus: ValorantGameStatus;
    partyId: string | null;
    partyCode: string | null;
    partySize: number;
    playerPuuid: string | null;
}

export interface DesktopStatusData {
    isOnline: boolean;
    valorantRunning: boolean;
    valorantStatus: ValorantGameStatus;
}
