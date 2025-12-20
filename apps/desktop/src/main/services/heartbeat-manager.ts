import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ValorantLocalAPI } from '../valorant/api-client';
import { LockfileWatcher } from '../valorant/lockfile-watcher';
import type { ValorantGameStatus } from '@shared/types/valorant';
import type { DesktopHeartbeatData, DesktopStatusData } from '@shared/types/ipc';

const HEARTBEAT_INTERVAL = 10000; // 10 seconds

/**
 * HeartbeatManager - Syncs desktop status to Supabase
 * Periodically updates desktop_sessions table with current state
 */
export class HeartbeatManager {
  private supabase: SupabaseClient | null = null;
  private localApi: ValorantLocalAPI;
  private lockfileWatcher: LockfileWatcher;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private isRunning = false;
  private lastStatus: DesktopStatusData | null = null;
  private onStatusChange?: (status: DesktopStatusData) => void;

  constructor(
    localApi: ValorantLocalAPI,
    lockfileWatcher: LockfileWatcher
  ) {
    this.localApi = localApi;
    this.lockfileWatcher = lockfileWatcher;
  }

  /**
   * Start syncing with Supabase
   */
  async start(
    supabaseUrl: string,
    supabaseToken: string,
    userId: string,
    onStatusChange?: (status: DesktopStatusData) => void
  ): Promise<void> {
    if (this.isRunning) {
      console.log('[HeartbeatManager] Already running');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseToken, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    this.userId = userId;
    this.onStatusChange = onStatusChange;
    this.isRunning = true;

    // Initial heartbeat
    await this.sendHeartbeat();

    // Start periodic heartbeat
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);

    console.log('[HeartbeatManager] Started');
  }

  /**
   * Stop syncing
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Mark as offline
    if (this.supabase && this.userId) {
      try {
        await this.supabase.rpc('desktop_session_offline');
      } catch (error) {
        console.error('[HeartbeatManager] Failed to mark offline:', error);
      }
    }

    this.supabase = null;
    this.userId = null;
    this.isRunning = false;
    this.lastStatus = null;

    console.log('[HeartbeatManager] Stopped');
  }

  /**
   * Send heartbeat to Supabase
   */
  private async sendHeartbeat(): Promise<void> {
    if (!this.supabase || !this.userId) {
      return;
    }

    try {
      const heartbeatData = await this.collectHeartbeatData();

      // Call RPC function to update desktop session
      const { error } = await this.supabase.rpc('update_desktop_session', {
        p_is_online: heartbeatData.isOnline,
        p_valorant_running: heartbeatData.valorantRunning,
        p_valorant_status: heartbeatData.valorantStatus,
        p_party_id: heartbeatData.partyId,
        p_party_code: heartbeatData.partyCode,
        p_party_size: heartbeatData.partySize,
        p_player_puuid: heartbeatData.playerPuuid
      });

      if (error) {
        console.error('[HeartbeatManager] Heartbeat failed:', error);
        return;
      }

      // Check for status change
      const newStatus: DesktopStatusData = {
        isOnline: heartbeatData.isOnline,
        valorantRunning: heartbeatData.valorantRunning,
        valorantStatus: heartbeatData.valorantStatus
      };

      if (this.hasStatusChanged(newStatus)) {
        this.lastStatus = newStatus;
        this.onStatusChange?.(newStatus);
      }

    } catch (error) {
      console.error('[HeartbeatManager] Heartbeat error:', error);
    }
  }

  /**
   * Collect current heartbeat data
   */
  private async collectHeartbeatData(): Promise<DesktopHeartbeatData> {
    const valorantRunning = this.lockfileWatcher.isRunning();
    let valorantStatus: ValorantGameStatus = 'not_running';
    let partyId: string | null = null;
    let partyCode: string | null = null;
    let partySize = 0;
    let playerPuuid: string | null = null;

    if (valorantRunning && this.localApi.isInitialized()) {
      try {
        // Get player PUUID
        playerPuuid = await this.localApi.getPlayerPUUID();

        // Determine game status
        const pregame = await this.localApi.getPregameInfo(playerPuuid);
        if (pregame) {
          valorantStatus = 'in_pregame';
        } else {
          const coregame = await this.localApi.getCoregameInfo(playerPuuid);
          if (coregame) {
            valorantStatus = coregame.State === 'IN_PROGRESS' ? 'in_game' : 'in_postgame';
          } else {
            valorantStatus = 'in_menu';
          }
        }

        // Get party info
        const party = await this.localApi.getPartyInfo(playerPuuid);
        if (party) {
          partyId = party.ID;
          partySize = party.Members?.length || 0;
          // Party code might be stored elsewhere, will be set by LFGService
        }

      } catch (error) {
        console.error('[HeartbeatManager] Error collecting data:', error);
        valorantStatus = 'in_menu'; // Fallback
      }
    }

    return {
      isOnline: true,
      valorantRunning,
      valorantStatus,
      partyId,
      partyCode,
      partySize,
      playerPuuid
    };
  }

  /**
   * Check if status has changed
   */
  private hasStatusChanged(newStatus: DesktopStatusData): boolean {
    if (!this.lastStatus) {
      return true;
    }

    return (
      this.lastStatus.isOnline !== newStatus.isOnline ||
      this.lastStatus.valorantRunning !== newStatus.valorantRunning ||
      this.lastStatus.valorantStatus !== newStatus.valorantStatus
    );
  }

  /**
   * Force an immediate heartbeat
   */
  async forceHeartbeat(): Promise<void> {
    await this.sendHeartbeat();
  }

  /**
   * Check if manager is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
