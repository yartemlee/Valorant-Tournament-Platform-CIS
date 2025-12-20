import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/types/ipc';
import type { ValorantGameStatus, ValorantLobbyInfo } from '@shared/types/valorant';
import type { LFGPartyInfo, DesktopStatusData } from '@shared/types/ipc';
import { ValorantLocalAPI } from './valorant/api-client';
import { ValorantRemoteAPI } from './valorant/remote-api';
import { LockfileWatcher } from './valorant/lockfile-watcher';
import { HeartbeatManager, LFGService, CommandListener } from './services';

// Service instances
let localApi: ValorantLocalAPI;
let remoteApi: ValorantRemoteAPI;
let lockfileWatcher: LockfileWatcher;
let heartbeatManager: HeartbeatManager;
let lfgService: LFGService;
let commandListener: CommandListener;

// Current state
let currentStatus: ValorantGameStatus = 'not_running';
let mainWindow: BrowserWindow | null = null;

// Supabase config (will be set from renderer)
let supabaseUrl = '';
let supabaseAnonKey = '';

export function setupIpcHandlers(window: BrowserWindow): void {
  mainWindow = window;

  // Initialize services
  localApi = new ValorantLocalAPI();
  remoteApi = new ValorantRemoteAPI();
  lockfileWatcher = new LockfileWatcher();
  heartbeatManager = new HeartbeatManager(localApi, lockfileWatcher);
  lfgService = new LFGService(localApi, remoteApi, lockfileWatcher);
  commandListener = new CommandListener(lfgService);

  // Setup lockfile watcher events
  lockfileWatcher.on('lockfile-found', (data) => {
    console.log('[IPC] Lockfile found, initializing API');
    localApi.initialize(data);
    lfgService.initialize();
    updateStatus('in_menu');
  });

  lockfileWatcher.on('lockfile-lost', () => {
    console.log('[IPC] Lockfile lost, clearing API');
    localApi.clear();
    lfgService.clear();
    updateStatus('not_running');
  });

  lockfileWatcher.on('error', (error) => {
    console.error('[IPC] Lockfile watcher error:', error);
  });

  // Start watching for Valorant
  lockfileWatcher.start();

  // ========================================
  // App control handlers
  // ========================================

  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return process.env.npm_package_version || '1.0.0';
  });

  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
    cleanup();
    window.close();
  });

  ipcMain.handle(IPC_CHANNELS.APP_MINIMIZE, () => {
    window.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.APP_MAXIMIZE, () => {
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP_CLOSE, () => {
    cleanup();
    window.close();
  });

  // ========================================
  // Valorant API handlers
  // ========================================

  ipcMain.handle(IPC_CHANNELS.VALORANT_GET_STATUS, async (): Promise<ValorantGameStatus> => {
    return currentStatus;
  });

  ipcMain.handle(IPC_CHANNELS.VALORANT_GET_LOBBY, async (): Promise<ValorantLobbyInfo | null> => {
    if (!localApi.isInitialized()) {
      return null;
    }

    try {
      const puuid = await localApi.getPlayerPUUID();
      const party = await localApi.getPartyInfo(puuid);

      if (!party) {
        return null;
      }

      return {
        partyId: party.ID,
        inviteCode: null,
        mapId: party.MatchmakingData?.QueueID || null,
        mode: party.MatchmakingData?.QueueID || null,
        maxPlayers: 5,
        currentPlayers: party.Members?.length || 0,
        players: (party.Members || []).map(m => ({
          subject: m.Subject,
          isOwner: m.IsOwner,
          isReady: m.IsReady,
          rank: m.CompetitiveTier
        })),
        isActive: party.State === 'DEFAULT' || party.State === 'MATCHMAKING',
        isInGame: party.State === 'IN_MATCH'
      };
    } catch (error) {
      console.error('[IPC] VALORANT_GET_LOBBY error:', error);
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.VALORANT_GET_MATCH_STATS, async () => {
    // TODO: Implement match stats retrieval
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.VALORANT_SYNC_SUPABASE, async () => {
    // Force immediate heartbeat
    await heartbeatManager.forceHeartbeat();
    return { success: true, synced: 1, failed: 0 };
  });

  // ========================================
  // LFG Party Management handlers
  // ========================================

  ipcMain.handle(IPC_CHANNELS.LFG_GET_PARTY_INFO, async (): Promise<LFGPartyInfo | null> => {
    return await lfgService.getPartyInfo();
  });

  ipcMain.handle(IPC_CHANNELS.LFG_GENERATE_PARTY_CODE, async () => {
    const result = await lfgService.generatePartyCode();

    if (result.success && result.code) {
      // Notify renderer
      sendToRenderer(IPC_CHANNELS.LFG_PARTY_CODE_GENERATED, {
        partyId: (await lfgService.getPartyInfo())?.partyId || '',
        code: result.code
      });
    }

    return result;
  });

  ipcMain.handle(IPC_CHANNELS.LFG_JOIN_PARTY_BY_CODE, async (_event, { code }: { code: string }) => {
    const result = await lfgService.joinPartyByCode(code);

    // Notify renderer
    sendToRenderer(IPC_CHANNELS.LFG_PARTY_JOIN_RESULT, {
      success: result.success,
      partyId: result.partyId,
      error: result.error
    });

    return result;
  });

  ipcMain.handle(IPC_CHANNELS.LFG_INVITE_TO_PARTY, async (_event, { gameName, tagLine }: { gameName: string; tagLine: string }) => {
    return await lfgService.inviteToParty(gameName, tagLine);
  });

  // ========================================
  // Desktop Sync handlers
  // ========================================

  ipcMain.handle(IPC_CHANNELS.DESKTOP_START_SYNC, async (_event, { supabaseToken }: { supabaseToken: string }) => {
    // Get Supabase config from environment or renderer
    supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    supabaseAnonKey = supabaseToken;

    if (!supabaseUrl) {
      console.error('[IPC] Supabase URL not configured');
      return { success: false };
    }

    // Extract user ID from token (JWT)
    try {
      const payload = JSON.parse(
        Buffer.from(supabaseToken.split('.')[1], 'base64').toString()
      );
      const userId = payload.sub;

      if (!userId) {
        console.error('[IPC] No user ID in token');
        return { success: false };
      }

      // Start services
      await heartbeatManager.start(
        supabaseUrl,
        supabaseToken,
        userId,
        (status: DesktopStatusData) => {
          sendToRenderer(IPC_CHANNELS.DESKTOP_STATUS_CHANGED, status);
        }
      );

      await commandListener.start(supabaseUrl, supabaseToken, userId);

      return { success: true };
    } catch (error) {
      console.error('[IPC] DESKTOP_START_SYNC error:', error);
      return { success: false };
    }
  });

  ipcMain.handle(IPC_CHANNELS.DESKTOP_STOP_SYNC, async () => {
    await heartbeatManager.stop();
    await commandListener.stop();
    return { success: true };
  });
}

/**
 * Update current status and notify renderer
 */
function updateStatus(status: ValorantGameStatus): void {
  if (currentStatus !== status) {
    currentStatus = status;
    sendToRenderer(IPC_CHANNELS.VALORANT_STATUS_CHANGED, status);
  }
}

/**
 * Send message to renderer
 */
function sendToRenderer(channel: string, data: any): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}

/**
 * Cleanup on app close
 */
async function cleanup(): Promise<void> {
  console.log('[IPC] Cleaning up...');
  lockfileWatcher.stop();
  await heartbeatManager.stop();
  await commandListener.stop();
  localApi.clear();
  lfgService.clear();
}
