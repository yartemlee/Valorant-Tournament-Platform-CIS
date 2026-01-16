// Edge Function: riot-auth-callback
// Handles Riot OAuth callback and creates/updates riot_accounts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { RiotApiClient, getRandomDemoRank, TIER_TO_RANK } from '../_shared/riot-api.ts';
import { encryptToken } from '../_shared/crypto.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';

  // Helper function to redirect with error
  const redirectWithError = (error: string) => {
    return Response.redirect(`${appUrl}/profile?riot_error=${encodeURIComponent(error)}`, 302);
  };

  // Helper function to redirect with success
  const redirectWithSuccess = () => {
    return Response.redirect(`${appUrl}/profile?riot_linked=true`, 302);
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for DEMO_MODE
    const isDemoMode = url.searchParams.get('demo') === 'true';

    if (isDemoMode) {
      // Demo mode: create mock riot account
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return redirectWithError('Missing user_id in demo mode');
      }

      // Generate demo Riot ID
      const demoName = `ValoHubPlayer${Math.floor(Math.random() * 9999)}`;
      const demoTag = `${Math.floor(1000 + Math.random() * 9000)}`;
      const demoPuuid = `DEMO-${crypto.randomUUID()}`;
      const demoRank = getRandomDemoRank();

      // Check if user already has a riot account
      const { data: existing } = await supabase
        .from('riot_accounts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing account
        await supabase
          .from('riot_accounts')
          .update({
            puuid: demoPuuid,
            riot_id_name: demoName,
            riot_id_tag: demoTag,
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            last_sync_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        // Create new riot account
        await supabase
          .from('riot_accounts')
          .insert({
            user_id: userId,
            puuid: demoPuuid,
            riot_id_name: demoName,
            riot_id_tag: demoTag,
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            region: 'eu',
          });
      }

      // Update profile with riot info
      await supabase
        .from('profiles')
        .update({
          riot_id: `${demoName}#${demoTag}`,
          riot_puuid: demoPuuid,
          riot_verified: true,
          riot_verified_at: new Date().toISOString(),
          official_rank: demoRank.rank,
          official_rank_tier: demoRank.tier,
          rank_last_updated: new Date().toISOString(),
        })
        .eq('id', userId);

      // Create demo rank cache
      const currentActId = Deno.env.get('CURRENT_ACT_ID') || 'demo-act-1';
      await supabase
        .from('riot_rank_cache')
        .upsert({
          puuid: demoPuuid,
          current_tier: demoRank.tier,
          current_rank: demoRank.rank,
          ranking_in_tier: demoRank.rankingInTier,
          act_id: currentActId,
          act_name: 'Episode 10 Act 1 (Demo)',
          fetched_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        }, {
          onConflict: 'puuid,act_id',
        });

      return redirectWithSuccess();
    }

    // Production mode: handle real OAuth callback
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return redirectWithError(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      return redirectWithError('Missing code or state');
    }

    // Decode and validate state
    let stateData: { userId: string; timestamp: number; nonce: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return redirectWithError('Invalid state parameter');
    }

    // Check state is not too old (5 minute window)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return redirectWithError('State expired');
    }

    const userId = stateData.userId;

    // Exchange code for tokens
    const riotClient = new RiotApiClient();
    const tokens = await riotClient.exchangeCodeForTokens(code);

    // Get account info
    const accountInfo = await riotClient.getAccountInfo(tokens.access_token);

    // Check if PUUID is already linked to another user
    const { data: existingPuuid } = await supabase
      .from('riot_accounts')
      .select('user_id')
      .eq('puuid', accountInfo.puuid)
      .single();

    if (existingPuuid && existingPuuid.user_id !== userId) {
      return redirectWithError('This Riot account is already linked to another user');
    }

    // Encrypt tokens
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = await encryptToken(tokens.refresh_token);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Check if user already has a riot account
    const { data: existing } = await supabase
      .from('riot_accounts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing account
      await supabase
        .from('riot_accounts')
        .update({
          puuid: accountInfo.puuid,
          riot_id_name: accountInfo.gameName,
          riot_id_tag: accountInfo.tagLine,
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // Create new riot account
      await supabase
        .from('riot_accounts')
        .insert({
          user_id: userId,
          puuid: accountInfo.puuid,
          riot_id_name: accountInfo.gameName,
          riot_id_tag: accountInfo.tagLine,
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken,
          token_expires_at: tokenExpiresAt,
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          region: 'eu',
        });
    }

    // Update profile
    await supabase
      .from('profiles')
      .update({
        riot_id: `${accountInfo.gameName}#${accountInfo.tagLine}`,
        riot_puuid: accountInfo.puuid,
        riot_verified: true,
        riot_verified_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Try to fetch rank (optional, may fail)
    try {
      const rankData = await riotClient.getRankInfo(accountInfo.puuid, 'eu');
      if (rankData) {
        const currentActId = Deno.env.get('CURRENT_ACT_ID') || 'unknown';

        await supabase
          .from('riot_rank_cache')
          .upsert({
            puuid: accountInfo.puuid,
            current_tier: rankData.currenttier,
            current_rank: TIER_TO_RANK[rankData.currenttier] || 'Unknown',
            ranking_in_tier: rankData.ranking_in_tier,
            act_id: currentActId,
            fetched_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          }, {
            onConflict: 'puuid,act_id',
          });

        await supabase
          .from('profiles')
          .update({
            official_rank: TIER_TO_RANK[rankData.currenttier] || 'Unranked',
            official_rank_tier: rankData.currenttier,
            rank_last_updated: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    } catch (rankError) {
      console.warn('Failed to fetch rank:', rankError);
      // Non-fatal, continue
    }

    return redirectWithSuccess();

  } catch (error) {
    console.error('riot-auth-callback error:', error);
    return redirectWithError('Server error during authentication');
  }
});
