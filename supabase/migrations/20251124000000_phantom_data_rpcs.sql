-- Create RPCs for Phantom Data Management

-- Function to fill tournament with phantom teams
CREATE OR REPLACE FUNCTION public.rpc_fill_tournament(tournament_id_input uuid, desired_size int DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions -- Set search path to include auth for accessing auth.users
AS $$
DECLARE
    current_count int;
    target_size int;
    teams_to_create int;
    i int;
    new_team_id uuid;
    new_captain_id uuid;
    created_teams int := 0;
    created_users int := 0;
    phantom_email text;
BEGIN
    -- Get current team count
    SELECT count(*) INTO current_count
    FROM tournament_registrations
    WHERE tournament_id = tournament_id_input;

    -- Determine target size
    IF desired_size IS NOT NULL THEN
        target_size := desired_size;
    ELSE
        -- Auto-calculate next power of 2: 8, 16, 32, 64...
        IF current_count < 8 THEN target_size := 8;
        ELSIF current_count < 16 THEN target_size := 16;
        ELSIF current_count < 32 THEN target_size := 32;
        ELSE target_size := 64;
        END IF;
    END IF;

    teams_to_create := target_size - current_count;

    IF teams_to_create <= 0 THEN
        RETURN json_build_object(
            'createdTeams', 0,
            'createdUsers', 0,
            'registeredTeams', current_count,
            'totalRegistered', current_count
        );
    END IF;

    FOR i IN 1..teams_to_create LOOP
        new_captain_id := gen_random_uuid();
        new_team_id := gen_random_uuid();
        phantom_email := 'phantom_' || substr(new_captain_id::text, 1, 8) || '@example.com';

        -- Create Phantom User in auth.users
        -- We need to insert into auth.users to satisfy the foreign key in profiles
        -- The handle_new_user trigger will automatically create the profile
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (
            new_captain_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            phantom_email,
            '$2a$10$phantompasswordhashplaceholder', -- Dummy hash
            now(),
            jsonb_build_object(
                'username', 'PhantomUser_' || substr(new_captain_id::text, 1, 8),
                'is_phantom', true
            )
        );
        created_users := created_users + 1;

        -- Mark profile as phantom (in case trigger didn't handle it, though we passed it in meta_data, 
        -- the trigger in 20251122000000_mvp_schema.sql only uses username and avatar_url)
        -- So we explicitly update the profile to store the phantom flag in social_links or similar
        -- We'll use social_links for now as a flexible storage
        UPDATE public.profiles 
        SET social_links = jsonb_build_object('is_phantom', true)
        WHERE id = new_captain_id;

        -- Create Phantom Team
        INSERT INTO public.teams (id, name, tag, captain_id, min_rank)
        VALUES (
            new_team_id,
            'Phantom Team ' || substr(new_team_id::text, 1, 8),
            'PHTM',
            new_captain_id,
            'Iron 1'
        );
        created_teams := created_teams + 1;

        -- Register Team
        INSERT INTO public.tournament_registrations (tournament_id, team_id, status)
        VALUES (tournament_id_input, new_team_id, 'approved');
        
        -- Update Captain's current team
        UPDATE public.profiles SET current_team_id = new_team_id WHERE id = new_captain_id;

    END LOOP;

    RETURN json_build_object(
        'createdTeams', created_teams,
        'createdUsers', created_users,
        'registeredTeams', current_count + created_teams,
        'totalRegistered', current_count + created_teams
    );
END;
$$;

-- Function to cleanup phantom data
CREATE OR REPLACE FUNCTION public.rpc_cleanup_tournament_phantoms(tournament_id_input uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    removed_teams int := 0;
    removed_users int := 0;
    team_record record;
BEGIN
    -- Find phantom teams in this tournament
    FOR team_record IN
        SELECT t.id, t.captain_id
        FROM public.teams t
        JOIN public.tournament_registrations tr ON tr.team_id = t.id
        JOIN public.profiles p ON t.captain_id = p.id
        WHERE tr.tournament_id = tournament_id_input
        AND (p.social_links->>'is_phantom')::boolean = true
    LOOP
        -- Delete registration
        DELETE FROM public.tournament_registrations WHERE team_id = team_record.id AND tournament_id = tournament_id_input;
        
        -- Delete team (cascade should handle members if any, but we only made captain)
        DELETE FROM public.teams WHERE id = team_record.id;
        removed_teams := removed_teams + 1;

        -- Delete captain from auth.users (cascade will delete profile)
        DELETE FROM auth.users WHERE id = team_record.captain_id;
        removed_users := removed_users + 1;
    END LOOP;

    RETURN json_build_object(
        'removedTeams', removed_teams,
        'removedUsers', removed_users,
        'removedRegistrations', removed_teams
    );
END;
$$;
