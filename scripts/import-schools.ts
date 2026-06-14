import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"
import { createClient } from "@supabase/supabase-js"
import { parse } from "csv-parse/sync"
import { z } from "zod"

export const SCHOOL_UPSERT_CONFLICT_TARGET = "natural_key"

const requiredText = z.string().trim().min(1)
const nullableText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
const nullableUrl = nullableText.pipe(z.url().nullable())
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

const schoolCsvRowSchema = z
  .object({
    name: requiredText,
    state: requiredText
      .transform((value) => value.toUpperCase())
      .pipe(z.string().regex(/^[A-Z]{2}$/, "must be a two-letter state code")),
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
    grades: nullableText,
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
        .split(",")
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
}

export type ImportRequest =
  | { readonly kind: "dry-run"; readonly csvPath: string }
  | {
      readonly kind: "live"
      readonly csvPath: string
      readonly supabaseUrl: string
      readonly serviceRoleKey: string
    }

export class ImportConfigurationError extends Error {
  readonly name = "ImportConfigurationError"
}

export class SchoolWriteError extends Error {
  readonly name = "SchoolWriteError"
}

export function ensureImportHasNoRejections(report: SchoolImportReport): void {
  if (report.rejectedCount > 0) {
    throw new SchoolWriteError("live import refused because the CSV contains rejected rows")
  }
}

export function parseSchoolCsv(csv: string): SchoolImportReport {
  const rawRows = z
    .array(z.record(z.string(), z.string()))
    .parse(parse(csv, { bom: true, columns: true, skip_empty_lines: true }))
  const accepted: SchoolImportRow[] = []
  const rejected: SchoolImportRejection[] = []
  const seenKeys = new Set<string>()

  rawRows.forEach((rawRow, index) => {
    const line = index + 2
    const result = schoolCsvRowSchema.safeParse(rawRow)
    if (!result.success) {
      const reason = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")
      rejected.push({ line, reason })
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
  }
}

export function resolveImportRequest(
  args: readonly string[],
  env: Readonly<Record<string, string | undefined>>,
): ImportRequest {
  const unsupported = args.filter(
    (argument) => argument.startsWith("--") && argument !== "--dry-run",
  )
  const csvPaths = args.filter((argument) => !argument.startsWith("--"))
  if (unsupported.length > 0 || csvPaths.length !== 1) {
    throw new ImportConfigurationError("usage: npm run import:schools -- <schools.csv> [--dry-run]")
  }

  const csvPath = csvPaths[0]
  if (csvPath === undefined) {
    throw new ImportConfigurationError("a CSV path is required")
  }
  if (args.includes("--dry-run")) {
    return { kind: "dry-run", csvPath }
  }

  const credentials = z
    .object({
      NEXT_PUBLIC_SUPABASE_URL: z.url(),
      SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    })
    .safeParse(env)
  if (!credentials.success) {
    throw new ImportConfigurationError(
      "live import requires NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY",
    )
  }
  return {
    kind: "live",
    csvPath,
    serviceRoleKey: credentials.data.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: credentials.data.NEXT_PUBLIC_SUPABASE_URL,
  }
}

async function runImport(request: ImportRequest): Promise<SchoolImportReport> {
  const report = parseSchoolCsv(await readFile(request.csvPath, "utf8"))
  if (request.kind === "live") {
    ensureImportHasNoRejections(report)
  }
  if (request.kind === "live" && report.accepted.length > 0) {
    const supabase = createClient(request.supabaseUrl, request.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await supabase
      .from("schools")
      .upsert([...report.accepted], { onConflict: SCHOOL_UPSERT_CONFLICT_TARGET })
    if (error !== null) {
      throw new SchoolWriteError(error.message)
    }
  }
  return report
}

async function main(): Promise<void> {
  const request = resolveImportRequest(process.argv.slice(2), process.env)
  const report = await runImport(request)
  console.log(`${request.kind}: accepted=${report.acceptedCount} rejected=${report.rejectedCount}`)
  for (const rejection of report.rejected) {
    console.error(`line ${rejection.line}: ${rejection.reason}`)
  }
  process.exitCode = report.rejectedCount === 0 ? 0 : 1
}

const entryPath = process.argv[1]
if (entryPath !== undefined && import.meta.url === pathToFileURL(entryPath).href) {
  main().catch((error: unknown) => {
    // no-excuse-ok: catch - CLI boundary converts all failures to a nonzero exit.
    console.error(error instanceof Error ? error.message : "unknown import failure")
    process.exitCode = 1
  })
}
