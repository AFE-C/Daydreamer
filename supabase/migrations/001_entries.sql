create extension if not exists pgcrypto;

create table if not exists public.entries (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  content_text text not null default '',
  tags text[] not null default '{}',
  mood text,
  color text not null default 'blue' check (color in ('blue', 'lavender', 'mint', 'pink')),
  is_favorite boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index if not exists entries_user_updated_idx on public.entries (user_id, updated_at desc);
create index if not exists entries_user_deleted_idx on public.entries (user_id, deleted_at);

alter table public.entries enable row level security;

drop policy if exists "Users can read their own entries" on public.entries;
create policy "Users can read their own entries"
  on public.entries for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own entries" on public.entries;
create policy "Users can insert their own entries"
  on public.entries for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own entries" on public.entries;
create policy "Users can update their own entries"
  on public.entries for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own entries" on public.entries;
create policy "Users can delete their own entries"
  on public.entries for delete
  using ((select auth.uid()) = user_id);
