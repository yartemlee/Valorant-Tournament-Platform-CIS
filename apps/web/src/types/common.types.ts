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
