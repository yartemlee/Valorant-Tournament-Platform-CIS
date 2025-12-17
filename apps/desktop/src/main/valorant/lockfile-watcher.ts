import { watch, FSWatcher, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import type { LockfileData } from '@shared/types/valorant';

export interface LockfileWatcherEvents {
  'lockfile-found': (data: LockfileData) => void;
  'lockfile-lost': () => void;
  'error': (error: Error) => void;
}

export class LockfileWatcher extends EventEmitter {
  private lockfilePath: string;
  private watcher: FSWatcher | null = null;
  private currentLockfileData: LockfileData | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();

    // Lockfile path: %LocalAppData%\Riot Games\Riot Client\Config\lockfile
    const localAppData = process.env.LOCALAPPDATA || '';
    this.lockfilePath = join(localAppData, 'Riot Games', 'Riot Client', 'Config', 'lockfile');
  }

  /**
   * Start watching for lockfile changes
   */
  start(): void {
    // Initial check
    this.checkLockfile();

    // Watch for file changes
    try {
      const configDir = join(process.env.LOCALAPPDATA || '', 'Riot Games', 'Riot Client', 'Config');

      this.watcher = watch(configDir, (eventType, filename) => {
        if (filename === 'lockfile') {
          this.checkLockfile();
        }
      });

      // Periodic check every 5 seconds as fallback
      this.checkInterval = setInterval(() => {
        this.checkLockfile();
      }, 5000);

    } catch (error) {
      this.emit('error', error as Error);
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
   * Check if Riot Client is running
   */
  isRunning(): boolean {
    return this.currentLockfileData !== null;
  }
}
