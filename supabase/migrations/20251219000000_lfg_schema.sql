-- LFG (Looking For Group) Schema
-- Функционал поиска тимейтов с синхронизацией desktop <-> web

-- -----------------------------------------------------------------------------
-- 1. ENUMS & TYPES
-- -----------------------------------------------------------------------------

-- Статусы лобби
CREATE TYPE public.lfg_lobby_status AS ENUM ('open', 'full', 'in_game', 'closed');

-- Режимы игры для LFG
CREATE TYPE public.lfg_game_mode AS ENUM ('competitive', 'unrated', 'spike_rush', 'deathmatch', 'swiftplay', 'custom');

-- Роли в LFG лобби
CREATE TYPE public.lfg_member_role AS ENUM ('owner', 'member');

-- Статусы запросов на вступление
CREATE TYPE public.lfg_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- -----------------------------------------------------------------------------
-- 2. DESKTOP SESSIONS (для синхронизации desktop <-> web)
-- -----------------------------------------------------------------------------

CREATE TABLE public.desktop_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,

  -- Статус подключения
  is_online BOOLEAN DEFAULT FALSE,
  valorant_running BOOLEAN DEFAULT FALSE,
  valorant_status TEXT CHECK (valorant_status IN ('not_running', 'in_menu', 'in_pregame', 'in_game', 'in_postgame')),

  -- Данные текущей party
  current_party_id TEXT,
  current_party_code TEXT,
  party_size INTEGER DEFAULT 0,

  -- PUUID игрока (для API вызовов)
  player_puuid TEXT,

  -- Timestamps
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_desktop_sessions_user ON public.desktop_sessions(user_id);
CREATE INDEX idx_desktop_sessions_online ON public.desktop_sessions(is_online) WHERE is_online = TRUE;

-- -----------------------------------------------------------------------------
-- 3. LFG LOBBIES (Активные лобби поиска игроков)
-- -----------------------------------------------------------------------------

CREATE TABLE public.lfg_lobbies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Настройки лобби
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  game_mode public.lfg_game_mode NOT NULL DEFAULT 'competitive',
  min_rank public.valorant_rank,
  max_rank public.valorant_rank,
  region public.valorant_region DEFAULT 'eu',

  -- Размер стека
  current_size INTEGER NOT NULL DEFAULT 1,
  max_size INTEGER NOT NULL DEFAULT 5 CHECK (max_size >= 2 AND max_size <= 5),

  -- Valorant party интеграция (от desktop app)
  party_id TEXT,
  party_code TEXT,

  -- Статус
  status public.lfg_lobby_status NOT NULL DEFAULT 'open',
  is_private BOOLEAN DEFAULT FALSE,
  voice_required BOOLEAN DEFAULT FALSE,
  discord_link TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 hours') NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX idx_lfg_lobbies_status ON public.lfg_lobbies(status) WHERE status = 'open';
CREATE INDEX idx_lfg_lobbies_game_mode ON public.lfg_lobbies(game_mode);
CREATE INDEX idx_lfg_lobbies_region ON public.lfg_lobbies(region);
CREATE INDEX idx_lfg_lobbies_expires ON public.lfg_lobbies(expires_at);
CREATE INDEX idx_lfg_lobbies_owner ON public.lfg_lobbies(owner_id);

-- -----------------------------------------------------------------------------
-- 4. LFG LOBBY MEMBERS (Участники лобби)
-- -----------------------------------------------------------------------------

CREATE TABLE public.lfg_lobby_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.lfg_lobbies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.lfg_member_role NOT NULL DEFAULT 'member',

  -- Статус присоединения к Valorant party
  party_joined BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(lobby_id, user_id)
);

CREATE INDEX idx_lfg_members_lobby ON public.lfg_lobby_members(lobby_id);
CREATE INDEX idx_lfg_members_user ON public.lfg_lobby_members(user_id);

-- Пользователь может быть только в одном LFG лобби одновременно
CREATE UNIQUE INDEX unique_user_lfg_membership ON public.lfg_lobby_members(user_id);

-- -----------------------------------------------------------------------------
-- 5. LFG LOBBY REQUESTS (Запросы на вступление для приватных лобби)
-- -----------------------------------------------------------------------------

CREATE TABLE public.lfg_lobby_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.lfg_lobbies(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT CHECK (char_length(message) <= 200),
  status public.lfg_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(lobby_id, requester_id)
);

CREATE INDEX idx_lfg_requests_lobby ON public.lfg_lobby_requests(lobby_id);
CREATE INDEX idx_lfg_requests_requester ON public.lfg_lobby_requests(requester_id);
CREATE INDEX idx_lfg_requests_status ON public.lfg_lobby_requests(status) WHERE status = 'pending';

-- -----------------------------------------------------------------------------
-- 6. LFG MESSAGES (Сообщения чата лобби)
-- -----------------------------------------------------------------------------

CREATE TABLE public.lfg_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lobby_id UUID NOT NULL REFERENCES public.lfg_lobbies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_lfg_messages_lobby ON public.lfg_messages(lobby_id);
CREATE INDEX idx_lfg_messages_created ON public.lfg_messages(lobby_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. PLAYER AVAILABILITY (Статус "Ищу группу")
-- -----------------------------------------------------------------------------

CREATE TABLE public.player_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  is_available BOOLEAN DEFAULT FALSE,
  available_until TIMESTAMPTZ,
  preferred_modes public.lfg_game_mode[] DEFAULT '{competitive}',
  note TEXT CHECK (char_length(note) <= 100),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_availability_available ON public.player_availability(is_available, available_until)
  WHERE is_available = TRUE;

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE public.desktop_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_lobby_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_lobby_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lfg_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_availability ENABLE ROW LEVEL SECURITY;

-- DESKTOP SESSIONS
CREATE POLICY "Users can view own desktop session"
  ON public.desktop_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own desktop session"
  ON public.desktop_sessions FOR ALL
  USING (user_id = auth.uid());

-- LFG LOBBIES
CREATE POLICY "Open lobbies viewable by everyone"
  ON public.lfg_lobbies FOR SELECT
  USING (status = 'open' OR owner_id = auth.uid());

CREATE POLICY "Users can create lobbies"
  ON public.lfg_lobbies FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their lobbies"
  ON public.lfg_lobbies FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their lobbies"
  ON public.lfg_lobbies FOR DELETE
  USING (auth.uid() = owner_id);

-- LFG LOBBY MEMBERS
CREATE POLICY "Members viewable by lobby participants and for open lobbies"
  ON public.lfg_lobby_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lfg_lobby_members m
      WHERE m.lobby_id = lfg_lobby_members.lobby_id AND m.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM public.lfg_lobbies l
      WHERE l.id = lfg_lobby_members.lobby_id AND l.status = 'open'
    )
  );

CREATE POLICY "Users can join lobbies via RPC"
  ON public.lfg_lobby_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave lobbies"
  ON public.lfg_lobby_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Owners can remove members"
  ON public.lfg_lobby_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lfg_lobbies l
      WHERE l.id = lfg_lobby_members.lobby_id AND l.owner_id = auth.uid()
    )
  );

-- LFG LOBBY REQUESTS
CREATE POLICY "Requesters see own requests"
  ON public.lfg_lobby_requests FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Lobby owners see requests to their lobby"
  ON public.lfg_lobby_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lfg_lobbies l
      WHERE l.id = lfg_lobby_requests.lobby_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create requests"
  ON public.lfg_lobby_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Owners can update request status"
  ON public.lfg_lobby_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lfg_lobbies l
      WHERE l.id = lfg_lobby_requests.lobby_id AND l.owner_id = auth.uid()
    )
  );

CREATE POLICY "Requesters can cancel own requests"
  ON public.lfg_lobby_requests FOR UPDATE
  USING (requester_id = auth.uid());

-- LFG MESSAGES
CREATE POLICY "Messages viewable by lobby members"
  ON public.lfg_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lfg_lobby_members m
      WHERE m.lobby_id = lfg_messages.lobby_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can send messages"
  ON public.lfg_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.lfg_lobby_members m
      WHERE m.lobby_id = lfg_messages.lobby_id AND m.user_id = auth.uid()
    )
  );

-- PLAYER AVAILABILITY
CREATE POLICY "Availability viewable by authenticated users"
  ON public.player_availability FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own availability"
  ON public.player_availability FOR ALL
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 9. TRIGGERS
-- -----------------------------------------------------------------------------

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_desktop_sessions_updated_at
  BEFORE UPDATE ON public.desktop_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lfg_lobbies_updated_at
  BEFORE UPDATE ON public.lfg_lobbies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lfg_requests_updated_at
  BEFORE UPDATE ON public.lfg_lobby_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_player_availability_updated_at
  BEFORE UPDATE ON public.player_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Автоматическое закрытие просроченных лобби
-- (Будет выполняться через cron job или edge function)
