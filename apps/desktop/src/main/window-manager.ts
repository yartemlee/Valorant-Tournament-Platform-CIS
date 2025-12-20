import { BrowserWindow, shell } from 'electron';
import { join } from 'path';

// Declare Electron Forge's magic constants
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  createWindow(): BrowserWindow {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 1024,
      minHeight: 768,
      show: false, // Don't show until ready-to-show event
      autoHideMenuBar: true,
      backgroundColor: '#0a0e27', // Match app theme
      webPreferences: {
        preload: join(__dirname, 'preload.mjs'),
        sandbox: false, // Required for preload script to work
        contextIsolation: true, // Enable context isolation for security
        nodeIntegration: false, // Disable node integration for security
        webSecurity: true
      }
    });

    // Load the app using Electron Forge's environment variables
    // In dev: use the web app on port 8080 (our main React app)
    // In prod: use the packaged renderer
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      // Development mode: load from web dev server on port 8080
      this.mainWindow.loadURL('http://localhost:8080');
    } else {
      // Production mode: load from built renderer files
      this.mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Show window when ready
    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Open external links in browser
    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Open DevTools in development
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.mainWindow.webContents.openDevTools();
    }

    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  closeWindow(): void {
    this.mainWindow?.close();
  }

  minimizeWindow(): void {
    this.mainWindow?.minimize();
  }

  maximizeWindow(): void {
    if (this.mainWindow?.isMaximized()) {
      this.mainWindow.unmaximize();
    } else {
      this.mainWindow?.maximize();
    }
  }
}
