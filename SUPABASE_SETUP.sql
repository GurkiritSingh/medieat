-- ============================================================
-- MedMeal Planner — Supabase setup
-- Run this once in the Supabase SQL editor:
--   https://supabase.com/dashboard/project/qrswutkoygynhtzpxqfi/sql/new
--
-- Creates the `profiles` table that stores per-user app state,
-- and locks it down with Row Level Security so users can only
-- read/write their own row.
-- ============================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    conditions text[] default '{}',
    allergies text[] default '{}',
    custom_allergies text[] default '{}',
    favorite_foods text[] default '{}',
    macro_goals text[] default '{}',
    macro_targets jsonb default '{}'::jsonb,
    selected_cuisines text[] default '{}',
    calorie_target int default 2000,
    meal_count int default 4,
    diet_preference text default 'any',
    plan_duration int default 7,
    meal_alert_times jsonb default '{}'::jsonb,
    current_plan jsonb,
    updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Drop any existing policies before recreating (idempotent)
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;

-- A user can only see their own row
create policy "Users can view their own profile"
    on public.profiles for select
    using (auth.uid() = id);

-- A user can only insert their own row (id must match their auth uid)
create policy "Users can insert their own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- A user can only update their own row
create policy "Users can update their own profile"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- A user can delete their own row (e.g. account deletion)
create policy "Users can delete their own profile"
    on public.profiles for delete
    using (auth.uid() = id);

-- Optional: create the profile row automatically on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================================
-- ALSO: in the Supabase Dashboard:
--   1. Authentication > Providers > Email — turn ON
--   2. Authentication > Rate Limits — set sensible defaults
--      (e.g. 30 sign-ins/hour per IP, 10 sign-ups/hour per IP)
--   3. Authentication > Email Templates — customize if you like
-- ============================================================
