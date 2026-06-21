"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

const linkSchema = z.object({
  parentUserId: z.string().uuid(),
  studentId: z.string().uuid(),
})

export async function linkParentAction(locale: string, formData: FormData): Promise<void> {
  await requireRole(locale, "admin")
  const parsed = linkSchema.safeParse({
    parentUserId: formData.get("parentUserId"),
    studentId: formData.get("studentId"),
  })
  if (!parsed.success) {
    return
  }
  const admin = createAdminClient()
  if (admin === null) {
    return
  }
  await admin
    .from("parents_students")
    .upsert(
      { parent_user_id: parsed.data.parentUserId, student_id: parsed.data.studentId },
      { onConflict: "parent_user_id,student_id" },
    )
  revalidatePath(`/${locale}/app/admin`)
}

export async function unlinkParentAction(locale: string, formData: FormData): Promise<void> {
  await requireRole(locale, "admin")
  const parsed = linkSchema.safeParse({
    parentUserId: formData.get("parentUserId"),
    studentId: formData.get("studentId"),
  })
  if (!parsed.success) {
    return
  }
  const admin = createAdminClient()
  if (admin === null) {
    return
  }
  await admin
    .from("parents_students")
    .delete()
    .eq("parent_user_id", parsed.data.parentUserId)
    .eq("student_id", parsed.data.studentId)
  revalidatePath(`/${locale}/app/admin`)
}
