-- Добавляем RLS политику для капитанов команды, чтобы они могли очищать current_team_id при удалении игрока
CREATE POLICY "Team captains can clear current_team_id"
ON profiles
FOR UPDATE
USING (
  -- Разрешаем капитанам/коучам очищать current_team_id
  current_team_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = profiles.current_team_id
      AND tm.user_id = auth.uid()
      AND tm.team_role IN ('captain', 'coach')
  )
)
WITH CHECK (
  -- Разрешаем установить только NULL или собственный профиль
  current_team_id IS NULL OR auth.uid() = id
);