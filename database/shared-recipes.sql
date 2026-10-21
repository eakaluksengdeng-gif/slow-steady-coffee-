-- Separate, public, append-only cookbook. Private coffee_books stays private.
create table public.coffee_shared_recipes (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint shared_recipe_shape check (coalesce((
    jsonb_typeof(payload) = 'object'
    and jsonb_typeof(payload->'name') = 'string'
    and length(trim(payload->>'name')) between 1 and 200
    and jsonb_typeof(payload->'ingredients') = 'array'
    and jsonb_typeof(payload->'steps') = 'array'
    and octet_length(payload::text) <= 1000000
  ),false))
);
create index coffee_shared_recipes_feed on public.coffee_shared_recipes(created_at desc,id);
alter table public.coffee_shared_recipes enable row level security;
revoke all on public.coffee_shared_recipes from public, anon, authenticated;
grant select on public.coffee_shared_recipes to anon,authenticated;
grant insert(id,payload) on public.coffee_shared_recipes to anon,authenticated;
create policy shared_recipes_read on public.coffee_shared_recipes for select
to anon,authenticated using (true);
create policy shared_recipes_add on public.coffee_shared_recipes for insert
to anon,authenticated with check (true);
-- No update/delete grants or policies: published recipes remain intact.
