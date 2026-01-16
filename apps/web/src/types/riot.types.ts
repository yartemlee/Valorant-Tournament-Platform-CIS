// Types for Riot Sign On (RSO) integration

export interface RiotAccount {
  id: string;
  user_id: string;
  puuid: string;
  riot_id_name: string;
  riot_id_tag: string;
  verification_status: 'pending' | 'verified' | 'expired' | 'revoked';
  verified_at: string | null;
  region: string;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}

export interface RiotRankInfo {
  rank: string;
  tier: number;
  rankingInTier?: number;
  leaderboardRank?: number;
  cached?: boolean;
  expiresAt?: string;
  demo?: boolean;
}

export interface RiotRankCache {
  id: string;
  puuid: string;
  current_tier: number | null;
  current_rank: string | null;
  ranking_in_tier: number | null;
  leaderboard_rank: number | null;
  peak_tier: number | null;
  peak_rank: string | null;
  act_id: string;
  act_name: string | null;
  wins: number;
  games_played: number;
  fetched_at: string;
  expires_at: string;
}

export type RiotLinkStatus =
  | 'not_linked'
  | 'pending'
  | 'verified'
  | 'expired'
  | 'revoked'
  | 'error'
  | 'loading';

export interface RiotAuthInitResponse {
  url: string;
  demo: boolean;
}

export interface RiotSyncRankResponse extends RiotRankInfo {
  error?: string;
  code?: string;
  retryAfterMinutes?: number;
}

// Tier number to rank name mapping (client-side reference)
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

// Rank to color mapping for UI
export const RANK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Unranked': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  'Iron': { bg: 'bg-zinc-500/20', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  'Bronze': { bg: 'bg-amber-700/20', text: 'text-amber-600', border: 'border-amber-700/30' },
  'Silver': { bg: 'bg-slate-400/20', text: 'text-slate-300', border: 'border-slate-400/30' },
  'Gold': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  'Platinum': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  'Diamond': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  'Ascendant': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  'Immortal': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  'Radiant': { bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20', text: 'text-yellow-300', border: 'border-yellow-500/30' },
};

export function getRankColorClass(rank: string): { bg: string; text: string; border: string } {
  // Extract base rank name (e.g., "Diamond 2" -> "Diamond")
  const baseRank = rank.split(' ')[0];
  return RANK_COLORS[baseRank] || RANK_COLORS['Unranked'];
}
