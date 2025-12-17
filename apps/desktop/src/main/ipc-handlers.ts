import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '@shared/types/ipc';
import type { ValorantGameStatus } from '@shared/types/valorant';

export function setupIpcHandlers(mainWindow: BrowserWindow): void {
  // App control handlers
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => {
    return process.env.npm_package_version || '1.0.0';
  });

  ipcMain.handle(IPC_CHANNELS.APP_QUIT, () => {
    mainWindow.close();
  });

  ipcMain.handle(IPC_CHANNELS.APP_MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.APP_MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP_CLOSE, () => {
    mainWindow.close();
  });

  // Valorant API handlers (stub for now, will implement in next steps)
  ipcMain.handle(IPC_CHANNELS.VALORANT_GET_STATUS, async (): Promise<ValorantGameStatus> => {
    // TODO: Implement lockfile reading and status detection
    return 'not_running';
  });

  ipcMain.handle(IPC_CHANNELS.VALORANT_GET_LOBBY, async () => {
    // TODO: Implement lobby info retrieval
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.VALORANT_GET_MATCH_STATS, async () => {
    // TODO: Implement match stats retrieval
    return null;
  });

  ipcMain.handle(IPC_CHANNELS.VALORANT_SYNC_SUPABASE, async () => {
    // TODO: Implement Supabase sync
    return { success: true, synced: 0, failed: 0 };
  });
}
