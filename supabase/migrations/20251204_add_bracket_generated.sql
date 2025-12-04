ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS bracket_generated boolean DEFAULT false;
