-- Enable Realtime for lfg_lobbies table
-- This allows clients to subscribe to changes on this table

-- Set REPLICA IDENTITY to FULL so that the old and new values are sent in the payload
ALTER TABLE public.lfg_lobbies REPLICA IDENTITY FULL;

-- Add lfg_lobbies to the supabase_realtime publication
-- This enables real-time subscriptions for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.lfg_lobbies;
