import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { TIER_TO_RANK } from '@/types/riot.types';
import type {
  RiotAccount,
  RiotLinkStatus,
  RiotRankInfo,
  RiotAuthInitResponse,
  RiotSyncRankResponse,
} from '@/types/riot.types';

const DEMO_TIERS = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];

function generateDemoRank() {
  const tier = DEMO_TIERS[Math.floor(Math.random() * DEMO_TIERS.length)];
  const rank = TIER_TO_RANK[tier];
  const rankingInTier = Math.floor(Math.random() * 100);
  const peakTier = Math.min(tier + Math.floor(Math.random() * 3), 27);
  const peakRank = TIER_TO_RANK[peakTier];
  const wins = Math.floor(Math.random() * 41) + 10;
  const gamesPlayed = wins + Math.floor(Math.random() * 31) + 5;

  return { tier, rank, rankingInTier, peakTier, peakRank, wins, gamesPlayed };
}

interface UseRiotAccountResult {
  riotAccount: RiotAccount | null;
  linkStatus: RiotLinkStatus;
  rankInfo: RiotRankInfo | null;
  isLoading: boolean;
  initLink: () => Promise<void>;
  linkDemo: (gameName: string, tagLine: string) => Promise<void>;
  syncRank: () => Promise<RiotRankInfo | null>;
  unlink: () => Promise<void>;
  isLinking: boolean;
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
    enabled: !!session?.user?.id,
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
        peakRank: data.peak_rank ?? undefined,
        peakTier: data.peak_tier ?? undefined,
        wins: data.wins ?? undefined,
        gamesPlayed: data.games_played ?? undefined,
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
        throw new Error(data.error || 'Ошибка при синхронизации ранга');
      }

      return {
        rank: data.rank,
        tier: data.tier,
        rankingInTier: data.rankingInTier,
        leaderboardRank: data.leaderboardRank,
        peakRank: data.peakRank,
        peakTier: data.peakTier,
        wins: data.wins,
        gamesPlayed: data.gamesPlayed,
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

  // Demo link mutation — generates rank data directly, no edge function needed
  const linkDemoMutation = useMutation({
    mutationFn: async ({ gameName, tagLine }: { gameName: string; tagLine: string }): Promise<void> => {
      if (!session?.user?.id) {
        throw new Error('Not authenticated');
      }

      const demoPuuid = `demo-${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const demoRank = generateDemoRank();

      // 1. Create riot account
      const { error: insertError } = await supabase
        .from('riot_accounts')
        .insert({
          user_id: session.user.id,
          puuid: demoPuuid,
          riot_id_name: gameName,
          riot_id_tag: tagLine,
          verification_status: 'verified',
          verified_at: now,
          region: 'eu',
          last_sync_at: now,
        });

      if (insertError) throw insertError;

      // 2. Update profile with riot info AND rank
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          riot_id: `${gameName}#${tagLine}`,
          riot_id_name: gameName,
          riot_id_tag: tagLine,
          riot_puuid: demoPuuid,
          riot_verified: true,
          riot_verified_at: now,
          official_rank: demoRank.rank,
          official_rank_tier: demoRank.tier,
          rank_last_updated: now,
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // 3. Write rank cache (peak, stats)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('riot_rank_cache')
        .upsert({
          puuid: demoPuuid,
          current_tier: demoRank.tier,
          current_rank: demoRank.rank,
          ranking_in_tier: demoRank.rankingInTier,
          leaderboard_rank: demoRank.tier === 27 ? Math.floor(Math.random() * 500) + 1 : null,
          peak_tier: demoRank.peakTier,
          peak_rank: demoRank.peakRank,
          wins: demoRank.wins,
          games_played: demoRank.gamesPlayed,
          act_id: 'current',
          act_name: 'Episode 10 Act 1 (Demo)',
          fetched_at: now,
          expires_at: expiresAt,
        }, {
          onConflict: 'puuid,act_id',
        });
      // Rank cache insert may fail due to RLS — that's OK, profile rank still works
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riot-account'] });
      queryClient.invalidateQueries({ queryKey: ['riot-rank'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['current-user-profile'] });
      toast.success('Riot ID привязан!');
    },
    onError: () => {
      toast.error('Ошибка при привязке Riot ID');
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
    linkDemo: (gameName: string, tagLine: string) =>
      linkDemoMutation.mutateAsync({ gameName, tagLine }),
    syncRank: syncRankMutation.mutateAsync,
    unlink: unlinkMutation.mutateAsync,
    isLinking: linkDemoMutation.isPending,
    isSyncing: syncRankMutation.isPending,
    isUnlinking: unlinkMutation.isPending,
  };
}
