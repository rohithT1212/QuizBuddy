-- QuizBuddy schema for Supabase (Postgres). Run in the Supabase SQL editor.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.modules (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  position int not null default 0
);

create table public.questions (
  id bigint generated always as identity primary key,
  module_id bigint not null references public.modules (id) on delete cascade,
  prompt text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('A', 'B', 'C', 'D')),
  position int not null default 0
);

create table public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id bigint not null references public.modules (id) on delete cascade,
  score int not null,
  total int not null,
  created_at timestamptz not null default now()
);

create table public.attempt_answers (
  attempt_id bigint not null references public.attempts (id) on delete cascade,
  question_id bigint not null references public.questions (id) on delete cascade,
  chosen_option char(1) not null check (chosen_option in ('A', 'B', 'C', 'D')),
  primary key (attempt_id, question_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

create policy "own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "modules readable by signed-in users" on public.modules
  for select to authenticated using (true);
create policy "own attempts" on public.attempts
  for select using (auth.uid() = user_id);
create policy "own attempt answers" on public.attempt_answers
  for select using (
    exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid())
  );
-- No policies on public.questions: clients cannot read it (so correct_option never leaks).

-- Client-facing view without the answer key (runs with the owner's rights).
create view public.questions_public as
  select id, module_id, prompt, option_a, option_b, option_c, option_d, position
  from public.questions;
revoke all on public.questions_public from anon;
grant select on public.questions_public to authenticated;

-- Create a profile row when a user signs up (name comes from signUp options.data.name).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Server-side scoring. p_answers example: {"12": "A", "13": "C"} (question id -> option).
create function public.submit_attempt(p_module_id bigint, p_answers jsonb)
returns table (attempt_id bigint, score int, total int)
language plpgsql security definer set search_path = public as $$
declare
  v_attempt bigint;
  v_score int;
  v_total int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select count(*) into v_total from questions where module_id = p_module_id;

  select count(*) into v_score
  from questions q
  where q.module_id = p_module_id
    and p_answers ->> q.id::text = q.correct_option;

  insert into attempts (user_id, module_id, score, total)
  values (auth.uid(), p_module_id, v_score, v_total)
  returning id into v_attempt;

  insert into attempt_answers (attempt_id, question_id, chosen_option)
  select v_attempt, q.id, upper(p_answers ->> q.id::text)
  from questions q
  where q.module_id = p_module_id
    and (p_answers ->> q.id::text) in ('A', 'B', 'C', 'D');

  return query select v_attempt, v_score, v_total;
end;
$$;

revoke all on function public.submit_attempt(bigint, jsonb) from public, anon;
grant execute on function public.submit_attempt(bigint, jsonb) to authenticated;
