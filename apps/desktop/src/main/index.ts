import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window-manager';
import { setupIpcHandlers } from './ipc-handlers';

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
