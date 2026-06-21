"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuthenticatedUser, requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const uuid = z.uuid()

const practiceSchema = z.object({
  questionId: uuid,
  recordingLink: z.string().max(500),
  responseNotes: z.string().max(5000),
  selfRating: z.preprocess(
    (value) => (value === "" || value === undefined ? null : Number(value)),
    z.number().int().min(1).max(5).nullable(),
  ),
  status: z.enum(["todo", "practiced", "reviewed"]),
})

export async function studentSaveInterviewPracticeAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = practiceSchema.safeParse(Object.fromEntries(formData))
  if (authenticated === null || authenticated.role !== "student" || !parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("student_save_interview_practice", {
    new_recording_link: parsed.data.recordingLink,
    new_response_notes: parsed.data.responseNotes,
    new_self_rating: parsed.data.selfRating,
    new_status: parsed.data.status,
    target_question_id: parsed.data.questionId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}

export async function adminSetInterviewFeedbackAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  await requireRole(locale, "admin")
  const parsed = z
    .object({ feedback: z.string().max(5000), practiceId: uuid })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("admin_set_interview_feedback", {
    new_feedback: parsed.data.feedback,
    target_practice_id: parsed.data.practiceId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/admin`)
  }
}
