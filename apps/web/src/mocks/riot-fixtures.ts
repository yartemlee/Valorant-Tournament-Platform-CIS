// Mock data fixtures for Riot integration DEMO_MODE

export interface MockRank {
  tier: number;
  rank: string;
  rankingInTier?: number;
  leaderboardRank?: number;
}

// Distribution of ranks for realistic demo
export const MOCK_RANKS: MockRank[] = [
  // Radiant (rare)
  { tier: 27, rank: 'Radiant', rankingInTier: 150, leaderboardRank: 423 },

  // Immortal (uncommon)
  { tier: 26, rank: 'Immortal 3', rankingInTier: 80 },
  { tier: 25, rank: 'Immortal 2', rankingInTier: 45 },
  { tier: 24, rank: 'Immortal 1', rankingInTier: 20 },

  // Ascendant (uncommon)
  { tier: 23, rank: 'Ascendant 3', rankingInTier: 75 },
  { tier: 22, rank: 'Ascendant 2', rankingInTier: 50 },
  { tier: 21, rank: 'Ascendant 1', rankingInTier: 25 },

  // Diamond (common)
  { tier: 20, rank: 'Diamond 3', rankingInTier: 85 },
  { tier: 19, rank: 'Diamond 2', rankingInTier: 60 },
  { tier: 18, rank: 'Diamond 1', rankingInTier: 30 },

  // Platinum (common)
  { tier: 17, rank: 'Platinum 3', rankingInTier: 70 },
  { tier: 16, rank: 'Platinum 2', rankingInTier: 45 },
  { tier: 15, rank: 'Platinum 1', rankingInTier: 20 },

  // Gold (most common)
  { tier: 14, rank: 'Gold 3', rankingInTier: 65 },
  { tier: 13, rank: 'Gold 2', rankingInTier: 40 },
  { tier: 12, rank: 'Gold 1', rankingInTier: 15 },

  // Silver (common)
  { tier: 11, rank: 'Silver 3', rankingInTier: 60 },
  { tier: 10, rank: 'Silver 2', rankingInTier: 35 },
  { tier: 9, rank: 'Silver 1', rankingInTier: 10 },

  // Bronze (uncommon in platform context)
  { tier: 8, rank: 'Bronze 3', rankingInTier: 55 },
  { tier: 7, rank: 'Bronze 2', rankingInTier: 30 },
  { tier: 6, rank: 'Bronze 1', rankingInTier: 5 },
];

// Weighted selection (higher ranks more common for tournament players)
const RANK_WEIGHTS = [
  // Radiant
  1,
  // Immortal
  3, 4, 5,
  // Ascendant
  8, 10, 12,
  // Diamond
  15, 18, 20,
  // Platinum
  18, 15, 12,
  // Gold
  10, 8, 6,
  // Silver
  4, 3, 2,
  // Bronze
  1, 1, 1,
];

export function getRandomDemoRank(): MockRank {
  const totalWeight = RANK_WEIGHTS.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < MOCK_RANKS.length; i++) {
    random -= RANK_WEIGHTS[i];
    if (random <= 0) {
      return { ...MOCK_RANKS[i] };
    }
  }

  // Fallback
  return { ...MOCK_RANKS[Math.floor(MOCK_RANKS.length / 2)] };
}

// Mock Riot ID generators
const MOCK_NAMES = [
  'ValorantPro', 'AimBot', 'HeadshotKing', 'PhoenixMain',
  'JettDiff', 'SageSupport', 'CypherCam', 'OmenShadow',
  'RazeBoom', 'BrimstoneSmoke', 'KilljoyTurret', 'ViperixPit',
  'SovaArrow', 'BreachFlash', 'SkyeDog', 'AstraStars',
  'YoruTeleport', 'KayoKnife', 'ChamberOP', 'NeonSpeed',
  'FadeHaunt', 'HarborWall', 'GekkoGlob', 'DeadlockNet',
  'IsoShield', 'CloveSmoke', 'VyseShatter', 'TejoCrush',
];

export function generateMockRiotId(): { name: string; tag: string } {
  const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  const suffix = Math.floor(Math.random() * 9999);
  const tag = String(1000 + Math.floor(Math.random() * 9000));

  return {
    name: `${name}${suffix}`,
    tag,
  };
}

export function generateMockPuuid(): string {
  const chars = 'abcdef0123456789';
  let puuid = 'DEMO-';
  for (let i = 0; i < 8; i++) {
    puuid += chars[Math.floor(Math.random() * chars.length)];
  }
  puuid += '-';
  for (let i = 0; i < 4; i++) {
    puuid += chars[Math.floor(Math.random() * chars.length)];
  }
  puuid += '-';
  for (let i = 0; i < 4; i++) {
    puuid += chars[Math.floor(Math.random() * chars.length)];
  }
  puuid += '-';
  for (let i = 0; i < 12; i++) {
    puuid += chars[Math.floor(Math.random() * chars.length)];
  }
  return puuid;
}
