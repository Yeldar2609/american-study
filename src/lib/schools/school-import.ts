import { createHash } from "node:crypto"
import { parse } from "csv-parse/sync"
import { z } from "zod"
import { STATE_CODES } from "./state-codes.ts"

export const SCHOOL_CSV_HEADER = [
  "name",
  "state",
  "city",
  "setting",
  "student_body",
  "affiliation",
  "grades",
  "enrollment",
  "pct_boarding",
  "pct_international",
  "boarding_tuition_usd",
  "acceptance_rate_pct",
  "avg_ssat_pctile",
  "offers_financial_aid",
  "niche_grade",
  "strengths",
  "website_url",
  "niche_profile_url",
  "notes",
] as const

const requiredText = z.string().trim().min(1)
const nullableText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
const nullableUrl = nullableText.pipe(
  z.string().url().startsWith("https://", "must use HTTPS").nullable(),
)
const stateCodeByName = new Map<string, string>(Object.entries(STATE_CODES))
const officialStateCodes = new Set<string>(Object.values(STATE_CODES))
const nullableNumber = (minimum: number, maximum?: number, integer = false) => {
  let schema = z.number().finite().min(minimum)
  if (maximum !== undefined) {
    schema = schema.max(maximum)
  }
  if (integer) {
    schema = schema.int()
  }
  return z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .pipe(schema.nullable())
}

const stateCode = requiredText.transform((value, context) => {
  const normalized = value.toLocaleLowerCase("en-US")
  const officialCode = stateCodeByName.get(normalized)
  const code = officialCode ?? value.toUpperCase()
  if (!officialStateCodes.has(code)) {
    context.addIssue({ code: "custom", message: "must be an official US state name or code" })
    return z.NEVER
  }
  return code
})

const schoolCsvRowSchema = z
  .object({
    name: requiredText,
    state: stateCode,
    city: requiredText,
    setting: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.enum(["urban", "suburban", "rural"])),
    student_body: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.enum(["coed", "boys", "girls"])),
    affiliation: nullableText,
    grades: z
      .string()
      .trim()
      .transform((value) =>
        value === ""
          ? null
          : value
              .replaceAll("â€“", "-")
              .replaceAll("â€”", "-")
              .replaceAll("–", "-")
              .replaceAll("—", "-"),
      ),
    enrollment: nullableNumber(1, undefined, true),
    pct_boarding: nullableNumber(0, 100),
    pct_international: nullableNumber(0, 100),
    boarding_tuition_usd: nullableNumber(0, undefined, true),
    acceptance_rate_pct: nullableNumber(0, 100),
    avg_ssat_pctile: nullableNumber(0, 100),
    offers_financial_aid: z
      .string()
      .trim()
      .toLowerCase()
      .transform((value) => (value === "" ? null : value))
      .pipe(z.enum(["true", "false"]).nullable())
      .transform((value) => (value === null ? null : value === "true")),
    niche_grade: z
      .string()
      .trim()
      .toUpperCase()
      .transform((value) => (value === "" ? null : value))
      .pipe(
        z
          .enum(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"])
          .nullable(),
      ),
    strengths: z.string().transform((value) =>
      value
        .split(/[;,]/)
        .map((strength) => strength.trim())
        .filter((strength) => strength !== ""),
    ),
    website_url: nullableUrl,
    niche_profile_url: nullableUrl,
    notes: nullableText,
  })
  .strict()

export type SchoolImportRow = Readonly<z.infer<typeof schoolCsvRowSchema>>

export type SchoolImportRejection = {
  readonly line: number
  readonly reason: string
}

export type SchoolImportReport = {
  readonly accepted: readonly SchoolImportRow[]
  readonly rejected: readonly SchoolImportRejection[]
  readonly acceptedCount: number
  readonly rejectedCount: number
  readonly inputSha256: string
}

function normalizeHeader(header: readonly string[]): readonly string[] {
  return header.map((column) => {
    const trimmed = column.trim()
    if (trimmed === "website") {
      return "website_url"
    }
    if (trimmed === "niche_profile") {
      return "niche_profile_url"
    }
    return trimmed
  })
}

export function parseSchoolCsv(csv: string): SchoolImportReport {
  const inputSha256 = createHash("sha256").update(csv, "utf8").digest("hex")
  const headerRows = z
    .array(z.array(z.string()))
    .parse(parse(csv, { bom: true, relax_column_count: true, skip_empty_lines: true, to_line: 1 }))
  const header = normalizeHeader(headerRows[0] ?? [])
  if (header.join(",") !== SCHOOL_CSV_HEADER.join(",")) {
    return {
      accepted: [],
      rejected: [{ line: 1, reason: `header: expected ${SCHOOL_CSV_HEADER.join(",")}` }],
      acceptedCount: 0,
      rejectedCount: 1,
      inputSha256,
    }
  }

  const rawRows = z.array(z.record(z.string(), z.string())).parse(
    parse(csv, {
      bom: true,
      columns: () => [...header],
      skip_empty_lines: true,
    }),
  )
  const accepted: SchoolImportRow[] = []
  const rejected: SchoolImportRejection[] = []
  const seenKeys = new Set<string>()

  rawRows.forEach((rawRow, index) => {
    const line = index + 2
    const result = schoolCsvRowSchema.safeParse(rawRow)
    if (!result.success) {
      rejected.push({
        line,
        reason: result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      })
      return
    }

    const key = [result.data.name, result.data.state, result.data.city]
      .map((part) => part.toLocaleLowerCase("en-US"))
      .join("\u0000")
    if (seenKeys.has(key)) {
      rejected.push({ line, reason: "duplicate school key" })
      return
    }

    seenKeys.add(key)
    accepted.push(result.data)
  })

  return {
    accepted,
    rejected,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    inputSha256,
  }
}
