import { watch, FSWatcher, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { LockfileData } from '@shared/types/valorant';

const execAsync = promisify(exec);

export interface LockfileWatcherEvents {
  'lockfile-found': (data: LockfileData) => void;
  'lockfile-lost': () => void;
  'valorant-running': () => void;
  'valorant-stopped': () => void;
  'error': (error: Error) => void;
}

export class LockfileWatcher extends EventEmitter {
  private lockfilePath: string;
  private watcher: FSWatcher | null = null;
  private currentLockfileData: LockfileData | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private valorantProcessInterval: NodeJS.Timeout | null = null;
  private isValorantProcessRunning = false;

  constructor() {
    super();

    // Lockfile path: %LocalAppData%\Riot Games\Riot Client\Config\lockfile
    const localAppData = process.env.LOCALAPPDATA || '';
    this.lockfilePath = join(localAppData, 'Riot Games', 'Riot Client', 'Config', 'lockfile');
  }

  /**
   * Start watching for lockfile changes AND VALORANT.exe process
   */
  start(): void {
    // Initial checks
    this.checkLockfile();
    this.checkValorantProcess();

    // Watch for file changes
    try {
      const configDir = join(process.env.LOCALAPPDATA || '', 'Riot Games', 'Riot Client', 'Config');

      this.watcher = watch(configDir, (eventType, filename) => {
        if (filename === 'lockfile') {
          this.checkLockfile();
        }
      });

      // Periodic check for lockfile every 5 seconds as fallback
      this.checkInterval = setInterval(() => {
        this.checkLockfile();
      }, 5000);

      // Check VALORANT.exe process every 3 seconds
      this.valorantProcessInterval = setInterval(() => {
        this.checkValorantProcess();
      }, 3000);

    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  /**
   * Check if VALORANT.exe process is running
   */
  private async checkValorantProcess(): Promise<void> {
    try {
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq VALORANT.exe" /NH');
      const isRunning = stdout.toLowerCase().includes('valorant.exe');

      if (isRunning && !this.isValorantProcessRunning) {
        this.isValorantProcessRunning = true;
        console.log('[LockfileWatcher] VALORANT.exe process detected');
        this.emit('valorant-running');
      } else if (!isRunning && this.isValorantProcessRunning) {
        this.isValorantProcessRunning = false;
        console.log('[LockfileWatcher] VALORANT.exe process stopped');
        this.emit('valorant-stopped');
      }
    } catch (error) {
      // Silently ignore tasklist errors
    }
  }

  /**
   * Stop watching for lockfile changes
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.valorantProcessInterval) {
      clearInterval(this.valorantProcessInterval);
      this.valorantProcessInterval = null;
    }
  }

  /**
   * Check if lockfile exists and parse it
   */
  private checkLockfile(): void {
    try {
      if (existsSync(this.lockfilePath)) {
        const content = readFileSync(this.lockfilePath, 'utf-8');
        const lockfileData = this.parseLockfile(content);

        // Only emit if lockfile data changed
        if (!this.currentLockfileData || this.hasLockfileChanged(lockfileData)) {
          this.currentLockfileData = lockfileData;
          this.emit('lockfile-found', lockfileData);
        }
      } else {
        // Lockfile doesn't exist
        if (this.currentLockfileData !== null) {
          this.currentLockfileData = null;
          this.emit('lockfile-lost');
        }
      }
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  /**
   * Parse lockfile content
   * Format: name:pid:port:password:protocol
   * Example: lockfile:12345:2999:abcd1234:https
   */
  private parseLockfile(content: string): LockfileData {
    const parts = content.trim().split(':');

    if (parts.length !== 5) {
      throw new Error(`Invalid lockfile format: expected 5 parts, got ${parts.length}`);
    }

    return {
      name: parts[0],
      pid: parseInt(parts[1], 10),
      port: parseInt(parts[2], 10),
      password: parts[3],
      protocol: 'https'
    };
  }

  /**
   * Check if lockfile data has changed
   */
  private hasLockfileChanged(newData: LockfileData): boolean {
    if (!this.currentLockfileData) return true;

    return (
      this.currentLockfileData.pid !== newData.pid ||
      this.currentLockfileData.port !== newData.port ||
      this.currentLockfileData.password !== newData.password
    );
  }

  /**
   * Get current lockfile data
   */
  getLockfileData(): LockfileData | null {
    return this.currentLockfileData;
  }

  /**
   * Check if VALORANT game is running (not just Riot Client)
   */
  isRunning(): boolean {
    return this.isValorantProcessRunning;
  }

  /**
   * Check if Riot Client is running (lockfile exists)
   */
  isRiotClientRunning(): boolean {
    return this.currentLockfileData !== null;
  }
}
