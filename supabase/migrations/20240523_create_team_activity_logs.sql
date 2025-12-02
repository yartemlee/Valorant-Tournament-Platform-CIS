-- Create team_activity_logs table
create table if not exists public.team_activity_logs (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade not null,
  type text not null,
  description text not null,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.team_activity_logs enable row level security;

-- Policies
create policy "Team members can view activity logs"
  on public.team_activity_logs for select
  using (
    auth.uid() in (
      select user_id from public.team_members
      where team_id = team_activity_logs.team_id
    )
  );

create policy "Team managers can insert activity logs"
  on public.team_activity_logs for insert
  with check (
    auth.uid() in (
      select user_id from public.team_members
      where team_id = team_activity_logs.team_id
      and role in ('captain', 'coach', 'owner')
    )
  );
