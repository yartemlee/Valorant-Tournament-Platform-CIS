-- ============================================================================
-- Migration: Riot Sign On (RSO) Integration
-- Description: Adds tables for Riot account linking, rank caching, and profile updates
-- ============================================================================

-- ============================================================================
-- 1. Create riot_accounts table
-- Stores linked Riot accounts with encrypted OAuth tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.riot_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Riot identifiers (PUUID is immutable, riot_id can change)
  puuid TEXT NOT NULL UNIQUE,           -- Riot PUUID (78 chars, immutable identifier)
  riot_id_name TEXT NOT NULL,           -- GameName part
  riot_id_tag TEXT NOT NULL,            -- TagLine part

  -- OAuth tokens (encrypted with pgcrypto)
  access_token_encrypted TEXT,          -- Encrypted access token
  refresh_token_encrypted TEXT,         -- Encrypted refresh token
  token_expires_at TIMESTAMPTZ,

  -- Verification status
  verification_status TEXT DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'expired', 'revoked')),
  verified_at TIMESTAMPTZ,

  -- Region for API routing
  region TEXT NOT NULL DEFAULT 'eu'
    CHECK (region IN ('eu', 'na', 'ap', 'kr', 'br', 'latam')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_sync_at TIMESTAMPTZ,

  -- One Riot account per user
  UNIQUE(user_id)
);

-- Indexes for riot_accounts
CREATE INDEX IF NOT EXISTS idx_riot_accounts_puuid ON public.riot_accounts(puuid);
CREATE INDEX IF NOT EXISTS idx_riot_accounts_user_id ON public.riot_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_riot_accounts_verification ON public.riot_accounts(verification_status);

-- Comments
COMMENT ON TABLE public.riot_accounts IS 'Linked Riot accounts via RSO OAuth';
COMMENT ON COLUMN public.riot_accounts.puuid IS 'Player UUID from Riot - immutable identifier';
COMMENT ON COLUMN public.riot_accounts.access_token_encrypted IS 'AES-GCM encrypted OAuth access token';
COMMENT ON COLUMN public.riot_accounts.refresh_token_encrypted IS 'AES-GCM encrypted OAuth refresh token';

-- ============================================================================
-- 2. Create riot_rank_cache table
-- Caches rank data to minimize API calls (TTL: 1 hour)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.riot_rank_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  puuid TEXT NOT NULL REFERENCES public.riot_accounts(puuid) ON DELETE CASCADE,

  -- Rank data
  current_tier INTEGER,               -- 0-27 (Iron 1 = 3, Radiant = 27)
  current_rank TEXT,                  -- "Diamond 2"
  ranking_in_tier INTEGER,            -- Position in rank (for Immortal+)
  leaderboard_rank INTEGER,           -- Leaderboard position (for Radiant)

  -- Peak rank for current act
  peak_tier INTEGER,
  peak_rank TEXT,

  -- Act metadata
  act_id TEXT NOT NULL,               -- UUID of current act
  act_name TEXT,                      -- "Episode 8 Act 3"

  -- Stats
  wins INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,

  -- Cache management
  fetched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,    -- TTL for cache

  UNIQUE(puuid, act_id)
);

-- Indexes for riot_rank_cache
CREATE INDEX IF NOT EXISTS idx_riot_rank_cache_puuid ON public.riot_rank_cache(puuid);
CREATE INDEX IF NOT EXISTS idx_riot_rank_cache_expires ON public.riot_rank_cache(expires_at);

-- Comments
COMMENT ON TABLE public.riot_rank_cache IS 'Cached rank data from Riot API with TTL';
COMMENT ON COLUMN public.riot_rank_cache.current_tier IS 'Numeric tier: 0=Unranked, 3=Iron1, ..., 27=Radiant';
COMMENT ON COLUMN public.riot_rank_cache.expires_at IS 'Cache expiration time (default: 1 hour)';

-- ============================================================================
-- 3. Update profiles table with Riot integration fields
-- ============================================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS riot_puuid TEXT,
ADD COLUMN IF NOT EXISTS riot_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS riot_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS official_rank TEXT,
ADD COLUMN IF NOT EXISTS official_rank_tier INTEGER,
ADD COLUMN IF NOT EXISTS rank_last_updated TIMESTAMPTZ;

-- Index for PUUID lookup
CREATE INDEX IF NOT EXISTS idx_profiles_riot_puuid ON public.profiles(riot_puuid);

-- Comments for new columns
COMMENT ON COLUMN public.profiles.riot_puuid IS 'Reference to verified Riot account PUUID';
COMMENT ON COLUMN public.profiles.riot_verified IS 'Whether Riot account is verified via RSO';
COMMENT ON COLUMN public.profiles.official_rank IS 'Official rank from Riot API (e.g., Diamond 2)';
COMMENT ON COLUMN public.profiles.official_rank_tier IS 'Numeric tier for sorting (0-27)';
COMMENT ON COLUMN public.profiles.rank_last_updated IS 'Last time rank was synced from Riot API';

-- ============================================================================
-- 4. RLS Policies for riot_accounts
-- ============================================================================
ALTER TABLE public.riot_accounts ENABLE ROW LEVEL SECURITY;

-- Users can view their own Riot account
CREATE POLICY "Users can view own riot account"
  ON public.riot_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own Riot account (via Edge Functions)
CREATE POLICY "Users can insert own riot account"
  ON public.riot_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own Riot account
CREATE POLICY "Users can update own riot account"
  ON public.riot_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own Riot account
CREATE POLICY "Users can delete own riot account"
  ON public.riot_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. RLS Policies for riot_rank_cache
-- ============================================================================
ALTER TABLE public.riot_rank_cache ENABLE ROW LEVEL SECURITY;

-- Rank cache is viewable by authenticated users (for verified accounts only)
CREATE POLICY "Rank cache viewable for verified accounts"
  ON public.riot_rank_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.riot_accounts ra
      WHERE ra.puuid = riot_rank_cache.puuid
      AND ra.verification_status = 'verified'
    )
  );

-- Service role can manage rank cache (via Edge Functions)
-- Note: Edge Functions use service_role key which bypasses RLS

-- ============================================================================
-- 6. Trigger for updated_at on riot_accounts
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_riot_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_riot_accounts_updated_at
  BEFORE UPDATE ON public.riot_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_riot_accounts_updated_at();

-- ============================================================================
-- 7. Helper function to convert tier to rank name
-- ============================================================================
CREATE OR REPLACE FUNCTION public.tier_to_rank_name(tier INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE tier
    WHEN 0 THEN 'Unranked'
    WHEN 3 THEN 'Iron 1'
    WHEN 4 THEN 'Iron 2'
    WHEN 5 THEN 'Iron 3'
    WHEN 6 THEN 'Bronze 1'
    WHEN 7 THEN 'Bronze 2'
    WHEN 8 THEN 'Bronze 3'
    WHEN 9 THEN 'Silver 1'
    WHEN 10 THEN 'Silver 2'
    WHEN 11 THEN 'Silver 3'
    WHEN 12 THEN 'Gold 1'
    WHEN 13 THEN 'Gold 2'
    WHEN 14 THEN 'Gold 3'
    WHEN 15 THEN 'Platinum 1'
    WHEN 16 THEN 'Platinum 2'
    WHEN 17 THEN 'Platinum 3'
    WHEN 18 THEN 'Diamond 1'
    WHEN 19 THEN 'Diamond 2'
    WHEN 20 THEN 'Diamond 3'
    WHEN 21 THEN 'Ascendant 1'
    WHEN 22 THEN 'Ascendant 2'
    WHEN 23 THEN 'Ascendant 3'
    WHEN 24 THEN 'Immortal 1'
    WHEN 25 THEN 'Immortal 2'
    WHEN 26 THEN 'Immortal 3'
    WHEN 27 THEN 'Radiant'
    ELSE 'Unknown'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.tier_to_rank_name IS 'Converts numeric tier (0-27) to human-readable rank name';

-- ============================================================================
-- 8. Function to check rate limit for Riot API calls
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.riot_api_rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,           -- 'rank_sync', 'account_info', etc.
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.riot_api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
  ON public.riot_api_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.check_riot_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 1,
  p_window_minutes INTEGER DEFAULT 5
) RETURNS BOOLEAN AS $$
DECLARE
  v_record RECORD;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  SELECT * INTO v_record
  FROM public.riot_api_rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint;

  IF NOT FOUND THEN
    -- First request, create record
    INSERT INTO public.riot_api_rate_limits (user_id, endpoint)
    VALUES (p_user_id, p_endpoint);
    RETURN TRUE;
  END IF;

  IF v_record.window_start < v_window_start THEN
    -- New window, reset count
    UPDATE public.riot_api_rate_limits
    SET request_count = 1, window_start = NOW(), last_request_at = NOW()
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN TRUE;
  END IF;

  IF v_record.request_count >= p_max_requests THEN
    -- Rate limited
    RETURN FALSE;
  END IF;

  -- Increment count
  UPDATE public.riot_api_rate_limits
  SET request_count = request_count + 1, last_request_at = NOW()
  WHERE user_id = p_user_id AND endpoint = p_endpoint;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_riot_rate_limit IS 'Check and update rate limit for Riot API calls per user';

-- ============================================================================
-- 9. Enable realtime for riot_accounts (for status updates)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.riot_accounts;
