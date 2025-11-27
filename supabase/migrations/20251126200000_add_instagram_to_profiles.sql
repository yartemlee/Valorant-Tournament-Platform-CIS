-- Add instagram_username column to profiles table
alter table public.profiles
add column instagram_username text;

-- Add comment
comment on column public.profiles.instagram_username is 'Instagram username of the user';
