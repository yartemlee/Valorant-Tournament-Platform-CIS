-- Function to sync team_members changes to profiles.current_team_id
CREATE OR REPLACE FUNCTION public.sync_team_members_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting, update profiles.current_team_id
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles
    SET current_team_id = NEW.team_id
    WHERE id = NEW.user_id;
    RETURN NEW;
  -- If deleting, set profiles.current_team_id to NULL
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles
    SET current_team_id = NULL
    WHERE id = OLD.user_id AND current_team_id = OLD.team_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_team_member_change ON public.team_members;
CREATE TRIGGER on_team_member_change
AFTER INSERT OR DELETE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.sync_team_members_to_profiles();

-- One-time cleanup for existing inconsistencies
UPDATE public.profiles
SET current_team_id = NULL
WHERE current_team_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.team_members
  WHERE team_members.user_id = profiles.id
  AND team_members.team_id = profiles.current_team_id
);
