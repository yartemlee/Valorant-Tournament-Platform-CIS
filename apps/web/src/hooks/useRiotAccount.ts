import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  RiotAccount,
  RiotLinkStatus,
  RiotRankInfo,
  RiotAuthInitResponse,
  RiotSyncRankResponse,
} from '@/types/riot.types';
import { FEATURES } from '@/config/features';

interface UseRiotAccountResult {
  riotAccount: RiotAccount | null;
  linkStatus: RiotLinkStatus;
  rankInfo: RiotRankInfo | null;
  isLoading: boolean;
  initLink: () => Promise<void>;
  syncRank: () => Promise<RiotRankInfo | null>;
  unlink: () => Promise<void>;
  isSyncing: boolean;
  isUnlinking: boolean;
}

export function useRiotAccount(): UseRiotAccountResult {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // Fetch riot account data
  const {
    data: riotAccount,
    isLoading: isLoadingAccount,
  } = useQuery({
    queryKey: ['riot-account', session?.user?.id],
    queryFn: async (): Promise<RiotAccount | null> => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from('riot_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        // PGRST116 = no rows found, which is expected when not linked
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as RiotAccount;
    },
    enabled: !!session?.user?.id && FEATURES.RSO_ENABLED,
  });

  // Fetch cached rank info
  const {
    data: rankInfo,
    isLoading: isLoadingRank,
  } = useQuery({
    queryKey: ['riot-rank', riotAccount?.puuid],
    queryFn: async (): Promise<RiotRankInfo | null> => {
      if (!riotAccount?.puuid) return null;

      const { data, error } = await supabase
        .from('riot_rank_cache')
        .select('*')
        .eq('puuid', riotAccount.puuid)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return {
        rank: data.current_rank || 'Unranked',
        tier: data.current_tier || 0,
        rankingInTier: data.ranking_in_tier ?? undefined,
        leaderboardRank: data.leaderboard_rank ?? undefined,
        cached: true,
        expiresAt: data.expires_at,
      };
    },
    enabled: !!riotAccount?.puuid && riotAccount.verification_status === 'verified',
  });

  // Determine link status
  const getLinkStatus = (): RiotLinkStatus => {
    if (isLoadingAccount) return 'loading';
    if (!riotAccount) return 'not_linked';
    return riotAccount.verification_status as RiotLinkStatus;
  };

  // Init link mutation
  const initLinkMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/riot-auth-init`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'ALREADY_LINKED') {
          throw new Error('Riot аккаунт уже привязан');
        }
        throw new Error(error.error || 'Ошибка при инициализации привязки');
      }

      const data: RiotAuthInitResponse = await response.json();

      // Redirect to Riot OAuth or demo callback
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Sync rank mutation
  const syncRankMutation = useMutation({
    mutationFn: async (): Promise<RiotRankInfo | null> => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/riot-sync-rank`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data: RiotSyncRankResponse = await response.json();

      if (!response.ok) {
        if (data.code === 'RATE_LIMITED') {
          throw new Error(`Подождите ${data.retryAfterMinutes} минут перед следующей синхронизацией`);
        }
        if (data.code === 'NOT_LINKED') {
          throw new Error('Riot аккаунт не привязан');
        }
        throw new Error(data.error || 'Ошибка при синхронизации ранга');
      }

      return {
        rank: data.rank,
        tier: data.tier,
        rankingInTier: data.rankingInTier,
        leaderboardRank: data.leaderboardRank,
        cached: data.cached,
        expiresAt: data.expiresAt,
        demo: data.demo,
      };
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['riot-rank'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        toast.success(`Ранг обновлён: ${data.rank}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      // Delete riot account (will cascade to riot_rank_cache)
      const { error: deleteError } = await supabase
        .from('riot_accounts')
        .delete()
        .eq('user_id', session.user.id);

      if (deleteError) throw deleteError;

      // Update profile to clear riot fields
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          riot_id: null,
          riot_puuid: null,
          riot_verified: false,
          riot_verified_at: null,
          official_rank: null,
          official_rank_tier: null,
          rank_last_updated: null,
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riot-account'] });
      queryClient.invalidateQueries({ queryKey: ['riot-rank'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Riot аккаунт отвязан');
    },
    onError: () => {
      toast.error('Ошибка при отвязке аккаунта');
    },
  });

  return {
    riotAccount: riotAccount ?? null,
    linkStatus: getLinkStatus(),
    rankInfo: rankInfo ?? null,
    isLoading: isLoadingAccount || isLoadingRank,
    initLink: initLinkMutation.mutateAsync,
    syncRank: syncRankMutation.mutateAsync,
    unlink: unlinkMutation.mutateAsync,
    isSyncing: syncRankMutation.isPending,
    isUnlinking: unlinkMutation.isPending,
  };
}
