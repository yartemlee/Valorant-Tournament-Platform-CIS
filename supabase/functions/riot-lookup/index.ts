// Edge Function: riot-lookup
// Public endpoint (no JWT required) — looks up Riot account by gameName#tagLine

import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { RiotApiClient } from '../_shared/riot-api.ts';

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
    const { gameName, tagLine } = await req.json();

    if (!gameName || !tagLine) {
      return new Response(
        JSON.stringify({ error: 'gameName and tagLine are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const riotClient = new RiotApiClient();
    const account = await riotClient.getAccountByRiotId(gameName, tagLine);

    return new Response(
      JSON.stringify({
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'Riot ID not found') {
      return new Response(
        JSON.stringify({ error: 'Riot ID не найден' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.error('riot-lookup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
