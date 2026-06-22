-- Admin-curated school collections: named lists (e.g. "Partner schools",
-- "Top STEM", "Faith-based") that an admin groups schools into. Admin-managed
-- via RLS (no RPCs needed — the admin UI reads/writes these tables directly,
-- like the school editor). An is_public flag is reserved for surfacing a
-- collection to students later; for now collections are an admin organizing tool.

create table public.school_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  description text,
  is_public boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.school_collections enable row level security;

create policy school_collections_admin_all on public.school_collections
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create table public.school_collection_members (
  collection_id uuid not null references public.school_collections(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, school_id)
);

alter table public.school_collection_members enable row level security;

create policy school_collection_members_admin_all on public.school_collection_members
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create index school_collection_members_school_idx
  on public.school_collection_members (school_id);
