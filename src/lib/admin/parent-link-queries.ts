import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

export type ParentLinkRow = {
  readonly name: string
  readonly userId: string
  readonly username: string
}

export type StudentParentLinks =
  | {
      readonly kind: "ready"
      readonly available: readonly ParentLinkRow[]
      readonly linked: readonly ParentLinkRow[]
    }
  | { readonly kind: "configuration" }
  | { readonly kind: "error" }

type ParentUserRow = {
  readonly full_name: string | null
  readonly id: string
  readonly username: string | null
}

// Linked + still-available parent accounts for one student. Admin-only; rendered
// inside the admin People panel, so the service-role read is acceptable.
export async function getStudentParentLinks(studentId: string): Promise<StudentParentLinks> {
  const admin = createAdminClient()
  if (admin === null) {
    return { kind: "configuration" }
  }

  const [parentsResult, linksResult] = await Promise.all([
    admin.from("users").select("id, full_name, username").eq("role", "parent").order("username"),
    admin.from("parents_students").select("parent_user_id").eq("student_id", studentId),
  ])
  if (parentsResult.error !== null || linksResult.error !== null) {
    return { kind: "error" }
  }

  const parents = (parentsResult.data ?? []) as readonly ParentUserRow[]
  const linkRows = (linksResult.data ?? []) as ReadonlyArray<{ readonly parent_user_id: string }>
  const linkedIds = new Set(linkRows.map((row) => row.parent_user_id))

  const toRow = (parent: ParentUserRow): ParentLinkRow => ({
    name: parent.full_name ?? "",
    userId: parent.id,
    username: parent.username ?? "",
  })

  return {
    available: parents.filter((parent) => !linkedIds.has(parent.id)).map(toRow),
    kind: "ready",
    linked: parents.filter((parent) => linkedIds.has(parent.id)).map(toRow),
  }
}
