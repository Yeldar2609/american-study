import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { APPLICATION_STAGES, type ApplicationStage } from "@/lib/workspace/application-stage"

export type { ApplicationStage }

const boardRowSchema = z.object({
  admin_pick: z.boolean(),
  application_portal_url: z.string().nullable(),
  application_stage: z.enum(APPLICATION_STAGES),
  city: z.string().nullable(),
  is_final_7: z.boolean(),
  sao_deadline: z.string().nullable(),
  school_id: z.uuid(),
  school_name: z.string(),
  starred: z.boolean(),
  state: z.string().nullable(),
  student_shortlisted: z.boolean(),
})

export type ApplicationBoardItem = {
  readonly adminPick: boolean
  readonly city: string | null
  readonly finalSeven: boolean
  readonly portalUrl: string | null
  readonly saoDeadline: string | null
  readonly schoolId: string
  readonly schoolName: string
  readonly shortlisted: boolean
  readonly stage: ApplicationStage
  readonly starred: boolean
  readonly state: string | null
}

export async function getApplicationBoard(
  studentId: string,
): Promise<
  { kind: "ready"; items: readonly ApplicationBoardItem[] } | { kind: "configuration" | "error" }
> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }
  const { data, error } = await supabase.rpc("get_application_board", {
    target_student_id: studentId,
  })
  if (error !== null) {
    return { kind: "error" }
  }
  const parsed = z.array(boardRowSchema).safeParse(data)
  if (!parsed.success) {
    return { kind: "error" }
  }
  return {
    items: parsed.data.map((row) => ({
      adminPick: row.admin_pick,
      city: row.city,
      finalSeven: row.is_final_7,
      portalUrl: row.application_portal_url,
      saoDeadline: row.sao_deadline,
      schoolId: row.school_id,
      schoolName: row.school_name,
      shortlisted: row.student_shortlisted,
      stage: row.application_stage,
      starred: row.starred,
      state: row.state,
    })),
    kind: "ready",
  }
}
