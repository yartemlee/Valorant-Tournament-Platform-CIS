-- LFG RPC Functions
-- Функции для управления лобби с атомарными операциями

-- -----------------------------------------------------------------------------
-- 1. JOIN LFG LOBBY
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.join_lfg_lobby(
  p_lobby_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lobby RECORD;
  v_member_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  -- Проверяем, не состоит ли уже в другом лобби
  IF EXISTS (SELECT 1 FROM lfg_lobby_members WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вы уже состоите в другом лобби');
  END IF;

  -- Блокируем лобби для обновления
  SELECT * INTO v_lobby FROM lfg_lobbies WHERE id = p_lobby_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби не найдено');
  END IF;

  IF v_lobby.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби закрыто');
  END IF;

  IF v_lobby.current_size >= v_lobby.max_size THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби заполнено');
  END IF;

  IF v_lobby.is_private THEN
    RETURN jsonb_build_object('success', false, 'error', 'Для приватного лобби нужно отправить запрос');
  END IF;

  -- Проверка ранга (если указаны ограничения)
  IF v_lobby.min_rank IS NOT NULL OR v_lobby.max_rank IS NOT NULL THEN
    DECLARE
      v_user_rank valorant_rank;
      v_rank_order INTEGER;
      v_min_order INTEGER;
      v_max_order INTEGER;
    BEGIN
      SELECT rank INTO v_user_rank FROM profiles WHERE id = v_user_id;

      IF v_user_rank IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Укажите ваш ранг в профиле');
      END IF;

      -- Получаем порядок рангов (enum ordinal position)
      SELECT enumsortorder INTO v_rank_order FROM pg_enum WHERE enumlabel = v_user_rank::text AND enumtypid = 'valorant_rank'::regtype;
      IF v_lobby.min_rank IS NOT NULL THEN
        SELECT enumsortorder INTO v_min_order FROM pg_enum WHERE enumlabel = v_lobby.min_rank::text AND enumtypid = 'valorant_rank'::regtype;
        IF v_rank_order < v_min_order THEN
          RETURN jsonb_build_object('success', false, 'error', 'Ваш ранг ниже минимального требования');
        END IF;
      END IF;
      IF v_lobby.max_rank IS NOT NULL THEN
        SELECT enumsortorder INTO v_max_order FROM pg_enum WHERE enumlabel = v_lobby.max_rank::text AND enumtypid = 'valorant_rank'::regtype;
        IF v_rank_order > v_max_order THEN
          RETURN jsonb_build_object('success', false, 'error', 'Ваш ранг выше максимального требования');
        END IF;
      END IF;
    END;
  END IF;

  -- Добавляем участника
  INSERT INTO lfg_lobby_members (lobby_id, user_id, role)
  VALUES (p_lobby_id, v_user_id, 'member')
  RETURNING id INTO v_member_id;

  -- Обновляем счётчик и статус
  UPDATE lfg_lobbies
  SET current_size = current_size + 1,
      status = CASE WHEN current_size + 1 >= max_size THEN 'full'::lfg_lobby_status ELSE status END
  WHERE id = p_lobby_id;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'party_code', v_lobby.party_code
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. LEAVE LFG LOBBY
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.leave_lfg_lobby(
  p_lobby_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  -- Находим участника
  SELECT * INTO v_member FROM lfg_lobby_members
  WHERE lobby_id = p_lobby_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вы не состоите в этом лобби');
  END IF;

  -- Если владелец покидает - закрываем лобби
  IF v_member.role = 'owner' THEN
    UPDATE lfg_lobbies SET status = 'closed' WHERE id = p_lobby_id;
    DELETE FROM lfg_lobby_members WHERE lobby_id = p_lobby_id;
    RETURN jsonb_build_object('success', true, 'lobby_closed', true);
  END IF;

  -- Удаляем участника
  DELETE FROM lfg_lobby_members WHERE id = v_member.id;

  -- Обновляем счётчик
  UPDATE lfg_lobbies
  SET current_size = GREATEST(current_size - 1, 1),
      status = 'open'::lfg_lobby_status
  WHERE id = p_lobby_id;

  RETURN jsonb_build_object('success', true, 'lobby_closed', false);
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. CREATE LFG LOBBY
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_lfg_lobby(
  p_title TEXT,
  p_game_mode lfg_game_mode DEFAULT 'competitive',
  p_max_size INTEGER DEFAULT 5,
  p_description TEXT DEFAULT NULL,
  p_min_rank valorant_rank DEFAULT NULL,
  p_max_rank valorant_rank DEFAULT NULL,
  p_region valorant_region DEFAULT 'eu',
  p_is_private BOOLEAN DEFAULT FALSE,
  p_voice_required BOOLEAN DEFAULT FALSE,
  p_discord_link TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lobby_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  -- Проверяем, не состоит ли уже в лобби
  IF EXISTS (SELECT 1 FROM lfg_lobby_members WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Вы уже состоите в лобби. Сначала покиньте текущее лобби.');
  END IF;

  -- Создаём лобби
  INSERT INTO lfg_lobbies (
    owner_id, title, description, game_mode,
    min_rank, max_rank, region, max_size,
    is_private, voice_required, discord_link,
    current_size, status
  )
  VALUES (
    v_user_id, p_title, p_description, p_game_mode,
    p_min_rank, p_max_rank, p_region, p_max_size,
    p_is_private, p_voice_required, p_discord_link,
    1, 'open'
  )
  RETURNING id INTO v_lobby_id;

  -- Добавляем создателя как owner
  INSERT INTO lfg_lobby_members (lobby_id, user_id, role)
  VALUES (v_lobby_id, v_user_id, 'owner');

  RETURN jsonb_build_object(
    'success', true,
    'lobby_id', v_lobby_id
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. UPDATE DESKTOP SESSION (Heartbeat)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_desktop_session(
  p_valorant_running BOOLEAN,
  p_valorant_status TEXT,
  p_party_id TEXT DEFAULT NULL,
  p_party_code TEXT DEFAULT NULL,
  p_party_size INTEGER DEFAULT 0,
  p_player_puuid TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  INSERT INTO desktop_sessions (
    user_id, is_online, valorant_running, valorant_status,
    current_party_id, current_party_code, party_size, player_puuid,
    last_heartbeat
  )
  VALUES (
    v_user_id, true, p_valorant_running, p_valorant_status,
    p_party_id, p_party_code, p_party_size, p_player_puuid,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_online = true,
    valorant_running = p_valorant_running,
    valorant_status = p_valorant_status,
    current_party_id = p_party_id,
    current_party_code = p_party_code,
    party_size = p_party_size,
    player_puuid = COALESCE(p_player_puuid, desktop_sessions.player_puuid),
    last_heartbeat = NOW();

  -- Обновляем party_code в лобби если пользователь owner
  IF p_party_code IS NOT NULL THEN
    UPDATE lfg_lobbies
    SET party_id = p_party_id, party_code = p_party_code
    WHERE owner_id = v_user_id AND status IN ('open', 'full');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. DESKTOP SESSION OFFLINE
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.desktop_session_offline()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  UPDATE desktop_sessions
  SET is_online = false,
      valorant_running = false,
      current_party_id = NULL,
      current_party_code = NULL,
      party_size = 0
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. SET PLAYER AVAILABILITY
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_player_availability(
  p_is_available BOOLEAN,
  p_duration_minutes INTEGER DEFAULT 30,
  p_preferred_modes lfg_game_mode[] DEFAULT '{competitive}',
  p_note TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_until TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  IF p_is_available THEN
    v_until := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  ELSE
    v_until := NULL;
  END IF;

  INSERT INTO player_availability (user_id, is_available, available_until, preferred_modes, note)
  VALUES (v_user_id, p_is_available, v_until, p_preferred_modes, p_note)
  ON CONFLICT (user_id) DO UPDATE SET
    is_available = p_is_available,
    available_until = v_until,
    preferred_modes = p_preferred_modes,
    note = p_note;

  RETURN jsonb_build_object('success', true, 'available_until', v_until);
END;
$$;

-- -----------------------------------------------------------------------------
-- 7. KICK LOBBY MEMBER (для owner)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kick_lfg_member(
  p_lobby_id UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  -- Проверяем что вызывающий - owner лобби
  SELECT owner_id INTO v_owner_id FROM lfg_lobbies WHERE id = p_lobby_id;

  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби не найдено');
  END IF;

  IF v_owner_id != v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Только владелец может исключать участников');
  END IF;

  IF p_user_id = v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Нельзя исключить себя');
  END IF;

  -- Удаляем участника
  DELETE FROM lfg_lobby_members
  WHERE lobby_id = p_lobby_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Участник не найден');
  END IF;

  -- Обновляем счётчик
  UPDATE lfg_lobbies
  SET current_size = GREATEST(current_size - 1, 1),
      status = 'open'::lfg_lobby_status
  WHERE id = p_lobby_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. HANDLE LFG REQUEST (для owner приватных лобби)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_lfg_request(
  p_request_id UUID,
  p_action TEXT -- 'accept' or 'reject'
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_lobby RECORD;
  v_caller_id UUID;
  v_member_id UUID;
BEGIN
  v_caller_id := auth.uid();

  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Необходимо авторизоваться');
  END IF;

  IF p_action NOT IN ('accept', 'reject') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Неверное действие');
  END IF;

  -- Получаем запрос
  SELECT * INTO v_request FROM lfg_lobby_requests WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Запрос не найден');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Запрос уже обработан');
  END IF;

  -- Проверяем владельца лобби
  SELECT * INTO v_lobby FROM lfg_lobbies WHERE id = v_request.lobby_id FOR UPDATE;

  IF v_lobby.owner_id != v_caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Только владелец может обрабатывать запросы');
  END IF;

  IF p_action = 'reject' THEN
    UPDATE lfg_lobby_requests SET status = 'rejected' WHERE id = p_request_id;
    RETURN jsonb_build_object('success', true, 'action', 'rejected');
  END IF;

  -- Accept
  IF v_lobby.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби закрыто');
  END IF;

  IF v_lobby.current_size >= v_lobby.max_size THEN
    RETURN jsonb_build_object('success', false, 'error', 'Лобби заполнено');
  END IF;

  -- Проверяем что игрок не в другом лобби
  IF EXISTS (SELECT 1 FROM lfg_lobby_members WHERE user_id = v_request.requester_id) THEN
    UPDATE lfg_lobby_requests SET status = 'cancelled' WHERE id = p_request_id;
    RETURN jsonb_build_object('success', false, 'error', 'Игрок уже в другом лобби');
  END IF;

  -- Добавляем участника
  INSERT INTO lfg_lobby_members (lobby_id, user_id, role)
  VALUES (v_request.lobby_id, v_request.requester_id, 'member')
  RETURNING id INTO v_member_id;

  -- Обновляем статус запроса
  UPDATE lfg_lobby_requests SET status = 'accepted' WHERE id = p_request_id;

  -- Обновляем лобби
  UPDATE lfg_lobbies
  SET current_size = current_size + 1,
      status = CASE WHEN current_size + 1 >= max_size THEN 'full'::lfg_lobby_status ELSE status END
  WHERE id = v_request.lobby_id;

  RETURN jsonb_build_object(
    'success', true,
    'action', 'accepted',
    'member_id', v_member_id,
    'party_code', v_lobby.party_code
  );
END;
$$;

-- -----------------------------------------------------------------------------
-- 9. CLEANUP EXPIRED LOBBIES (для cron job)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_expired_lfg_lobbies()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Закрываем просроченные лобби
  UPDATE lfg_lobbies
  SET status = 'closed'
  WHERE status IN ('open', 'full')
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Удаляем очень старые закрытые лобби (старше 24 часов)
  DELETE FROM lfg_lobbies
  WHERE status = 'closed'
    AND updated_at < NOW() - INTERVAL '24 hours';

  -- Сбрасываем просроченную доступность
  UPDATE player_availability
  SET is_available = false
  WHERE is_available = true
    AND available_until IS NOT NULL
    AND available_until < NOW();

  -- Помечаем неактивные desktop сессии как offline
  UPDATE desktop_sessions
  SET is_online = false
  WHERE is_online = true
    AND last_heartbeat < NOW() - INTERVAL '1 minute';

  RETURN v_count;
END;
$$;

-- -----------------------------------------------------------------------------
-- 10. GET AVAILABLE PLAYERS (для поиска доступных игроков)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_available_players(
  p_game_mode lfg_game_mode DEFAULT NULL,
  p_min_rank valorant_rank DEFAULT NULL,
  p_max_rank valorant_rank DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  rank valorant_rank,
  preferred_modes lfg_game_mode[],
  note TEXT,
  available_until TIMESTAMPTZ,
  is_desktop_online BOOLEAN,
  valorant_running BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.username,
    p.avatar_url,
    p.rank,
    pa.preferred_modes,
    pa.note,
    pa.available_until,
    COALESCE(ds.is_online, false) as is_desktop_online,
    COALESCE(ds.valorant_running, false) as valorant_running
  FROM player_availability pa
  JOIN profiles p ON p.id = pa.user_id
  LEFT JOIN desktop_sessions ds ON ds.user_id = pa.user_id
  WHERE pa.is_available = true
    AND (pa.available_until IS NULL OR pa.available_until > NOW())
    AND (p_game_mode IS NULL OR p_game_mode = ANY(pa.preferred_modes))
    AND pa.user_id != auth.uid()
  ORDER BY
    COALESCE(ds.is_online, false) DESC,
    COALESCE(ds.valorant_running, false) DESC,
    pa.updated_at DESC
  LIMIT p_limit;
END;
$$;
