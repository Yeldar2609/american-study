import "server-only"

import type { createAdminClient } from "@/lib/supabase/admin"

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>

// Single source of truth for the parents_students relationship writes. The
// upsert's conflict target must stay (parent_user_id, student_id) so re-linking
// the same pair is idempotent rather than a duplicate-key error.
export function linkParentToStudent(admin: AdminClient, parentUserId: string, studentId: string) {
  return admin
    .from("parents_students")
    .upsert(
      { parent_user_id: parentUserId, student_id: studentId },
      { onConflict: "parent_user_id,student_id" },
    )
}

export function unlinkParentFromStudent(
  admin: AdminClient,
  parentUserId: string,
  studentId: string,
) {
  return admin
    .from("parents_students")
    .delete()
    .eq("parent_user_id", parentUserId)
    .eq("student_id", studentId)
}
