-- Function to automatically log team member changes
CREATE OR REPLACE FUNCTION public.log_team_member_activity()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  executor_id UUID;
BEGIN
  -- Get the executor ID (who performed the action)
  executor_id := auth.uid();

  -- Handle INSERT (Member Joined)
  IF (TG_OP = 'INSERT') THEN
    -- Get username
    SELECT username INTO user_name FROM public.profiles WHERE id = NEW.user_id;
    
    INSERT INTO public.team_activity_logs (team_id, type, description, data)
    VALUES (
      NEW.team_id,
      'member_joined',
      'Игрок ' || COALESCE(user_name, 'Unknown') || ' вступил в команду',
      jsonb_build_object('userId', NEW.user_id, 'username', user_name)
    );
    RETURN NEW;

  -- Handle DELETE (Member Left or Kicked)
  ELSIF (TG_OP = 'DELETE') THEN
    -- Get username
    SELECT username INTO user_name FROM public.profiles WHERE id = OLD.user_id;

    -- Determine if kicked or left
    IF executor_id = OLD.user_id THEN
      -- User left voluntarily
      INSERT INTO public.team_activity_logs (team_id, type, description, data)
      VALUES (
        OLD.team_id,
        'member_left',
        'Игрок ' || COALESCE(user_name, 'Unknown') || ' покинул команду',
        jsonb_build_object('userId', OLD.user_id, 'username', user_name)
      );
    ELSE
      -- User was kicked (or removed by admin/system)
      INSERT INTO public.team_activity_logs (team_id, type, description, data)
      VALUES (
        OLD.team_id,
        'member_kicked',
        'Игрок ' || COALESCE(user_name, 'Unknown') || ' был исключен из команды',
        jsonb_build_object('userId', OLD.user_id, 'username', user_name, 'kickedBy', executor_id)
      );
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_team_member_activity ON public.team_members;
CREATE TRIGGER on_team_member_activity
AFTER INSERT OR DELETE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.log_team_member_activity();
