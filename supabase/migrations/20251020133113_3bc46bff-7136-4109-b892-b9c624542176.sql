-- Создаём security definer функцию для проверки прав капитана
CREATE OR REPLACE FUNCTION public.is_or_was_team_captain(
  team_id_input uuid,
  user_to_update uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Проверяем, является ли текущий пользователь капитаном/коучем команды
  SELECT EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.team_id = team_id_input
      AND tm.user_id = auth.uid()
      AND tm.team_role IN ('captain', 'coach')
  )
$$;

-- Удаляем старую политику
DROP POLICY IF EXISTS "Team captains can clear current_team_id" ON profiles;

-- Создаём новую политику с использованием security definer функции
CREATE POLICY "Team captains can clear current_team_id"
ON profiles
FOR UPDATE
USING (
  -- Разрешаем капитанам/коучам очищать current_team_id
  current_team_id IS NOT NULL 
  AND is_or_was_team_captain(current_team_id, id)
)
WITH CHECK (
  -- Разрешаем установить только NULL или обновлять собственный профиль
  current_team_id IS NULL OR auth.uid() = id
);