import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@shared/types/ipc';
import type {
  ValorantAPI,
  AppAPI,
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

// Expose APIs to renderer via contextBridge
contextBridge.exposeInMainWorld('valorantApi', valorantApi);
contextBridge.exposeInMainWorld('appApi', appApi);

// Log successful preload
console.log('[Preload] APIs exposed successfully');
