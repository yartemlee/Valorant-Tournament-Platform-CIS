-- Исправляем search_path для всех функций с SECURITY DEFINER
-- Это предотвращает потенциальные атаки через изменение search_path

-- Функция принятия приглашения
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'accept_team_invitation') THEN
    ALTER FUNCTION public.accept_team_invitation(UUID) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Функция отклонения приглашения
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decline_team_invitation') THEN
    ALTER FUNCTION public.decline_team_invitation(UUID) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Функция принятия заявки
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'accept_team_application') THEN
    ALTER FUNCTION public.accept_team_application(UUID) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Функция отклонения заявки
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'decline_team_application') THEN
    ALTER FUNCTION public.decline_team_application(UUID) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Функция создания команды с капитаном
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_team_with_captain') THEN
    ALTER FUNCTION public.create_team_with_captain(TEXT, TEXT, TEXT, TEXT, BOOLEAN) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Функция исключения участника
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'kick_member') THEN
    ALTER FUNCTION public.kick_member(UUID, UUID) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Функция изменения роли участника
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_member_role') THEN
    ALTER FUNCTION public.set_member_role(UUID, UUID, TEXT) SET search_path = public, pg_temp;
  END IF;
END $$;

-- Функция передачи капитанства
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'transfer_captain') THEN
    ALTER FUNCTION public.transfer_captain(UUID, UUID) SET search_path = public, pg_temp;
  END IF;
END $$;

