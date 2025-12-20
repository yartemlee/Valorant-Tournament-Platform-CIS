// Type-safe IPC communication types for Electron
import type { ValorantGameStatus, ValorantLobbyInfo, ValorantMatchStats } from './valorant';

/**
 * LFG Party information for party management
 */
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

/**
 * Desktop heartbeat data sent to Supabase
 */
export interface DesktopHeartbeatData {
  isOnline: boolean;
  valorantRunning: boolean;
  valorantStatus: ValorantGameStatus;
  partyId: string | null;
  partyCode: string | null;
  partySize: number;
  playerPuuid: string | null;
}

/**
 * Desktop status change event
 */
export interface DesktopStatusData {
  isOnline: boolean;
  valorantRunning: boolean;
  valorantStatus: ValorantGameStatus;
}

/**
 * Centralized IPC channel definitions
 * All channels should be defined here to ensure type safety
 */
export const IPC_CHANNELS = {
  // Valorant API channels
  VALORANT_GET_STATUS: 'valorant:get-status',
  VALORANT_GET_LOBBY: 'valorant:get-lobby',
  VALORANT_GET_MATCH_STATS: 'valorant:get-match-stats',
  VALORANT_STATUS_CHANGED: 'valorant:status-changed',
  VALORANT_LOBBY_DETECTED: 'valorant:lobby-detected',
  VALORANT_MATCH_STARTED: 'valorant:match-started',
  VALORANT_MATCH_COMPLETED: 'valorant:match-completed',

  // Supabase sync channels
  VALORANT_SYNC_SUPABASE: 'valorant:sync-supabase',
  VALORANT_SYNC_STATUS: 'valorant:sync-status',

  // LFG Party Management channels
  LFG_GET_PARTY_INFO: 'lfg:get-party-info',
  LFG_GENERATE_PARTY_CODE: 'lfg:generate-party-code',
  LFG_JOIN_PARTY_BY_CODE: 'lfg:join-party-by-code',
  LFG_INVITE_TO_PARTY: 'lfg:invite-to-party',
  LFG_PARTY_CODE_GENERATED: 'lfg:party-code-generated',
  LFG_PARTY_JOIN_RESULT: 'lfg:party-join-result',

  // Desktop Sync channels
  DESKTOP_HEARTBEAT: 'desktop:heartbeat',
  DESKTOP_STATUS_CHANGED: 'desktop:status-changed',
  DESKTOP_START_SYNC: 'desktop:start-sync',
  DESKTOP_STOP_SYNC: 'desktop:stop-sync',

  // App lifecycle channels
  APP_GET_VERSION: 'app:get-version',
  APP_QUIT: 'app:quit',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  APP_CLOSE: 'app:close',
} as const;

/**
 * Type-safe request/response mapping for IPC invoke calls
 * Maps channel name to request payload type
 */
export type IPCRequest = {
  [IPC_CHANNELS.VALORANT_GET_STATUS]: void;
  [IPC_CHANNELS.VALORANT_GET_LOBBY]: void;
  [IPC_CHANNELS.VALORANT_GET_MATCH_STATS]: { matchId?: string };
  [IPC_CHANNELS.VALORANT_SYNC_SUPABASE]: { force?: boolean };
  // LFG Party Management
  [IPC_CHANNELS.LFG_GET_PARTY_INFO]: void;
  [IPC_CHANNELS.LFG_GENERATE_PARTY_CODE]: void;
  [IPC_CHANNELS.LFG_JOIN_PARTY_BY_CODE]: { code: string };
  [IPC_CHANNELS.LFG_INVITE_TO_PARTY]: { gameName: string; tagLine: string };
  // Desktop Sync
  [IPC_CHANNELS.DESKTOP_START_SYNC]: { supabaseToken: string };
  [IPC_CHANNELS.DESKTOP_STOP_SYNC]: void;
  // App lifecycle
  [IPC_CHANNELS.APP_GET_VERSION]: void;
  [IPC_CHANNELS.APP_QUIT]: void;
  [IPC_CHANNELS.APP_MINIMIZE]: void;
  [IPC_CHANNELS.APP_MAXIMIZE]: void;
  [IPC_CHANNELS.APP_CLOSE]: void;
};

/**
 * Type-safe request/response mapping for IPC invoke calls
 * Maps channel name to response data type
 */
export type IPCResponse = {
  [IPC_CHANNELS.VALORANT_GET_STATUS]: ValorantGameStatus;
  [IPC_CHANNELS.VALORANT_GET_LOBBY]: ValorantLobbyInfo | null;
  [IPC_CHANNELS.VALORANT_GET_MATCH_STATS]: ValorantMatchStats | null;
  [IPC_CHANNELS.VALORANT_SYNC_SUPABASE]: { success: boolean; synced: number; failed: number };
  // LFG Party Management
  [IPC_CHANNELS.LFG_GET_PARTY_INFO]: LFGPartyInfo | null;
  [IPC_CHANNELS.LFG_GENERATE_PARTY_CODE]: { success: boolean; code?: string; error?: string };
  [IPC_CHANNELS.LFG_JOIN_PARTY_BY_CODE]: { success: boolean; partyId?: string; error?: string };
  [IPC_CHANNELS.LFG_INVITE_TO_PARTY]: { success: boolean; error?: string };
  // Desktop Sync
  [IPC_CHANNELS.DESKTOP_START_SYNC]: { success: boolean };
  [IPC_CHANNELS.DESKTOP_STOP_SYNC]: { success: boolean };
  // App lifecycle
  [IPC_CHANNELS.APP_GET_VERSION]: string;
  [IPC_CHANNELS.APP_QUIT]: void;
  [IPC_CHANNELS.APP_MINIMIZE]: void;
  [IPC_CHANNELS.APP_MAXIMIZE]: void;
  [IPC_CHANNELS.APP_CLOSE]: void;
};

/**
 * Type-safe event listener mapping for IPC send/on calls
 * Maps channel name to event payload type
 */
export type IPCEvent = {
  [IPC_CHANNELS.VALORANT_STATUS_CHANGED]: ValorantGameStatus;
  [IPC_CHANNELS.VALORANT_LOBBY_DETECTED]: ValorantLobbyInfo;
  [IPC_CHANNELS.VALORANT_MATCH_STARTED]: { matchId: string };
  [IPC_CHANNELS.VALORANT_MATCH_COMPLETED]: ValorantMatchStats;
  [IPC_CHANNELS.VALORANT_SYNC_STATUS]: {
    status: 'syncing' | 'success' | 'error';
    message?: string;
  };
  // LFG Party events
  [IPC_CHANNELS.LFG_PARTY_CODE_GENERATED]: { partyId: string; code: string };
  [IPC_CHANNELS.LFG_PARTY_JOIN_RESULT]: { success: boolean; partyId?: string; error?: string };
  // Desktop Sync events
  [IPC_CHANNELS.DESKTOP_HEARTBEAT]: DesktopHeartbeatData;
  [IPC_CHANNELS.DESKTOP_STATUS_CHANGED]: DesktopStatusData;
};

/**
 * Type-safe IPC invoke function signature
 */
export type IPCInvoke = <K extends keyof IPCRequest>(
  channel: K,
  data?: IPCRequest[K]
) => Promise<IPCResponse[K]>;

/**
 * Type-safe IPC event listener signature
 */
export type IPCOn = <K extends keyof IPCEvent>(
  channel: K,
  listener: (data: IPCEvent[K]) => void
) => () => void; // Returns cleanup function

/**
 * Type-safe IPC event remover signature
 */
export type IPCOff = <K extends keyof IPCEvent>(
  channel: K,
  listener: (data: IPCEvent[K]) => void
) => void;

/**
 * Valorant API exposed to renderer via contextBridge
 */
export interface ValorantAPI {
  // Query methods
  getGameStatus: () => Promise<ValorantGameStatus>;
  getLobbyInfo: () => Promise<ValorantLobbyInfo | null>;
  getMatchStats: (matchId?: string) => Promise<ValorantMatchStats | null>;

  // Sync methods
  syncToSupabase: (force?: boolean) => Promise<{ success: boolean; synced: number; failed: number }>;

  // Event listeners
  onStatusChange: (callback: (status: ValorantGameStatus) => void) => () => void;
  onLobbyDetected: (callback: (lobby: ValorantLobbyInfo) => void) => () => void;
  onMatchStarted: (callback: (data: { matchId: string }) => void) => () => void;
  onMatchCompleted: (callback: (stats: ValorantMatchStats) => void) => () => void;
  onSyncStatus: (callback: (status: { status: 'syncing' | 'success' | 'error'; message?: string }) => void) => () => void;
}

/**
 * App API exposed to renderer via contextBridge
 */
export interface AppAPI {
  getVersion: () => Promise<string>;
  quit: () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

/**
 * LFG API exposed to renderer via contextBridge
 */
export interface LFGAPI {
  // Party management
  getPartyInfo: () => Promise<LFGPartyInfo | null>;
  generatePartyCode: () => Promise<{ success: boolean; code?: string; error?: string }>;
  joinPartyByCode: (code: string) => Promise<{ success: boolean; partyId?: string; error?: string }>;
  inviteToParty: (gameName: string, tagLine: string) => Promise<{ success: boolean; error?: string }>;

  // Desktop sync
  startSync: (supabaseToken: string) => Promise<{ success: boolean }>;
  stopSync: () => Promise<{ success: boolean }>;

  // Event listeners
  onPartyCodeGenerated: (callback: (data: { partyId: string; code: string }) => void) => () => void;
  onPartyJoinResult: (callback: (data: { success: boolean; partyId?: string; error?: string }) => void) => () => void;
  onHeartbeat: (callback: (data: DesktopHeartbeatData) => void) => () => void;
  onStatusChanged: (callback: (data: DesktopStatusData) => void) => () => void;
}

/**
 * Window interface extension for Electron preload
 * This should be used in apps/web/src/vite-env.d.ts
 */
export interface ElectronWindow {
  valorantApi: ValorantAPI;
  appApi: AppAPI;
  lfgApi: LFGAPI;
}

// Type guard to check if running in Electron
export function isElectronWindow(win: any): win is ElectronWindow {
  return win && typeof win === 'object' && 'valorantApi' in win && 'appApi' in win && 'lfgApi' in win;
}

/**
 * Error response wrapper for IPC calls
 */
export interface IPCErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Success response wrapper for IPC calls
 */
export interface IPCSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Generic IPC response wrapper
 */
export type IPCResponseWrapper<T> = IPCSuccessResponse<T> | IPCErrorResponse;
