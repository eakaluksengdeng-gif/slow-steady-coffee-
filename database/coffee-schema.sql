-- Run in the chosen Supabase project. RLS keeps each account's recipes private.
create table if not exists public.coffee_books (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null default 1 check(revision > 0),
  recipes jsonb not null default '[]'::jsonb check(jsonb_typeof(recipes) = 'array'),
  updated_at timestamptz not null default now()
);
alter table public.coffee_books enable row level security;
revoke all on public.coffee_books from anon;
grant select, insert, update on public.coffee_books to authenticated;
create policy coffee_books_read on public.coffee_books for select to authenticated
using ((select auth.uid()) = user_id);
create policy coffee_books_create on public.coffee_books for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy coffee_books_update on public.coffee_books for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Compare revisions to prevent a stale device overwriting changes from another.
create or replace function public.save_coffee_book(expected_revision integer, new_recipes jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare next_revision integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(new_recipes) <> 'array' or octet_length(new_recipes::text) > 12000000
    then raise exception 'Invalid recipe payload'; end if;
  if expected_revision = 0 then
    insert into public.coffee_books(user_id,recipes) values(auth.uid(),new_recipes)
    on conflict(user_id) do nothing returning revision into next_revision;
  else
    update public.coffee_books set recipes=new_recipes, revision=revision+1,updated_at=now()
    where user_id=auth.uid() and revision=expected_revision
    returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'COFFEE_CONFLICT' using errcode='40001'; end if;
  return next_revision;
end $$;
revoke all on function public.save_coffee_book(integer,jsonb) from public, anon;
grant execute on function public.save_coffee_book(integer,jsonb) to authenticated;
