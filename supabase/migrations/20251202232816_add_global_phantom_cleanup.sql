-- Migration: Add global phantom data cleanup function
-- This function removes ALL phantom teams, users, and registrations from the entire database

CREATE OR REPLACE FUNCTION rpc_cleanup_all_phantoms()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_removed_teams INT := 0;
  v_removed_users INT := 0;
  v_removed_registrations INT := 0;
BEGIN
  -- First, delete all tournament registrations for phantom teams
  WITH deleted_registrations AS (
    DELETE FROM tournament_registrations
    WHERE team_id IN (
      SELECT id FROM teams WHERE is_phantom = true
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_removed_registrations FROM deleted_registrations;

  -- Delete all members of phantom teams
  DELETE FROM team_members
  WHERE team_id IN (
    SELECT id FROM teams WHERE is_phantom = true
  );

  -- Delete all phantom teams
  WITH deleted_teams AS (
    DELETE FROM teams
    WHERE is_phantom = true
    RETURNING id
  )
  SELECT COUNT(*) INTO v_removed_teams FROM deleted_teams;

  -- Delete all phantom users (users with names starting with "Phantom Player")
  WITH deleted_users AS (
    DELETE FROM profiles
    WHERE full_name LIKE 'Phantom Player%'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_removed_users FROM deleted_users;

  -- Delete auth users for phantom players
  DELETE FROM auth.users
  WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE 'phantom.player.%@phantom.local'
  );

  RETURN json_build_object(
    'removedTeams', v_removed_teams,
    'removedUsers', v_removed_users,
    'removedRegistrations', v_removed_registrations
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION rpc_cleanup_all_phantoms() TO authenticated;

-- Add comment
COMMENT ON FUNCTION rpc_cleanup_all_phantoms() IS 'Removes all phantom teams, users, and registrations from the entire database';
