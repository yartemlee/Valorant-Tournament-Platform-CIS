-- Add new columns for split Riot ID and tracker visibility
alter table public.profiles
add column riot_id_name text,
add column riot_id_tag text,
add column show_tracker boolean default false;

-- Add comments
comment on column public.profiles.riot_id_name is 'Riot ID name part';
comment on column public.profiles.riot_id_tag is 'Riot ID tag part';
comment on column public.profiles.show_tracker is 'Whether to show Tracker.gg link on profile';

-- Optional: Backfill existing data (best effort)
-- This assumes riot_id is in format "Name#Tag"
update public.profiles
set 
  riot_id_name = split_part(riot_id, '#', 1),
  riot_id_tag = split_part(riot_id, '#', 2)
where riot_id is not null and riot_id like '%#%';
