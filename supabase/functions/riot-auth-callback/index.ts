// Edge Function: riot-auth-callback
// Handles Riot OAuth callback for both account linking and login flows

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { RiotApiClient, getRandomDemoRank, TIER_TO_RANK } from '../_shared/riot-api.ts';
import { encryptToken } from '../_shared/crypto.ts';

interface LinkingState {
  type?: undefined;
  userId: string;
  timestamp: number;
  nonce: string;
}

interface LoginState {
  type: 'login';
  timestamp: number;
  nonce: string;
}

type StateData = LinkingState | LoginState;

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';

  const redirectWithError = (error: string) => {
    return Response.redirect(`${appUrl}/profile?riot_error=${encodeURIComponent(error)}`, 302);
  };

  const redirectWithSuccess = () => {
    return Response.redirect(`${appUrl}/profile?riot_linked=true`, 302);
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for DEMO_MODE (legacy linking flow)
    const isDemoMode = url.searchParams.get('demo') === 'true';

    if (isDemoMode) {
      const userId = url.searchParams.get('user_id');
      if (!userId) {
        return redirectWithError('Missing user_id in demo mode');
      }

      const demoName = `ValoHubPlayer${Math.floor(Math.random() * 9999)}`;
      const demoTag = `${Math.floor(1000 + Math.random() * 9000)}`;
      const demoPuuid = `DEMO-${crypto.randomUUID()}`;
      const demoRank = getRandomDemoRank();

      const { data: existing } = await supabase
        .from('riot_accounts')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
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
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
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

    let stateData: StateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return redirectWithError('Invalid state parameter');
    }

    // Check state is not too old (5 minute window)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return redirectWithError('State expired');
    }

    // Exchange code for tokens
    const riotClient = new RiotApiClient();
    const tokens = await riotClient.exchangeCodeForTokens(code);
    const accountInfo = await riotClient.getAccountInfo(tokens.access_token);

    // Encrypt tokens
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = await encryptToken(tokens.refresh_token);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // ── LOGIN FLOW ──
    if (stateData.type === 'login') {
      return await handleLoginFlow(
        supabase, riotClient, accountInfo, encryptedAccessToken,
        encryptedRefreshToken, tokenExpiresAt, appUrl
      );
    }

    // ── LINKING FLOW (legacy — userId in state) ──
    const userId = (stateData as LinkingState).userId;

    // Check if PUUID is already linked to another user
    const { data: existingPuuid } = await supabase
      .from('riot_accounts')
      .select('user_id')
      .eq('puuid', accountInfo.puuid)
      .single();

    if (existingPuuid && existingPuuid.user_id !== userId) {
      return redirectWithError('This Riot account is already linked to another user');
    }

    const { data: existing } = await supabase
      .from('riot_accounts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
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

    await supabase
      .from('profiles')
      .update({
        riot_id: `${accountInfo.gameName}#${accountInfo.tagLine}`,
        riot_puuid: accountInfo.puuid,
        riot_verified: true,
        riot_verified_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Try to fetch rank
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
    }

    return redirectWithSuccess();

  } catch (error) {
    console.error('riot-auth-callback error:', error);
    return redirectWithError('Server error during authentication');
  }
});

/**
 * Handle RSO login flow: find or create user by PUUID, generate magic link
 */
async function handleLoginFlow(
  supabase: ReturnType<typeof createClient>,
  riotClient: RiotApiClient,
  accountInfo: { puuid: string; gameName: string; tagLine: string },
  encryptedAccessToken: string,
  encryptedRefreshToken: string,
  tokenExpiresAt: string,
  appUrl: string,
): Promise<Response> {
  // Look up existing user by PUUID
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('riot_puuid', accountInfo.puuid)
    .single();

  let userId: string;
  let isNewUser = false;

  if (existingProfile) {
    // ── RETURNING USER ──
    userId = existingProfile.id;

    // Update riot_accounts with fresh tokens
    await supabase
      .from('riot_accounts')
      .update({
        riot_id_name: accountInfo.gameName,
        riot_id_tag: accountInfo.tagLine,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
        last_sync_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Update profile Riot ID in case it changed
    await supabase
      .from('profiles')
      .update({
        riot_id: `${accountInfo.gameName}#${accountInfo.tagLine}`,
      })
      .eq('id', userId);

  } else {
    // ── NEW USER ──
    isNewUser = true;

    const tempEmail = `${accountInfo.puuid.slice(0, 8)}@valohub.local`;

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        username: accountInfo.gameName,
        full_name: `${accountInfo.gameName}#${accountInfo.tagLine}`,
      },
    });

    if (createError || !newUser.user) {
      console.error('Failed to create user:', createError);
      return Response.redirect(
        `${appUrl}/login?error=${encodeURIComponent('Failed to create account')}`,
        302
      );
    }

    userId = newUser.user.id;

    // Create riot_accounts entry
    await supabase.from('riot_accounts').insert({
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

    // Update profile
    await supabase.from('profiles').update({
      riot_id: `${accountInfo.gameName}#${accountInfo.tagLine}`,
      riot_puuid: accountInfo.puuid,
      riot_verified: true,
      riot_verified_at: new Date().toISOString(),
    }).eq('id', userId);

    // Try to fetch rank (non-critical)
    try {
      const rankData = await riotClient.getRankInfo(accountInfo.puuid, 'eu');
      if (rankData) {
        const currentActId = Deno.env.get('CURRENT_ACT_ID') || 'unknown';

        await supabase.from('riot_rank_cache').upsert({
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

        await supabase.from('profiles').update({
          official_rank: TIER_TO_RANK[rankData.currenttier] || 'Unranked',
          official_rank_tier: rankData.currenttier,
          rank_last_updated: new Date().toISOString(),
        }).eq('id', userId);
      }
    } catch (rankError) {
      console.warn('Failed to fetch rank for new user:', rankError);
    }
  }

  // Generate magic link for the user
  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  if (!authUser?.user?.email) {
    return Response.redirect(
      `${appUrl}/login?error=${encodeURIComponent('User email not found')}`,
      302
    );
  }

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: authUser.user.email,
  });

  if (linkError || !linkData) {
    console.error('Failed to generate magic link:', linkError);
    return Response.redirect(
      `${appUrl}/login?error=${encodeURIComponent('Failed to generate login link')}`,
      302
    );
  }

  const linkUrl = new URL(linkData.properties.action_link);
  const tokenHash = linkUrl.searchParams.get('token_hash') || '';

  let callbackUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink`;

  if (isNewUser) {
    callbackUrl += `&new_user=true&riot_name=${encodeURIComponent(accountInfo.gameName)}`;
  }

  return Response.redirect(callbackUrl, 302);
}
