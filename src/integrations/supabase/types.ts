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
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      player_agents: {
        Row: {
          agent_name: string
          created_at: string | null
          id: string
          skill_level: Database["public"]["Enums"]["comfort_level"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name: string
          created_at?: string | null
          id?: string
          skill_level?: Database["public"]["Enums"]["comfort_level"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string | null
          id?: string
          skill_level?: Database["public"]["Enums"]["comfort_level"]
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
          comfort_level: Database["public"]["Enums"]["comfort_level"]
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["valorant_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comfort_level?: Database["public"]["Enums"]["comfort_level"]
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["valorant_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comfort_level?: Database["public"]["Enums"]["comfort_level"]
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["valorant_role"]
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
      profiles: {
        Row: {
          about_me: string | null
          avatar_url: string | null
          country: string | null
          created_at: string
          current_rank: string | null
          current_team_id: string | null
          date_of_birth: string | null
          discord_notifications: boolean | null
          discord_username: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          is_phantom: boolean | null
          medals_bronze: number | null
          medals_gold: number | null
          medals_silver: number | null
          newsletter_subscribed: boolean | null
          peak_rank: string | null
          phantom_source: string | null
          phone_number: string | null
          riot_id: string | null
          riot_linked: boolean | null
          riot_tag: string | null
          show_country: boolean | null
          show_social_links: boolean | null
          show_statistics: boolean | null
          status: string | null
          tiktok_username: string | null
          token_balance: number
          tracker_gg_username: string | null
          twitch_username: string | null
          twitter_username: string | null
          updated_at: string
          username: string
          youtube_username: string | null
        }
        Insert: {
          about_me?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          current_rank?: string | null
          current_team_id?: string | null
          date_of_birth?: string | null
          discord_notifications?: boolean | null
          discord_username?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          is_phantom?: boolean | null
          medals_bronze?: number | null
          medals_gold?: number | null
          medals_silver?: number | null
          newsletter_subscribed?: boolean | null
          peak_rank?: string | null
          phantom_source?: string | null
          phone_number?: string | null
          riot_id?: string | null
          riot_linked?: boolean | null
          riot_tag?: string | null
          show_country?: boolean | null
          show_social_links?: boolean | null
          show_statistics?: boolean | null
          status?: string | null
          tiktok_username?: string | null
          token_balance?: number
          tracker_gg_username?: string | null
          twitch_username?: string | null
          twitter_username?: string | null
          updated_at?: string
          username: string
          youtube_username?: string | null
        }
        Update: {
          about_me?: string | null
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          current_rank?: string | null
          current_team_id?: string | null
          date_of_birth?: string | null
          discord_notifications?: boolean | null
          discord_username?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          is_phantom?: boolean | null
          medals_bronze?: number | null
          medals_gold?: number | null
          medals_silver?: number | null
          newsletter_subscribed?: boolean | null
          peak_rank?: string | null
          phantom_source?: string | null
          phone_number?: string | null
          riot_id?: string | null
          riot_linked?: boolean | null
          riot_tag?: string | null
          show_country?: boolean | null
          show_social_links?: boolean | null
          show_statistics?: boolean | null
          status?: string | null
          tiktok_username?: string | null
          token_balance?: number
          tracker_gg_username?: string | null
          twitch_username?: string | null
          twitter_username?: string | null
          updated_at?: string
          username?: string
          youtube_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_current_team"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_applications: {
        Row: {
          created_at: string | null
          from_user_id: string
          id: string
          note: string | null
          status: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_user_id: string
          id?: string
          note?: string | null
          status?: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_user_id?: string
          id?: string
          note?: string | null
          status?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_applications_from_user_id_fkey"
            columns: ["from_user_id"]
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
      team_invites: {
        Row: {
          created_at: string | null
          id: string
          status: string
          team_id: string
          to_user_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string
          team_id: string
          to_user_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string
          team_id?: string
          to_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          is_phantom: boolean | null
          joined_at: string | null
          team_id: string
          team_role: string
          user_id: string
        }
        Insert: {
          id?: string
          is_phantom?: boolean | null
          joined_at?: string | null
          team_id: string
          team_role?: string
          user_id: string
        }
        Update: {
          id?: string
          is_phantom?: boolean | null
          joined_at?: string | null
          team_id?: string
          team_role?: string
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
          created_at: string | null
          description: string | null
          id: string
          is_phantom: boolean | null
          is_recruiting: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          phantom_source: string | null
          tag: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_phantom?: boolean | null
          is_recruiting?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          phantom_source?: string | null
          tag: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_phantom?: boolean | null
          is_recruiting?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phantom_source?: string | null
          tag?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tournament_matches: {
        Row: {
          best_of: number | null
          bracket_type: string
          created_at: string | null
          id: string
          loser_id: string | null
          match_number: number
          round_number: number
          scheduled_time: string | null
          status: string | null
          team1_id: string | null
          team1_score: number | null
          team2_id: string | null
          team2_score: number | null
          tournament_id: string
          updated_at: string | null
          winner_id: string | null
        }
        Insert: {
          best_of?: number | null
          bracket_type: string
          created_at?: string | null
          id?: string
          loser_id?: string | null
          match_number: number
          round_number: number
          scheduled_time?: string | null
          status?: string | null
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          tournament_id: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Update: {
          best_of?: number | null
          bracket_type?: string
          created_at?: string | null
          id?: string
          loser_id?: string | null
          match_number?: number
          round_number?: number
          scheduled_time?: string | null
          status?: string | null
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          tournament_id?: string
          updated_at?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_loser_id_fkey"
            columns: ["loser_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_medals: {
        Row: {
          created_at: string | null
          id: string
          placement: number
          tournament_date: string
          tournament_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          placement: number
          tournament_date: string
          tournament_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          placement?: number
          tournament_date?: string
          tournament_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_medals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_notifications: {
        Row: {
          created_at: string | null
          id: string
          notification_type: string
          sent_at: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_type: string
          sent_at?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_notifications_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          id: string
          is_phantom: boolean | null
          joined_at: string | null
          status: string | null
          team_id: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_phantom?: boolean | null
          joined_at?: string | null
          status?: string | null
          team_id?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_phantom?: boolean | null
          joined_at?: string | null
          status?: string | null
          team_id?: string | null
          tournament_id?: string
          user_id?: string
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
          {
            foreignKeyName: "tournament_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_results: {
        Row: {
          created_at: string | null
          first_place_team_ids: string[] | null
          id: string
          second_place_team_ids: string[] | null
          third_place_team_ids: string[] | null
          tournament_id: string
        }
        Insert: {
          created_at?: string | null
          first_place_team_ids?: string[] | null
          id?: string
          second_place_team_ids?: string[] | null
          third_place_team_ids?: string[] | null
          tournament_id: string
        }
        Update: {
          created_at?: string | null
          first_place_team_ids?: string[] | null
          id?: string
          second_place_team_ids?: string[] | null
          third_place_team_ids?: string[] | null
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          bracket_format: string
          bracket_generated: boolean | null
          created_at: string | null
          date_start: string
          description: string | null
          id: string
          name: string
          owner_id: string
          participant_limit: number | null
          prize: string | null
          region: string | null
          registration_open: boolean | null
          rules: string | null
          started_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          bracket_format: string
          bracket_generated?: boolean | null
          created_at?: string | null
          date_start: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          participant_limit?: number | null
          prize?: string | null
          region?: string | null
          registration_open?: boolean | null
          rules?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          bracket_format?: string
          bracket_generated?: boolean | null
          created_at?: string | null
          date_start?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          participant_limit?: number | null
          prize?: string | null
          region?: string | null
          registration_open?: boolean | null
          rules?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          tournament_name: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          tournament_name?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          tournament_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
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
      get_email_by_username: {
        Args: { username_input: string }
        Returns: string
      }
      internal_cleanup_team_phantoms: {
        Args: { team_id_input: string }
        Returns: Json
      }
      internal_cleanup_tournament_phantoms: {
        Args: { tournament_id_input: string }
        Returns: Json
      }
      is_or_was_team_captain: {
        Args: { team_id_input: string; user_to_update: string }
        Returns: boolean
      }
      is_team_captain_or_coach: {
        Args: { team_id_input: string }
        Returns: boolean
      }
      kick_member: {
        Args: { member_user_id: string; team_id_input: string }
        Returns: Json
      }
      list_teams_public: {
        Args: { search?: string; status?: string }
        Returns: {
          created_at: string
          id: string
          is_recruiting: boolean
          logo_url: string
          name: string
          tag: string
        }[]
      }
      rpc_apply_to_team: {
        Args: { note?: string; target_team_id: string }
        Returns: Json
      }
      rpc_cleanup_team_phantoms: {
        Args: { team_id_input: string }
        Returns: Json
      }
      rpc_cleanup_tournament_phantoms: {
        Args: { tournament_id_input: string }
        Returns: Json
      }
      rpc_fill_team_roster: {
        Args: { max_size?: number; min_size?: number; team_id_input: string }
        Returns: Json
      }
      rpc_fill_tournament: {
        Args: { desired_size?: number; tournament_id_input: string }
        Returns: Json
      }
      set_member_role: {
        Args: {
          member_user_id: string
          new_role: string
          team_id_input: string
        }
        Returns: Json
      }
      transfer_captain: {
        Args: { new_captain_user_id: string; target_team_id: string }
        Returns: Json
      }
      update_team_settings: {
        Args: {
          new_description?: string
          new_is_recruiting?: boolean
          new_logo_url?: string
          new_name?: string
          new_tag?: string
          team_id_input: string
        }
        Returns: Json
      }
    }
    Enums: {
      comfort_level: "not_played" | "learning" | "average" | "good" | "perfect"
      valorant_role: "duelist" | "initiator" | "controller" | "sentinel"
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
      comfort_level: ["not_played", "learning", "average", "good", "perfect"],
      valorant_role: ["duelist", "initiator", "controller", "sentinel"],
    },
  },
} as const
