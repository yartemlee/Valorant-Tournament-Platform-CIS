-- Удаляем дубликаты заявок, оставляя только самые новые
WITH duplicates AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY team_id, from_user_id 
    ORDER BY created_at DESC
  ) as rn
  FROM team_applications
  WHERE status = 'pending'
)
UPDATE team_applications
SET status = 'cancelled'
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Удаляем дубликаты приглашений, оставляя только самые новые
WITH duplicate_invites AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY team_id, to_user_id 
    ORDER BY created_at DESC
  ) as rn
  FROM team_invites
  WHERE status = 'pending'
)
UPDATE team_invites
SET status = 'cancelled'
WHERE id IN (SELECT id FROM duplicate_invites WHERE rn > 1);

-- Добавляем уникальные ограничения для предотвращения дублей заявок и приглашений
CREATE UNIQUE INDEX unique_pending_application 
ON team_applications(team_id, from_user_id) 
WHERE status = 'pending';

CREATE UNIQUE INDEX unique_pending_invite 
ON team_invites(team_id, to_user_id) 
WHERE status = 'pending';