import { app, BrowserWindow, dialog } from 'electron';
import { existsSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { WindowManager } from './window-manager';
import { setupIpcHandlers } from './ipc-handlers';

// FIRST: Register error handlers BEFORE anything else
// This suppresses the Electron error dialog for network errors
process.on('uncaughtException', (error) => {
  // Silently ignore network connection errors (expected when Valorant isn't running)
  if (
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('ECONNRESET') ||
    error.message?.includes('ETIMEDOUT') ||
    error.message?.includes('Riot Client') ||
    error.name === 'RiotClientUnavailable'
  ) {
    console.log('[Main] Network error suppressed (Valorant not running)');
    return;
  }
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  if (
    msg?.includes('ECONNREFUSED') ||
    msg?.includes('ECONNRESET') ||
    msg?.includes('ETIMEDOUT') ||
    msg?.includes('Riot Client')
  ) {
    console.log('[Main] Promise rejection suppressed (Valorant not running)');
    return;
  }
  console.error('[Main] Unhandled rejection:', reason);
});

// SECOND: Disable error dialogs completely
// eslint-disable-next-line @typescript-eslint/no-unused-vars
dialog.showErrorBox = (_title: string, _content: string) => {
  // No-op: suppress ALL error dialogs
};

// THIRD: Delete stale Riot Client lockfile at startup
// This prevents ANY connection attempts to ports from old sessions
function deleteStaleRiotLockfile(): void {
  try {
    const localAppData = process.env.LOCALAPPDATA || '';
    const lockfilePath = join(localAppData, 'Riot Games', 'Riot Client', 'Config', 'lockfile');

    if (existsSync(lockfilePath)) {
      // Check if RiotClientServices.exe is running
      try {
        const output = execSync('tasklist /FI "IMAGENAME eq RiotClientServices.exe" /NH', { encoding: 'utf-8' });
        const isRiotRunning = output.toLowerCase().includes('riotclientservices.exe');

        if (!isRiotRunning) {
          console.log('[Main] Deleting stale Riot lockfile (Riot Client not running)');
          unlinkSync(lockfilePath);
        }
      } catch {
        // If tasklist fails, assume Riot isn't running and delete lockfile
        console.log('[Main] Deleting lockfile (could not verify Riot Client status)');
        try {
          unlinkSync(lockfilePath);
        } catch {
          // Ignore delete errors
        }
      }
    }
  } catch (error) {
    console.log('[Main] Could not check/delete lockfile:', (error as Error).message);
  }
}

// Delete stale lockfile IMMEDIATELY at startup
deleteStaleRiotLockfile();

const windowManager = new WindowManager();

// Fix blurry rendering on Windows with high DPI displays
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Create window
  const mainWindow = windowManager.createWindow();

  // Setup IPC handlers
  setupIpcHandlers(mainWindow);

  // On macOS it's common to re-create a window when the dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Allow navigation to localhost and file:// for dev/prod
    if (
      parsedUrl.protocol === 'file:' ||
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1'
    ) {
      return;
    }

    // Prevent all other navigation
    event.preventDefault();
  });
});
