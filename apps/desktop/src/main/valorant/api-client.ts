import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import type {
  LockfileData,
  PregameMatch,
  CoregameMatch,
  PartyInfo
} from '@shared/types/valorant';

/**
 * Auth tokens from local API for GLZ requests
 */
export interface ValorantAuthTokens {
  accessToken: string;
  entitlementsToken: string;
  subject: string; // Player PUUID
}

/**
 * Client version info
 */
export interface ClientVersionInfo {
  version: string;
  clientPlatform: string; // Base64 encoded
}

export class ValorantLocalAPI {
  private client: AxiosInstance | null = null;
  private lockfileData: LockfileData | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  /**
   * Initialize API client with lockfile data
   */
  initialize(lockfileData: LockfileData): void {
    this.lockfileData = lockfileData;
    this.retryCount = 0;

    // Create axios instance with self-signed certificate support
    this.client = axios.create({
      baseURL: `https://127.0.0.1:${lockfileData.port}`,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Riot Client uses self-signed certificate
      }),
      auth: {
        username: 'riot',
        password: lockfileData.password
      },
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Clear API client
   */
  clear(): void {
    this.client = null;
    this.lockfileData = null;
    this.retryCount = 0;
  }

  /**
   * Check if API client is initialized
   */
  isInitialized(): boolean {
    return this.client !== null;
  }

  /**
   * Get current player PUUID
   */
  async getPlayerPUUID(): Promise<string> {
    try {
      // Try /chat/v1/session first
      const response = await this.request<{ Subject?: string; puuid?: string }>('/chat/v1/session');


      if (response.Subject) {
        return response.Subject;
      }
      if (response.puuid) {
        return response.puuid;
      }

      // Try /entitlements/v1/token as fallback

      const authResponse = await this.request<{ subject?: string }>('/entitlements/v1/token');


      if (authResponse.subject) {
        return authResponse.subject;
      }

      console.error('[ValorantLocalAPI] Could not get PUUID from any endpoint');
      return '';
    } catch (error) {
      console.error('[ValorantLocalAPI] getPlayerPUUID error:', error);
      return '';
    }
  }

  /**
   * Get auth tokens for GLZ API requests
   */
  async getAuthTokens(): Promise<ValorantAuthTokens> {
    const response = await this.request<{
      accessToken: string;
      token: string;
      subject: string;
    }>('/entitlements/v1/token');

    return {
      accessToken: response.accessToken,
      entitlementsToken: response.token,
      subject: response.subject
    };
  }

  /**
   * Get client version for headers
   */
  async getClientVersion(): Promise<ClientVersionInfo> {
    const response = await this.request<{
      branch: string;
      buildVersion: string;
      version: string;
    }>('/product-session/v1/external-sessions');

    // Find Valorant session
    const sessions = response as unknown as Record<string, {
      launchConfiguration: {
        arguments: string[];
      };
    }>;

    let clientVersion = 'release-10.00-shipping-10-0000000.0000000';

    // Try to extract version from session arguments
    for (const session of Object.values(sessions)) {
      const args = session.launchConfiguration?.arguments || [];
      for (const arg of args) {
        if (arg.startsWith('-config-branch=')) {
          clientVersion = arg.replace('-config-branch=', '');
          break;
        }
      }
    }

    // Standard client platform (PC/Windows)
    const clientPlatform = Buffer.from(JSON.stringify({
      platformType: 'PC',
      platformOS: 'Windows',
      platformOSVersion: '10.0.19042.1.256.64bit',
      platformChipset: 'Unknown'
    })).toString('base64');

    return {
      version: clientVersion,
      clientPlatform
    };
  }

  /**
   * Get shard/region from session
   */
  async getRegionInfo(): Promise<{ region: string; shard: string }> {
    const response = await this.request<any>('/product-session/v1/external-sessions');

    // Parse region from session
    const sessions = response as Record<string, any>;
    for (const session of Object.values(sessions)) {
      const args = session.launchConfiguration?.arguments || [];
      for (const arg of args) {
        if (arg.includes('-ares-deployment=')) {
          const deployment = arg.split('=')[1];
          // Parse deployment (e.g., "eu" -> region: "eu", shard: "eu")
          return {
            region: deployment,
            shard: deployment
          };
        }
      }
    }

    // Default to EU if not found
    return { region: 'eu', shard: 'eu' };
  }

  /**
   * Get current party ID for the player
   */
  async getCurrentPartyId(puuid: string): Promise<string | null> {
    try {
      const response = await this.request<any>('/chat/v4/presences');
      const presences = response.presences || [];

      const playerPresence = presences.find((p: any) => p.puuid === puuid);

      if (playerPresence?.private) {
        try {
          const privateData = JSON.parse(
            Buffer.from(playerPresence.private, 'base64').toString()
          );
          return privateData.partyId || null;
        } catch {
          return null;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get pregame info (agent select phase)
   */
  async getPregameInfo(puuid: string): Promise<PregameMatch | null> {
    try {
      const response = await this.request<{ ID: string }>(
        `/pregame/v1/players/${puuid}`
      );

      if (response.ID) {
        return await this.request<PregameMatch>(`/pregame/v1/matches/${response.ID}`);
      }

      return null;
    } catch (error) {
      // Player not in pregame
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get coregame info (active match)
   */
  async getCoregameInfo(puuid: string): Promise<CoregameMatch | null> {
    try {
      const response = await this.request<{ MatchID: string }>(
        `/coregame/v1/players/${puuid}`
      );

      if (response.MatchID) {
        return await this.request<CoregameMatch>(
          `/coregame/v1/matches/${response.MatchID}`
        );
      }

      return null;
    } catch (error) {
      // Player not in active game
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get party/lobby info
   */
  async getPartyInfo(puuid: string): Promise<PartyInfo | null> {
    try {
      const response = await this.request<{ Current: string }>(
        `/chat/v4/presences`
      );

      // Find player's current party ID from presences
      const presences = response as any;
      const playerPresence = presences.presences?.find(
        (p: any) => p.puuid === puuid
      );

      if (playerPresence?.private) {
        const privateData = JSON.parse(
          Buffer.from(playerPresence.private, 'base64').toString()
        );

        if (privateData.partyId) {
          return await this.request<PartyInfo>(`/parties/v1/parties/${privateData.partyId}`);
        }
      }

      return null;
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Generic request method with retry logic
   */
  private async request<T>(endpoint: string): Promise<T> {
    if (!this.client) {
      throw new Error('API client not initialized. Call initialize() first.');
    }

    try {
      const response = await this.client.get<T>(endpoint);
      this.retryCount = 0; // Reset on success
      return response.data;
    } catch (error) {
      return this.handleError<T>(error, endpoint);
    }
  }

  /**
   * Handle request errors with exponential backoff
   */
  private async handleError<T>(error: unknown, endpoint: string): Promise<T> {
    const axiosError = error as AxiosError;

    // Don't retry 404s (not found) - these are expected
    if (axiosError.response?.status === 404) {
      throw error;
    }

    // Handle connection refused - Riot Client/Valorant not running
    // This means the lockfile is stale - clear API to prevent repeated failures
    if (axiosError.code === 'ECONNREFUSED') {
      console.log('[ValorantLocalAPI] Connection refused - clearing stale API connection');
      this.clear(); // Clear API so isInitialized() returns false
      // Throw a controlled error that will be caught by callers
      const err = new Error('Riot Client not available');
      err.name = 'RiotClientUnavailable'; // Mark as expected error
      throw err;
    }

    // Handle connection reset or timeout - these should also clear state
    if (axiosError.code === 'ECONNRESET' || axiosError.code === 'ETIMEDOUT') {
      console.log(`[ValorantLocalAPI] Connection ${axiosError.code} - clearing API`);
      this.clear();
      const err = new Error('Riot Client connection lost');
      err.name = 'RiotClientUnavailable';
      throw err;
    }

    // Retry on network errors or 5xx errors
    if (
      this.retryCount < this.maxRetries &&
      (!axiosError.response || axiosError.response.status >= 500)
    ) {
      this.retryCount++;
      const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff

      await this.sleep(delay);

      // Recursive retry
      return this.request<T>(endpoint);
    }

    // Max retries exceeded or non-retryable error
    throw error;
  }

  /**
   * Check if error is a 404 Not Found
   */
  private isNotFoundError(error: unknown): boolean {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 404;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
