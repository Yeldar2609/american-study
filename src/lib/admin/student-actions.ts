"use server"

import { revalidatePath } from "next/cache"
import { deleteAuthUsers } from "@/lib/admin/auth-compensation"
import type { AdminStudentActionState } from "@/lib/admin/student-action-state"
import { parseStudentForm } from "@/lib/admin/student-form"
import { requireRole } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function createStudentAction(
  locale: string,
  _previous: AdminStudentActionState,
  formData: FormData,
): Promise<AdminStudentActionState> {
  await requireRole(locale, "admin")
  const parsed = parseStudentForm(formData)
  if (parsed.kind === "invalid") {
    return { fieldErrors: parsed.fieldErrors, message: "validation", status: "error" }
  }

  const admin = createAdminClient()
  const supabase = await createClient()
  if (admin === null || supabase === null) {
    return { fieldErrors: {}, message: "configuration", status: "error" }
  }

  const value = parsed.value
  const { data: studentAuth, error: studentAuthError } = await admin.auth.admin.createUser({
    app_metadata: { role: "student" },
    email: value.studentEmail,
    email_confirm: true,
    password: value.studentPassword,
    user_metadata: { full_name: value.studentFullName, language: value.studentLanguage },
  })
  if (studentAuthError !== null) {
    return {
      fieldErrors: { studentEmail: ["duplicate"] },
      message: "duplicate",
      status: "error",
    }
  }

  const studentUserId = studentAuth.user.id
  const studentRow = {
    address: value.address,
    aid_need_level: value.aidNeedLevel,
    current_grade: value.currentGrade,
    current_school: value.currentSchool,
    diagnostic_summary: value.diagnosticSummary,
    dob: value.dob,
    drive_folder_url: value.driveFolderUrl,
    english_level: value.englishLevel,
    interests: value.interests,
    package_state: value.packageState,
    parent_email: value.parentEmail,
    parent_phone: value.parentPhone,
    passport_id_drive_url: value.passportIdDriveUrl,
    phone: value.phone,
    pref_setting: value.prefSetting,
    pref_size: value.prefSize,
    pref_state_or_region: value.prefStateOrRegion,
    stage: value.stage,
    test_scores: value.testScores,
    user_id: studentUserId,
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      email: value.studentEmail,
      full_name: value.studentFullName,
      language: value.studentLanguage,
    })
    .eq("id", studentUserId)
  const { data: student, error: studentError } =
    userError === null
      ? await supabase.from("students").insert(studentRow).select("id").single()
      : { data: null, error: userError }

  if (studentError !== null || student === null) {
    const cleaned = await deleteAuthUsers(admin.auth.admin, [studentUserId])
    return {
      fieldErrors: {},
      message: cleaned ? "unexpected" : "cleanupRequired",
      status: "error",
    }
  }

  if (
    value.parentEmail !== null &&
    value.parentFullName !== null &&
    value.parentLanguage !== null &&
    value.parentPassword !== null
  ) {
    const { data: parentAuth, error: parentAuthError } = await admin.auth.admin.createUser({
      app_metadata: { role: "parent" },
      email: value.parentEmail,
      email_confirm: true,
      password: value.parentPassword,
      user_metadata: { full_name: value.parentFullName, language: value.parentLanguage },
    })
    if (parentAuthError !== null) {
      const cleaned = await deleteAuthUsers(admin.auth.admin, [studentUserId])
      return {
        fieldErrors: { parentEmail: ["duplicate"] },
        message: cleaned ? "duplicate" : "cleanupRequired",
        status: "error",
      }
    }

    const parentUserId = parentAuth.user.id
    const { error: parentUserError } = await supabase
      .from("users")
      .update({
        email: value.parentEmail,
        full_name: value.parentFullName,
        language: value.parentLanguage,
      })
      .eq("id", parentUserId)
    const { error: linkError } =
      parentUserError === null
        ? await supabase
            .from("parents_students")
            .insert({ parent_user_id: parentUserId, student_id: student.id })
        : { error: parentUserError }
    if (linkError !== null) {
      const cleaned = await deleteAuthUsers(admin.auth.admin, [parentUserId, studentUserId])
      return {
        fieldErrors: {},
        message: cleaned ? "unexpected" : "cleanupRequired",
        status: "error",
      }
    }
  }

  revalidatePath(`/${locale}/app/admin`)
  return { fieldErrors: {}, message: "created", status: "success" }
}
