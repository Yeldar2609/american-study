"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { restoreAuthUser } from "@/lib/admin/auth-compensation"
import type { AdminStudentActionState } from "@/lib/admin/student-action-state"
import { parseStudentProfileForm } from "@/lib/admin/student-profile-form"
import { requireRole } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const packageFormSchema = z.object({
  packageState: z.enum(["trial", "paid"]),
  studentId: z.uuid(),
})

export async function updateStudentProfileAction(
  locale: string,
  _previous: AdminStudentActionState,
  formData: FormData,
): Promise<AdminStudentActionState> {
  await requireRole(locale, "admin")
  const parsed = parseStudentProfileForm(formData)
  if (parsed.kind === "invalid") {
    return { fieldErrors: parsed.fieldErrors, message: "validation", status: "error" }
  }

  const admin = createAdminClient()
  const supabase = await createClient()
  if (admin === null || supabase === null) {
    return { fieldErrors: {}, message: "configuration", status: "error" }
  }

  const value = parsed.value
  const { data: existingStudent, error: studentReadError } = await supabase
    .from("students")
    .select("user_id")
    .eq("id", value.studentId)
    .maybeSingle()
  if (studentReadError !== null || existingStudent === null) {
    return { fieldErrors: {}, message: "unexpected", status: "error" }
  }
  const { data: existingUser, error: userReadError } = await supabase
    .from("users")
    .select("email,full_name,language")
    .eq("id", existingStudent.user_id)
    .maybeSingle()
  if (userReadError !== null || existingUser === null) {
    return { fieldErrors: {}, message: "unexpected", status: "error" }
  }

  const { error: authError } = await admin.auth.admin.updateUserById(existingStudent.user_id, {
    email: value.studentEmail,
    email_confirm: true,
    user_metadata: {
      full_name: value.studentFullName,
      language: value.studentLanguage,
    },
  })
  if (authError !== null) {
    return {
      fieldErrors: { studentEmail: ["duplicate"] },
      message: "duplicate",
      status: "error",
    }
  }

  const { error: profileError } = await supabase.rpc("admin_update_student_profile", {
    profile: {
      address: value.address,
      aid_need_level: value.aidNeedLevel,
      current_grade: value.currentGrade,
      current_school: value.currentSchool,
      current_school_id: value.currentSchoolId,
      diagnostic_summary: value.diagnosticSummary,
      dob: value.dob,
      drive_folder_url: value.driveFolderUrl,
      email: value.studentEmail,
      english_level: value.englishLevel,
      full_name: value.studentFullName,
      interests: value.interests,
      is_independent_student: value.isIndependentStudent,
      language: value.studentLanguage,
      parent_email: value.parentEmail,
      parent_phone: value.parentPhone,
      passport_id_drive_url: value.passportIdDriveUrl,
      phone: value.phone,
      pref_setting: value.prefSetting,
      pref_size: value.prefSize,
      pref_state_or_region: value.prefStateOrRegion,
      stage: value.stage,
      test_scores: value.testScores,
    },
    target_student_id: value.studentId,
  })
  if (profileError !== null) {
    const restored = await restoreAuthUser(admin.auth.admin, existingStudent.user_id, {
      email: existingUser.email,
      fullName: existingUser.full_name,
      language: existingUser.language,
    })
    return {
      fieldErrors: {},
      message: restored ? "unexpected" : "cleanupRequired",
      status: "error",
    }
  }

  revalidatePath(`/${locale}/app/admin`)
  return { fieldErrors: {}, message: "updated", status: "success" }
}

export async function setStudentPackageAction(
  locale: string,
  _previous: AdminStudentActionState,
  formData: FormData,
): Promise<AdminStudentActionState> {
  await requireRole(locale, "admin")
  const parsed = packageFormSchema.safeParse({
    packageState: formData.get("packageState"),
    studentId: formData.get("studentId"),
  })
  if (!parsed.success) {
    return { fieldErrors: {}, message: "validation", status: "error" }
  }

  const supabase = await createClient()
  if (supabase === null) {
    return { fieldErrors: {}, message: "configuration", status: "error" }
  }
  const { error } = await supabase.rpc("admin_set_student_package_state", {
    new_package_state: parsed.data.packageState,
    target_student_id: parsed.data.studentId,
  })
  if (error !== null) {
    return { fieldErrors: {}, message: "unexpected", status: "error" }
  }

  revalidatePath(`/${locale}/app/admin`)
  return { fieldErrors: {}, message: "packageUpdated", status: "success" }
}
