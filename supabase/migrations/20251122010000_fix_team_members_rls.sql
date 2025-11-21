
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Team managers can manage members" ON public.team_members;

-- Create improved policies
-- 1. Captains and Coaches can manage members of their own teams
CREATE POLICY "Team managers can manage members" ON public.team_members
FOR ALL USING (
  public.is_team_manager(team_id)
);

-- 2. Allow a user to join a team as CAPTAIN if the team has NO members yet (initial creation flow)
CREATE POLICY "Initial captain can join empty team" ON public.team_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND role = 'captain'
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = team_members.team_id
  )
);

