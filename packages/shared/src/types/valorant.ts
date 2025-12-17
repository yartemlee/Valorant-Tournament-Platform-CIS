// Valorant Local API Types
// Based on https://github.com/techchrism/valorant-api-docs

/**
 * Lockfile data parsed from %LocalAppData%\Riot Games\Riot Client\Config\lockfile
 * Format: name:pid:port:password:protocol
 */
export interface LockfileData {
  name: string;
  pid: number;
  port: number;
  password: string;
  protocol: 'https';
}

/**
 * Game status enum
 */
export type ValorantGameStatus =
  | 'not_running'  // Game not running or lockfile not found
  | 'in_menu'      // In main menu
  | 'in_pregame'   // In agent select / pre-game lobby
  | 'in_game'      // In active match
  | 'in_postgame'; // Post-game screen

/**
 * Player in pregame/agent select
 */
export interface PregamePlayer {
  Subject: string;           // Player UUID
  CharacterID: string;       // Agent UUID
  CharacterSelectionState: 'locked' | 'selected' | '';
  PregamePlayerState: 'joined' | 'left';
  CompetitiveTier: number;   // Rank tier (0-27)
  PlayerIdentity: {
    Subject: string;
    PlayerCardID: string;
    PlayerTitleID: string;
    AccountLevel: number;
    PreferredLevelBorderID: string;
    Incognito: boolean;
    HideAccountLevel: boolean;
  };
  SeasonalBadgeInfo: {
    SeasonID: string;
    NumberOfWins: number;
    WinsByTier: Record<string, number> | null;
    Rank: number;
    LeaderboardRank: number;
  };
  IsCaptain: boolean;
}

/**
 * Pregame match info
 */
export interface PregameMatch {
  ID: string;
  Version: number;
  Teams: Array<{
    TeamID: string;
    Players: PregamePlayer[];
  }>;
  AllyTeam: {
    TeamID: string;
    Players: PregamePlayer[];
  };
  EnemyTeam: {
    TeamID: string;
    Players: PregamePlayer[];
  } | null;
  ObserverSubjects: string[];
  MatchCoaches: any[];
  EnemyTeamSize: number;
  EnemyTeamLockCount: number;
  PregameState: 'character_select_active' | 'provisioned' | 'finished';
  LastUpdated: string;
  MapID: string;
  MapSelectPool: any[];
  BannedMapIDs: string[];
  CastedVotes: Record<string, any>;
  MapSelectSteps: any[];
  MapSelectStep: number;
  Team1: string;
  GamePodID: string;
  Mode: string;
  VoiceSessionID: string;
  MUCName: string;
  QueueID: string;
  ProvisioningFlowID: string;
  IsRanked: boolean;
  PhaseTimeRemainingNS: number;
  StepTimeRemainingNS: number;
  altModesFlagADA: boolean;
  TournamentMetadata: any | null;
}

/**
 * Player in active game (coregame)
 */
export interface CoregamePlayer {
  Subject: string;
  TeamID: string;
  CharacterID: string;
  PlayerIdentity: {
    Subject: string;
    PlayerCardID: string;
    PlayerTitleID: string;
    AccountLevel: number;
    PreferredLevelBorderID: string;
    Incognito: boolean;
    HideAccountLevel: boolean;
  };
  SeasonalBadgeInfo: {
    SeasonID: string;
    NumberOfWins: number;
    WinsByTier: Record<string, number> | null;
    Rank: number;
    LeaderboardRank: number;
  };
  IsCoach: boolean;
  IsAssociated: boolean;
}

/**
 * Active game (coregame) info
 */
export interface CoregameMatch {
  MatchID: string;
  Version: number;
  State: 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';
  MapID: string;
  ModeID: string;
  ProvisioningFlow: string;
  GamePodID: string;
  AllMUCName: string;
  TeamMUCName: string;
  TeamVoiceID: string;
  TeamMatchToken: string;
  IsReconnectable: boolean;
  ConnectionDetails: {
    GameServerHosts: string[];
    GameServerHost: string;
    GameServerPort: number;
    GameServerObfuscatedIP: number;
    GameClientHash: number;
    PlayerKey: string;
  };
  PostGameDetails: any | null;
  Players: CoregamePlayer[];
  MatchmakingData: {
    QueueID: string;
    IsRanked: boolean;
  };
}

/**
 * Party/Lobby information
 */
export interface PartyInfo {
  ID: string;
  MUCName: string;
  VoiceRoomID: string;
  Version: number;
  ClientVersion: string;
  Members: Array<{
    Subject: string;
    CompetitiveTier: number;
    PlayerIdentity: {
      Subject: string;
      PlayerCardID: string;
      PlayerTitleID: string;
      AccountLevel: number;
      PreferredLevelBorderID: string;
      Incognito: boolean;
      HideAccountLevel: boolean;
    };
    SeasonalBadgeInfo: {
      SeasonID: string;
      NumberOfWins: number;
      WinsByTier: Record<string, number> | null;
      Rank: number;
      LeaderboardRank: number;
    };
    IsOwner: boolean;
    QueueEligibleRemainingAccountLevels: number;
    Pings: any[];
    IsReady: boolean;
    IsModerator: boolean;
    UseBroadcastHUD: boolean;
    PlatformType: string;
  }>;
  State: 'DEFAULT' | 'MATCHMAKING' | 'IN_MATCH';
  PreviousState: string;
  StateTransitionReason: string;
  Accessibility: 'OPEN' | 'CLOSED';
  CustomGameData: {
    Settings: {
      Map: string;
      Mode: string;
      UseBots: boolean;
      GamePod: string;
      GameRules: any | null;
    };
    Membership: {
      teamOne: any[];
      teamTwo: any[];
      teamSpectate: any[];
      teamOneCoaches: any[];
      teamTwoCoaches: any[];
    };
    MaxPartySize: number;
    AutobalanceEnabled: boolean;
    AutobalanceMinPlayers: number;
    HasRecoveryData: boolean;
  } | null;
  MatchmakingData: {
    QueueID: string;
    PreferredGamePods: string[];
  };
  Invites: any[] | null;
  Requests: any[];
  QueueEntryTime: string;
  ErrorNotification: {
    ErrorType: string;
    ErroredPlayers: any[] | null;
  };
  RestrictedSeconds: number;
  EligibleQueues: string[];
  QueueIneligibilities: string[];
  CheatData: {
    GamePodOverride: string;
    ForcePostGameProcessing: boolean;
  };
  XPBonuses: any[];
}

/**
 * Custom game statistics (post-game)
 */
export interface CustomGameStats {
  matchId: string;
  mapId: string;
  mode: string;
  isRanked: boolean;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;

  // Team results
  teams: Array<{
    teamId: string;
    won: boolean;
    roundsWon: number;
    roundsLost: number;
    players: Array<{
      subject: string;
      gameName: string;
      tagLine: string;
      characterId: string;
      kills: number;
      deaths: number;
      assists: number;
      score: number;
      combatScore: number;
      roundsPlayed: number;
      playtimeMillis: number;
    }>;
  }>;

  // Player stats (current user)
  playerStats: {
    subject: string;
    teamId: string;
    characterId: string;
    kills: number;
    deaths: number;
    assists: number;
    score: number;
    combatScore: number;
    roundsWon: number;
    roundsLost: number;
    isVictory: boolean;
  };

  // Full match stats (raw JSON)
  fullStats: any;
}

/**
 * Simplified lobby info for UI display
 */
export interface ValorantLobbyInfo {
  partyId: string;
  inviteCode: string | null;
  mapId: string | null;
  mode: string | null;
  maxPlayers: number;
  currentPlayers: number;
  players: Array<{
    subject: string;
    isOwner: boolean;
    isReady: boolean;
    rank: number;
  }>;
  isActive: boolean;
  isInGame: boolean;
}

/**
 * Match statistics for sync with Supabase
 */
export interface ValorantMatchStats {
  matchId: string;
  partyId?: string;
  mapId: string;
  mode: string;
  isRanked: boolean;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  roundsWon: number;
  roundsLost: number;
  isVictory?: boolean;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  combatScore: number;
  agentId: string;
  fullStats: any;
}
