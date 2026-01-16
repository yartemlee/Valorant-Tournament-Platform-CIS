// Edge Function: riot-auth-init
// Initiates Riot Sign On OAuth flow

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { RiotApiClient } from '../_shared/riot-api.ts';

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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a linked Riot account
    const { data: existingAccount } = await supabase
      .from('riot_accounts')
      .select('id, verification_status')
      .eq('user_id', user.id)
      .single();

    if (existingAccount?.verification_status === 'verified') {
      return new Response(
        JSON.stringify({ error: 'Riot account already linked', code: 'ALREADY_LINKED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for DEMO_MODE
    const isDemoMode = Deno.env.get('RIOT_DEMO_MODE') === 'true';
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:8080';

    if (isDemoMode) {
      // In demo mode, redirect directly to callback with demo state
      const demoCallbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/riot-auth-callback?demo=true&user_id=${user.id}`;

      return new Response(
        JSON.stringify({
          url: demoCallbackUrl,
          demo: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Production mode: Generate OAuth URL
    const riotClient = new RiotApiClient();

    // Create state with user ID and timestamp for CSRF protection
    const state = btoa(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      nonce: crypto.randomUUID(),
    }));

    const authUrl = riotClient.getAuthorizationUrl(state);

    return new Response(
      JSON.stringify({
        url: authUrl,
        demo: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('riot-auth-init error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
