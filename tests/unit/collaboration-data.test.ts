import { describe, expect, it } from "vitest"
import {
  parseApplicationRows,
  parseFaqItems,
  parseMessages,
} from "@/lib/workspace/collaboration-data"

describe("collaboration data parsers", () => {
  it("parses student comments and FAQ content", () => {
    expect(
      parseMessages([
        {
          attachment_link: null,
          author_name: "Parent",
          body: "Please check the deadline.",
          created_at: "2026-06-18T12:00:00Z",
          id: "11111111-1111-4111-8111-111111111111",
        },
      ]),
    ).toHaveLength(1)
    expect(
      parseFaqItems([
        {
          answer_en: "Use the portal.",
          answer_ru: "Используйте портал.",
          id: "22222222-2222-4222-8222-222222222222",
          order: 1,
          question_en: "Where?",
          question_ru: "Где?",
        },
      ]),
    ).toHaveLength(1)
  })

  it("parses admin application outreach rows", () => {
    expect(
      parseApplicationRows([
        {
          sao_deadline: "2027-01-15",
          school_name: "Example School",
          status: "applied",
          student_name: "Student",
        },
      ]),
    ).toHaveLength(1)
  })

  it("rejects malformed collaboration data", () => {
    expect(() => parseMessages([{ id: "bad" }])).toThrow()
    expect(() => parseApplicationRows([{ status: "unknown" }])).toThrow()
  })
})
