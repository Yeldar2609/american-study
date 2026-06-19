import { createClient } from "@/lib/supabase/server"
import {
  parseBookings,
  parseDocuments,
  parseEssays,
  parseNotifications,
  parseTasks,
  parseVideos,
} from "@/lib/workspace/workflow-data"

export type QueryResult<T> =
  | { readonly kind: "ready"; readonly value: T }
  | { readonly kind: "configuration" | "error" }

export async function getRoadmapData(studentId: string) {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" as const }
  }

  const [tasks, documents, videos] = await Promise.all([
    supabase
      .from("application_tasks")
      .select("id,school_id,section,title,description,video_youtube_id,status,due_date,drive_link")
      .eq("student_id", studentId)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("documents")
      .select("id,type,title,drive_link,status,required,due_date,notes")
      .eq("student_id", studentId)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("content_videos")
      .select("id,section_key,youtube_id,title_en,title_ru")
      .order("section_key"),
  ])
  if (tasks.error !== null || documents.error !== null || videos.error !== null) {
    return { kind: "error" as const }
  }

  try {
    return {
      kind: "ready" as const,
      value: {
        documents: parseDocuments(documents.data),
        tasks: parseTasks(tasks.data),
        videos: parseVideos(videos.data),
      },
    }
  } catch {
    return { kind: "error" as const }
  }
}

export async function getEssaysData(studentId: string) {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" as const }
  }
  const { data, error } = await supabase
    .from("essays")
    .select("id,school_id,title,drive_link,status,admin_feedback,updated_at")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
  if (error !== null) {
    return { kind: "error" as const }
  }
  try {
    return { kind: "ready" as const, value: parseEssays(data) }
  } catch {
    return { kind: "error" as const }
  }
}

export async function getBookingsData(studentId: string) {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" as const }
  }
  const { data, error } = await supabase
    .from("bookings")
    .select("id,type,calendar_link,scheduled_at,status")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
  if (error !== null) {
    return { kind: "error" as const }
  }
  try {
    return { kind: "ready" as const, value: parseBookings(data) }
  } catch {
    return { kind: "error" as const }
  }
}

export async function getNotificationsData() {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" as const }
  }
  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title_en,title_ru,body_en,body_ru,link,read,created_at")
    .order("created_at", { ascending: false })
    .limit(20)
  if (error !== null) {
    return { kind: "error" as const }
  }
  try {
    return { kind: "ready" as const, value: parseNotifications(data) }
  } catch {
    return { kind: "error" as const }
  }
}
