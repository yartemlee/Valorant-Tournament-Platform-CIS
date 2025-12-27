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
          created_at: string
          description: string
          icon_url: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon_url?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      desktop_sessions: {
        Row: {
          created_at: string
          current_party_code: string | null
          current_party_id: string | null
          id: string
          is_online: boolean | null
          last_heartbeat: string | null
          party_size: number | null
          player_puuid: string | null
          updated_at: string
          user_id: string
          valorant_running: boolean | null
          valorant_status: string | null
        }
        Insert: {
          created_at?: string
          current_party_code?: string | null
          current_party_id?: string | null
          id?: string
          is_online?: boolean | null
          last_heartbeat?: string | null
          party_size?: number | null
          player_puuid?: string | null
          updated_at?: string
          user_id: string
          valorant_running?: boolean | null
          valorant_status?: string | null
        }
        Update: {
          created_at?: string
          current_party_code?: string | null
          current_party_id?: string | null
          id?: string
          is_online?: boolean | null
          last_heartbeat?: string | null
          party_size?: number | null
          player_puuid?: string | null
          updated_at?: string
          user_id?: string
          valorant_running?: boolean | null
          valorant_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "desktop_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_agent_cards: {
        Row: {
          created_at: string | null
          id: string
          intro: string
          is_active: boolean | null
          preferred_roles: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          intro: string
          is_active?: boolean | null
          preferred_roles?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          intro?: string
          is_active?: boolean | null
          preferred_roles?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_agent_cards_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lfg_lobbies: {
        Row: {
          created_at: string
          current_size: number
          description: string | null
          discord_link: string | null
          expires_at: string
          game_mode: Database["public"]["Enums"]["lfg_game_mode"]
          id: string
          is_private: boolean | null
          max_rank: Database["public"]["Enums"]["valorant_rank"] | null
          max_size: number
          min_rank: Database["public"]["Enums"]["valorant_rank"] | null
          owner_id: string
          party_code: string | null
          party_id: string | null
          region: Database["public"]["Enums"]["valorant_region"] | null
          status: Database["public"]["Enums"]["lfg_lobby_status"]
          title: string
          updated_at: string
          voice_required: boolean | null
        }
        Insert: {
          created_at?: string
          current_size?: number
          description?: string | null
          discord_link?: string | null
          expires_at?: string
          game_mode?: Database["public"]["Enums"]["lfg_game_mode"]
          id?: string
          is_private?: boolean | null
          max_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          max_size?: number
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          owner_id: string
          party_code?: string | null
          party_id?: string | null
          region?: Database["public"]["Enums"]["valorant_region"] | null
          status?: Database["public"]["Enums"]["lfg_lobby_status"]
          title: string
          updated_at?: string
          voice_required?: boolean | null
        }
        Update: {
          created_at?: string
          current_size?: number
          description?: string | null
          discord_link?: string | null
          expires_at?: string
          game_mode?: Database["public"]["Enums"]["lfg_game_mode"]
          id?: string
          is_private?: boolean | null
          max_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          max_size?: number
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          owner_id?: string
          party_code?: string | null
          party_id?: string | null
          region?: Database["public"]["Enums"]["valorant_region"] | null
          status?: Database["public"]["Enums"]["lfg_lobby_status"]
          title?: string
          updated_at?: string
          voice_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lfg_lobbies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lfg_lobby_members: {
        Row: {
          id: string
          joined_at: string
          lobby_id: string
          party_joined: boolean | null
          role: Database["public"]["Enums"]["lfg_member_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          lobby_id: string
          party_joined?: boolean | null
          role?: Database["public"]["Enums"]["lfg_member_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          lobby_id?: string
          party_joined?: boolean | null
          role?: Database["public"]["Enums"]["lfg_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lfg_lobby_members_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lfg_lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lfg_lobby_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lfg_lobby_requests: {
        Row: {
          created_at: string
          id: string
          lobby_id: string
          message: string | null
          requester_id: string
          status: Database["public"]["Enums"]["lfg_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lobby_id: string
          message?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["lfg_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lobby_id?: string
          message?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["lfg_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lfg_lobby_requests_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lfg_lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lfg_lobby_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lfg_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          lobby_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lobby_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lobby_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lfg_messages_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lfg_lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lfg_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lobbies: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string
          game_mode: Database["public"]["Enums"]["valorant_game_mode"]
          id: string
          is_active: boolean
          language: string | null
          max_players: number
          max_rank: Database["public"]["Enums"]["valorant_rank"] | null
          min_rank: Database["public"]["Enums"]["valorant_rank"] | null
          owner_id: string
          party_code: string | null
          party_id: string | null
          requires_mic: boolean
          status: Database["public"]["Enums"]["lobby_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string
          game_mode?: Database["public"]["Enums"]["valorant_game_mode"]
          id?: string
          is_active?: boolean
          language?: string | null
          max_players?: number
          max_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          owner_id: string
          party_code?: string | null
          party_id?: string | null
          requires_mic?: boolean
          status?: Database["public"]["Enums"]["lobby_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string
          game_mode?: Database["public"]["Enums"]["valorant_game_mode"]
          id?: string
          is_active?: boolean
          language?: string | null
          max_players?: number
          max_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          owner_id?: string
          party_code?: string | null
          party_id?: string | null
          requires_mic?: boolean
          status?: Database["public"]["Enums"]["lobby_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobbies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lobby_members: {
        Row: {
          current_rank: Database["public"]["Enums"]["valorant_rank"] | null
          id: string
          is_owner: boolean
          is_ready: boolean
          joined_at: string
          lobby_id: string
          riot_id: string | null
          user_id: string
        }
        Insert: {
          current_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          id?: string
          is_owner?: boolean
          is_ready?: boolean
          joined_at?: string
          lobby_id: string
          riot_id?: string | null
          user_id: string
        }
        Update: {
          current_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          id?: string
          is_owner?: boolean
          is_ready?: boolean
          joined_at?: string
          lobby_id?: string
          riot_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobby_members_lobby_id_fkey"
            columns: ["lobby_id"]
            isOneToOne: false
            referencedRelation: "lobbies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lobby_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_request_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          request_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          request_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "match_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_requests: {
        Row: {
          created_at: string
          description: string | null
          id: string
          match_id: string
          reporter_id: string
          request_type: string
          resolution_note: string | null
          resolved_by: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          match_id: string
          reporter_id: string
          request_type: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string
          reporter_id?: string
          request_type?: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_requests_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_requests_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_veto: {
        Row: {
          action_order: number
          action_type: string
          created_at: string
          id: string
          map_name: string | null
          match_id: string
          side: string | null
          team_id: string
        }
        Insert: {
          action_order: number
          action_type: string
          created_at?: string
          id?: string
          map_name?: string | null
          match_id: string
          side?: string | null
          team_id: string
        }
        Update: {
          action_order?: number
          action_type?: string
          created_at?: string
          id?: string
          map_name?: string | null
          match_id?: string
          side?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_veto_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_veto_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: []
      }
      player_availability: {
        Row: {
          available_until: string | null
          id: string
          is_available: boolean | null
          note: string | null
          preferred_modes: Database["public"]["Enums"]["lfg_game_mode"][] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_until?: string | null
          id?: string
          is_available?: boolean | null
          note?: string | null
          preferred_modes?:
            | Database["public"]["Enums"]["lfg_game_mode"][]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_until?: string | null
          id?: string
          is_available?: boolean | null
          note?: string | null
          preferred_modes?:
            | Database["public"]["Enums"]["lfg_game_mode"][]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
        Relationships: []
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
          allow_invites: boolean | null
          avatar_url: string | null
          bio: string | null
          coins: number
          country: string | null
          created_at: string
          current_team_id: string | null
          discord_notifications: boolean | null
          email_notifications: boolean | null
          id: string
          instagram_username: string | null
          main_agents: string[] | null
          medals_bronze: number | null
          medals_gold: number | null
          medals_silver: number | null
          phone_number: string | null
          rank: Database["public"]["Enums"]["valorant_rank"] | null
          riot_id: string | null
          riot_id_name: string | null
          riot_id_tag: string | null
          role: string | null
          show_country: boolean | null
          show_roles: boolean | null
          show_social_links: boolean | null
          show_statistics: boolean | null
          show_tracker: boolean | null
          social_links: Json | null
          socials_team_only: boolean | null
          status: string | null
          updated_at: string
          username: string
        }
        Insert: {
          allow_invites?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          country?: string | null
          created_at?: string
          current_team_id?: string | null
          discord_notifications?: boolean | null
          email_notifications?: boolean | null
          id: string
          instagram_username?: string | null
          main_agents?: string[] | null
          medals_bronze?: number | null
          medals_gold?: number | null
          medals_silver?: number | null
          phone_number?: string | null
          rank?: Database["public"]["Enums"]["valorant_rank"] | null
          riot_id?: string | null
          riot_id_name?: string | null
          riot_id_tag?: string | null
          role?: string | null
          show_country?: boolean | null
          show_roles?: boolean | null
          show_social_links?: boolean | null
          show_statistics?: boolean | null
          show_tracker?: boolean | null
          social_links?: Json | null
          socials_team_only?: boolean | null
          status?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          allow_invites?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          coins?: number
          country?: string | null
          created_at?: string
          current_team_id?: string | null
          discord_notifications?: boolean | null
          email_notifications?: boolean | null
          id?: string
          instagram_username?: string | null
          main_agents?: string[] | null
          medals_bronze?: number | null
          medals_gold?: number | null
          medals_silver?: number | null
          phone_number?: string | null
          rank?: Database["public"]["Enums"]["valorant_rank"] | null
          riot_id?: string | null
          riot_id_name?: string | null
          riot_id_tag?: string | null
          role?: string | null
          show_country?: boolean | null
          show_roles?: boolean | null
          show_social_links?: boolean | null
          show_statistics?: boolean | null
          show_tracker?: boolean | null
          social_links?: Json | null
          socials_team_only?: boolean | null
          status?: string | null
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
      substitution_requests: {
        Row: {
          created_at: string | null
          id: string
          player_in_id: string | null
          player_out_id: string | null
          requester_id: string | null
          status: string | null
          team_id: string | null
          tournament_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          player_in_id?: string | null
          player_out_id?: string | null
          requester_id?: string | null
          status?: string | null
          team_id?: string | null
          tournament_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          player_in_id?: string | null
          player_out_id?: string | null
          requester_id?: string | null
          status?: string | null
          team_id?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "substitution_requests_player_in_id_fkey"
            columns: ["player_in_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitution_requests_player_out_id_fkey"
            columns: ["player_out_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitution_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitution_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "substitution_requests_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      team_activity_logs: {
        Row: {
          created_at: string
          data: Json | null
          description: string
          id: string
          team_id: string
          type: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          description: string
          id?: string
          team_id: string
          type: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          description?: string
          id?: string
          team_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_logs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
          message: string | null
          status: string | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_user_id: string
          message?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_user_id?: string
          message?: string | null
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
          is_phantom: boolean | null
          is_recruiting: boolean | null
          last_active_at: string
          logo_url: string | null
          medals_bronze: number | null
          medals_gold: number | null
          medals_silver: number | null
          min_rank: Database["public"]["Enums"]["valorant_rank"] | null
          name: string
          slug: string | null
          tag: string
          updated_at: string
        }
        Insert: {
          captain_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_phantom?: boolean | null
          is_recruiting?: boolean | null
          last_active_at?: string
          logo_url?: string | null
          medals_bronze?: number | null
          medals_gold?: number | null
          medals_silver?: number | null
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          name: string
          slug?: string | null
          tag: string
          updated_at?: string
        }
        Update: {
          captain_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_phantom?: boolean | null
          is_recruiting?: boolean | null
          last_active_at?: string
          logo_url?: string | null
          medals_bronze?: number | null
          medals_gold?: number | null
          medals_silver?: number | null
          min_rank?: Database["public"]["Enums"]["valorant_rank"] | null
          name?: string
          slug?: string | null
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
          best_of: number | null
          bracket_type: string
          created_at: string | null
          id: string
          loser_id: string | null
          match_number: number
          round_number: number
          start_time: string | null
          status: string | null
          team1_id: string | null
          team1_score: number | null
          team2_id: string | null
          team2_score: number | null
          tournament_id: string
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
          start_time?: string | null
          status?: string | null
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          tournament_id: string
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
          start_time?: string | null
          status?: string | null
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          tournament_id?: string
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
      tournament_participants: {
        Row: {
          id: string
          joined_at: string | null
          status: string | null
          team_id: string
          tournament_id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          joined_at?: string | null
          status?: string | null
          team_id: string
          tournament_id: string
          user_id?: string | null
        }
        Update: {
          id?: string
          joined_at?: string | null
          status?: string | null
          team_id?: string
          tournament_id?: string
          user_id?: string | null
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
      tournament_registrations: {
        Row: {
          id: string
          registered_at: string
          selected_roster: string[] | null
          status: string | null
          team_id: string
          tournament_id: string
        }
        Insert: {
          id?: string
          registered_at?: string
          selected_roster?: string[] | null
          status?: string | null
          team_id: string
          tournament_id: string
        }
        Update: {
          id?: string
          registered_at?: string
          selected_roster?: string[] | null
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
      tournament_results: {
        Row: {
          created_at: string
          first_place_team_ids: string[] | null
          id: string
          second_place_team_ids: string[] | null
          third_place_team_ids: string[] | null
          tournament_id: string
        }
        Insert: {
          created_at?: string
          first_place_team_ids?: string[] | null
          id?: string
          second_place_team_ids?: string[] | null
          third_place_team_ids?: string[] | null
          tournament_id: string
        }
        Update: {
          created_at?: string
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
          settings: Json | null
          slug: string | null
          start_time: string
          status: Database["public"]["Enums"]["tournament_status"]
          substitution_limit: number | null
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
          settings?: Json | null
          slug?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["tournament_status"]
          substitution_limit?: number | null
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
          settings?: Json | null
          slug?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          substitution_limit?: number | null
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
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          tournament_name: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          tournament_name?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
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
      accept_team_application: {
        Args: { application_id_input: string }
        Returns: Json
      }
      accept_team_invitation: {
        Args: { invitation_id_input: string }
        Returns: Json
      }
      award_tournament_medals: {
        Args: {
          p_medal_type: string
          p_team_id: string
          p_tournament_id: string
        }
        Returns: undefined
      }
      cleanup_expired_lfg_lobbies: { Args: never; Returns: number }
      cleanup_expired_lobbies: { Args: never; Returns: number }
      create_lfg_lobby: {
        Args: {
          p_description?: string
          p_discord_link?: string
          p_game_mode?: Database["public"]["Enums"]["lfg_game_mode"]
          p_is_private?: boolean
          p_max_rank?: Database["public"]["Enums"]["valorant_rank"]
          p_max_size?: number
          p_min_rank?: Database["public"]["Enums"]["valorant_rank"]
          p_region?: Database["public"]["Enums"]["valorant_region"]
          p_title: string
          p_voice_required?: boolean
        }
        Returns: Json
      }
      create_lobby: {
        Args: {
          p_description?: string
          p_game_mode: Database["public"]["Enums"]["valorant_game_mode"]
          p_language?: string
          p_max_players?: number
          p_max_rank?: Database["public"]["Enums"]["valorant_rank"]
          p_min_rank?: Database["public"]["Enums"]["valorant_rank"]
          p_party_code?: string
          p_party_id?: string
          p_requires_mic?: boolean
          p_title: string
        }
        Returns: Json
      }
      create_team_with_captain:
        | {
            Args: {
              description_input: string
              is_recruiting_input: boolean
              logo_url_input: string
              name_input: string
              tag_input: string
            }
            Returns: string
          }
        | {
            Args: {
              team_description?: string
              team_logo_url?: string
              team_name: string
              team_tag: string
            }
            Returns: string
          }
      create_tournament_with_payment:
        | {
            Args: {
              p_description: string
              p_format: Database["public"]["Enums"]["tournament_format"]
              p_max_teams: number
              p_prize_pool: string
              p_rules: string
              p_start_time: string
              p_title: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_banner_url: string
              p_description: string
              p_format: Database["public"]["Enums"]["tournament_format"]
              p_max_teams: number
              p_prize_pool: string
              p_rules: string
              p_start_time: string
              p_title: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_description: string
              p_format: Database["public"]["Enums"]["tournament_format"]
              p_max_teams: number
              p_prize_pool: string
              p_rules: string
              p_settings?: Json
              p_start_time: string
              p_title: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_description: string
              p_format: Database["public"]["Enums"]["tournament_format"]
              p_max_teams: number
              p_prize_pool: string
              p_rules: string
              p_start_time: string
              p_substitution_limit?: number
              p_title: string
            }
            Returns: Json
          }
      decline_team_application: {
        Args: { application_id_input: string }
        Returns: Json
      }
      decline_team_invitation: {
        Args: { invitation_id_input: string }
        Returns: Json
      }
      desktop_session_offline: { Args: never; Returns: Json }
      distribute_tournament_prizes: {
        Args: {
          p_first_place_team_id: string
          p_second_place_team_id: string
          p_third_place_team_id: string
          p_tournament_id: string
        }
        Returns: Json
      }
      get_available_players: {
        Args: {
          p_game_mode?: Database["public"]["Enums"]["lfg_game_mode"]
          p_limit?: number
          p_max_rank?: Database["public"]["Enums"]["valorant_rank"]
          p_min_rank?: Database["public"]["Enums"]["valorant_rank"]
        }
        Returns: {
          available_until: string
          avatar_url: string
          is_desktop_online: boolean
          note: string
          preferred_modes: Database["public"]["Enums"]["lfg_game_mode"][]
          rank: Database["public"]["Enums"]["valorant_rank"]
          user_id: string
          username: string
          valorant_running: boolean
        }[]
      }
      get_email_by_username: {
        Args: { username_input: string }
        Returns: string
      }
      get_lobby_player_count: { Args: { lobby_uuid: string }; Returns: number }
      handle_lfg_request: {
        Args: { p_action: string; p_request_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_lfg_lobby_participant: {
        Args: { p_lobby_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_manager: { Args: { team_id_input: string }; Returns: boolean }
      join_lfg_lobby: { Args: { p_lobby_id: string }; Returns: Json }
      join_lobby: {
        Args: {
          p_current_rank?: Database["public"]["Enums"]["valorant_rank"]
          p_lobby_id: string
          p_riot_id?: string
        }
        Returns: Json
      }
      kick_lfg_member: {
        Args: { p_lobby_id: string; p_user_id: string }
        Returns: Json
      }
      kick_member: {
        Args: { team_id: string; user_id: string }
        Returns: undefined
      }
      leave_lfg_lobby: { Args: { p_lobby_id: string }; Returns: Json }
      leave_lobby: { Args: { p_lobby_id: string }; Returns: Json }
      process_substitution: {
        Args: { p_request_id: string; p_status: string }
        Returns: Json
      }
      request_substitution: {
        Args: {
          p_player_in_id: string
          p_player_out_id: string
          p_team_id: string
          p_tournament_id: string
        }
        Returns: Json
      }
      request_to_join_lfg_lobby: {
        Args: { p_lobby_id: string; p_message?: string }
        Returns: Json
      }
      rpc_apply_to_team: {
        Args: { note?: string; target_team_id: string }
        Returns: Json
      }
      rpc_cleanup_all_phantoms: { Args: never; Returns: Json }
      rpc_cleanup_tournament_phantoms: {
        Args: { tournament_id_input: string }
        Returns: Json
      }
      rpc_fill_tournament: {
        Args: { desired_size?: number; tournament_id_input: string }
        Returns: Json
      }
      search_available_players: {
        Args: { search_term: string }
        Returns: {
          avatar_url: string
          id: string
          riot_id: string
          username: string
        }[]
      }
      set_member_role:
        | {
            Args: {
              new_role: Database["public"]["Enums"]["team_role"]
              team_id: string
              user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              member_user_id: string
              new_role: string
              team_id_input: string
            }
            Returns: undefined
          }
      set_player_availability: {
        Args: {
          p_duration_minutes?: number
          p_is_available: boolean
          p_note?: string
          p_preferred_modes?: Database["public"]["Enums"]["lfg_game_mode"][]
        }
        Returns: Json
      }
      transfer_captain: {
        Args: { new_captain_id: string; team_id: string }
        Returns: undefined
      }
      update_desktop_session: {
        Args: {
          p_party_code?: string
          p_party_id?: string
          p_party_size?: number
          p_player_puuid?: string
          p_valorant_running: boolean
          p_valorant_status: string
        }
        Returns: Json
      }
      update_lobby_party: {
        Args: { p_lobby_id: string; p_party_code: string; p_party_id: string }
        Returns: Json
      }
      update_tournament_with_payment:
        | {
            Args: {
              p_description: string
              p_format: Database["public"]["Enums"]["tournament_format"]
              p_max_teams: number
              p_prize_pool: string
              p_rules: string
              p_start_time: string
              p_title: string
              p_tournament_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_description: string
              p_format: Database["public"]["Enums"]["tournament_format"]
              p_max_teams: number
              p_prize_pool: string
              p_rules: string
              p_start_time: string
              p_substitution_limit?: number
              p_title: string
              p_tournament_id: string
            }
            Returns: Json
          }
    }
    Enums: {
      app_role: "admin" | "publisher" | "organizer" | "player"
      lfg_game_mode:
        | "competitive"
        | "unrated"
        | "spike_rush"
        | "deathmatch"
        | "swiftplay"
        | "custom"
      lfg_lobby_status: "open" | "full" | "in_game" | "closed"
      lfg_member_role: "owner" | "member"
      lfg_request_status: "pending" | "accepted" | "rejected" | "cancelled"
      lobby_status:
        | "waiting"
        | "ready"
        | "in_queue"
        | "in_game"
        | "completed"
        | "cancelled"
      match_status: "scheduled" | "live" | "completed" | "cancelled"
      scrim_status: "searching" | "in_progress" | "finished" | "cancelled"
      team_role: "captain" | "coach" | "member"
      tournament_format:
        | "single_elimination"
        | "double_elimination"
        | "round_robin"
        | "swiss"
      tournament_status:
        | "draft"
        | "registration"
        | "active"
        | "completed"
        | "cancelled"
      valorant_game_mode:
        | "competitive"
        | "unrated"
        | "swiftplay"
        | "spike_rush"
        | "deathmatch"
        | "escalation"
        | "replication"
        | "custom"
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
      lfg_game_mode: [
        "competitive",
        "unrated",
        "spike_rush",
        "deathmatch",
        "swiftplay",
        "custom",
      ],
      lfg_lobby_status: ["open", "full", "in_game", "closed"],
      lfg_member_role: ["owner", "member"],
      lfg_request_status: ["pending", "accepted", "rejected", "cancelled"],
      lobby_status: [
        "waiting",
        "ready",
        "in_queue",
        "in_game",
        "completed",
        "cancelled",
      ],
      match_status: ["scheduled", "live", "completed", "cancelled"],
      scrim_status: ["searching", "in_progress", "finished", "cancelled"],
      team_role: ["captain", "coach", "member"],
      tournament_format: [
        "single_elimination",
        "double_elimination",
        "round_robin",
        "swiss",
      ],
      tournament_status: [
        "draft",
        "registration",
        "active",
        "completed",
        "cancelled",
      ],
      valorant_game_mode: [
        "competitive",
        "unrated",
        "swiftplay",
        "spike_rush",
        "deathmatch",
        "escalation",
        "replication",
        "custom",
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
