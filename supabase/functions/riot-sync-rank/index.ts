// Edge Function: riot-sync-rank
// Syncs rank data from Riot API with rate limiting and caching

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { RiotApiClient, TIER_TO_RANK, getRandomDemoRank } from '../_shared/riot-api.ts';

const CACHE_TTL_HOURS = 1; // Cache validity in hours
const RATE_LIMIT_MINUTES = 5; // Minimum time between sync requests

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client for user authentication
    const supabaseUser = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const { data: canProceed } = await supabase
      .rpc('check_riot_rate_limit', {
        p_user_id: user.id,
        p_endpoint: 'rank_sync',
        p_max_requests: 1,
        p_window_minutes: RATE_LIMIT_MINUTES,
      });

    if (!canProceed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limited',
          code: 'RATE_LIMITED',
          retryAfterMinutes: RATE_LIMIT_MINUTES,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's riot account
    const { data: riotAccount, error: accountError } = await supabase
      .from('riot_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_status', 'verified')
      .single();

    if (accountError || !riotAccount) {
      return new Response(
        JSON.stringify({ error: 'No verified Riot account found', code: 'NOT_LINKED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentActId = Deno.env.get('CURRENT_ACT_ID') || 'current';
    const isDemoMode = Deno.env.get('RIOT_DEMO_MODE') === 'true';

    // Check cache first
    const { data: cachedRank } = await supabase
      .from('riot_rank_cache')
      .select('*')
      .eq('puuid', riotAccount.puuid)
      .eq('act_id', currentActId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedRank) {
      return new Response(
        JSON.stringify({
          rank: cachedRank.current_rank,
          tier: cachedRank.current_tier,
          rankingInTier: cachedRank.ranking_in_tier,
          leaderboardRank: cachedRank.leaderboard_rank,
          cached: true,
          expiresAt: cachedRank.expires_at,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let rankData: {
      tier: number;
      rank: string;
      rankingInTier: number | null;
      leaderboardRank: number | null;
    };

    if (isDemoMode) {
      // Demo mode: return random rank
      const demoRank = getRandomDemoRank();
      rankData = {
        tier: demoRank.tier,
        rank: demoRank.rank,
        rankingInTier: demoRank.rankingInTier,
        leaderboardRank: demoRank.tier === 27 ? Math.floor(Math.random() * 500) + 1 : null,
      };
    } else {
      // Production: fetch from Riot API
      const riotClient = new RiotApiClient();
      const apiRankData = await riotClient.getRankInfo(riotAccount.puuid, riotAccount.region);

      if (!apiRankData) {
        rankData = {
          tier: 0,
          rank: 'Unranked',
          rankingInTier: null,
          leaderboardRank: null,
        };
      } else {
        rankData = {
          tier: apiRankData.currenttier,
          rank: TIER_TO_RANK[apiRankData.currenttier] || 'Unknown',
          rankingInTier: apiRankData.ranking_in_tier,
          leaderboardRank: null, // Would need separate leaderboard API call
        };
      }
    }

    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    // Update cache
    await supabase
      .from('riot_rank_cache')
      .upsert({
        puuid: riotAccount.puuid,
        current_tier: rankData.tier,
        current_rank: rankData.rank,
        ranking_in_tier: rankData.rankingInTier,
        leaderboard_rank: rankData.leaderboardRank,
        act_id: currentActId,
        act_name: isDemoMode ? 'Episode 10 Act 1 (Demo)' : undefined,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, {
        onConflict: 'puuid,act_id',
      });

    // Update profile
    await supabase
      .from('profiles')
      .update({
        official_rank: rankData.rank,
        official_rank_tier: rankData.tier,
        rank_last_updated: new Date().toISOString(),
      })
      .eq('id', user.id);

    // Update riot_accounts last_sync_at
    await supabase
      .from('riot_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({
        rank: rankData.rank,
        tier: rankData.tier,
        rankingInTier: rankData.rankingInTier,
        leaderboardRank: rankData.leaderboardRank,
        cached: false,
        expiresAt: expiresAt,
        demo: isDemoMode,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('riot-sync-rank error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
