-- Migration: Add selected_roster to tournament_registrations and update award_tournament_medals
-- Description: Allows selecting specific players for a tournament and awards medals only to them.

-- 1. Add selected_roster column
ALTER TABLE public.tournament_registrations
ADD COLUMN IF NOT EXISTS selected_roster UUID[] DEFAULT NULL;

-- 2. Update award_tournament_medals RPC
CREATE OR REPLACE FUNCTION public.award_tournament_medals(
  p_tournament_id UUID,
  p_team_id UUID,
  p_medal_type TEXT
)
RETURNS VOID AS $$
DECLARE
  v_col_name TEXT;
  v_selected_roster UUID[];
BEGIN
  -- Check permissions: Organizer or Admin
  IF NOT EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE id = p_tournament_id AND organizer_id = auth.uid()
  ) AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only tournament organizer or admin can award medals';
  END IF;

  -- Determine column name
  IF p_medal_type = 'gold' THEN
    v_col_name := 'medals_gold';
  ELSIF p_medal_type = 'silver' THEN
    v_col_name := 'medals_silver';
  ELSIF p_medal_type = 'bronze' THEN
    v_col_name := 'medals_bronze';
  ELSE
    RAISE EXCEPTION 'Invalid medal type: %', p_medal_type;
  END IF;

  -- Get selected roster for this tournament registration
  SELECT selected_roster INTO v_selected_roster
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id AND team_id = p_team_id;

  -- Update Team Medal Count
  EXECUTE format('UPDATE public.teams SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', v_col_name, v_col_name)
  USING p_team_id;

  -- Update Members Medal Count
  IF v_selected_roster IS NOT NULL AND array_length(v_selected_roster, 1) > 0 THEN
    -- Award only to selected roster
    EXECUTE format('
      UPDATE public.profiles 
      SET %I = COALESCE(%I, 0) + 1 
      WHERE id = ANY($1)
    ', v_col_name, v_col_name)
    USING v_selected_roster;
  ELSE
    -- Fallback: Award to ALL current team members (legacy behavior)
    EXECUTE format('
      UPDATE public.profiles 
      SET %I = COALESCE(%I, 0) + 1 
      WHERE id IN (
        SELECT user_id FROM public.team_members WHERE team_id = $1
      )', v_col_name, v_col_name)
    USING p_team_id;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
