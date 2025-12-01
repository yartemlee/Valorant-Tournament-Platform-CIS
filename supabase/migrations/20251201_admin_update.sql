-- 1. Assign 'admin' role to 'yartemlee'
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by username (from profiles)
  SELECT id INTO target_user_id FROM public.profiles WHERE username = 'yartemlee';

  -- If user exists, insert admin role
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

-- 2. Update RLS Policies to allow Admin override

-- PROFILES
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" ON public.profiles FOR DELETE USING (public.is_admin());

-- TEAMS
DROP POLICY IF EXISTS "Admins can update any team" ON public.teams;
CREATE POLICY "Admins can update any team" ON public.teams FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any team" ON public.teams;
CREATE POLICY "Admins can delete any team" ON public.teams FOR DELETE USING (public.is_admin());

-- TEAM MEMBERS
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL USING (public.is_admin());

-- TEAM INVITATIONS
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.team_invitations;
CREATE POLICY "Admins can manage invitations" ON public.team_invitations FOR ALL USING (public.is_admin());

-- TEAM APPLICATIONS
DROP POLICY IF EXISTS "Admins can manage applications" ON public.team_applications;
CREATE POLICY "Admins can manage applications" ON public.team_applications FOR ALL USING (public.is_admin());

-- TOURNAMENTS
-- (Already had some admin policies, ensuring coverage)
DROP POLICY IF EXISTS "Admins can update any tournament" ON public.tournaments;
CREATE POLICY "Admins can update any tournament" ON public.tournaments FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any tournament" ON public.tournaments;
CREATE POLICY "Admins can delete any tournament" ON public.tournaments FOR DELETE USING (public.is_admin());

-- TOURNAMENT REGISTRATIONS
DROP POLICY IF EXISTS "Admins can manage registrations" ON public.tournament_registrations;
CREATE POLICY "Admins can manage registrations" ON public.tournament_registrations FOR ALL USING (public.is_admin());

-- MATCHES
-- (Already had some admin policies, ensuring coverage)
DROP POLICY IF EXISTS "Admins can manage matches" ON public.matches;
CREATE POLICY "Admins can manage matches" ON public.matches FOR ALL USING (public.is_admin());

-- SCRIMS
DROP POLICY IF EXISTS "Admins can manage scrims" ON public.scrims;
CREATE POLICY "Admins can manage scrims" ON public.scrims FOR ALL USING (public.is_admin());

-- SCRIM APPLICATIONS
DROP POLICY IF EXISTS "Admins can manage scrim applications" ON public.scrim_applications;
CREATE POLICY "Admins can manage scrim applications" ON public.scrim_applications FOR ALL USING (public.is_admin());

-- POSTS
-- (Already had some admin policies, ensuring coverage)
DROP POLICY IF EXISTS "Admins can manage posts" ON public.posts;
CREATE POLICY "Admins can manage posts" ON public.posts FOR ALL USING (public.is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (public.is_admin());

-- USER ROLES
-- (Already had "Only admins can manage roles", ensuring it covers everything)
-- The existing policy "Only admins can manage roles" uses (public.is_admin()) for ALL, which is correct.
