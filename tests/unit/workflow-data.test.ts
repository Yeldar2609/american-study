import { describe, expect, it } from "vitest"
import {
  parseBookings,
  parseDocuments,
  parseEssays,
  parseNotifications,
  parseTasks,
  parseVideos,
} from "@/lib/workspace/workflow-data"

describe("workflow data parsers", () => {
  it("parses application tasks and documents", () => {
    expect(
      parseTasks([
        {
          description: "Complete the profile",
          drive_link: null,
          due_date: "2027-01-10",
          id: "11111111-1111-4111-8111-111111111111",
          school_id: null,
          section: "profile",
          status: "in_progress",
          title: "Student profile",
          video_youtube_id: null,
        },
      ]),
    ).toHaveLength(1)
    expect(
      parseDocuments([
        {
          drive_link: null,
          due_date: null,
          id: "22222222-2222-4222-8222-222222222222",
          notes: null,
          required: true,
          status: "requested",
          title: "Passport",
          type: "passport",
        },
      ]),
    ).toHaveLength(1)
  })

  it("parses essays, bookings, videos, and notifications", () => {
    expect(
      parseEssays([
        {
          admin_feedback: null,
          drive_link: "https://drive.google.com/example",
          id: "33333333-3333-4333-8333-333333333333",
          school_id: null,
          status: "draft",
          title: "Personal statement",
          updated_at: "2026-06-18T12:00:00Z",
        },
      ]),
    ).toHaveLength(1)
    expect(
      parseBookings([
        {
          calendar_link: "https://calendar.google.com/example",
          id: "44444444-4444-4444-8444-444444444444",
          scheduled_at: null,
          status: "requested",
          type: "essay_review",
        },
      ]),
    ).toHaveLength(1)
    expect(
      parseVideos([
        {
          id: "55555555-5555-4555-8555-555555555555",
          section_key: "essays",
          title_en: "Essay guide",
          title_ru: "Гид по эссе",
          youtube_id: "dQw4w9WgXcQ",
        },
      ]),
    ).toHaveLength(1)
    expect(
      parseNotifications([
        {
          body_en: "A task changed.",
          body_ru: "Задача обновлена.",
          created_at: "2026-06-18T12:00:00Z",
          id: "66666666-6666-4666-8666-666666666666",
          link: "/en/app/student?section=roadmap",
          read: false,
          title_en: "Task update",
          title_ru: "Обновление задачи",
          type: "task",
        },
      ]),
    ).toHaveLength(1)
  })

  it("rejects malformed workflow rows", () => {
    expect(() => parseTasks([{ id: "invalid" }])).toThrow()
    expect(() => parseEssays([{ id: "invalid" }])).toThrow()
  })
})
