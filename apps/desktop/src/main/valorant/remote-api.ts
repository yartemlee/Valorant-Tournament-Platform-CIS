import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import type { ValorantAuthTokens, ClientVersionInfo } from './api-client';
import type { PartyInfo } from '@shared/types/valorant';

/**
 * Result of party code generation
 */
export interface PartyCodeResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * Result of joining party by code
 */
export interface PartyJoinResult {
  success: boolean;
  partyId?: string;
  error?: string;
}

/**
 * Result of party invite
 */
export interface PartyInviteResult {
  success: boolean;
  error?: string;
}

/**
 * Result of changing queue/game mode
 */
export interface ChangeQueueResult {
  success: boolean;
  error?: string;
}

/**
 * Known Valorant Queue IDs
 * These map to game modes in Valorant
 */
export const VALORANT_QUEUE_IDS = {
  competitive: 'competitive',
  unrated: 'unrated',
  spikerush: 'spikerush',
  deathmatch: 'deathmatch',
  ggteam: 'ggteam', // Escalation
  onefa: 'onefa', // Replication
  swiftplay: 'swiftplay',
  hurm: 'hurm', // Team Deathmatch
  snowball: 'snowball', // Snowball Fight (seasonal)
  custom: '', // Custom games don't use queue
} as const;

export type ValorantQueueId = keyof typeof VALORANT_QUEUE_IDS;

/**
 * ValorantRemoteAPI - GLZ API for party management
 * Uses Riot's GLZ servers for party-related operations
 */
export class ValorantRemoteAPI {
  private client: AxiosInstance | null = null;
  private authTokens: ValorantAuthTokens | null = null;
  private clientVersion: ClientVersionInfo | null = null;
  private region: string = 'eu';
  private shard: string = 'eu';

  /**
   * Initialize the remote API with auth tokens and version info
   */
  initialize(
    authTokens: ValorantAuthTokens,
    clientVersion: ClientVersionInfo,
    region: string,
    shard: string
  ): void {
    this.authTokens = authTokens;
    this.clientVersion = clientVersion;
    this.region = region;
    this.shard = shard;

    const baseURL = `https://glz-${region}-1.${shard}.a.pvp.net`;

    this.client = axios.create({
      baseURL,
      httpsAgent: new https.Agent({
        rejectUnauthorized: true
      }),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Riot-ClientPlatform': clientVersion.clientPlatform,
        'X-Riot-ClientVersion': clientVersion.version,
        'X-Riot-Entitlements-JWT': authTokens.entitlementsToken,
        'Authorization': `Bearer ${authTokens.accessToken}`
      }
    });
  }

  /**
   * Update auth tokens (when they refresh)
   */
  updateTokens(authTokens: ValorantAuthTokens): void {
    this.authTokens = authTokens;
    if (this.client) {
      this.client.defaults.headers['Authorization'] = `Bearer ${authTokens.accessToken}`;
      this.client.defaults.headers['X-Riot-Entitlements-JWT'] = authTokens.entitlementsToken;
    }
  }

  /**
   * Check if API is initialized
   */
  isInitialized(): boolean {
    return this.client !== null && this.authTokens !== null;
  }

  /**
   * Clear API client
   */
  clear(): void {
    this.client = null;
    this.authTokens = null;
    this.clientVersion = null;
  }

  /**
   * Generate party invite code
   * POST /parties/v1/parties/{partyId}/invitecode
   */
  async generatePartyCode(partyId: string): Promise<PartyCodeResult> {
    if (!this.client) {
      return { success: false, error: 'API not initialized' };
    }

    try {
      const response = await this.client.post<PartyInfo>(
        `/parties/v1/parties/${partyId}/invitecode`
      );

      // The response contains the updated party info with InviteCode
      const inviteCode = (response.data as any).InviteCode;

      if (inviteCode) {
        return { success: true, code: inviteCode };
      }

      return { success: false, error: 'No invite code in response' };
    } catch (error) {
      return this.handleError(error, 'generatePartyCode');
    }
  }

  /**
   * Join party by invite code
   * POST /parties/v1/players/joinbycode/{code}
   */
  async joinPartyByCode(code: string): Promise<PartyJoinResult> {
    if (!this.client) {
      return { success: false, error: 'API not initialized' };
    }

    try {
      const response = await this.client.post<{
        Subject: string;
        CurrentPartyID: string;
      }>(`/parties/v1/players/joinbycode/${code}`);

      return {
        success: true,
        partyId: response.data.CurrentPartyID
      };
    } catch (error) {
      return this.handleError(error, 'joinPartyByCode');
    }
  }

  /**
   * Invite player to party by Riot ID
   * POST /parties/v1/parties/{partyId}/invites/name/{name}/tag/{tag}
   */
  async inviteToParty(partyId: string, gameName: string, tagLine: string): Promise<PartyInviteResult> {
    if (!this.client) {
      return { success: false, error: 'API not initialized' };
    }

    try {
      // URL encode the name and tag
      const encodedName = encodeURIComponent(gameName);
      const encodedTag = encodeURIComponent(tagLine);

      await this.client.post(
        `/parties/v1/parties/${partyId}/invites/name/${encodedName}/tag/${encodedTag}`
      );

      return { success: true };
    } catch (error) {
      return this.handleError(error, 'inviteToParty');
    }
  }

  /**
   * Get party info by ID
   * GET /parties/v1/parties/{partyId}
   */
  async getPartyInfo(partyId: string): Promise<PartyInfo | null> {
    if (!this.client) {
      return null;
    }

    try {
      const response = await this.client.get<PartyInfo>(
        `/parties/v1/parties/${partyId}`
      );
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Leave current party
   * POST /parties/v1/players/{puuid}/leave
   */
  async leaveParty(puuid: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.post(`/parties/v1/players/${puuid}/leave`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Set party to open/closed
   * POST /parties/v1/parties/{partyId}/accessibility
   */
  async setPartyAccessibility(partyId: string, open: boolean): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.post(`/parties/v1/parties/${partyId}/accessibility`, {
        accessibility: open ? 'OPEN' : 'CLOSED'
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Change party queue/game mode
   * POST /parties/v1/parties/{partyId}/queue
   */
  async changeQueue(partyId: string, queueId: string): Promise<ChangeQueueResult> {
    if (!this.client) {
      return { success: false, error: 'API not initialized' };
    }

    // Skip for custom games (they don't use queue)
    if (!queueId) {
      return { success: true };
    }

    try {
      await this.client.post(`/parties/v1/parties/${partyId}/queue`, {
        queueId: queueId
      });

      console.log(`[ValorantRemoteAPI] Changed queue to: ${queueId}`);
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'changeQueue');
    }
  }

  /**
   * Handle API errors
   */
  private handleError<T extends { success: false; error: string }>(
    error: unknown,
    operation: string
  ): T {
    const axiosError = error as AxiosError<{ errorCode?: string; message?: string }>;

    let errorMessage = `${operation} failed`;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      switch (status) {
        case 400:
          errorMessage = data?.message || 'Bad request';
          break;
        case 401:
          errorMessage = 'Authentication failed - tokens may be expired';
          break;
        case 403:
          errorMessage = 'Access denied';
          break;
        case 404:
          errorMessage = 'Party or player not found';
          break;
        case 429:
          errorMessage = 'Rate limited - too many requests';
          break;
        default:
          errorMessage = data?.message || `Server error (${status})`;
      }
    } else if (axiosError.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Valorant servers';
    } else if (axiosError.code === 'ETIMEDOUT') {
      errorMessage = 'Request timed out';
    }

    console.error(`[ValorantRemoteAPI] ${operation} error:`, errorMessage);

    return { success: false, error: errorMessage } as T;
  }
}
