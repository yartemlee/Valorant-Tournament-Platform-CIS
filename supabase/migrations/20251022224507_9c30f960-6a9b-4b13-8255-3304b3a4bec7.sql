-- Fix phantom team name length constraint violation
CREATE OR REPLACE FUNCTION public.rpc_fill_tournament(tournament_id_input uuid, desired_size integer DEFAULT NULL::integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID;
  is_owner BOOLEAN;
  current_real_count INT;
  current_phantom_count INT;
  target_size INT;
  teams_needed INT;
  created_teams INT := 0;
  created_users INT := 0;
  new_team_id UUID;
  new_user_id UUID;
  captain_user_id UUID;
  i INT;
  j INT;
  phantom_source_val TEXT;
  time_suffix TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Check permission: user must own the tournament
  SELECT (owner_id = current_user_id) INTO is_owner
  FROM tournaments
  WHERE id = tournament_id_input;

  IF NOT is_owner THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  phantom_source_val := 'tournament:' || tournament_id_input::TEXT;
  -- Create time suffix using HHMISS format (e.g., 224530)
  time_suffix := TO_CHAR(NOW(), 'HH24MISS');

  -- Count current registrations
  SELECT 
    COUNT(*) FILTER (WHERE is_phantom = FALSE),
    COUNT(*) FILTER (WHERE is_phantom = TRUE)
  INTO current_real_count, current_phantom_count
  FROM tournament_participants
  WHERE tournament_id = tournament_id_input;

  -- Determine target size
  IF desired_size IS NULL THEN
    IF current_real_count + current_phantom_count < 8 THEN
      target_size := 8;
    ELSIF current_real_count + current_phantom_count < 16 THEN
      target_size := 16;
    ELSIF current_real_count + current_phantom_count < 32 THEN
      target_size := 32;
    ELSE
      target_size := 64;
    END IF;
  ELSE
    target_size := desired_size;
  END IF;

  teams_needed := target_size - current_real_count - current_phantom_count;

  IF teams_needed <= 0 THEN
    RETURN json_build_object(
      'createdTeams', 0,
      'createdUsers', 0,
      'registeredTeams', 0,
      'totalRegistered', current_real_count + current_phantom_count
    );
  END IF;

  -- Create phantom teams
  FOR i IN 1..teams_needed LOOP
    -- Create phantom team with short unique name
    INSERT INTO teams (
      owner_id,
      name,
      tag,
      logo_url,
      is_phantom,
      phantom_source,
      is_recruiting
    ) VALUES (
      current_user_id,
      'Phantom ' || time_suffix || '-' || i::TEXT,
      'PH' || i::TEXT,
      NULL,
      TRUE,
      phantom_source_val,
      FALSE
    ) RETURNING id INTO new_team_id;

    created_teams := created_teams + 1;
    captain_user_id := NULL;

    -- Create 5 phantom users for this team
    FOR j IN 1..5 LOOP
      INSERT INTO profiles (
        id,
        username,
        full_name,
        riot_id,
        riot_tag,
        is_phantom,
        phantom_source
      ) VALUES (
        gen_random_uuid(),
        'phantom_' || new_team_id::TEXT || '_' || j::TEXT,
        'Phantom Player ' || j::TEXT,
        'PT' || time_suffix || 'T' || i::TEXT || 'P' || j::TEXT,
        'TEST',
        TRUE,
        phantom_source_val
      ) RETURNING id INTO new_user_id;

      created_users := created_users + 1;

      -- Save the first player as captain
      IF j = 1 THEN
        captain_user_id := new_user_id;
      END IF;

      -- Add to team
      INSERT INTO team_members (
        team_id,
        user_id,
        team_role,
        is_phantom
      ) VALUES (
        new_team_id,
        new_user_id,
        CASE WHEN j = 1 THEN 'captain' ELSE 'player' END,
        TRUE
      );
    END LOOP;

    -- Register team to tournament using team_id
    INSERT INTO tournament_participants (
      tournament_id,
      user_id,
      team_id,
      is_phantom,
      status
    ) VALUES (
      tournament_id_input,
      captain_user_id,
      new_team_id,
      TRUE,
      'registered'
    );
  END LOOP;

  RETURN json_build_object(
    'createdTeams', created_teams,
    'createdUsers', created_users,
    'registeredTeams', teams_needed,
    'totalRegistered', current_real_count + current_phantom_count + teams_needed
  );
END;
$function$;