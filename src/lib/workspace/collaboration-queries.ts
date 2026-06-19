import { createClient } from "@/lib/supabase/server"
import {
  parseApplicationRows,
  parseFaqItems,
  parseMessages,
} from "@/lib/workspace/collaboration-data"
import { parseVideos } from "@/lib/workspace/workflow-data"

export async function getStudentComments(studentId: string) {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" as const }
  }
  const { data, error } = await supabase.rpc("get_student_comments", {
    target_student_id: studentId,
  })
  if (error !== null) {
    return { kind: "error" as const }
  }
  try {
    return { kind: "ready" as const, value: parseMessages(data) }
  } catch {
    return { kind: "error" as const }
  }
}

export async function getAdminApplications() {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" as const }
  }
  const { data, error } = await supabase.rpc("get_admin_applications")
  if (error !== null) {
    return { kind: "error" as const }
  }
  try {
    return { kind: "ready" as const, value: parseApplicationRows(data) }
  } catch {
    return { kind: "error" as const }
  }
}

export async function getResourcesData() {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" as const }
  }
  const [faq, videos] = await Promise.all([
    supabase
      .from("faq")
      .select("id,question_en,question_ru,answer_en,answer_ru,order")
      .order("order"),
    supabase
      .from("content_videos")
      .select("id,section_key,youtube_id,title_en,title_ru")
      .order("section_key"),
  ])
  if (faq.error !== null || videos.error !== null) {
    return { kind: "error" as const }
  }
  try {
    return {
      kind: "ready" as const,
      value: { faq: parseFaqItems(faq.data), videos: parseVideos(videos.data) },
    }
  } catch {
    return { kind: "error" as const }
  }
}
