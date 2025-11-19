-- ===================================
-- VALORANT TOURNAMENT PLATFORM - НОВАЯ СХЕМА БД
-- ===================================
-- Выполните этот SQL в SQL Editor вашего нового Supabase проекта

-- 1. Включить расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Создать ENUM типы
CREATE TYPE comfort_level AS ENUM ('not_played', 'learning', 'average', 'good', 'perfect');
CREATE TYPE valorant_role AS ENUM ('duelist', 'initiator', 'controller', 'sentinel');

-- 3. Создать таблицу profiles (связь с auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  country TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  
  -- Valorant данные
  riot_id TEXT,
  riot_tag TEXT,
  riot_linked BOOLEAN DEFAULT false,
  current_rank TEXT,
  peak_rank TEXT,
  
  -- Статистика
  token_balance INTEGER DEFAULT 0,
  medals_gold INTEGER DEFAULT 0,
  medals_silver INTEGER DEFAULT 0,
  medals_bronze INTEGER DEFAULT 0,
  
  -- Настройки профиля
  about_me TEXT,
  status TEXT,
  show_country BOOLEAN DEFAULT true,
  show_social_links BOOLEAN DEFAULT true,
  show_statistics BOOLEAN DEFAULT true,
  
  -- Социальные сети
  discord_username TEXT,
  twitch_username TEXT,
  twitter_username TEXT,
  youtube_username TEXT,
  tiktok_username TEXT,
  tracker_gg_username TEXT,
  
  -- Настройки уведомлений
  email_notifications BOOLEAN DEFAULT true,
  discord_notifications BOOLEAN DEFAULT false,
  newsletter_subscribed BOOLEAN DEFAULT false,
  
  -- Команда
  current_team_id UUID,
  
  -- Phantom data (для тестирования)
  is_phantom BOOLEAN DEFAULT false,
  phantom_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Создать таблицу player_roles
CREATE TABLE player_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role valorant_role NOT NULL,
  comfort_level comfort_level DEFAULT 'average',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 5. Создать таблицу player_agents
CREATE TABLE player_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  skill_level comfort_level DEFAULT 'average',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_name)
);

-- 6. Создать таблицу teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  is_recruiting BOOLEAN DEFAULT false,
  is_phantom BOOLEAN DEFAULT false,
  phantom_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name),
  UNIQUE(tag)
);

-- 7. Добавить FK для current_team_id
ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_current_team 
  FOREIGN KEY (current_team_id) 
  REFERENCES teams(id) 
  ON DELETE SET NULL;

-- 8. Создать таблицу team_members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_role TEXT DEFAULT 'member',
  is_phantom BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 9. Создать таблицу team_invites
CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, to_user_id, status)
);

-- 10. Создать таблицу team_applications
CREATE TABLE team_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, from_user_id, status)
);

-- 11. Создать таблицу tournaments
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  bracket_format TEXT NOT NULL,
  participant_limit INTEGER,
  prize TEXT,
  region TEXT,
  rules TEXT,
  date_start TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming',
  registration_open BOOLEAN DEFAULT true,
  bracket_generated BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Создать таблицу tournament_participants
CREATE TABLE tournament_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'registered',
  is_phantom BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, user_id)
);

-- 13. Создать таблицу tournament_matches
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  bracket_type TEXT NOT NULL,
  team1_id UUID REFERENCES profiles(id),
  team2_id UUID REFERENCES profiles(id),
  team1_score INTEGER,
  team2_score INTEGER,
  winner_id UUID REFERENCES profiles(id),
  loser_id UUID REFERENCES teams(id),
  best_of INTEGER,
  status TEXT DEFAULT 'pending',
  scheduled_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Создать таблицу tournament_medals
CREATE TABLE tournament_medals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_name TEXT NOT NULL,
  tournament_date DATE NOT NULL,
  placement INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Создать таблицу achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Создать таблицу user_achievements
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  tournament_name TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- 17. Создать таблицу tournament_notifications
CREATE TABLE tournament_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Создать таблицу tournament_results
CREATE TABLE tournament_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE UNIQUE,
  first_place_team_ids UUID[],
  second_place_team_ids UUID[],
  third_place_team_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================
-- TRIGGERS & FUNCTIONS
-- ===================================

-- Функция для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, email_notifications)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'full_name',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на создание пользователя
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для получения email по username (для логина)
CREATE OR REPLACE FUNCTION get_email_by_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT au.email INTO user_email
  FROM profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE p.username = username_input;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================
-- ROW LEVEL SECURITY (RLS)
-- ===================================

-- Включить RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_medals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies для profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies для player_roles
CREATE POLICY "Player roles are viewable by everyone" ON player_roles FOR SELECT USING (true);
CREATE POLICY "Users can manage own roles" ON player_roles FOR ALL USING (auth.uid() = user_id);

-- RLS Policies для player_agents
CREATE POLICY "Player agents are viewable by everyone" ON player_agents FOR SELECT USING (true);
CREATE POLICY "Users can manage own agents" ON player_agents FOR ALL USING (auth.uid() = user_id);

-- RLS Policies для teams
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Team owners can update" ON teams FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Team owners can delete" ON teams FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies для team_members
CREATE POLICY "Team members are viewable by everyone" ON team_members FOR SELECT USING (true);
CREATE POLICY "Team captains can manage members" ON team_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.owner_id = auth.uid()
  )
);

-- RLS Policies для team_invites
CREATE POLICY "Invites viewable by recipient and team captain" ON team_invites FOR SELECT USING (
  auth.uid() = to_user_id OR
  EXISTS (SELECT 1 FROM teams WHERE teams.id = team_invites.team_id AND teams.owner_id = auth.uid())
);
CREATE POLICY "Team captains can create invites" ON team_invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM teams WHERE teams.id = team_invites.team_id AND teams.owner_id = auth.uid())
);
CREATE POLICY "Recipients can update invites" ON team_invites FOR UPDATE USING (auth.uid() = to_user_id);

-- RLS Policies для team_applications
CREATE POLICY "Applications viewable by applicant and team captain" ON team_applications FOR SELECT USING (
  auth.uid() = from_user_id OR
  EXISTS (SELECT 1 FROM teams WHERE teams.id = team_applications.team_id AND teams.owner_id = auth.uid())
);
CREATE POLICY "Users can create applications" ON team_applications FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Captains can update applications" ON team_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM teams WHERE teams.id = team_applications.team_id AND teams.owner_id = auth.uid())
);

-- RLS Policies для tournaments
CREATE POLICY "Tournaments are viewable by everyone" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Users can create tournaments" ON tournaments FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Tournament owners can update" ON tournaments FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Tournament owners can delete" ON tournaments FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies для tournament_participants
CREATE POLICY "Participants are viewable by everyone" ON tournament_participants FOR SELECT USING (true);
CREATE POLICY "Users can register" ON tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON tournament_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies для tournament_matches
CREATE POLICY "Matches are viewable by everyone" ON tournament_matches FOR SELECT USING (true);
CREATE POLICY "Tournament owners can manage matches" ON tournament_matches FOR ALL USING (
  EXISTS (SELECT 1 FROM tournaments WHERE tournaments.id = tournament_matches.tournament_id AND tournaments.owner_id = auth.uid())
);

-- RLS Policies для остальных таблиц
CREATE POLICY "Medals viewable by everyone" ON tournament_medals FOR SELECT USING (true);
CREATE POLICY "Achievements viewable by everyone" ON achievements FOR SELECT USING (true);
CREATE POLICY "User achievements viewable by everyone" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "Notifications viewable by user" ON tournament_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Results viewable by everyone" ON tournament_results FOR SELECT USING (true);

-- ===================================
-- INDEXES для производительности
-- ===================================

CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_current_team ON profiles(current_team_id);
CREATE INDEX idx_player_roles_user ON player_roles(user_id);
CREATE INDEX idx_player_agents_user ON player_agents(user_id);
CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_invites_team ON team_invites(team_id);
CREATE INDEX idx_team_invites_user ON team_invites(to_user_id);
CREATE INDEX idx_team_applications_team ON team_applications(team_id);
CREATE INDEX idx_team_applications_user ON team_applications(from_user_id);
CREATE INDEX idx_tournaments_owner ON tournaments(owner_id);
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_medals_user ON tournament_medals(user_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- ===================================
-- ГОТОВО!
-- ===================================
-- После выполнения этого скрипта:
-- 1. Обновите переменные окружения в .env файле
-- 2. Перегенерируйте типы TypeScript командой: npx supabase gen types typescript

