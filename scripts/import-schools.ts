import { readFile } from "node:fs/promises"
import { pathToFileURL } from "node:url"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import {
  parseSchoolCsv,
  type SchoolImportReport,
  type SchoolImportRow,
} from "../src/lib/schools/school-import.ts"

export { parseSchoolCsv } from "../src/lib/schools/school-import.ts"
export const SCHOOL_UPSERT_CONFLICT_TARGET = "natural_key"

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

export interface SchoolImportWriter {
  write(rows: readonly SchoolImportRow[]): Promise<number>
}

export function ensureImportHasNoRejections(report: SchoolImportReport): void {
  if (report.rejectedCount > 0) {
    throw new SchoolWriteError("live import refused because the CSV contains rejected rows")
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

export async function runImport(
  request: ImportRequest,
  writer?: SchoolImportWriter,
): Promise<SchoolImportReport> {
  const report = parseSchoolCsv(await readFile(request.csvPath, "utf8"))
  if (request.kind === "live") {
    ensureImportHasNoRejections(report)
  }
  if (request.kind === "live" && report.accepted.length > 0) {
    const liveWriter =
      writer ??
      (() => {
        const supabase = createClient(request.supabaseUrl, request.serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
        return {
          async write(rows: readonly SchoolImportRow[]): Promise<number> {
            const { data, error } = await supabase.rpc("admin_import_schools", {
              import_rows: rows,
            })
            if (error !== null) {
              throw new SchoolWriteError(error.message)
            }
            return z.number().int().nonnegative().parse(data)
          },
        }
      })()
    const affectedCount = await liveWriter.write(report.accepted)
    if (affectedCount !== report.acceptedCount) {
      throw new SchoolWriteError(
        `database affected ${affectedCount} rows; expected ${report.acceptedCount}`,
      )
    }
  }
  return report
}

async function main(): Promise<void> {
  const request = resolveImportRequest(process.argv.slice(2), process.env)
  const report = await runImport(request)
  console.log(
    `${request.kind}: sha256=${report.inputSha256} accepted=${report.acceptedCount} rejected=${report.rejectedCount}`,
  )
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
