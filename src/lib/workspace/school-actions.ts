"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuthenticatedUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const flagFormSchema = z.object({
  schoolId: z.uuid(),
  studentId: z.uuid(),
  value: z.enum(["true", "false"]).transform((value) => value === "true"),
})

const interestFormSchema = z.object({
  interest: z.enum(["exploring", "interested", "shortlisted", "not_interested"]),
  schoolId: z.uuid(),
  studentId: z.uuid(),
})

// Students (and admins) may toggle their own school picks; parents are read-only.
// The RPC enforces the paid-vs-recommended boundary in the database.
async function runPickMutation(
  locale: string,
  rpc: string,
  args: Record<string, unknown>,
): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  if (authenticated === null || authenticated.role === "parent") {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc(rpc, args)
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}

export async function setSchoolStarAction(locale: string, formData: FormData): Promise<void> {
  const parsed = flagFormSchema.safeParse({
    schoolId: formData.get("schoolId"),
    studentId: formData.get("studentId"),
    value: formData.get("value"),
  })
  if (!parsed.success) {
    return
  }
  await runPickMutation(locale, "set_school_star", {
    new_starred: parsed.data.value,
    target_school_id: parsed.data.schoolId,
    target_student_id: parsed.data.studentId,
  })
}

export async function setSchoolInterestAction(locale: string, formData: FormData): Promise<void> {
  const parsed = interestFormSchema.safeParse({
    interest: formData.get("interest"),
    schoolId: formData.get("schoolId"),
    studentId: formData.get("studentId"),
  })
  if (!parsed.success) {
    return
  }
  await runPickMutation(locale, "set_school_interest", {
    new_interest: parsed.data.interest,
    target_school_id: parsed.data.schoolId,
    target_student_id: parsed.data.studentId,
  })
}
