-- Удаляем существующий FK constraint для profiles
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Создаем функцию валидации
CREATE OR REPLACE FUNCTION validate_profile_user_id()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Если это НЕ фантомный пользователь, проверяем наличие в auth.users
  IF NEW.is_phantom = FALSE OR NEW.is_phantom IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
      RAISE EXCEPTION 'user_id must exist in auth.users for non-phantom profiles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер
DROP TRIGGER IF EXISTS validate_profile_user_trigger ON profiles;
CREATE TRIGGER validate_profile_user_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION validate_profile_user_id();