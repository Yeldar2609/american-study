"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const optionalInteger = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.number().int().min(0).max(100).nullable(),
)
const optionalDate = z.preprocess((value) => (value === "" ? null : value), z.iso.date().nullable())
const schoolPickFormSchema = z.object({
  adminPick: z.boolean(),
  finalSeven: z.boolean(),
  matchOverride: optionalInteger,
  matchReason: z.string().max(3000),
  saoDeadline: optionalDate,
  schoolId: z.uuid(),
  status: z.enum(["researching", "applied", "submitted"]),
  studentId: z.uuid(),
})

export async function updateSchoolPickAction(locale: string, formData: FormData): Promise<void> {
  await requireRole(locale, "admin")
  const parsed = schoolPickFormSchema.safeParse({
    adminPick: formData.get("adminPick") === "on",
    finalSeven: formData.get("finalSeven") === "on",
    matchOverride: formData.get("matchOverride"),
    matchReason: formData.get("matchReason"),
    saoDeadline: formData.get("saoDeadline"),
    schoolId: formData.get("schoolId"),
    status: formData.get("status"),
    studentId: formData.get("studentId"),
  })
  if (!parsed.success) {
    return
  }

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  const value = parsed.data
  const { error } = await supabase.rpc("admin_update_school_pick", {
    new_admin_pick: value.adminPick,
    new_is_final_7: value.finalSeven,
    new_match_percent_override: value.matchOverride,
    new_match_reason: value.matchReason,
    new_sao_deadline: value.saoDeadline,
    new_status: value.status,
    target_school_id: value.schoolId,
    target_student_id: value.studentId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/admin`)
  }
}
