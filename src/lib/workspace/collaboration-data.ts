import { z } from "zod"

const messageSchema = z.object({
  attachment_link: z.url().nullable(),
  author_name: z.string().min(1),
  body: z.string().min(1),
  created_at: z.string(),
  id: z.uuid(),
})

const applicationRowSchema = z.object({
  sao_deadline: z.string().nullable(),
  school_name: z.string().min(1),
  status: z.enum(["researching", "applied", "submitted"]),
  student_name: z.string().min(1),
})

const faqSchema = z.object({
  answer_en: z.string().min(1),
  answer_ru: z.string().min(1),
  id: z.uuid(),
  order: z.coerce.number().int().nonnegative(),
  question_en: z.string().min(1),
  question_ru: z.string().min(1),
})

export type StudentMessage = Readonly<z.infer<typeof messageSchema>>
export type ApplicationRow = Readonly<z.infer<typeof applicationRowSchema>>
export type FaqItem = Readonly<z.infer<typeof faqSchema>>

export const parseMessages = (value: unknown): readonly StudentMessage[] =>
  z.array(messageSchema).parse(value)

export const parseApplicationRows = (value: unknown): readonly ApplicationRow[] =>
  z.array(applicationRowSchema).parse(value)

export const parseFaqItems = (value: unknown): readonly FaqItem[] => z.array(faqSchema).parse(value)

export function applicationRowsToCsv(rows: readonly ApplicationRow[]): string {
  const quoteCsv = (value: string | null) => `"${(value ?? "").replaceAll('"', '""')}"`
  return [
    ["Student", "School", "Status", "SAO deadline"].map(quoteCsv).join(","),
    ...rows.map((row) =>
      [row.student_name, row.school_name, row.status, row.sao_deadline].map(quoteCsv).join(","),
    ),
  ].join("\r\n")
}
