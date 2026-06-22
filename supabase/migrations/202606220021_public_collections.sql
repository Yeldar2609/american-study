-- Make collections flagged is_public readable by students/parents so they can
-- browse schools by curated list. Admins keep full control via the existing
-- school_collections_admin_all policy; these add read-only access to PUBLIC
-- collections (and their members) for any authenticated user. RLS policies are
-- permissive (OR'd), so admins still see everything and students see only public.

create policy school_collections_public_select on public.school_collections
  for select
  to authenticated
  using (is_public);

create policy school_collection_members_public_select on public.school_collection_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.school_collections as c
      where c.id = collection_id
        and c.is_public
    )
  );
