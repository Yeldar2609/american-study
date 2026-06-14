alter table public.schools
  add column natural_key text generated always as (
    lower(btrim(name))
    || E'\x1f'
    || lower(btrim(coalesce(state, '')))
    || E'\x1f'
    || lower(btrim(coalesce(city, '')))
  ) stored,
  add constraint schools_natural_key_unique unique (natural_key);
