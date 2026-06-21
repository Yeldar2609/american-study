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
const workspaceAccess = readFileSync(
  "supabase/migrations/202606180002_workspace_access.sql",
  "utf8",
)
const schoolManagement = readFileSync(
  "supabase/migrations/202606180003_school_management.sql",
  "utf8",
)
const paidWorkflows = readFileSync("supabase/migrations/202606180004_paid_workflows.sql", "utf8")
const collaboration = readFileSync(
  "supabase/migrations/202606180005_collaboration_admin.sql",
  "utf8",
)
const authTriggerFix = readFileSync("supabase/migrations/202606180006_auth_trigger_fix.sql", "utf8")
const adminAnalytics = readFileSync("supabase/migrations/202606180007_admin_analytics.sql", "utf8")
const appSettings = readFileSync("supabase/migrations/202606220001_app_settings.sql", "utf8")
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

  it("enforces paid feature access through one stable database helper", () => {
    expect(workspaceAccess).toContain("create or replace function private.is_unlocked")
    expect(workspaceAccess).toContain("language sql")
    expect(workspaceAccess).toContain("stable")
    expect(workspaceAccess).toContain("create or replace function public.get_school_catalog")
    expect(workspaceAccess).toContain("student.package_state = 'paid'")
    expect(workspaceAccess).toContain("or pick.admin_pick")
    expect(workspaceAccess).toContain("create or replace function public.set_school_star")
    expect(workspaceAccess).toContain("if not private.is_unlocked(target_student_id)")
  })

  it("guards school matching changes and limits the final list to seven", () => {
    expect(schoolManagement).toContain("create or replace function public.admin_update_school_pick")
    expect(schoolManagement).toContain("if not private.is_admin()")
    expect(schoolManagement).toContain("Final seven already contains seven schools")
    expect(schoolManagement).toContain("on conflict (student_id, school_id)")
    expect(schoolManagement).toContain("grant execute")
  })

  it("uses guarded workflow mutations that create notifications", () => {
    expect(paidWorkflows).toContain("create or replace function public.update_task_status")
    expect(paidWorkflows).toContain("create or replace function public.admin_save_task")
    expect(paidWorkflows).toContain("create or replace function public.admin_save_document")
    expect(paidWorkflows).toContain("create or replace function public.save_essay")
    expect(paidWorkflows).toContain("create or replace function public.request_booking")
    expect(paidWorkflows).toContain("create or replace function public.mark_notification_read")
    expect(paidWorkflows).toContain("if not private.is_unlocked")
    expect(paidWorkflows).toContain("insert into public.notifications")
    expect(paidWorkflows).toContain("documents_paid_select")
    expect(paidWorkflows).toContain("messages_paid_select")
  })

  it("supports paid comments and an admin-only applications export", () => {
    expect(collaboration).toContain("create or replace function public.post_student_comment")
    expect(collaboration).toContain("create or replace function public.get_admin_applications")
    expect(collaboration).toContain("if not private.is_unlocked")
    expect(collaboration).toContain("if not private.is_admin()")
    expect(collaboration).toContain("grant execute")
  })

  it("lets Auth create users before optional role metadata is available", () => {
    expect(authTriggerFix).toContain("new.raw_user_meta_data ->> 'role'")
    expect(authTriggerFix).toContain("requested_role is null")
    expect(authTriggerFix).toContain("return new")
  })

  it("defines the admin analytics aggregate and its security contract", () => {
    expect(adminAnalytics).toContain("create or replace function public.get_admin_analytics()")
    expect(adminAnalytics).toContain("returns jsonb")
    expect(adminAnalytics).toContain("language plpgsql")
    expect(adminAnalytics).toContain("stable")
    expect(adminAnalytics).toContain("security definer")
    expect(adminAnalytics).toContain("set search_path = ''")
    expect(adminAnalytics).toContain("if not private.is_admin()")
    expect(adminAnalytics).toContain(
      "raise exception 'Admin access required' using errcode = '42501'",
    )
    expect(adminAnalytics).toMatch(/return\s*\(\s*with[\s\S]+jsonb_build_object/i)
    expect(adminAnalytics).toContain("'conversion_percent'")
    expect(adminAnalytics).toMatch(
      /student_rollup\.paid_students\s*\*\s*100\.0\s*\/\s*student_rollup\.total_students/,
    )
    expect(adminAnalytics).toContain("pick.admin_pick")
    expect(adminAnalytics).toContain(
      "student.stage in ('list_building', 'finalized', 'application', 'submitted')",
    )
    expect(adminAnalytics).toContain("task.due_date between current_date and current_date + 14")
    expect(adminAnalytics).toContain("task.status <> 'approved'")
    expect(adminAnalytics).toContain("document.required")
    expect(adminAnalytics).toContain("document.due_date between current_date and current_date + 14")
    expect(adminAnalytics).toContain("document.status <> 'verified'")
    expect(adminAnalytics).toContain("distinct on (activity.student_id)")
    expect(adminAnalytics).toContain("limit 8")
    expect(adminAnalytics).toContain(
      "revoke execute on function public.get_admin_analytics() from public, anon",
    )
    expect(adminAnalytics).toContain(
      "grant execute on function public.get_admin_analytics() to authenticated",
    )
  })

  it("stores admin-editable app settings behind a guarded setter", () => {
    expect(appSettings).toContain("create table public.app_settings")
    expect(appSettings).toContain("alter table public.app_settings enable row level security")
    expect(appSettings).toContain("create or replace function public.admin_set_app_setting")
    expect(appSettings).toContain("security definer")
    expect(appSettings).toContain("set search_path = ''")
    expect(appSettings).toContain("if not private.is_admin()")
    expect(appSettings).toContain("on conflict (key) do update")
    expect(appSettings).toContain(
      "revoke execute on function public.admin_set_app_setting(text, text) from public, anon",
    )
    expect(appSettings).toContain(
      "grant execute on function public.admin_set_app_setting(text, text) to authenticated",
    )
  })

  it("seeds exactly four role accounts without inventing school records", () => {
    expect(seed).toContain("admin@american-study.local")
    expect(seed).toContain("trial.student@american-study.local")
    expect(seed).toContain("paid.student@american-study.local")
    expect(seed).toContain("paid.parent@american-study.local")
    expect(new Set(seed.match(/'[a-z.]+@american-study\.local'/g) ?? []).size).toBe(4)
    expect(seed).not.toMatch(/insert\s+into\s+public\.schools/i)
  })
})
