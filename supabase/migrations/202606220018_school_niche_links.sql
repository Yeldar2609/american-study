-- Link each school to its Niche K-12 profile. Niche 403s scrapers, so we can't
-- verify each URL, but Niche profile slugs are deterministic:
--   https://www.niche.com/k12/<name>-<city>-<state>/
-- lowercased, "&" -> "and", apostrophes/periods stripped, every other run of
-- non-alphanumerics collapsed to a single hyphen. Construct that for every
-- school that has a city + state and no profile URL yet. Only fills NULLs, so
-- any hand-curated URL is preserved. Schools missing a city are skipped (Niche
-- slugs require the city, so a city-less slug would 404) — they keep a null URL
-- and simply show no Niche link rather than a broken one.
-- The school card + detail render this as a clickable "Niche profile" link.

update public.schools
set niche_profile_url =
  'https://www.niche.com/k12/'
  || regexp_replace(
       regexp_replace(
         lower(
           translate(
             replace(
               name || ' ' || city || ' ' || state,
               '&',
               ' and '
             ),
             '''’.',
             ''
           )
         ),
         '[^a-z0-9]+',
         '-',
         'g'
       ),
       '(^-+|-+$)',
       '',
       'g'
     )
  || '/'
where niche_profile_url is null
  and coalesce(btrim(city), '') <> ''
  and coalesce(btrim(state), '') <> '';
