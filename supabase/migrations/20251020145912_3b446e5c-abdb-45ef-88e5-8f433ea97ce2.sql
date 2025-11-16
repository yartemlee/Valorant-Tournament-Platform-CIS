-- Добавляем уникальные индексы для предотвращения дублирования заявок и приглашений
-- Только одна активная заявка от пользователя в команду
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_application 
ON team_applications(team_id, from_user_id) 
WHERE status = 'pending';

-- Только одно активное приглашение пользователю от команды
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_invite 
ON team_invites(team_id, to_user_id) 
WHERE status = 'pending';

-- Функция для автоматической отмены других заявок/приглашений при вступлении в команду
CREATE OR REPLACE FUNCTION cancel_other_applications_and_invites()
RETURNS TRIGGER AS $$
BEGIN
  -- Отменяем все активные заявки этого пользователя
  UPDATE team_applications
  SET status = 'cancelled', updated_at = now()
  WHERE from_user_id = NEW.user_id
    AND status = 'pending'
    AND team_id != NEW.team_id;
  
  -- Отменяем все активные приглашения этого пользователя
  UPDATE team_invites
  SET status = 'cancelled', updated_at = now()
  WHERE to_user_id = NEW.user_id
    AND status = 'pending'
    AND team_id != NEW.team_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Триггер при добавлении в команду
DROP TRIGGER IF EXISTS cancel_applications_on_join ON team_members;
CREATE TRIGGER cancel_applications_on_join
  AFTER INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION cancel_other_applications_and_invites();