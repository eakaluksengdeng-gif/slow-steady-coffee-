-- Explicit shop choice: anonymous visitors may delete shared recipes.
-- Private coffee_books and UPDATE permissions are unchanged.
grant delete on public.coffee_shared_recipes to anon, authenticated;
create policy shared_recipes_delete on public.coffee_shared_recipes
  for delete to anon, authenticated using (true);
