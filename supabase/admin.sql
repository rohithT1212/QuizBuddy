-- Admin support. Run once in the Supabase SQL editor (after schema.sql and subscriptions.sql).

-- 1) Admin flag. Users cannot change it themselves: profiles has no update policy for clients.
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 2) Admins can manage modules and read/manage questions (including correct answers).
create policy "admin manages modules" on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin manages questions" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 3) Bulk add (or replace) a module's questions in one transaction.
-- p_rows: [{"prompt": "...", "option_a": "...", "option_b": "...", "option_c": "...",
--           "option_d": "...", "correct": "A"}, ...]
create or replace function public.admin_add_questions(
  p_module_id bigint,
  p_rows jsonb,
  p_replace boolean default false
) returns int
language plpgsql security definer set search_path = public as $$
declare
  v_start int;
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if not exists (select 1 from modules where id = p_module_id) then
    raise exception 'module not found';
  end if;

  if p_replace then
    delete from questions where module_id = p_module_id;
  end if;

  select coalesce(max(position) + 1, 0) into v_start from questions where module_id = p_module_id;

  insert into questions (module_id, prompt, option_a, option_b, option_c, option_d, correct_option, position)
  select p_module_id,
         r.value ->> 'prompt',
         r.value ->> 'option_a',
         r.value ->> 'option_b',
         r.value ->> 'option_c',
         r.value ->> 'option_d',
         upper(r.value ->> 'correct'),
         v_start + r.ord - 1
  from jsonb_array_elements(p_rows) with ordinality as r(value, ord);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.admin_add_questions(bigint, jsonb, boolean) from public, anon;
grant execute on function public.admin_add_questions(bigint, jsonb, boolean) to authenticated;

-- 4) Make yourself the first admin (replace the email, then run this line):
-- update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
