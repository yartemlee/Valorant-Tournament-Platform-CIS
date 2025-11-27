export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            matches: {
                Row: {
                    bracket_position: number | null
                    created_at: string
                    id: string
                    round_number: number
                    score_team1: number | null
                    score_team2: number | null
                    start_time: string | null
                    status: Database["public"]["Enums"]["match_status"] | null
                    team1_id: string | null
                    team2_id: string | null
                    tournament_id: string
                    winner_id: string | null
                }
                Insert: {
                    bracket_position?: number | null
                    created_at?: string
                    id?: string
                    round_number: number
                    score_team1?: number | null
                    score_team2?: number | null
                    start_time?: string | null
                    status?: Database["public"]["Enums"]["match_status"] | null
                    team1_id?: string | null
                    team2_id?: string | null
                    tournament_id: string
                    winner_id?: string | null
                }
                Update: {
                    bracket_position?: number | null
                    created_at?: string
                    id?: string
                    round_number?: number
                    score_team1?: number | null
                    score_team2?: number | null
                    start_time?: string | null
                    status?: Database["public"]["Enums"]["match_status"] | null
                    team1_id?: string | null
                    team2_id?: string | null
                    tournament_id?: string
                    winner_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "matches_team1_id_fkey"
                        columns: ["team1_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "matches_team2_id_fkey"
                        columns: ["team2_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "matches_tournament_id_fkey"
                        columns: ["tournament_id"]
                        isOneToOne: false
                        referencedRelation: "tournaments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "matches_winner_id_fkey"
                        columns: ["winner_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    created_at: string
                    id: string
                    is_read: boolean | null
                    message: string
                    title: string
                    type: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    is_read?: boolean | null
                    message: string
                    title: string
                    type: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    is_read?: boolean | null
                    message?: string
                    title?: string
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    country: string | null
                    created_at: string
                    current_team_id: string | null
                    discord_username: string | null
                    email: string | null
                    full_name: string | null
                    id: string
                    instagram_username: string | null
                    medals_bronze: number | null
                    medals_gold: number | null
                    medals_silver: number | null
                    riot_id: string | null
                    riot_id_name: string | null
                    riot_id_tag: string | null
                    role: Database["public"]["Enums"]["app_role"] | null
                    show_tracker: boolean | null
                    status: string | null
                    tiktok_username: string | null
                    tracker_gg_username: string | null
                    twitch_username: string | null
                    twitter_username: string | null
                    updated_at: string | null
                    username: string | null
                    youtube_username: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    country?: string | null
                    created_at?: string
                    current_team_id?: string | null
                    discord_username?: string | null
                    email?: string | null
                    full_name?: string | null
                    id: string
                    instagram_username?: string | null
                    medals_bronze?: number | null
                    medals_gold?: number | null
                    medals_silver?: number | null
                    riot_id?: string | null
                    riot_id_name?: string | null
                    riot_id_tag?: string | null
                    role?: Database["public"]["Enums"]["app_role"] | null
                    show_tracker?: boolean | null
                    status?: string | null
                    tiktok_username?: string | null
                    tracker_gg_username?: string | null
                    twitch_username?: string | null
                    twitter_username?: string | null
                    updated_at?: string | null
                    username?: string | null
                    youtube_username?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    country?: string | null
                    created_at?: string
                    current_team_id?: string | null
                    discord_username?: string | null
                    email?: string | null
                    full_name?: string | null
                    id?: string
                    instagram_username?: string | null
                    medals_bronze?: number | null
                    medals_gold?: number | null
                    medals_silver?: number | null
                    riot_id?: string | null
                    riot_id_name?: string | null
                    riot_id_tag?: string | null
                    role?: Database["public"]["Enums"]["app_role"] | null
                    show_tracker?: boolean | null
                    status?: string | null
                    tiktok_username?: string | null
                    tracker_gg_username?: string | null
                    twitch_username?: string | null
                    twitter_username?: string | null
                    updated_at?: string | null
                    username?: string | null
                    youtube_username?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_current_team_id_fkey"
                        columns: ["current_team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            team_invitations: {
                Row: {
                    created_at: string
                    id: string
                    invited_user_id: string
                    status: string | null
                    team_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    invited_user_id: string
                    status?: string | null
                    team_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    invited_user_id?: string
                    status?: string | null
                    team_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_invitations_invited_user_id_fkey"
                        columns: ["invited_user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_invitations_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            team_members: {
                Row: {
                    joined_at: string
                    role: Database["public"]["Enums"]["team_role"] | null
                    team_id: string
                    user_id: string
                }
                Insert: {
                    joined_at?: string
                    role?: Database["public"]["Enums"]["team_role"] | null
                    team_id: string
                    user_id: string
                }
                Update: {
                    joined_at?: string
                    role?: Database["public"]["Enums"]["team_role"] | null
                    team_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_members_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            teams: {
                Row: {
                    captain_id: string
                    created_at: string
                    description: string | null
                    id: string
                    logo_url: string | null
                    name: string
                    updated_at: string | null
                }
                Insert: {
                    captain_id: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    logo_url?: string | null
                    name: string
                    updated_at?: string | null
                }
                Update: {
                    captain_id?: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "teams_captain_id_fkey"
                        columns: ["captain_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tournament_participants: {
                Row: {
                    joined_at: string
                    status: string | null
                    team_id: string
                    tournament_id: string
                }
                Insert: {
                    joined_at?: string
                    status?: string | null
                    team_id: string
                    tournament_id: string
                }
                Update: {
                    joined_at?: string
                    status?: string | null
                    team_id?: string
                    tournament_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "tournament_participants_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tournament_participants_tournament_id_fkey"
                        columns: ["tournament_id"]
                        isOneToOne: false
                        referencedRelation: "tournaments"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tournament_results: {
                Row: {
                    created_at: string
                    id: string
                    place: number
                    points_awarded: number | null
                    prize_money: number | null
                    team_id: string
                    tournament_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    place: number
                    points_awarded?: number | null
                    prize_money?: number | null
                    team_id: string
                    tournament_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    place?: number
                    points_awarded?: number | null
                    prize_money?: number | null
                    team_id?: string
                    tournament_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "tournament_results_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "tournament_results_tournament_id_fkey"
                        columns: ["tournament_id"]
                        isOneToOne: false
                        referencedRelation: "tournaments"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tournaments: {
                Row: {
                    created_at: string
                    description: string | null
                    end_date: string
                    format: Database["public"]["Enums"]["tournament_format"]
                    id: string
                    image_url: string | null
                    max_teams: number
                    min_rank: Database["public"]["Enums"]["valorant_rank"] | null
                    organizer_id: string
                    prize_pool: number
                    region: Database["public"]["Enums"]["valorant_region"]
                    registration_deadline: string
                    start_date: string
                    status: Database["public"]["Enums"]["tournament_status"]
                    title: string
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    end_date: string
                    format: Database["public"]["Enums"]["tournament_format"]
                    id?: string
                    image_url?: string | null
                    max_teams: number
                    min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
                    organizer_id: string
                    prize_pool: number
                    region: Database["public"]["Enums"]["valorant_region"]
                    registration_deadline: string
                    start_date: string
                    status?: Database["public"]["Enums"]["tournament_status"]
                    title: string
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    end_date?: string
                    format?: Database["public"]["Enums"]["tournament_format"]
                    id?: string
                    image_url?: string | null
                    max_teams?: number
                    min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
                    organizer_id?: string
                    prize_pool?: number
                    region?: Database["public"]["Enums"]["valorant_region"]
                    registration_deadline?: string
                    start_date?: string
                    status?: Database["public"]["Enums"]["tournament_status"]
                    title?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tournaments_organizer_id_fkey"
                        columns: ["organizer_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            award_tournament_medals: {
                Args: {
                    p_tournament_id: string
                    p_gold_team_id: string
                    p_silver_team_id: string
                    p_bronze_team_id: string
                }
                Returns: undefined
            }
            check_is_admin: {
                Args: {
                    user_id: string
                }
                Returns: boolean
            }
            check_is_organizer: {
                Args: {
                    user_id: string
                }
                Returns: boolean
            }
            create_tournament_with_organizer: {
                Args: {
                    p_title: string
                    p_description: string
                    p_start_date: string
                    p_end_date: string
                    p_registration_deadline: string
                    p_prize_pool: number
                    p_max_teams: number
                    p_region: Database["public"]["Enums"]["valorant_region"]
                    p_format: Database["public"]["Enums"]["tournament_format"]
                    p_min_rank: Database["public"]["Enums"]["valorant_rank"]
                    p_image_url: string
                }
                Returns: string
            }
            get_team_members_count: {
                Args: {
                    team_id: string
                }
                Returns: number
            }
            handle_new_user: {
                Args: Record<PropertyKey, never>
                Returns: undefined
            }
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            is_organizer: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
            kick_member: {
                Args: {
                    p_team_id: string
                    p_user_id: string
                }
                Returns: undefined
            }
            search_available_players: {
                Args: {
                    search_query: string
                    limit_count?: number
                }
                Returns: {
                    id: string
                    username: string
                    avatar_url: string
                    riot_id: string
                    country: string
                }[]
            }
        }
        Enums: {
            app_role: ["admin", "publisher", "organizer", "player"]
            match_status: ["scheduled", "live", "completed", "cancelled"]
            scrim_status: ["searching", "in_progress", "finished", "cancelled"]
            team_role: ["captain", "coach", "member"]
            tournament_format: ["single_elimination", "double_elimination"]
            tournament_status: [
                "draft",
                "registration",
                "active",
                "completed",
                "cancelled",
            ]
            valorant_rank: [
                "Iron 1",
                "Iron 2",
                "Iron 3",
                "Bronze 1",
                "Bronze 2",
                "Bronze 3",
                "Silver 1",
                "Silver 2",
                "Silver 3",
                "Gold 1",
                "Gold 2",
                "Gold 3",
                "Platinum 1",
                "Platinum 2",
                "Platinum 3",
                "Diamond 1",
                "Diamond 2",
                "Diamond 3",
                "Ascendant 1",
                "Ascendant 2",
                "Ascendant 3",
                "Immortal 1",
                "Immortal 2",
                "Immortal 3",
                "Radiant",
            ]
            valorant_region: ["eu", "na", "ap", "kr", "br", "latam"]
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {
            app_role: ["admin", "publisher", "organizer", "player"],
            match_status: ["scheduled", "live", "completed", "cancelled"],
            scrim_status: ["searching", "in_progress", "finished", "cancelled"],
            team_role: ["captain", "coach", "member"],
            tournament_format: ["single_elimination", "double_elimination"],
            tournament_status: [
                "draft",
                "registration",
                "active",
                "completed",
                "cancelled",
            ],
            valorant_rank: [
                "Iron 1",
                "Iron 2",
                "Iron 3",
                "Bronze 1",
                "Bronze 2",
                "Bronze 3",
                "Silver 1",
                "Silver 2",
                "Silver 3",
                "Gold 1",
                "Gold 2",
                "Gold 3",
                "Platinum 1",
                "Platinum 2",
                "Platinum 3",
                "Diamond 1",
                "Diamond 2",
                "Diamond 3",
                "Ascendant 1",
                "Ascendant 2",
                "Ascendant 3",
                "Immortal 1",
                "Immortal 2",
                "Immortal 3",
                "Radiant",
            ],
            valorant_region: ["eu", "na", "ap", "kr", "br", "latam"],
        },
    },
} as const
