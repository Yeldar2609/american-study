import { z } from "zod"

const uuid = z.uuid()
const taskStatus = z.enum(["not_started", "in_progress", "submitted", "needs_revision", "approved"])
const essayStatus = z.enum(["draft", "in_review", "needs_revision", "approved"])

const taskSchema = z.object({
  description: z.string().nullable(),
  drive_link: z.url().nullable(),
  due_date: z.string().nullable(),
  id: uuid,
  school_id: uuid.nullable(),
  section: z.string().min(1),
  status: taskStatus,
  title: z.string().min(1),
  video_youtube_id: z.string().nullable(),
})

const documentSchema = z.object({
  drive_link: z.url().nullable(),
  due_date: z.string().nullable(),
  id: uuid,
  notes: z.string().nullable(),
  required: z.boolean(),
  status: z.enum(["requested", "uploaded", "verified"]),
  title: z.string().min(1),
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

const essaySchema = z.object({
  admin_feedback: z.string().nullable(),
  drive_link: z.url().nullable(),
  id: uuid,
  school_id: uuid.nullable(),
  status: essayStatus,
  title: z.string().min(1),
  updated_at: z.string(),
})

const bookingSchema = z.object({
  calendar_link: z.url(),
  id: uuid,
  scheduled_at: z.string().nullable(),
  status: z.enum(["requested", "booked", "completed"]),
  type: z.enum([
    "school_list_review",
    "essay_review",
    "mock_interview",
    "final_application_check",
    "general_strategy",
  ]),
})

const videoSchema = z.object({
  id: uuid,
  section_key: z.string().min(1),
  title_en: z.string().min(1),
  title_ru: z.string().min(1),
  youtube_id: z.string().length(11),
})

const notificationSchema = z.object({
  body_en: z.string().min(1),
  body_ru: z.string().min(1),
  created_at: z.string(),
  id: uuid,
  link: z.string().nullable(),
  read: z.boolean(),
  title_en: z.string().min(1),
  title_ru: z.string().min(1),
  type: z.string().min(1),
})

export type ApplicationTask = Readonly<z.infer<typeof taskSchema>>
export type StudentDocument = Readonly<z.infer<typeof documentSchema>>
export type Essay = Readonly<z.infer<typeof essaySchema>>
export type Booking = Readonly<z.infer<typeof bookingSchema>>
export type ContentVideo = Readonly<z.infer<typeof videoSchema>>
export type Notification = Readonly<z.infer<typeof notificationSchema>>

export const parseTasks = (value: unknown): readonly ApplicationTask[] =>
  z.array(taskSchema).parse(value)

export const parseDocuments = (value: unknown): readonly StudentDocument[] =>
  z.array(documentSchema).parse(value)

export const parseEssays = (value: unknown): readonly Essay[] => z.array(essaySchema).parse(value)

export const parseBookings = (value: unknown): readonly Booking[] =>
  z.array(bookingSchema).parse(value)

export const parseVideos = (value: unknown): readonly ContentVideo[] =>
  z.array(videoSchema).parse(value)

export const parseNotifications = (value: unknown): readonly Notification[] =>
  z.array(notificationSchema).parse(value)
