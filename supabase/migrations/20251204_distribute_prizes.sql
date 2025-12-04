-- Migration: Create distribute_tournament_prizes RPC
-- Description: Distributes prize pool coins to winning teams' players (60/30/10 split).

CREATE OR REPLACE FUNCTION public.distribute_tournament_prizes(
  p_tournament_id UUID,
  p_first_place_team_id UUID,
  p_second_place_team_id UUID,
  p_third_place_team_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_prize_pool_text TEXT;
  v_prize_pool_amount INTEGER;
  v_share_1st INTEGER;
  v_share_2nd INTEGER;
  v_share_3rd INTEGER;
  v_roster UUID[];
  v_player_share INTEGER;
  v_result JSONB := '{}'::jsonb;
BEGIN
  -- Check permissions: Organizer or Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE id = p_tournament_id AND organizer_id = auth.uid()
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only tournament organizer or admin can distribute prizes';
  END IF;

  -- Get prize pool
  SELECT prize_pool INTO v_prize_pool_text
  FROM public.tournaments
  WHERE id = p_tournament_id;

  -- Parse prize pool
  BEGIN
    v_prize_pool_amount := v_prize_pool_text::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    v_prize_pool_amount := 0;
  END;

  IF v_prize_pool_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'No prize pool to distribute');
  END IF;

  -- Calculate shares (60%, 30%, 10%)
  v_share_1st := FLOOR(v_prize_pool_amount * 0.60);
  v_share_2nd := FLOOR(v_prize_pool_amount * 0.30);
  v_share_3rd := FLOOR(v_prize_pool_amount * 0.10);

  -- Helper function to distribute to a team
  -- We can't define inner functions easily in PL/pgSQL so we repeat logic or use a loop.
  -- Let's use a loop over the 3 places.

  FOR i IN 1..3 LOOP
    DECLARE
      v_current_team_id UUID;
      v_current_share INTEGER;
    BEGIN
      IF i = 1 THEN
        v_current_team_id := p_first_place_team_id;
        v_current_share := v_share_1st;
      ELSIF i = 2 THEN
        v_current_team_id := p_second_place_team_id;
        v_current_share := v_share_2nd;
      ELSIF i = 3 THEN
        v_current_team_id := p_third_place_team_id;
        v_current_share := v_share_3rd;
      END IF;

      IF v_current_team_id IS NOT NULL AND v_current_share > 0 THEN
        -- Get roster
        SELECT selected_roster INTO v_roster
        FROM public.tournament_registrations
        WHERE tournament_id = p_tournament_id AND team_id = v_current_team_id;

        -- Fallback to all members if no roster selected
        IF v_roster IS NULL OR array_length(v_roster, 1) = 0 THEN
          SELECT array_agg(user_id) INTO v_roster
          FROM public.team_members
          WHERE team_id = v_current_team_id;
        END IF;

        IF v_roster IS NOT NULL AND array_length(v_roster, 1) > 0 THEN
          v_player_share := FLOOR(v_current_share / array_length(v_roster, 1));
          
          IF v_player_share > 0 THEN
            UPDATE public.profiles
            SET coins = COALESCE(coins, 0) + v_player_share
            WHERE id = ANY(v_roster);
          END IF;
        END IF;
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'distributed_total', v_share_1st + v_share_2nd + v_share_3rd
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
