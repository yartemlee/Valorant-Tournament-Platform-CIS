import { Database } from './database.types';
export type { Database };

// Common database table types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Team = Database['public']['Tables']['teams']['Row'];
export type Tournament = Database['public']['Tables']['tournaments']['Row'] & {
    bracket_generated?: boolean;
};
export type Participant = Database['public']['Tables']['tournament_registrations']['Row'];
export type Match = Database['public']['Tables']['matches']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type TournamentRegistration = Database['public']['Tables']['tournament_registrations']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type TeamInsert = Database['public']['Tables']['teams']['Insert'];
export type TournamentInsert = Database['public']['Tables']['tournaments']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type TeamUpdate = Database['public']['Tables']['teams']['Update'];
export type TournamentUpdate = Database['public']['Tables']['tournaments']['Update'];

// Enums
export type AppRole = Database['public']['Enums']['app_role'];
export type TournamentStatus = Database['public']['Enums']['tournament_status'];
export type TournamentFormat = Database['public']['Enums']['tournament_format'];
export type MatchStatus = Database['public']['Enums']['match_status'];
export type TeamRole = Database['public']['Enums']['team_role'];
export type ValorantRank = Database['public']['Enums']['valorant_rank'];
export type ValorantRegion = Database['public']['Enums']['valorant_region'];

// Auth types
export interface SignInCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials {
    email: string;
    password: string;
    options?: {
        data?: {
            username?: string;
        };
    };
}

// Extended types with relations
export interface ProfileWithTeam extends Profile {
    team?: Team | null;
}

export interface TeamWithMembers extends Team {
    team_members: Array<TeamMember & { profiles: Profile | null }>;
}

export interface TournamentWithRegistrations extends Tournament {
    tournament_registrations: TournamentRegistration[];
}

// Utility functions for error handling
export function isError(error: unknown): error is Error {
    return error instanceof Error;
}

export function getErrorMessage(error: unknown): string {
    if (isError(error)) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Неизвестная ошибка';
}

// Player agents type
import type { AgentProficiencyLevel, RoleProficiencyLevel } from '@/constants/proficiency';

export interface PlayerAgent {
    id: string;
    user_id: string;
    agent_name: string;
    skill_level: AgentProficiencyLevel;
    created_at: string;
    updated_at?: string;
}

// Player roles type
export interface PlayerRole {
    id: string;
    user_id: string;
    role: 'duelist' | 'initiator' | 'controller' | 'sentinel';
    comfort_level: RoleProficiencyLevel;
    created_at: string;
    updated_at?: string;
}

// Achievement types
export interface Achievement {
    id: string;
    name: string;
    description: string;
    category: string;
    icon_url?: string;
    created_at: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    earned_at: string;
    tournament_name?: string;
    achievement?: Achievement;
}

// Form data types for settings
export interface ProfileFormData {
    country: string;
    phone_number: string;
    status: string;
    about_me: string;
}

export interface SocialLinksData {
    twitch_url?: string;
    twitter_url?: string;
    youtube_url?: string;
    instagram_url?: string;
    vk_url?: string;
}

export interface SocialLinks {
    discord?: string;
    twitch?: string;
    youtube?: string;
    tiktok?: string;
    tracker_gg?: string;
    twitter?: string;
}

export interface BracketMatch extends Match {
    match_number: number;
    bracket_type: string;
    bracket_position: number | null;
    team1?: {
        name: string;
        tag: string;
        logo_url: string | null;
    };
    team2?: {
        name: string;
        tag: string;
        logo_url: string | null;
    };
}

export interface ParticipantWithTeam extends Participant {
    team: {
        name: string;
        tag: string;
        logo_url: string | null;
    } | null;
}
