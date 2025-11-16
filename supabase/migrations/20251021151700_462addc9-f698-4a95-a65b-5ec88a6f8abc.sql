-- Обновляем функцию создания фантомных игроков для команды
CREATE OR REPLACE FUNCTION public.rpc_fill_team_roster(team_id_input uuid, min_size integer DEFAULT 5, max_size integer DEFAULT 10)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID;
  is_captain BOOLEAN;
  current_size INT;
  players_needed INT;
  added_phantoms INT := 0;
  new_user_id UUID;
  phantom_source_val TEXT;
  i INT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Check permission: user must be captain
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_id_input
      AND user_id = current_user_id
      AND team_role = 'captain'
  ) INTO is_captain;

  IF NOT is_captain THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  phantom_source_val := 'team:' || team_id_input::TEXT;

  -- Count current roster
  SELECT COUNT(*)
  INTO current_size
  FROM team_members
  WHERE team_id = team_id_input;

  players_needed := GREATEST(0, min_size - current_size);

  IF players_needed = 0 THEN
    RETURN json_build_object(
      'addedPhantoms', 0,
      'totalMembers', current_size
    );
  END IF;

  -- Limit to max_size
  IF current_size + players_needed > max_size THEN
    players_needed := max_size - current_size;
  END IF;

  -- Create phantom players
  FOR i IN 1..players_needed LOOP
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
      'phantom_team_' || team_id_input::TEXT || '_' || i::TEXT,
      'Фантомный игрок ' || i::TEXT,
      'PhantomPlayer' || (current_size + i)::TEXT,
      'TEST',
      TRUE,
      phantom_source_val
    ) RETURNING id INTO new_user_id;

    -- Add to team
    INSERT INTO team_members (
      team_id,
      user_id,
      team_role,
      is_phantom
    ) VALUES (
      team_id_input,
      new_user_id,
      'player',
      TRUE
    );

    added_phantoms := added_phantoms + 1;
  END LOOP;

  RETURN json_build_object(
    'addedPhantoms', added_phantoms,
    'totalMembers', current_size + added_phantoms
  );
END;
$function$;

-- Обновляем функцию создания фантомных команд для турнира
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
  i INT;
  j INT;
  phantom_source_val TEXT;
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
    -- Create phantom team
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
      'Фантомная команда ' || (current_phantom_count + i)::TEXT,
      'PH' || (current_phantom_count + i)::TEXT,
      NULL,
      TRUE,
      phantom_source_val,
      FALSE
    ) RETURNING id INTO new_team_id;

    created_teams := created_teams + 1;

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
        'Фантомный игрок ' || j::TEXT,
        'PhantomTeam' || (current_phantom_count + i)::TEXT || 'P' || j::TEXT,
        'TEST',
        TRUE,
        phantom_source_val
      ) RETURNING id INTO new_user_id;

      created_users := created_users + 1;

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

    -- Register team to tournament
    INSERT INTO tournament_participants (
      tournament_id,
      user_id,
      team_name,
      is_phantom,
      status
    ) VALUES (
      tournament_id_input,
      new_team_id,
      'Фантомная команда ' || (current_phantom_count + i)::TEXT,
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