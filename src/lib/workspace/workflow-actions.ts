"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireAuthenticatedUser, requireRole } from "@/lib/auth/session"
import { resolveCalendarBookingLink } from "@/lib/settings/calendar-link"
import { createClient } from "@/lib/supabase/server"
import type { AssignTaskState } from "@/lib/workspace/assign-task-state"

type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createClient>>>

type ResolveStudentIdsResult =
  | { readonly kind: "ok"; readonly studentIds: string[] }
  | { readonly kind: "error"; readonly reason: "unexpected" | "none" }

// Shared between the bulk task-assigner and the broadcast sender: "all" expands
// to every student id, otherwise the comma-separated list is trimmed and kept to
// valid uuids. An empty result (no students, or none selected) is an error.
async function resolveTargetStudentIds(
  supabase: SupabaseServerClient,
  mode: "all" | "selected",
  rawStudentIds: string,
): Promise<ResolveStudentIdsResult> {
  let studentIds: string[]
  if (mode === "all") {
    const { data, error } = await supabase.from("students").select("id")
    const rows = z.array(z.object({ id: z.uuid() })).safeParse(data)
    if (error !== null || !rows.success) {
      return { kind: "error", reason: "unexpected" }
    }
    studentIds = rows.data.map((row) => row.id)
  } else {
    studentIds = rawStudentIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => uuid.safeParse(id).success)
  }

  if (studentIds.length === 0) {
    return { kind: "error", reason: "none" }
  }
  return { kind: "ok", studentIds }
}

const uuid = z.uuid()
const optionalUuid = z.preprocess((value) => (value === "" ? null : value), uuid.nullable())
const optionalDate = z.preprocess((value) => (value === "" ? null : value), z.iso.date().nullable())
const optionalUrl = z.preprocess(
  (value) => (value === "" ? "" : value),
  z.union([z.url(), z.literal("")]),
)

export async function updateTaskStatusAction(locale: string, formData: FormData): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = z
    .object({
      status: z.enum(["not_started", "in_progress", "submitted", "needs_revision", "approved"]),
      taskId: uuid,
    })
    .safeParse({ status: formData.get("status"), taskId: formData.get("taskId") })
  if (authenticated === null || authenticated.role === "parent" || !parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("update_task_status", {
    new_status: parsed.data.status,
    target_task_id: parsed.data.taskId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}

export async function studentSaveTaskAction(locale: string, formData: FormData): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = z
    .object({
      description: z.string().max(5000),
      dueDate: optionalDate,
      section: z.string().trim().max(120),
      taskId: optionalUuid,
      title: z.string().trim().min(1).max(300),
    })
    .safeParse(Object.fromEntries(formData))
  if (authenticated === null || authenticated.role !== "student" || !parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("student_save_task", {
    new_description: parsed.data.description,
    new_due_date: parsed.data.dueDate,
    new_section: parsed.data.section,
    new_title: parsed.data.title,
    target_task_id: parsed.data.taskId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}

export async function studentDeleteTaskAction(locale: string, formData: FormData): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = uuid.safeParse(formData.get("taskId"))
  if (authenticated === null || authenticated.role !== "student" || !parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("student_delete_task", { target_task_id: parsed.data })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}

export async function adminSaveTaskAction(locale: string, formData: FormData): Promise<void> {
  await requireRole(locale, "admin")
  const parsed = z
    .object({
      description: z.string().max(5000),
      driveLink: optionalUrl,
      dueDate: optionalDate,
      schoolId: optionalUuid,
      section: z.string().trim().min(1).max(120),
      studentId: uuid,
      taskId: optionalUuid,
      title: z.string().trim().min(1).max(300),
      videoId: z.union([z.literal(""), z.string().regex(/^[A-Za-z0-9_-]{11}$/)]),
    })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const value = parsed.data
  const { error } = await supabase.rpc("admin_save_task", {
    new_description: value.description,
    new_drive_link: value.driveLink,
    new_due_date: value.dueDate,
    new_section: value.section,
    new_title: value.title,
    new_video_youtube_id: value.videoId,
    target_school_id: value.schoolId,
    target_student_id: value.studentId,
    target_task_id: value.taskId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/admin`)
  }
}

const assignTaskSchema = z.object({
  description: z.string().max(5000),
  driveLink: optionalUrl,
  dueDate: optionalDate,
  mode: z.enum(["all", "selected"]),
  section: z.string().trim().min(1).max(120),
  studentIds: z.string().max(20000),
  title: z.string().trim().min(1).max(300),
  videoId: z.union([z.literal(""), z.string().regex(/^[A-Za-z0-9_-]{11}$/)]),
})

export async function adminAssignTaskAction(
  locale: string,
  _previous: AssignTaskState,
  formData: FormData,
): Promise<AssignTaskState> {
  await requireRole(locale, "admin")
  const parsed = assignTaskSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { reason: "validation", status: "error" }
  }
  const supabase = await createClient()
  if (supabase === null) {
    return { reason: "configuration", status: "error" }
  }
  const value = parsed.data

  const resolved = await resolveTargetStudentIds(supabase, value.mode, value.studentIds)
  if (resolved.kind === "error") {
    return { reason: resolved.reason, status: "error" }
  }
  const studentIds = resolved.studentIds

  const { data: createdCount, error } = await supabase.rpc("admin_bulk_create_task", {
    new_description: value.description,
    new_drive_link: value.driveLink,
    new_due_date: value.dueDate,
    new_section: value.section,
    new_title: value.title,
    new_video_youtube_id: value.videoId,
    target_student_ids: studentIds,
  })
  if (error !== null) {
    return { reason: "unexpected", status: "error" }
  }

  revalidatePath(`/${locale}/app/admin`)
  return {
    count: typeof createdCount === "number" ? createdCount : studentIds.length,
    status: "success",
  }
}

const broadcastSchema = z.object({
  body: z.string().trim().min(1).max(2000),
  link: z.string().max(500),
  mode: z.enum(["all", "selected"]),
  studentIds: z.string().max(20000),
  title: z.string().trim().min(1).max(200),
})

export async function adminBroadcastNotificationAction(
  locale: string,
  _previous: AssignTaskState,
  formData: FormData,
): Promise<AssignTaskState> {
  await requireRole(locale, "admin")
  const parsed = broadcastSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { reason: "validation", status: "error" }
  }
  const supabase = await createClient()
  if (supabase === null) {
    return { reason: "configuration", status: "error" }
  }
  const value = parsed.data

  const resolved = await resolveTargetStudentIds(supabase, value.mode, value.studentIds)
  if (resolved.kind === "error") {
    return { reason: resolved.reason, status: "error" }
  }
  const studentIds = resolved.studentIds

  const { data: sentCount, error } = await supabase.rpc("admin_broadcast_notification", {
    new_body: value.body,
    new_link: value.link,
    new_title: value.title,
    target_student_ids: studentIds,
  })
  if (error !== null) {
    return { reason: "unexpected", status: "error" }
  }

  revalidatePath(`/${locale}/app/admin`)
  return {
    count: typeof sentCount === "number" ? sentCount : studentIds.length,
    status: "success",
  }
}

export async function adminSaveDocumentAction(locale: string, formData: FormData): Promise<void> {
  await requireRole(locale, "admin")
  const parsed = z
    .object({
      documentId: optionalUuid,
      driveLink: optionalUrl,
      dueDate: optionalDate,
      notes: z.string().max(5000),
      required: z.boolean(),
      status: z.enum(["requested", "uploaded", "verified"]),
      studentId: uuid,
      title: z.string().trim().min(1).max(300),
      type: z.enum([
        "passport",
        "transcript",
        "recommendation",
        "financial",
        "test_score",
        "photo",
        "other",
      ]),
    })
    .safeParse({
      ...Object.fromEntries(formData),
      required: formData.get("required") === "on",
    })
  if (!parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const value = parsed.data
  const { error } = await supabase.rpc("admin_save_document", {
    new_drive_link: value.driveLink,
    new_due_date: value.dueDate,
    new_notes: value.notes,
    new_required: value.required,
    new_status: value.status,
    new_title: value.title,
    new_type: value.type,
    target_document_id: value.documentId,
    target_student_id: value.studentId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/admin`)
  }
}

export async function saveEssayAction(locale: string, formData: FormData): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = z
    .object({
      adminFeedback: z.string().max(5000),
      driveLink: optionalUrl,
      essayId: optionalUuid,
      schoolId: optionalUuid,
      status: z.enum(["draft", "in_review", "needs_revision", "approved"]),
      studentId: uuid,
      title: z.string().trim().min(1).max(300),
    })
    .safeParse(Object.fromEntries(formData))
  if (authenticated === null || authenticated.role === "parent" || !parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const value = parsed.data
  const { error } = await supabase.rpc("save_essay", {
    new_admin_feedback: value.adminFeedback || null,
    new_drive_link: value.driveLink,
    new_status: value.status,
    new_title: value.title,
    target_essay_id: value.essayId,
    target_school_id: value.schoolId,
    target_student_id: value.studentId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}

export async function requestBookingAction(locale: string, formData: FormData): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = z
    .object({
      studentId: uuid,
      type: z.enum([
        "school_list_review",
        "essay_review",
        "mock_interview",
        "final_application_check",
        "general_strategy",
      ]),
    })
    .safeParse(Object.fromEntries(formData))
  if (authenticated === null || authenticated.role === "parent" || !parsed.success) {
    return
  }
  const calendarLink = await resolveCalendarBookingLink()
  if (calendarLink === undefined) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("request_booking", {
    booking_calendar_link: calendarLink,
    requested_type: parsed.data.type,
    target_student_id: parsed.data.studentId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
    redirect(calendarLink)
  }
}

export async function markNotificationReadAction(
  locale: string,
  formData: FormData,
): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = uuid.safeParse(formData.get("notificationId"))
  if (authenticated === null || !parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("mark_notification_read", {
    target_notification_id: parsed.data,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}
