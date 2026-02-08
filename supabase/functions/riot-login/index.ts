// Edge Function: riot-login
// Public endpoint (no JWT required) — initiates RSO login flow

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { RiotApiClient, getRandomDemoRank } from '../_shared/riot-api.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const isDemoMode = Deno.env.get('RIOT_DEMO_MODE') === 'true';
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';

    if (isDemoMode) {
      return await handleDemoLogin(appUrl);
    }

    return handleProductionLogin();
  } catch (error) {
    console.error('riot-login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function handleProductionLogin(): Response {
  const riotClient = new RiotApiClient();

  const state = btoa(JSON.stringify({
    type: 'login',
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
  }));

  const authUrl = riotClient.getAuthorizationUrl(state);

  return new Response(
    JSON.stringify({ url: authUrl, demo: false }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDemoLogin(appUrl: string): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const shortId = crypto.randomUUID().slice(0, 8);
  const demoEmail = `demo-${shortId}@valohub.local`;
  const demoPassword = crypto.randomUUID();
  const demoUsername = `Player${Math.floor(1000 + Math.random() * 9000)}`;

  // Create demo user
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: demoEmail,
    password: demoPassword,
    email_confirm: true,
    user_metadata: {
      username: demoUsername,
      full_name: 'Demo Player',
    },
  });

  if (createError || !userData.user) {
    console.error('Failed to create demo user:', createError);
    return new Response(
      JSON.stringify({ error: 'Failed to create demo user' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const userId = userData.user.id;

  // Create riot_accounts entry
  const demoPuuid = `DEMO-${crypto.randomUUID()}`;
  const demoName = `ValoHub${Math.floor(Math.random() * 9999)}`;
  const demoTag = `${Math.floor(1000 + Math.random() * 9000)}`;

  await supabase.from('riot_accounts').insert({
    user_id: userId,
    puuid: demoPuuid,
    riot_id_name: demoName,
    riot_id_tag: demoTag,
    verification_status: 'verified',
    verified_at: new Date().toISOString(),
    region: 'eu',
  });

  // Update profile
  const demoRank = getRandomDemoRank();
  await supabase.from('profiles').update({
    riot_id: `${demoName}#${demoTag}`,
    riot_puuid: demoPuuid,
    riot_verified: true,
    riot_verified_at: new Date().toISOString(),
    official_rank: demoRank.rank,
    official_rank_tier: demoRank.tier,
    rank_last_updated: new Date().toISOString(),
  }).eq('id', userId);

  // Create rank cache
  const currentActId = Deno.env.get('CURRENT_ACT_ID') || 'demo-act-1';
  await supabase.from('riot_rank_cache').upsert({
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

  // Generate magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: demoEmail,
  });

  if (linkError || !linkData) {
    console.error('Failed to generate magic link:', linkError);
    return new Response(
      JSON.stringify({ error: 'Failed to generate login link' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Extract token_hash from the generated link
  const linkUrl = new URL(linkData.properties.action_link);
  const tokenHash = linkUrl.searchParams.get('token_hash') || linkUrl.hash;

  const callbackUrl = `${appUrl}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink&new_user=true&riot_name=${encodeURIComponent(demoName)}`;

  return new Response(
    JSON.stringify({ url: callbackUrl, demo: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
