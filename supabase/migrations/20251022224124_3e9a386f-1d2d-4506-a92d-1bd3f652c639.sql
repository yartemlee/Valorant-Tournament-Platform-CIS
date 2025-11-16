-- Create internal cleanup functions without auth checks for use in triggers

-- Internal function to cleanup tournament phantoms (no auth check)
CREATE OR REPLACE FUNCTION internal_cleanup_tournament_phantoms(tournament_id_input UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  phantom_team_ids UUID[];
  removed_teams INT := 0;
  removed_users INT := 0;
  removed_registrations INT := 0;
  phantom_source_val TEXT;
BEGIN
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

-- Internal function to cleanup team phantoms (no auth check)
CREATE OR REPLACE FUNCTION internal_cleanup_team_phantoms(team_id_input UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  removed_phantoms INT := 0;
  removed_users INT := 0;
  phantom_user_ids UUID[];
  phantom_source_val TEXT;
BEGIN
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

-- Trigger function for automatic cleanup on tournament deletion
CREATE OR REPLACE FUNCTION cleanup_tournament_phantoms_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call internal cleanup function without auth check
  PERFORM internal_cleanup_tournament_phantoms(OLD.id);
  RETURN OLD;
END;
$$;

-- Trigger function for automatic cleanup on team deletion
CREATE OR REPLACE FUNCTION cleanup_team_phantoms_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call internal cleanup function without auth check
  PERFORM internal_cleanup_team_phantoms(OLD.id);
  RETURN OLD;
END;
$$;

-- Create trigger on tournaments table
DROP TRIGGER IF EXISTS trigger_cleanup_tournament_phantoms ON tournaments;
CREATE TRIGGER trigger_cleanup_tournament_phantoms
  BEFORE DELETE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_tournament_phantoms_trigger();

-- Create trigger on teams table
DROP TRIGGER IF EXISTS trigger_cleanup_team_phantoms ON teams;
CREATE TRIGGER trigger_cleanup_team_phantoms
  BEFORE DELETE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_team_phantoms_trigger();