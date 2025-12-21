import { ValorantLocalAPI } from '../valorant/api-client';
import { ValorantRemoteAPI, PartyCodeResult, PartyJoinResult, PartyInviteResult } from '../valorant/remote-api';
import { LockfileWatcher } from '../valorant/lockfile-watcher';
import type { LFGPartyInfo } from '@shared/types/ipc';
import type { PartyInfo } from '@shared/types/valorant';

/**
 * LFGService - Business logic for LFG party management
 * Handles party code generation, joining, and invites
 */
export class LFGService {
  private localApi: ValorantLocalAPI;
  private remoteApi: ValorantRemoteAPI;
  private lockfileWatcher: LockfileWatcher;
  private isInitialized = false;
  private currentPartyCode: string | null = null;

  constructor(
    localApi: ValorantLocalAPI,
    remoteApi: ValorantRemoteAPI,
    lockfileWatcher: LockfileWatcher
  ) {
    this.localApi = localApi;
    this.remoteApi = remoteApi;
    this.lockfileWatcher = lockfileWatcher;
  }

  /**
   * Initialize the service when Valorant is running
   */
  async initialize(): Promise<boolean> {
    if (!this.lockfileWatcher.isRunning()) {
      // Valorant not ready yet - this is normal during startup
      return false;
    }

    if (!this.localApi.isInitialized()) {
      // Local API not ready yet - this is normal during startup
      return false;
    }

    try {
      // Get auth tokens
      const authTokens = await this.localApi.getAuthTokens();
      const clientVersion = await this.localApi.getClientVersion();
      const regionInfo = await this.localApi.getRegionInfo();

      // Initialize remote API
      this.remoteApi.initialize(
        authTokens,
        clientVersion,
        regionInfo.region,
        regionInfo.shard
      );

      this.isInitialized = true;
      console.log('[LFGService] Initialized for region:', regionInfo.region);
      return true;
    } catch (error) {
      // Initialization failed - this is expected if Valorant isn't fully loaded
      return false;
    }
  }

  /**
   * Refresh auth tokens
   */
  async refreshTokens(): Promise<boolean> {
    if (!this.localApi.isInitialized()) {
      return false;
    }

    try {
      const authTokens = await this.localApi.getAuthTokens();
      this.remoteApi.updateTokens(authTokens);
      return true;
    } catch (error) {
      console.error('[LFGService] Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Clear service state
   */
  clear(): void {
    this.remoteApi.clear();
    this.isInitialized = false;
    this.currentPartyCode = null;
  }

  /**
   * Get current party info
   */
  async getPartyInfo(): Promise<LFGPartyInfo | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.localApi.isInitialized()) {
      return null;
    }

    try {
      const puuid = await this.localApi.getPlayerPUUID();
      const partyId = await this.localApi.getCurrentPartyId(puuid);

      if (!partyId) {
        return null;
      }

      const party = await this.localApi.getPartyInfo(puuid);
      if (!party) {
        return null;
      }

      return this.mapPartyToLFGInfo(party, puuid);
    } catch (error) {
      console.error('[LFGService] getPartyInfo failed:', error);
      return null;
    }
  }

  /**
   * Generate party invite code
   */
  async generatePartyCode(): Promise<PartyCodeResult> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Valorant not running or not initialized' };
      }
    }

    try {
      const puuid = await this.localApi.getPlayerPUUID();
      const partyId = await this.localApi.getCurrentPartyId(puuid);

      if (!partyId) {
        return { success: false, error: 'Not in a party' };
      }

      const result = await this.remoteApi.generatePartyCode(partyId);

      if (result.success && result.code) {
        this.currentPartyCode = result.code;
      }

      return result;
    } catch (error) {
      console.error('[LFGService] generatePartyCode failed:', error);
      return { success: false, error: 'Failed to generate party code' };
    }
  }

  /**
   * Join party by invite code
   */
  async joinPartyByCode(code: string): Promise<PartyJoinResult> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Valorant not running or not initialized' };
      }
    }

    try {
      // Refresh tokens before joining
      await this.refreshTokens();

      const result = await this.remoteApi.joinPartyByCode(code);
      return result;
    } catch (error) {
      console.error('[LFGService] joinPartyByCode failed:', error);
      return { success: false, error: 'Failed to join party' };
    }
  }

  /**
   * Invite player to party by Riot ID
   */
  async inviteToParty(gameName: string, tagLine: string): Promise<PartyInviteResult> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Valorant not running or not initialized' };
      }
    }

    try {
      const puuid = await this.localApi.getPlayerPUUID();
      const partyId = await this.localApi.getCurrentPartyId(puuid);

      if (!partyId) {
        return { success: false, error: 'Not in a party' };
      }

      const result = await this.remoteApi.inviteToParty(partyId, gameName, tagLine);
      return result;
    } catch (error) {
      console.error('[LFGService] inviteToParty failed:', error);
      return { success: false, error: 'Failed to send invite' };
    }
  }

  /**
   * Leave current party
   */
  async leaveParty(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const puuid = await this.localApi.getPlayerPUUID();
      return await this.remoteApi.leaveParty(puuid);
    } catch {
      return false;
    }
  }

  /**
   * Set party accessibility (open/closed)
   */
  async setPartyOpen(open: boolean): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      const puuid = await this.localApi.getPlayerPUUID();
      const partyId = await this.localApi.getCurrentPartyId(puuid);

      if (!partyId) {
        return false;
      }

      return await this.remoteApi.setPartyAccessibility(partyId, open);
    } catch {
      return false;
    }
  }

  /**
   * Get current party code
   */
  getCurrentPartyCode(): string | null {
    return this.currentPartyCode;
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.remoteApi.isInitialized();
  }

  /**
   * Change the game mode/queue for the current party
   */
  async changeQueue(queueId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return { success: false, error: 'Valorant not running or not initialized' };
      }
    }

    try {
      const puuid = await this.localApi.getPlayerPUUID();

      // Try to get party ID
      let partyId = await this.localApi.getCurrentPartyId(puuid);

      // If no party ID from presences, try getting party info directly
      if (!partyId) {
        const partyInfo = await this.localApi.getPartyInfo(puuid);
        if (partyInfo) {
          partyId = partyInfo.ID;
        }
      }

      if (!partyId) {
        return { success: false, error: 'Not in a party' };
      }

      const result = await this.remoteApi.changeQueue(partyId, queueId);
      if (result.success) {
        console.log('[LFGService] Changed queue to:', queueId);
      }
      return result;
    } catch (error) {
      console.error('[LFGService] changeQueue failed:', error);
      return { success: false, error: 'Failed to change queue' };
    }
  }

  /**
   * Map PartyInfo to LFGPartyInfo
   */
  private mapPartyToLFGInfo(party: PartyInfo, currentPuuid: string): LFGPartyInfo {
    const currentMember = party.Members?.find(m => m.Subject === currentPuuid);

    return {
      partyId: party.ID,
      inviteCode: this.currentPartyCode,
      size: party.Members?.length || 0,
      maxSize: 5,
      isOwner: currentMember?.IsOwner || false,
      members: (party.Members || []).map(m => ({
        puuid: m.Subject,
        gameName: undefined, // Not available in party info
        tagLine: undefined,
        isReady: m.IsReady
      }))
    };
  }
}
