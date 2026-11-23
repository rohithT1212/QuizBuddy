-- Module subscriptions. Run once in the Supabase SQL editor (after schema.sql).
-- A user sees only the modules they subscribed to in the side panel.

create table public.subscriptions (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  module_id bigint not null references public.modules (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table public.subscriptions enable row level security;

create policy "read own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);
create policy "subscribe as self" on public.subscriptions
  for insert with check (auth.uid() = user_id);
create policy "unsubscribe own" on public.subscriptions
  for delete using (auth.uid() = user_id);
