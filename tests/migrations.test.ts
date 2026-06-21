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
const catalogMatchBulk = readFileSync(
  "supabase/migrations/202606220006_catalog_match_and_bulk_tasks.sql",
  "utf8",
)
const schoolSummary = readFileSync(
  "supabase/migrations/202606220007_student_school_summary.sql",
  "utf8",
)
const broadcastNotification = readFileSync(
  "supabase/migrations/202606220008_admin_broadcast_notification.sql",
  "utf8",
)
const interviewPrep = readFileSync("supabase/migrations/202606220009_interview_prep.sql", "utf8")
const selfServe = readFileSync("supabase/migrations/202606220010_student_self_serve.sql", "utf8")
const applicationPipeline = readFileSync(
  "supabase/migrations/202606220011_application_pipeline.sql",
  "utf8",
)
const saveToFinal = readFileSync("supabase/migrations/202606220012_save_to_final.sql", "utf8")
const catalogMatchPerf = readFileSync(
  "supabase/migrations/202606220013_catalog_match_perf.sql",
  "utf8",
)
const consolidateGuards = readFileSync(
  "supabase/migrations/202606220014_consolidate_access_guards.sql",
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

  it("authorizes catalog scoring for the student/parent and adds bulk task assignment", () => {
    expect(catalogMatchBulk).toContain("create or replace function public.compute_match")
    expect(catalogMatchBulk).toContain("not private.is_admin()")
    expect(catalogMatchBulk).toContain("from public.parents_students as link")
    expect(catalogMatchBulk).toContain("create or replace function public.admin_bulk_create_task")
    expect(catalogMatchBulk).toContain("if not private.is_admin()")
    expect(catalogMatchBulk).toContain("foreach target_id in array")
    expect(catalogMatchBulk).toContain("insert into public.application_tasks")
    expect(catalogMatchBulk).toContain(
      "revoke execute on function public.admin_bulk_create_task(uuid[], text, text, text, text, date, text)\n  from public, anon",
    )
    expect(catalogMatchBulk).toContain(
      "grant execute on function public.admin_bulk_create_task(uuid[], text, text, text, text, date, text)\n  to authenticated",
    )
  })

  it("answers the dashboard schools summary with one guarded aggregate query", () => {
    expect(schoolSummary).toContain("create or replace function public.get_student_school_summary")
    expect(schoolSummary).toContain("security definer")
    expect(schoolSummary).toContain("set search_path = ''")
    expect(schoolSummary).toContain("from public.parents_students as link")
    expect(schoolSummary).toContain("count(*) filter (where pick.admin_pick)")
    expect(schoolSummary).toContain("from public.student_school_picks as pick")
    expect(schoolSummary).toContain(
      "revoke execute on function public.get_student_school_summary(uuid) from public, anon",
    )
    expect(schoolSummary).toContain(
      "grant execute on function public.get_student_school_summary(uuid) to authenticated",
    )
  })

  it("broadcasts admin notifications to students through a guarded RPC", () => {
    expect(broadcastNotification).toContain(
      "create or replace function public.admin_broadcast_notification",
    )
    expect(broadcastNotification).toContain("if not private.is_admin()")
    expect(broadcastNotification).toContain("perform private.notify_user")
    expect(broadcastNotification).toContain("foreach target_id in array")
    expect(broadcastNotification).toContain(
      "revoke execute on function public.admin_broadcast_notification(uuid[], text, text, text)\n  from public, anon",
    )
    expect(broadcastNotification).toContain(
      "grant execute on function public.admin_broadcast_notification(uuid[], text, text, text)\n  to authenticated",
    )
  })

  it("surfaces interview prep with guarded read and write RPCs", () => {
    expect(interviewPrep).toContain("alter table public.interview_practice")
    expect(interviewPrep).toContain("add column if not exists admin_feedback")
    expect(interviewPrep).toContain("insert into public.interview_questions")
    expect(interviewPrep).toContain("on conflict (id) do nothing")
    expect(interviewPrep).toContain("create or replace function public.get_interview_prep")
    expect(interviewPrep).toContain(
      "create or replace function public.student_save_interview_practice",
    )
    expect(interviewPrep).toContain(
      "create or replace function public.admin_set_interview_feedback",
    )
    expect(interviewPrep).toContain("not private.is_unlocked(own_student_id)")
    expect(interviewPrep).toContain("if not private.is_admin()")
    expect(interviewPrep).toContain("on conflict (student_id, question_id) do update")
    expect(interviewPrep).toContain("grant execute on function public.get_interview_prep(uuid)")
  })

  it("gives students a narrow self-serve profile surface scoped to their own row", () => {
    expect(selfServe).toContain("add column if not exists test_targets")
    expect(selfServe).toContain("add column if not exists onboarded_at")
    expect(selfServe).toContain("create or replace function public.get_student_self")
    expect(selfServe).toContain("create or replace function public.student_update_self")
    expect(selfServe).toContain("create or replace function public.student_complete_onboarding")
    expect(selfServe).toContain("where s.user_id = (select auth.uid())")
    // Must not let a student change privileged fields.
    expect(selfServe).not.toContain("package_state =")
    expect(selfServe).not.toContain("stage =")
    expect(selfServe).toContain("grant execute on function public.get_student_self()")
  })

  it("tracks per-school application stage with admin-or-owner guards", () => {
    expect(applicationPipeline).toContain("create type public.application_stage as enum")
    expect(applicationPipeline).toContain("add column if not exists application_stage")
    expect(applicationPipeline).toContain("create or replace function public.set_application_stage")
    expect(applicationPipeline).toContain("create or replace function public.get_application_board")
    expect(applicationPipeline).toContain("private.is_admin()")
    expect(applicationPipeline).toContain("private.is_unlocked(target_student_id)")
    expect(applicationPipeline).toContain(
      "grant execute on function public.get_application_board(uuid) to authenticated",
    )
  })

  it("makes saving a school add it to the final list", () => {
    expect(saveToFinal).toContain("create or replace function public.set_school_star")
    expect(saveToFinal).toContain("is_final_7")
    expect(saveToFinal).toContain(
      "do update set starred = excluded.starred, is_final_7 = excluded.is_final_7",
    )
  })

  it("computes the catalog match once per row and marks compute_match parallel-safe", () => {
    expect(catalogMatchPerf).toContain(
      "alter function public.compute_match(uuid, uuid) parallel safe",
    )
    expect(catalogMatchPerf).toContain("create or replace function public.get_school_catalog")
    expect(catalogMatchPerf).toContain("order by 22 desc, school.name")
  })

  it("routes the read RPCs through the shared can_access_student guard", () => {
    for (const fn of [
      "public.get_student_school_summary",
      "public.get_interview_prep",
      "public.get_application_board",
      "public.get_school_catalog",
    ]) {
      expect(consolidateGuards).toContain(`create or replace function ${fn}`)
    }
    expect(consolidateGuards).toContain("if not private.can_access_student(target_student_id) then")
    // The catalog perf win must survive the guard swap.
    expect(consolidateGuards).toContain("order by 22 desc, school.name")
    // These guard a different predicate and must NOT be folded into can_access_student.
    expect(consolidateGuards).not.toContain("create or replace function public.compute_match")
    expect(consolidateGuards).not.toContain(
      "create or replace function public.set_application_stage",
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
