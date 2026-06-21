"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuthenticatedUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import { APPLICATION_STAGES } from "@/lib/workspace/application-stage"

const stageSchema = z.object({
  portalUrl: z.string().max(500),
  schoolId: z.uuid(),
  stage: z.enum(APPLICATION_STAGES),
  studentId: z.uuid(),
})

export async function setApplicationStageAction(locale: string, formData: FormData): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  // Parents view the board read-only; students (own + paid) and admins edit.
  // The RPC enforces the precise ownership/paid rules.
  if (authenticated === null || authenticated.role === "parent") {
    return
  }
  const parsed = stageSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("set_application_stage", {
    new_portal_url: parsed.data.portalUrl,
    new_stage: parsed.data.stage,
    target_school_id: parsed.data.schoolId,
    target_student_id: parsed.data.studentId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}
