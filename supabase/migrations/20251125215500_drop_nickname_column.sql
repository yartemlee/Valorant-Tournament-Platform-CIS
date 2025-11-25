-- Drop the nickname column from profiles table as it is redundant with username
alter table public.profiles drop column nickname;
