import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Database } from '@/types/database.types';

type LFGLobby = Database['public']['Tables']['lfg_lobbies']['Row'];
type LFGLobbyMember = Database['public']['Tables']['lfg_lobby_members']['Row'];
type LFGGameMode = Database['public']['Enums']['lfg_game_mode'];
type ValorantRegion = Database['public']['Enums']['valorant_region'];

export interface LFGLobbyWithMembers extends LFGLobby {
  lfg_lobby_members: Array<LFGLobbyMember & {
    profiles: {
      id: string;
      username: string | null;
      avatar_url: string | null;
      rank: string | null;
    } | null;
  }>;
  owner_profile: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    rank: string | null;
  } | null;
}

export interface CreateLobbyParams {
  title: string;
  description?: string;
  gameMode: LFGGameMode;
  maxSize: number;
  minRank?: string;
  maxRank?: string;
  region?: ValorantRegion;
  isPrivate?: boolean;
  voiceRequired?: boolean;
  discordLink?: string;
  inviteCode?: string;
}

export interface LobbyFilters {
  gameMode?: LFGGameMode;
  region?: ValorantRegion;
  maxSize?: number;
  hideFullLobbies?: boolean;
}

/**
 * Hook для работы со списком LFG лобби
 */
export function useLFGLobbies(filters: LobbyFilters = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Real-time subscription for lobby updates (party_code changes)
  useEffect(() => {
    const channel = supabase
      .channel('lfg-lobbies-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lfg_lobbies',
        },
        () => {
          // Invalidate queries to refetch updated lobby data
          queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
          queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Fetch lobbies
  const {
    data: lobbies,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lfg-lobbies', filters],
    queryFn: async () => {
      let query = supabase
        .from('lfg_lobbies')
        .select(`
          *,
          lfg_lobby_members (
            id,
            user_id,
            role,
            party_joined,
            joined_at,
            profiles (
              id,
              username,
              avatar_url,
              rank
            )
          ),
          owner_profile:profiles!lfg_lobbies_owner_id_fkey (
            id,
            username,
            avatar_url,
            rank
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.gameMode) {
        query = query.eq('game_mode', filters.gameMode);
      }

      if (filters.region) {
        query = query.eq('region', filters.region);
      }

      if (filters.maxSize) {
        query = query.eq('max_size', filters.maxSize);
      }

      if (filters.hideFullLobbies) {
        query = query.lt('current_size', supabase.rpc('max_size'));
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useLFGLobbies] Error fetching lobbies:', error);
        throw error;
      }

      return data as LFGLobbyWithMembers[];
    },
    staleTime: 5000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('lfg-lobbies-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lfg_lobbies',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lfg_lobby_members',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create lobby mutation
  const createLobby = useMutation({
    mutationFn: async (params: CreateLobbyParams) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('create_lfg_lobby', {
        p_title: params.title,
        p_description: params.description ?? null,
        p_game_mode: params.gameMode,
        p_max_size: params.maxSize,
        p_min_rank: params.minRank ?? null,
        p_max_rank: params.maxRank ?? null,
        p_region: params.region ?? 'eu',
        p_is_private: params.isPrivate ?? false,
        p_voice_required: params.voiceRequired ?? false,
        p_discord_link: params.discordLink ?? null,
      });

      if (error) {
        console.error('[useLFGLobbies] Error creating lobby:', error);
        throw error;
      }

      const lobbyId = data as string;

      // If invite code was provided, update the lobby with it
      if (params.inviteCode) {
        await supabase
          .from('lfg_lobbies')
          .update({ party_code: params.inviteCode })
          .eq('id', lobbyId);
      }

      return lobbyId;
    },
    onSuccess: () => {
      toast.success('Лобби создано');
      queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка создания лобби');
    },
  });

  // Join lobby mutation
  const joinLobby = useMutation({
    mutationFn: async (lobbyId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('join_lfg_lobby', {
        p_lobby_id: lobbyId,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Вы присоединились к лобби');
      queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка присоединения к лобби');
    },
  });

  // Leave lobby mutation
  const leaveLobby = useMutation({
    mutationFn: async (lobbyId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('leave_lfg_lobby', {
        p_lobby_id: lobbyId,
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Вы покинули лобби');
      queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка выхода из лобби');
    },
  });

  // Update lobby party code mutation
  const updateLobbyPartyCode = useMutation({
    mutationFn: async ({ lobbyId, partyCode }: { lobbyId: string; partyCode: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('lfg_lobbies')
        .update({ party_code: partyCode })
        .eq('id', lobbyId)
        .eq('owner_id', user.id); // Only owner can update

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обновления кода');
    },
  });

  return {
    lobbies: lobbies ?? [],
    isLoading,
    error,
    refetch,
    createLobby,
    joinLobby,
    leaveLobby,
    updateLobbyPartyCode,
  };
}

/**
 * Hook для получения текущего лобби пользователя
 */
export function useMyLFGLobby() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: lobby, isLoading } = useQuery({
    queryKey: ['my-lfg-lobby', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // First, find if user is a member of any lobby
      const { data: membership, error: memberError } = await supabase
        .from('lfg_lobby_members')
        .select('lobby_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberError || !membership) {
        return null;
      }

      // Fetch the lobby details
      const { data: lobbyData, error: lobbyError } = await supabase
        .from('lfg_lobbies')
        .select(`
          *,
          lfg_lobby_members (
            id,
            user_id,
            role,
            party_joined,
            joined_at,
            profiles (
              id,
              username,
              avatar_url,
              rank
            )
          ),
          owner_profile:profiles!lfg_lobbies_owner_id_fkey (
            id,
            username,
            avatar_url,
            rank
          )
        `)
        .eq('id', membership.lobby_id)
        .single();

      if (lobbyError) {
        return null;
      }

      return lobbyData as LFGLobbyWithMembers;
    },
    enabled: !!user?.id,
    staleTime: 5000,
  });

  // Subscribe to realtime updates for my lobby
  useEffect(() => {
    if (!lobby?.id) return;

    const channel = supabase
      .channel(`my-lfg-lobby:${lobby.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lfg_lobbies',
          filter: `id=eq.${lobby.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lfg_lobby_members',
          filter: `lobby_id=eq.${lobby.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobby?.id, queryClient]);

  const isOwner = lobby?.owner_id === user?.id;
  const myMembership = lobby?.lfg_lobby_members?.find(m => m.user_id === user?.id);

  return {
    lobby,
    isLoading,
    isOwner,
    myMembership,
    isInLobby: !!lobby,
  };
}
