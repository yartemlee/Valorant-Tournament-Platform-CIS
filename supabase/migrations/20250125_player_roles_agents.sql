-- Create player_roles table
CREATE TABLE IF NOT EXISTS player_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('duelist', 'initiator', 'controller', 'sentinel')),
  comfort_level TEXT NOT NULL CHECK (comfort_level IN ('not_played', 'learning', 'average', 'good', 'perfect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create player_agents table
CREATE TABLE IF NOT EXISTS player_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('not_played', 'learning', 'average', 'good', 'perfect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, agent_name)
);

-- Enable Row Level Security
ALTER TABLE player_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_agents ENABLE ROW LEVEL SECURITY;

-- Create policies for player_roles
CREATE POLICY "Users can view all player roles"
  ON player_roles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own player roles"
  ON player_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player roles"
  ON player_roles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own player roles"
  ON player_roles FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for player_agents
CREATE POLICY "Users can view all player agents"
  ON player_agents FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own player agents"
  ON player_agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player agents"
  ON player_agents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own player agents"
  ON player_agents FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_player_roles_user_id ON player_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_agents_user_id ON player_agents(user_id);
