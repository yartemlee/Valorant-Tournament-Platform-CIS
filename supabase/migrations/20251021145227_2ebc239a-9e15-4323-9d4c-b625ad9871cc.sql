-- Add phantom flags to tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_phantom BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phantom_source TEXT;

ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_phantom BOOLEAN DEFAULT FALSE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS phantom_source TEXT;

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS is_phantom BOOLEAN DEFAULT FALSE;

ALTER TABLE tournament_participants ADD COLUMN IF NOT EXISTS is_phantom BOOLEAN DEFAULT FALSE;

-- RPC 1: Fill tournament with phantom teams
CREATE OR REPLACE FUNCTION public.rpc_fill_tournament(
  tournament_id_input UUID,
  desired_size INT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        is_phantom,
        phantom_source
      ) VALUES (
        gen_random_uuid(),
        'phantom_' || new_team_id::TEXT || '_' || j::TEXT,
        'Фантомный игрок ' || j::TEXT,
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
$$;

-- RPC 2: Cleanup tournament phantoms
CREATE OR REPLACE FUNCTION public.rpc_cleanup_tournament_phantoms(
  tournament_id_input UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_owner BOOLEAN;
  phantom_team_ids UUID[];
  removed_teams INT := 0;
  removed_users INT := 0;
  removed_registrations INT := 0;
  phantom_source_val TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Check permission
  SELECT (owner_id = current_user_id) INTO is_owner
  FROM tournaments
  WHERE id = tournament_id_input;

  IF NOT is_owner THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  phantom_source_val := 'tournament:' || tournament_id_input::TEXT;

  -- Get phantom team IDs for this tournament
  SELECT ARRAY_AGG(DISTINCT user_id)
  INTO phantom_team_ids
  FROM tournament_participants
  WHERE tournament_id = tournament_id_input
    AND is_phantom = TRUE;

  -- Delete phantom registrations
  DELETE FROM tournament_participants
  WHERE tournament_id = tournament_id_input
    AND is_phantom = TRUE;
  GET DIAGNOSTICS removed_registrations = ROW_COUNT;

  -- Delete phantom teams and their members
  IF phantom_team_ids IS NOT NULL THEN
    FOR i IN 1..array_length(phantom_team_ids, 1) LOOP
      -- Check if team has only phantom members
      IF NOT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_id = phantom_team_ids[i]
          AND is_phantom = FALSE
      ) THEN
        -- Delete team members
        DELETE FROM team_members
        WHERE team_id = phantom_team_ids[i];

        -- Delete team
        DELETE FROM teams
        WHERE id = phantom_team_ids[i]
          AND is_phantom = TRUE;
        IF FOUND THEN
          removed_teams := removed_teams + 1;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Delete orphan phantom users
  DELETE FROM profiles
  WHERE is_phantom = TRUE
    AND phantom_source = phantom_source_val
    AND NOT EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = profiles.id
    );
  GET DIAGNOSTICS removed_users = ROW_COUNT;

  RETURN json_build_object(
    'removedTeams', removed_teams,
    'removedUsers', removed_users,
    'removedRegistrations', removed_registrations
  );
END;
$$;

-- RPC 3: Fill team roster with phantom players
CREATE OR REPLACE FUNCTION public.rpc_fill_team_roster(
  team_id_input UUID,
  min_size INT DEFAULT 5,
  max_size INT DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      is_phantom,
      phantom_source
    ) VALUES (
      gen_random_uuid(),
      'phantom_team_' || team_id_input::TEXT || '_' || i::TEXT,
      'Фантомный игрок ' || i::TEXT,
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
$$;

-- RPC 4: Cleanup team phantoms
CREATE OR REPLACE FUNCTION public.rpc_cleanup_team_phantoms(
  team_id_input UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_captain BOOLEAN;
  removed_phantoms INT := 0;
  removed_users INT := 0;
  phantom_user_ids UUID[];
  phantom_source_val TEXT;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Check permission
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

  -- Get phantom user IDs
  SELECT ARRAY_AGG(user_id)
  INTO phantom_user_ids
  FROM team_members
  WHERE team_id = team_id_input
    AND is_phantom = TRUE;

  -- Delete phantom team members
  DELETE FROM team_members
  WHERE team_id = team_id_input
    AND is_phantom = TRUE;
  GET DIAGNOSTICS removed_phantoms = ROW_COUNT;

  -- Delete phantom users that are not in any other team
  IF phantom_user_ids IS NOT NULL THEN
    DELETE FROM profiles
    WHERE id = ANY(phantom_user_ids)
      AND is_phantom = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.user_id = profiles.id
      );
    GET DIAGNOSTICS removed_users = ROW_COUNT;
  END IF;

  RETURN json_build_object(
    'removedPhantoms', removed_phantoms,
    'removedUsers', removed_users
  );
END;
$$;