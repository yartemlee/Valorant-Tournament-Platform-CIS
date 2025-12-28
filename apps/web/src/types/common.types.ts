import { Database } from './database.types';

export type { Database };

export interface TournamentSettings {
    team_size: number;
    match_format: string;
    veto_enabled: boolean;
    veto_time_limit: number;
    map_pool: string[];
    rank_min: string;
    rank_max: string;
    servers: string[];
}


export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Re-export common entities
export type Profile = Tables<'profiles'>;
export type Team = Tables<'teams'>;
export type TeamMember = Tables<'team_members'>;
export type Tournament = Tables<'tournaments'>;
export type TournamentMatch = Tables<'tournament_matches'>;
export type LfgLobby = Tables<'lfg_lobbies'>;
export type TeamInvitation = Tables<'team_invitations'>;
export type TeamApplication = Tables<'team_applications'>;
export type PlayerRole = Tables<'player_roles'>;
export type PlayerAgent = Tables<'player_agents'>;

// Extended types (joins)
export interface TeamWithMembers extends Team {
    team_members: (TeamMember & {
        profiles: Profile
    })[];
    _count?: {
        team_members: number;
    };
}

export interface UserWithProfile {
    id: string;
    email?: string;
    profile?: Profile;
}

export interface SignInCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials {
    email: string;
    password: string;
    options?: {
        data: {
            username: string;
            full_name?: string;
        };
    };
}

export interface SocialLinks {
    discord?: string;
    twitch?: string;
    youtube?: string;
    tiktok?: string;
    tracker_gg?: string;
    twitter?: string;
    instagram?: string;
}

export type MatchRequestStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';
export type MatchRequestType = 'score_dispute' | 'tech_issue' | 'cheating' | 'other';

export interface MatchRequest {
    id: string;
    match_id: string;
    reporter_id: string;
    request_type: MatchRequestType;
    status: MatchRequestStatus;
    description: string;
    evidence_urls?: string[];
    admin_notes?: string;
    created_at: string;
    updated_at: string;
    resolved_by?: string;
    resolved_at?: string;
}

export type FreeAgentCard = Tables<'free_agent_cards'>;

export interface FreeAgentCardWithProfile extends FreeAgentCard {
    profiles: {
        id: string;
        username: string;
        avatar_url: string | null;
        rank: string | null;
        country: string | null;
    } | null;
    player_roles?: PlayerRole[];
    player_agents?: PlayerAgent[];
}

// Tournament bracket types
export interface TeamInfo {
    name: string;
    tag: string;
    logo_url: string | null;
}

export interface BracketMatch {
    id: string;
    tournament_id: string;
    round_number: number;
    match_number: number;
    bracket_type?: string;
    team1_id: string | null;
    team2_id: string | null;
    team1_score: number | null;
    team2_score: number | null;
    winner_id: string | null;
    loser_id: string | null;
    status: string;
    best_of: number;
    next_match_id?: string | null;
    loser_next_match_id?: string | null;
    scheduled_time?: string | null;
    created_at: string;
    updated_at?: string;
    // Joined team info
    team1?: TeamInfo | null;
    team2?: TeamInfo | null;
}

export interface ParticipantWithTeam {
    id: string;
    tournament_id: string;
    team_id: string;
    seed?: number | null;
    status: string;
    registered_at: string;
    // Joined team info
    team?: Team | null;
}
