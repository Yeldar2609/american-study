"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuthenticatedUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const starFormSchema = z.object({
  schoolId: z.uuid(),
  starred: z.enum(["true", "false"]).transform((value) => value === "true"),
  studentId: z.uuid(),
})

export async function setSchoolStarAction(locale: string, formData: FormData): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  if (authenticated === null || authenticated.role === "parent") {
    return
  }

  const parsed = starFormSchema.safeParse({
    schoolId: formData.get("schoolId"),
    starred: formData.get("starred"),
    studentId: formData.get("studentId"),
  })
  if (!parsed.success) {
    return
  }

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  const { error } = await supabase.rpc("set_school_star", {
    new_starred: parsed.data.starred,
    target_school_id: parsed.data.schoolId,
    target_student_id: parsed.data.studentId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}
