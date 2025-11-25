-- Create a function to get email by username
-- This is needed for the login flow where users can enter their username
create or replace function get_email_by_username(username_input text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found_email text;
begin
  select u.email into found_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.username = username_input;
  
  return found_email;
end;
$$;

grant execute on function get_email_by_username(text) to public;
