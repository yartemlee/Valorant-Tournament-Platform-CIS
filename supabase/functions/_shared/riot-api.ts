о// Riot API client for RSO (Riot Sign On) integration

export interface RiotTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface RiotAccountInfo {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotRankData {
  currenttier: number;
  currenttierpatched: string;
  ranking_in_tier: number;
  mmr_change_to_last_game: number;
  elo: number;
  games_needed_for_rating: number;
  old: boolean;
}

// Region to shard mapping for Riot API
const REGION_SHARDS: Record<string, string> = {
  'eu': 'europe',
  'na': 'americas',
  'ap': 'asia',
  'kr': 'asia',
  'br': 'americas',
  'latam': 'americas',
};

// Tier number to rank name mapping
export const TIER_TO_RANK: Record<number, string> = {
  0: 'Unranked',
  3: 'Iron 1', 4: 'Iron 2', 5: 'Iron 3',
  6: 'Bronze 1', 7: 'Bronze 2', 8: 'Bronze 3',
  9: 'Silver 1', 10: 'Silver 2', 11: 'Silver 3',
  12: 'Gold 1', 13: 'Gold 2', 14: 'Gold 3',
  15: 'Platinum 1', 16: 'Platinum 2', 17: 'Platinum 3',
  18: 'Diamond 1', 19: 'Diamond 2', 20: 'Diamond 3',
  21: 'Ascendant 1', 22: 'Ascendant 2', 23: 'Ascendant 3',
  24: 'Immortal 1', 25: 'Immortal 2', 26: 'Immortal 3',
  27: 'Radiant',
};

export class RiotApiClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private apiKey: string;

  constructor() {
    this.clientId = Deno.env.get('RIOT_CLIENT_ID') || '';
    this.clientSecret = Deno.env.get('RIOT_CLIENT_SECRET') || '';
    this.redirectUri = Deno.env.get('RIOT_REDIRECT_URI') || '';
    this.apiKey = Deno.env.get('RIOT_API_KEY') || '';
  }

  /**
   * Generate OAuth authorization URL for RSO
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid',
      state: state,
    });

    return `https://auth.riotgames.com/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access/refresh tokens
   */
  async exchangeCodeForTokens(code: string): Promise<RiotTokenResponse> {
    const response = await fetch('https://auth.riotgames.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<RiotTokenResponse> {
    const response = await fetch('https://auth.riotgames.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get account info (PUUID and Riot ID) using access token
   */
  async getAccountInfo(accessToken: string): Promise<RiotAccountInfo> {
    const response = await fetch('https://europe.api.riotgames.com/riot/account/v1/accounts/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Account info request failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get ranked info by PUUID using API key
   * Note: This requires val-ranked-v1 endpoint access
   */
  async getRankInfo(puuid: string, region: string = 'eu'): Promise<RiotRankData | null> {
    const shard = REGION_SHARDS[region] || 'europe';

    const response = await fetch(
      `https://${shard}.api.riotgames.com/val/ranked/v1/by-puuid/${puuid}`,
      {
        headers: {
          'X-Riot-Token': this.apiKey,
        },
      }
    );

    if (response.status === 404) {
      // Player has no ranked data
      return null;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Rank info request failed: ${error}`);
    }

    return response.json();
  }
}

// Demo mode mock data
export const DEMO_RANKS = [
  { tier: 27, rank: 'Radiant', rankingInTier: 150 },
  { tier: 26, rank: 'Immortal 3', rankingInTier: 80 },
  { tier: 25, rank: 'Immortal 2', rankingInTier: 45 },
  { tier: 24, rank: 'Immortal 1', rankingInTier: 20 },
  { tier: 23, rank: 'Ascendant 3', rankingInTier: 75 },
  { tier: 22, rank: 'Ascendant 2', rankingInTier: 50 },
  { tier: 21, rank: 'Ascendant 1', rankingInTier: 25 },
  { tier: 20, rank: 'Diamond 3', rankingInTier: 85 },
  { tier: 19, rank: 'Diamond 2', rankingInTier: 60 },
  { tier: 18, rank: 'Diamond 1', rankingInTier: 30 },
  { tier: 17, rank: 'Platinum 3', rankingInTier: 70 },
  { tier: 16, rank: 'Platinum 2', rankingInTier: 45 },
  { tier: 15, rank: 'Platinum 1', rankingInTier: 20 },
];

export function getRandomDemoRank() {
  return DEMO_RANKS[Math.floor(Math.random() * DEMO_RANKS.length)];
}
