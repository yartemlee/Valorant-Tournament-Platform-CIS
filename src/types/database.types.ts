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
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
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
      player_agents: {
        Row: {
          agent_name: string
          created_at: string | null
          id: string
          skill_level: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name: string
          created_at?: string | null
          id?: string
          skill_level: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string | null
          id?: string
          skill_level?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_roles: {
        Row: {
          comfort_level: string
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comfort_level: string
          created_at?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comfort_level?: string
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          current_team_id: string | null
          id: string
          main_agents: string[] | null
          medals_bronze: number | null
          medals_gold: number | null
          medals_silver: number | null
          rank: Database["public"]["Enums"]["valorant_rank"] | null
          region: Database["public"]["Enums"]["valorant_region"] | null
          riot_id: string | null
          social_links: Json | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_team_id?: string | null
          id: string
          main_agents?: string[] | null
          medals_bronze?: number | null
          medals_gold?: number | null
          medals_silver?: number | null
          rank?: Database["public"]["Enums"]["valorant_rank"] | null
          region?: Database["public"]["Enums"]["valorant_region"] | null
          riot_id?: string | null
          social_links?: Json | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          current_team_id?: string | null
          id?: string
          main_agents?: string[] | null
          medals_bronze?: number | null
          medals_gold?: number | null
          medals_silver?: number | null
          rank?: Database["public"]["Enums"]["valorant_rank"] | null
          region?: Database["public"]["Enums"]["valorant_region"] | null
          riot_id?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string
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
      scrim_applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          scrim_id: string
          status: string | null
          team_id: string | null
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          scrim_id: string
          status?: string | null
          team_id?: string | null
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          scrim_id?: string
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrim_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_applications_scrim_id_fkey"
            columns: ["scrim_id"]
            isOneToOne: false
            referencedRelation: "scrims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrim_applications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      scrims: {
        Row: {
          created_at: string
          description: string | null
          host_id: string
          id: string
          max_rank: Database["public"]["Enums"]["valorant_rank"] | null
          min_rank: Database["public"]["Enums"]["valorant_rank"] | null
          region: Database["public"]["Enums"]["valorant_region"] | null
          status: Database["public"]["Enums"]["scrim_status"] | null
          team_size: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          host_id: string
          id?: string
          max_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          region?: Database["public"]["Enums"]["valorant_region"] | null
          status?: Database["public"]["Enums"]["scrim_status"] | null
          team_size?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          host_id?: string
          id?: string
          max_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          region?: Database["public"]["Enums"]["valorant_region"] | null
          status?: Database["public"]["Enums"]["scrim_status"] | null
          team_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scrims_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          message: string | null
          status: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          message?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_applications_team_id_fkey"
            columns: ["team_id"]
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_user_id: string
          status?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_user_id?: string
          status?: string | null
          team_id?: string
          updated_at?: string
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
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
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
          is_recruiting: boolean | null
          last_active_at: string
          logo_url: string | null
          min_rank: Database["public"]["Enums"]["valorant_rank"] | null
          name: string
          tag: string
          updated_at: string
        }
        Insert: {
          captain_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_recruiting?: boolean | null
          last_active_at?: string
          logo_url?: string | null
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          name: string
          tag: string
          updated_at?: string
        }
        Update: {
          captain_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_recruiting?: boolean | null
          last_active_at?: string
          logo_url?: string | null
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          name?: string
          tag?: string
          updated_at?: string
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
      tournament_matches: {
        Row: {
          best_of: number
          bracket_position: number | null
          bracket_type: string
          created_at: string
          id: string
          match_number: number
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
          best_of?: number
          bracket_position?: number | null
          bracket_type: string
          created_at?: string
          id?: string
          match_number: number
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
          best_of?: number
          bracket_position?: number | null
          bracket_type?: string
          created_at?: string
          id?: string
          match_number?: number
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
            foreignKeyName: "tournament_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          id: string
          registered_at: string
          status: string | null
          team_id: string
          tournament_id: string
        }
        Insert: {
          id?: string
          registered_at?: string
          status?: string | null
          team_id: string
          tournament_id: string
        }
        Update: {
          id?: string
          registered_at?: string
          status?: string | null
          team_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          bracket_generated: boolean | null
          created_at: string
          description: string | null
          format: Database["public"]["Enums"]["tournament_format"]
          id: string
          max_teams: number | null
          min_players_per_team: number | null
          organizer_id: string
          prize_pool: string | null
          rules: string | null
          start_time: string
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          bracket_generated?: boolean | null
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          id?: string
          max_teams?: number | null
          min_players_per_team?: number | null
          organizer_id: string
          prize_pool?: string | null
          rules?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          bracket_generated?: boolean | null
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["tournament_format"]
          id?: string
          max_teams?: number | null
          min_players_per_team?: number | null
          organizer_id?: string
          prize_pool?: string | null
          rules?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
          updated_at?: string
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
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
          p_team_id: string
          p_medal_type: string
        }
        Returns: void
      }
      is_admin: {
        Args: never
        Returns: boolean
      }
      is_team_manager: {
        Args: {
          team_id_input: string
        }
        Returns: boolean
      }
      search_available_players: {
        Args: {
          search_term: string
        }
        Returns: {
          id: string
          username: string
          avatar_url: string | null
          riot_id: string | null
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "publisher" | "organizer" | "player"
      match_status: "scheduled" | "live" | "completed" | "cancelled"
      scrim_status: "searching" | "in_progress" | "finished" | "cancelled"
      team_role: "captain" | "coach" | "member"
      tournament_format: "single_elimination" | "double_elimination"
      tournament_status:
      | "draft"
      | "registration"
      | "active"
      | "completed"
      | "cancelled"
      valorant_rank:
      | "Iron 1"
      | "Iron 2"
      | "Iron 3"
      | "Bronze 1"
      | "Bronze 2"
      | "Bronze 3"
      | "Silver 1"
      | "Silver 2"
      | "Silver 3"
      | "Gold 1"
      | "Gold 2"
      | "Gold 3"
      | "Platinum 1"
      | "Platinum 2"
      | "Platinum 3"
      | "Diamond 1"
      | "Diamond 2"
      | "Diamond 3"
      | "Ascendant 1"
      | "Ascendant 2"
      | "Ascendant 3"
      | "Immortal 1"
      | "Immortal 2"
      | "Immortal 3"
      | "Radiant"
      valorant_region: "eu" | "na" | "ap" | "kr" | "br" | "latam"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
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
} as const;
