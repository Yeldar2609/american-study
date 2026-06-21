import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const interviewRowSchema = z.object({
  admin_feedback: z.string().nullable(),
  category: z.string(),
  practice_id: z.uuid().nullable(),
  question_en: z.string(),
  question_id: z.uuid(),
  question_ru: z.string(),
  recording_link: z.string().nullable(),
  response_notes: z.string().nullable(),
  sample_youtube_id: z.string().nullable(),
  self_rating: z.coerce.number().int().nullable(),
  sort_order: z.coerce.number().int(),
  status: z.enum(["todo", "practiced", "reviewed"]).nullable(),
  tip_en: z.string(),
  tip_ru: z.string(),
})

export type InterviewPrepItem = {
  readonly adminFeedback: string | null
  readonly category: string
  readonly practiceId: string | null
  readonly questionEn: string
  readonly questionId: string
  readonly questionRu: string
  readonly recordingLink: string | null
  readonly responseNotes: string | null
  readonly sampleYoutubeId: string | null
  readonly selfRating: number | null
  readonly status: "todo" | "practiced" | "reviewed"
  readonly tipEn: string
  readonly tipRu: string
}

export async function getInterviewPrep(
  studentId: string,
): Promise<
  { kind: "ready"; items: readonly InterviewPrepItem[] } | { kind: "configuration" | "error" }
> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }
  const { data, error } = await supabase.rpc("get_interview_prep", { target_student_id: studentId })
  if (error !== null) {
    return { kind: "error" }
  }
  const parsed = z.array(interviewRowSchema).safeParse(data)
  if (!parsed.success) {
    return { kind: "error" }
  }
  return {
    items: parsed.data.map((row) => ({
      adminFeedback: row.admin_feedback,
      category: row.category,
      practiceId: row.practice_id,
      questionEn: row.question_en,
      questionId: row.question_id,
      questionRu: row.question_ru,
      recordingLink: row.recording_link,
      responseNotes: row.response_notes,
      sampleYoutubeId: row.sample_youtube_id,
      selfRating: row.self_rating,
      status: row.status ?? "todo",
      tipEn: row.tip_en,
      tipRu: row.tip_ru,
    })),
    kind: "ready",
  }
}
