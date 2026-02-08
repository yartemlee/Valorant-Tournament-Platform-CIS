export const queryKeys = {
  profiles: {
    all: ["profile"] as const,
    detail: (id: string) => ["profile", id] as const,
    current: ["current-user-profile"] as const,
    admin: (userId: string) => ["is-admin", userId] as const,
  },
  teams: {
    all: ["teams"] as const,
    list: (filters: { status?: string; search?: string }) =>
      ["teams", filters] as const,
    detail: (id: string) => ["team", id] as const,
    manage: (id: string) => ["team-manage", id] as const,
    medals: (teamId: string) => ["team-medals", teamId] as const,
    managed: (userId: string) => ["managed-teams", userId] as const,
    activity: (teamId: string) => ["team-activity", teamId] as const,
  },
  teamMembers: {
    all: (teamId: string) => ["team-member", teamId] as const,
    role: (teamId: string, userId: string) =>
      ["team-member", teamId, userId] as const,
  },
  teamApplications: {
    all: ["team-applications"] as const,
    byTeam: (teamId: string) => ["team-applications", teamId] as const,
    count: ["team-applications-count"] as const,
    countByUser: (userId: string) =>
      ["team-applications-count", userId] as const,
    my: (userId: string) => ["my-team-applications", userId] as const,
  },
  teamInvitations: {
    sent: (teamId: string) => ["team-invites-sent", teamId] as const,
    my: (userId: string) => ["my-team-invites", userId] as const,
  },
  freeAgents: {
    all: ["free-agent-cards"] as const,
    myCard: (userId: string) => ["my-free-agent-card", userId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    count: (userId: string) => ["notifications-count", userId] as const,
  },
  players: {
    available: (search: string) => ["available-players", search] as const,
  },
  tournaments: {
    all: ["tournaments"] as const,
    list: (filters: Record<string, unknown>) =>
      ["tournaments", filters] as const,
    detail: (id: string) => ["tournaments", id] as const,
  },
  riot: {
    account: (userId: string) => ["riot-account", userId] as const,
    rank: (puuid: string) => ["riot-rank", puuid] as const,
  },
  lfg: {
    lobbies: (filters?: Record<string, unknown>) =>
      filters ? (["lfg-lobbies", filters] as const) : (["lfg-lobbies"] as const),
    myLobby: (userId: string) => ["my-lfg-lobby", userId] as const,
    lobbyRequests: (lobbyId: string) =>
      ["lobby-requests", lobbyId] as const,
    myLobbyRequest: (lobbyId: string, userId: string) =>
      ["my-lobby-request", lobbyId, userId] as const,
    myPendingRequests: (userId: string) =>
      ["my-pending-requests", userId] as const,
    chat: (lobbyId: string) => ["lfg-chat", lobbyId] as const,
  },
  desktop: {
    session: (userId: string) => ["desktop-session", userId] as const,
  },
  session: ["session"] as const,
} as const;
