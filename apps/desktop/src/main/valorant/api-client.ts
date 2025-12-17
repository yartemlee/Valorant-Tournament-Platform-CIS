import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import type {
  LockfileData,
  PregameMatch,
  CoregameMatch,
  PartyInfo
} from '@shared/types/valorant';

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
    const response = await this.request<{ Subject: string }>('/chat/v1/session');
    return response.Subject;
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
