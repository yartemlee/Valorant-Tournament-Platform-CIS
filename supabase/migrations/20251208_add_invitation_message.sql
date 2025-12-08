-- Миграция: добавление поля message в team_invitations
-- Позволяет капитанам/тренерам отправлять сопроводительное письмо при приглашении игрока

ALTER TABLE public.team_invitations 
ADD COLUMN IF NOT EXISTS message TEXT;

COMMENT ON COLUMN public.team_invitations.message IS 'Сопроводительное письмо от капитана/тренера (макс 500 символов)';
