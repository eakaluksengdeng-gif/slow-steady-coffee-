-- Public shop cookbook: visitors can overwrite payload, not identifiers/timestamps.
grant update (payload) on public.coffee_shared_recipes to anon, authenticated;
create policy shared_recipes_edit on public.coffee_shared_recipes
  for update to anon, authenticated using (true) with check (true);
