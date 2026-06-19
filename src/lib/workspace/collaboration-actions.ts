"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuthenticatedUser, requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const uuid = z.uuid()
const optionalUuid = z.preprocess((value) => (value === "" ? null : value), uuid.nullable())
const optionalUrl = z.preprocess(
  (value) => (value === "" ? "" : value),
  z.union([z.url(), z.literal("")]),
)

export async function postStudentCommentAction(locale: string, formData: FormData): Promise<void> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = z
    .object({
      attachmentLink: optionalUrl,
      body: z.string().trim().min(1).max(5000),
      studentId: uuid,
    })
    .safeParse(Object.fromEntries(formData))
  if (authenticated === null || !parsed.success) {
    return
  }
  const supabase = await createClient()
  if (supabase === null) {
    return
  }
  const { error } = await supabase.rpc("post_student_comment", {
    comment_attachment_link: parsed.data.attachmentLink,
    comment_body: parsed.data.body,
    target_student_id: parsed.data.studentId,
  })
  if (error === null) {
    revalidatePath(`/${locale}/app/${authenticated.role}`)
  }
}

export async function adminSaveVideoAction(locale: string, formData: FormData): Promise<void> {
  await requireRole(locale, "admin")
  const parsed = z
    .object({
      id: optionalUuid,
      sectionKey: z.string().trim().min(1).max(120),
      titleEn: z.string().trim().min(1).max(300),
      titleRu: z.string().trim().min(1).max(300),
      youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
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
  const mutation =
    value.id === null
      ? supabase.from("content_videos").insert({
          section_key: value.sectionKey,
          title_en: value.titleEn,
          title_ru: value.titleRu,
          youtube_id: value.youtubeId,
        })
      : supabase
          .from("content_videos")
          .update({
            section_key: value.sectionKey,
            title_en: value.titleEn,
            title_ru: value.titleRu,
            youtube_id: value.youtubeId,
          })
          .eq("id", value.id)
  const { error } = await mutation
  if (error === null) {
    revalidatePath(`/${locale}/app/admin`)
  }
}

export async function adminSaveFaqAction(locale: string, formData: FormData): Promise<void> {
  await requireRole(locale, "admin")
  const parsed = z
    .object({
      answerEn: z.string().trim().min(1).max(5000),
      answerRu: z.string().trim().min(1).max(5000),
      id: optionalUuid,
      order: z.coerce.number().int().nonnegative(),
      questionEn: z.string().trim().min(1).max(500),
      questionRu: z.string().trim().min(1).max(500),
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
  const mutation =
    value.id === null
      ? supabase.from("faq").insert({
          answer_en: value.answerEn,
          answer_ru: value.answerRu,
          order: value.order,
          question_en: value.questionEn,
          question_ru: value.questionRu,
        })
      : supabase
          .from("faq")
          .update({
            answer_en: value.answerEn,
            answer_ru: value.answerRu,
            order: value.order,
            question_en: value.questionEn,
            question_ru: value.questionRu,
          })
          .eq("id", value.id)
  const { error } = await mutation
  if (error === null) {
    revalidatePath(`/${locale}/app/admin`)
  }
}
