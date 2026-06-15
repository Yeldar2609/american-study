import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const coreSchema = readFileSync("supabase/migrations/202606130001_types_and_schema.sql", "utf8")
const corePolicies = readFileSync("supabase/migrations/202606130003_rls_policies.sql", "utf8")
const expandedSchema = readFileSync(
  "supabase/migrations/202606130006_expanded_platform_schema.sql",
  "utf8",
)
const schoolNaturalKey = readFileSync(
  "supabase/migrations/202606140001_school_natural_key.sql",
  "utf8",
)
const adminProfileRpc = readFileSync(
  "supabase/migrations/202606140002_admin_profile_rpc.sql",
  "utf8",
)
const schoolImportRpc = readFileSync(
  "supabase/migrations/202606150001_service_school_import.sql",
  "utf8",
)
const functionGrants = readFileSync("supabase/migrations/202606130007_function_grants.sql", "utf8")
const seed = readFileSync("supabase/seed.sql", "utf8")

const coreTables = [
  "users",
  "students",
  "parents_students",
  "schools",
  "student_school_picks",
  "application_tasks",
  "essays",
  "bookings",
  "notes_internal",
  "content_videos",
  "faq",
] as const

const expandedTables = [
  "messages",
  "message_reads",
  "notifications",
  "activity_log",
  "documents",
  "recommendations",
  "interview_questions",
  "interview_practice",
  "task_templates",
  "student_tags",
  "announcements",
] as const

describe("Supabase migration contract", () => {
  it("creates and enables RLS on every core table", () => {
    for (const table of coreTables) {
      expect(coreSchema).toContain(`create table public.${table}`)
      expect(corePolicies).toContain(`alter table public.${table} enable row level security`)
    }
  })

  it("creates and enables RLS on every expanded table", () => {
    for (const table of expandedTables) {
      expect(expandedSchema).toContain(`create table public.${table}`)
      expect(expandedSchema).toContain(`alter table public.${table} enable row level security`)
    }
  })

  it("revokes anonymous execution of public functions", () => {
    expect(functionGrants).toContain(
      "revoke execute on all functions in schema public from public, anon",
    )
  })

  it("does not grant a function before its creating migration", () => {
    expect(functionGrants).not.toContain("admin_import_schools")
  })

  it("guards the school import RPC and grants only intended roles", () => {
    expect(schoolImportRpc).toContain("security definer")
    expect(schoolImportRpc).toContain("set search_path = ''")
    expect(schoolImportRpc).toContain("auth.role()) is distinct from 'service_role'")
    expect(schoolImportRpc).toContain(
      "revoke execute on function public.admin_import_schools(jsonb) from public, anon",
    )
    expect(schoolImportRpc).toContain(
      "grant execute on function public.admin_import_schools(jsonb) to authenticated, service_role",
    )
  })

  it("provides a concrete unique conflict target for idempotent school imports", () => {
    expect(schoolNaturalKey).toContain("natural_key text generated always as")
    expect(schoolNaturalKey).toContain("unique (natural_key)")
  })

  it("updates student and user profile rows through one guarded transaction", () => {
    expect(adminProfileRpc).toContain(
      "create or replace function public.admin_update_student_profile",
    )
    expect(adminProfileRpc).toContain("if not private.is_admin()")
    expect(adminProfileRpc).toContain("update public.students")
    expect(adminProfileRpc).toContain("update public.users")
    expect(adminProfileRpc).toContain("to authenticated")
  })

  it("seeds role fixtures without inventing school records", () => {
    expect(seed).toContain("admin@american-study.local")
    expect(seed).toContain("trial.student@american-study.local")
    expect(seed).toContain("paid.student@american-study.local")
    expect(seed).not.toMatch(/insert\s+into\s+public\.schools/i)
  })
})
