"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const localeSchema = z.enum(["en", "ru", "kk"])

function text(formData: FormData, name: string): string | null {
  const value = formData.get(name)
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function integer(formData: FormData, name: string): number | null {
  const value = text(formData, name)
  if (value === null) {
    return null
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function decimal(formData: FormData, name: string): number | null {
  const value = text(formData, name)
  if (value === null) {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? null : parsed
}

function boolean(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true"
}

// The array facets are entered as comma/newline-separated text. Split, trim, and
// drop blanks so an empty field becomes [] (the column default) not [""].
function stringArray(formData: FormData, name: string): string[] {
  const value = formData.get(name)
  if (typeof value !== "string") {
    return []
  }
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

// public.schools constrains website_url / niche_profile_url to start with
// https://, so only persist a value that satisfies it — otherwise null it out
// rather than letting the update fail.
function httpsUrl(formData: FormData, name: string): string | null {
  const value = text(formData, name)
  return value?.startsWith("https://") ? value : null
}

function enumValue<T extends string>(
  formData: FormData,
  name: string,
  allowed: readonly T[],
): T | null {
  const value = text(formData, name)
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

export async function updateSchoolAction(formData: FormData): Promise<void> {
  const locale = localeSchema.safeParse(formData.get("locale"))
  const schoolId = z.uuid().safeParse(formData.get("schoolId"))
  if (!locale.success || !schoolId.success) {
    return
  }

  await requireRole(locale.data, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  await supabase
    .from("schools")
    .update({
      about: text(formData, "about"),
      acceptance_rate_pct: decimal(formData, "acceptanceRatePct"),
      accreditation: text(formData, "accreditation"),
      admissions_email: text(formData, "admissionsEmail"),
      admissions_phone: text(formData, "admissionsPhone"),
      affiliation: text(formData, "affiliation"),
      ap_courses: stringArray(formData, "apCourses"),
      application_fee_usd: integer(formData, "applicationFeeUsd"),
      athletic_conference: text(formData, "athleticConference"),
      avg_class_size: integer(formData, "avgClassSize"),
      avg_sat: integer(formData, "avgSat"),
      avg_ssat_pctile: decimal(formData, "avgSsatPctile"),
      boarding_tuition_usd: integer(formData, "boardingTuitionUsd"),
      campus_acres: integer(formData, "campusAcres"),
      clubs: stringArray(formData, "clubs"),
      college_matriculation: text(formData, "collegeMatriculation"),
      dorm_count: integer(formData, "dormCount"),
      endowment_usd: integer(formData, "endowmentUsd"),
      enrollment: integer(formData, "enrollment"),
      extracurriculars: stringArray(formData, "extracurriculars"),
      faculty_count: integer(formData, "facultyCount"),
      financial_aid_notes: text(formData, "financialAidNotes"),
      founded_year: integer(formData, "foundedYear"),
      grades: text(formData, "grades"),
      head_of_school: text(formData, "headOfSchool"),
      ib_offered: boolean(formData, "ibOffered"),
      is_partner: boolean(formData, "isPartner"),
      languages_offered: stringArray(formData, "languagesOffered"),
      last_checked_in: text(formData, "lastCheckedIn"),
      niche_profile_url: httpsUrl(formData, "nicheProfileUrl"),
      niche_rank: integer(formData, "nicheRank"),
      notable_alumni: text(formData, "notableAlumni"),
      offers_financial_aid: boolean(formData, "offersFinancialAid"),
      pct_boarding: decimal(formData, "pctBoarding"),
      pct_international: decimal(formData, "pctInternational"),
      percent_students_of_color: integer(formData, "percentStudentsOfColor"),
      religious_affiliation: text(formData, "religiousAffiliation"),
      setting: enumValue(formData, "setting", ["urban", "suburban", "rural"]),
      sports: stringArray(formData, "sports"),
      strengths: stringArray(formData, "strengths"),
      student_body: enumValue(formData, "studentBody", ["coed", "boys", "girls"]),
      student_teacher_ratio: text(formData, "studentTeacherRatio"),
      website_url: httpsUrl(formData, "websiteUrl"),
    })
    .eq("id", schoolId.data)

  revalidatePath(`/${locale.data}/app/admin`)
}

export async function markCheckedInAction(formData: FormData): Promise<void> {
  const locale = localeSchema.safeParse(formData.get("locale"))
  const schoolId = z.uuid().safeParse(formData.get("schoolId"))
  if (!locale.success || !schoolId.success) {
    return
  }

  await requireRole(locale.data, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  const today = new Date().toISOString().slice(0, 10)
  await supabase.from("schools").update({ last_checked_in: today }).eq("id", schoolId.data)

  revalidatePath(`/${locale.data}/app/admin`)
}
