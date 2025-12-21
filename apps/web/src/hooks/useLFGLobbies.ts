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

export interface UpdateLobbyParams {
  lobbyId: string;
  title: string;
  description?: string;
  maxSize: number;
  minRank?: string;
  maxRank?: string;
  isPrivate?: boolean;
  voiceRequired?: boolean;
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

  // Update lobby mutation
  const updateLobby = useMutation({
    mutationFn: async (params: UpdateLobbyParams) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('lfg_lobbies')
        .update({
          title: params.title,
          description: params.description ?? null,
          max_size: params.maxSize,
          min_rank: params.minRank ?? null,
          max_rank: params.maxRank ?? null,
          is_private: params.isPrivate ?? false,
          voice_required: params.voiceRequired ?? false,
        })
        .eq('id', params.lobbyId)
        .eq('owner_id', user.id); // Only owner can update

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Лобби обновлено');
      queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обновления лобби');
    },
  });

  // Request to join private lobby mutation
  const requestToJoin = useMutation({
    mutationFn: async ({ lobbyId, message }: { lobbyId: string; message?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('request_to_join_lfg_lobby', {
        p_lobby_id: lobbyId,
        p_message: message || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as { success: boolean; error?: string; request_id?: string };
      if (!result.success) {
        throw new Error(result.error || 'Ошибка отправки заявки');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Заявка отправлена!');
      queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
      queryClient.invalidateQueries({ queryKey: ['my-pending-requests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка отправки заявки');
    },
  });

  // Handle join request (accept/reject) mutation
  const handleRequest = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'accept' | 'reject' }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('handle_lfg_request', {
        p_request_id: requestId,
        p_action: action,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as { success: boolean; error?: string; action?: string };
      if (!result.success) {
        throw new Error(result.error || 'Ошибка обработки заявки');
      }

      return result;
    },
    onSuccess: (data) => {
      const actionText = data.action === 'accepted' ? 'принята' : 'отклонена';
      toast.success(`Заявка ${actionText}`);
      queryClient.invalidateQueries({ queryKey: ['lfg-lobbies'] });
      queryClient.invalidateQueries({ queryKey: ['my-lfg-lobby'] });
      queryClient.invalidateQueries({ queryKey: ['lobby-requests'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка обработки заявки');
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
    updateLobby,
    requestToJoin,
    handleRequest,
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

/**
 * Interface for lobby join request
 */
export interface LobbyJoinRequest {
  id: string;
  lobby_id: string;
  requester_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
  profiles?: {
    id: string;
    username: string;
    avatar_url: string | null;
    rank: string | null;
    player_roles?: Array<{ id: string; role: string; comfort_level: string }>;
    player_agents?: Array<{ id: string; agent_name: string; skill_level: string }>;
  };
}

/**
 * Hook для работы с заявками на вступление в лобби
 */
export function useLobbyRequests(lobbyId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch pending requests for this lobby (for owner)
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['lobby-requests', lobbyId],
    queryFn: async () => {
      if (!lobbyId) return [];

      // First get the requests with basic profile info
      const { data, error } = await supabase
        .from('lfg_lobby_requests')
        .select(`
          id,
          lobby_id,
          requester_id,
          message,
          status,
          created_at,
          profiles:requester_id (
            id,
            username,
            avatar_url,
            rank
          )
        `)
        .eq('lobby_id', lobbyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lobby requests:', error);
        return [];
      }

      // Get player_roles and player_agents for each requester
      const requestsWithExtras = await Promise.all(
        (data || []).map(async (request: any) => {
          const userId = request.requester_id;

          // Fetch player_roles
          const { data: roles } = await supabase
            .from('player_roles')
            .select('id, role, comfort_level')
            .eq('user_id', userId);

          // Fetch player_agents
          const { data: agents } = await supabase
            .from('player_agents')
            .select('id, agent_name, skill_level')
            .eq('user_id', userId);

          return {
            ...request,
            profiles: {
              ...request.profiles,
              player_roles: roles || [],
              player_agents: agents || [],
            },
          };
        })
      );

      return requestsWithExtras as LobbyJoinRequest[];
    },
    enabled: !!lobbyId && !!user?.id,
    staleTime: 5000,
  });

  // Subscribe to realtime updates for requests
  useEffect(() => {
    if (!lobbyId) return;

    const channel = supabase
      .channel(`lobby-requests:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lfg_lobby_requests',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lobby-requests', lobbyId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId, queryClient]);

  return {
    requests,
    isLoading,
    refetch,
  };
}

/**
 * Hook для проверки статуса заявки пользователя на конкретное лобби
 */
export function useMyLobbyRequest(lobbyId: string | undefined) {
  const { user } = useAuth();

  const { data: myRequest, isLoading } = useQuery({
    queryKey: ['my-lobby-request', lobbyId, user?.id],
    queryFn: async () => {
      if (!lobbyId || !user?.id) return null;

      const { data, error } = await supabase
        .from('lfg_lobby_requests')
        .select('id, status')
        .eq('lobby_id', lobbyId)
        .eq('requester_id', user.id)
        .single();

      if (error) {
        // PGRST116 = no rows found, which is expected
        if (error.code !== 'PGRST116') {
          console.error('Error fetching my request:', error);
        }
        return null;
      }

      return data as { id: string; status: string };
    },
    enabled: !!lobbyId && !!user?.id,
    staleTime: 5000,
  });

  const hasPendingRequest = myRequest?.status === 'pending';
  const wasRejected = myRequest?.status === 'rejected';

  return {
    myRequest,
    hasPendingRequest,
    wasRejected,
    isLoading,
  };
}

/**
 * Hook для получения всех pending заявок пользователя (для списка лобби)
 */
export function useMyPendingRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingRequests = [], isLoading, refetch } = useQuery({
    queryKey: ['my-pending-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('lfg_lobby_requests')
        .select('id, lobby_id, status')
        .eq('requester_id', user.id);

      if (error) {
        console.error('Error fetching my requests:', error);
        return [];
      }

      return data as Array<{ id: string; lobby_id: string; status: string }>;
    },
    enabled: !!user?.id,
    staleTime: 1000, // Shorter stale time for faster updates
  });

  // Subscribe to realtime updates for user's requests
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`my-requests:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lfg_lobby_requests',
          filter: `requester_id=eq.${user.id}`,
        },
        () => {
          // Immediately refetch when any change happens to user's requests
          queryClient.invalidateQueries({ queryKey: ['my-pending-requests', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Helper to get request status for a specific lobby
  const getRequestStatus = (lobbyId: string): 'pending' | 'rejected' | null => {
    const request = pendingRequests.find((r) => r.lobby_id === lobbyId);
    if (!request) return null;
    if (request.status === 'pending') return 'pending';
    if (request.status === 'rejected') return 'rejected';
    return null;
  };

  return {
    pendingRequests,
    getRequestStatus,
    isLoading,
    refetch,
  };
}
