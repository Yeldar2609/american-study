import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const profileSchema = z.object({
  address: z.string().nullable(),
  aid_need_level: z.enum(["low", "medium", "high"]).nullable(),
  current_grade: z.string().nullable(),
  current_school: z.string().nullable(),
  diagnostic_summary: z.string().nullable(),
  dob: z.string().nullable(),
  drive_folder_url: z.string().nullable(),
  english_level: z.string().nullable(),
  id: z.string(),
  interests: z.array(z.string()),
  package_state: z.enum(["trial", "paid"]),
  parent_email: z.string().nullable(),
  parent_phone: z.string().nullable(),
  passport_id_drive_url: z.string().nullable(),
  phone: z.string().nullable(),
  pref_setting: z.enum(["urban", "suburban", "rural"]).nullable(),
  pref_size: z.enum(["small", "medium", "large"]).nullable(),
  pref_state_or_region: z.string().nullable(),
  stage: z.enum(["diagnostic", "trial", "list_building", "finalized", "application", "submitted"]),
  test_scores: z.record(z.string(), z.number()),
  user_id: z.string(),
})

const userSchema = z.object({
  email: z.string(),
  full_name: z.string(),
  language: z.enum(["en", "ru"]),
})

export type AdminStudentProfile = {
  readonly id: string
  readonly userId: string
  readonly email: string
  readonly fullName: string
  readonly language: "en" | "ru"
  readonly packageState: "trial" | "paid"
  readonly stage:
    | "diagnostic"
    | "trial"
    | "list_building"
    | "finalized"
    | "application"
    | "submitted"
  readonly address: string | null
  readonly aidNeedLevel: "low" | "medium" | "high" | null
  readonly currentGrade: string | null
  readonly currentSchool: string | null
  readonly diagnosticSummary: string | null
  readonly dob: string | null
  readonly driveFolderUrl: string | null
  readonly englishLevel: string | null
  readonly interests: readonly string[]
  readonly parentEmail: string | null
  readonly parentPhone: string | null
  readonly passportIdDriveUrl: string | null
  readonly phone: string | null
  readonly prefSetting: "urban" | "suburban" | "rural" | null
  readonly prefSize: "small" | "medium" | "large" | null
  readonly prefStateOrRegion: string | null
  readonly testScores: Readonly<Record<string, number>>
}

export type AdminStudentProfileResult =
  | { readonly kind: "ready"; readonly profile: AdminStudentProfile }
  | { readonly kind: "configuration" | "error" | "notFound" }

export async function getAdminStudentProfile(
  studentId: string,
): Promise<AdminStudentProfileResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data: profileData, error: profileError } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle()
  if (profileError !== null) {
    return { kind: "error" }
  }
  if (profileData === null) {
    return { kind: "notFound" }
  }
  const profile = profileSchema.safeParse(profileData)
  if (!profile.success) {
    return { kind: "error" }
  }

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("email,full_name,language")
    .eq("id", profile.data.user_id)
    .maybeSingle()
  const user = userSchema.safeParse(userData)
  if (userError !== null || !user.success) {
    return { kind: "error" }
  }

  const value = profile.data
  return {
    kind: "ready",
    profile: {
      address: value.address,
      aidNeedLevel: value.aid_need_level,
      currentGrade: value.current_grade,
      currentSchool: value.current_school,
      diagnosticSummary: value.diagnostic_summary,
      dob: value.dob,
      driveFolderUrl: value.drive_folder_url,
      email: user.data.email,
      englishLevel: value.english_level,
      fullName: user.data.full_name,
      id: value.id,
      interests: value.interests,
      language: user.data.language,
      packageState: value.package_state,
      parentEmail: value.parent_email,
      parentPhone: value.parent_phone,
      passportIdDriveUrl: value.passport_id_drive_url,
      phone: value.phone,
      prefSetting: value.pref_setting,
      prefSize: value.pref_size,
      prefStateOrRegion: value.pref_state_or_region,
      stage: value.stage,
      testScores: value.test_scores,
      userId: value.user_id,
    },
  }
}
