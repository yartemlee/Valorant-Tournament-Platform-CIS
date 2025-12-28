import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/types/ipc';
import type {
  ValorantAPI,
  AppAPI,
  LFGAPI,
  IPCRequest,
  IPCResponse,
  IPCEvent
} from '@shared/types/ipc';

// Type-safe IPC invoke wrapper
function invoke<K extends keyof IPCRequest>(
  channel: K,
  data?: IPCRequest[K]
): Promise<IPCResponse[K]> {
  return ipcRenderer.invoke(channel, data);
}

// Type-safe IPC event listener wrapper
function on<K extends keyof IPCEvent>(
  channel: K,
  listener: (data: IPCEvent[K]) => void
): () => void {
  const wrappedListener = (_event: Electron.IpcRendererEvent, data: IPCEvent[K]) => {
    listener(data);
  };

  ipcRenderer.on(channel, wrappedListener);

  // Return cleanup function
  return () => {
    ipcRenderer.removeListener(channel, wrappedListener);
  };
}

// Valorant API exposed to renderer
const valorantApi: ValorantAPI = {
  // Query methods
  getGameStatus: () => invoke(IPC_CHANNELS.VALORANT_GET_STATUS),
  getLobbyInfo: () => invoke(IPC_CHANNELS.VALORANT_GET_LOBBY),
  getMatchStats: (matchId?: string) =>
    invoke(IPC_CHANNELS.VALORANT_GET_MATCH_STATS, { matchId }),

  // Sync methods
  syncToSupabase: (force?: boolean) =>
    invoke(IPC_CHANNELS.VALORANT_SYNC_SUPABASE, { force }),

  // Event listeners
  onStatusChange: (callback) => on(IPC_CHANNELS.VALORANT_STATUS_CHANGED, callback),
  onLobbyDetected: (callback) => on(IPC_CHANNELS.VALORANT_LOBBY_DETECTED, callback),
  onMatchStarted: (callback) => on(IPC_CHANNELS.VALORANT_MATCH_STARTED, callback),
  onMatchCompleted: (callback) => on(IPC_CHANNELS.VALORANT_MATCH_COMPLETED, callback),
  onSyncStatus: (callback) => on(IPC_CHANNELS.VALORANT_SYNC_STATUS, callback)
};

// App API exposed to renderer
const appApi: AppAPI = {
  getVersion: () => invoke(IPC_CHANNELS.APP_GET_VERSION),
  quit: () => invoke(IPC_CHANNELS.APP_QUIT),
  minimize: () => invoke(IPC_CHANNELS.APP_MINIMIZE),
  maximize: () => invoke(IPC_CHANNELS.APP_MAXIMIZE),
  close: () => invoke(IPC_CHANNELS.APP_CLOSE)
};

// LFG API exposed to renderer
const lfgApi: LFGAPI = {
  // Party management
  getPartyInfo: () => invoke(IPC_CHANNELS.LFG_GET_PARTY_INFO),
  generatePartyCode: () => invoke(IPC_CHANNELS.LFG_GENERATE_PARTY_CODE),
  joinPartyByCode: (code: string) =>
    invoke(IPC_CHANNELS.LFG_JOIN_PARTY_BY_CODE, { code }),
  inviteToParty: (gameName: string, tagLine: string) =>
    invoke(IPC_CHANNELS.LFG_INVITE_TO_PARTY, { gameName, tagLine }),
  changeQueue: (queueId: string) =>
    invoke(IPC_CHANNELS.LFG_CHANGE_QUEUE, { queueId }),

  // Desktop sync
  startSync: (supabaseToken: string, supabaseUrl?: string, supabaseAnonKey?: string) =>
    invoke(IPC_CHANNELS.DESKTOP_START_SYNC, { supabaseToken, supabaseUrl, supabaseAnonKey }),
  stopSync: () => invoke(IPC_CHANNELS.DESKTOP_STOP_SYNC),

  // Event listeners
  onPartyCodeGenerated: (callback) =>
    on(IPC_CHANNELS.LFG_PARTY_CODE_GENERATED, callback),
  onPartyJoinResult: (callback) =>
    on(IPC_CHANNELS.LFG_PARTY_JOIN_RESULT, callback),
  onHeartbeat: (callback) =>
    on(IPC_CHANNELS.DESKTOP_HEARTBEAT, callback),
  onStatusChanged: (callback) =>
    on(IPC_CHANNELS.DESKTOP_STATUS_CHANGED, callback)
};

// Expose APIs to renderer via contextBridge
contextBridge.exposeInMainWorld('valorantApi', valorantApi);
contextBridge.exposeInMainWorld('appApi', appApi);
contextBridge.exposeInMainWorld('lfgApi', lfgApi);

// Log successful preload
console.log('[Preload] APIs exposed successfully');
