import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

// Full school row for the admin editor. Admins read public.schools directly under
// RLS (schools_select_paid_or_admin), so this includes the admin-only operational
// fields (is_partner, last_checked_in, niche_rank) alongside every public facet.
const adminSchoolRowSchema = z.object({
  about: z.string().nullable(),
  acceptance_rate_pct: z.coerce.number().nullable(),
  accreditation: z.string().nullable(),
  admissions_email: z.string().nullable(),
  admissions_phone: z.string().nullable(),
  affiliation: z.string().nullable(),
  ap_courses: z.array(z.string()).nullable(),
  avg_class_size: z.coerce.number().int().nullable(),
  avg_ssat_pctile: z.coerce.number().nullable(),
  boarding_tuition_usd: z.coerce.number().int().nullable(),
  campus_acres: z.coerce.number().int().nullable(),
  city: z.string().nullable(),
  clubs: z.array(z.string()).nullable(),
  college_matriculation: z.string().nullable(),
  enrollment: z.coerce.number().int().nullable(),
  extracurriculars: z.array(z.string()).nullable(),
  financial_aid_notes: z.string().nullable(),
  founded_year: z.coerce.number().int().nullable(),
  grades: z.string().nullable(),
  ib_offered: z.boolean().nullable(),
  id: z.uuid(),
  is_partner: z.boolean(),
  languages_offered: z.array(z.string()).nullable(),
  last_checked_in: z.string().nullable(),
  name: z.string(),
  niche_profile_url: z.string().nullable(),
  niche_rank: z.coerce.number().int().nullable(),
  notable_alumni: z.string().nullable(),
  offers_financial_aid: z.boolean().nullable(),
  pct_boarding: z.coerce.number().nullable(),
  pct_international: z.coerce.number().nullable(),
  religious_affiliation: z.string().nullable(),
  setting: z.enum(["urban", "suburban", "rural"]).nullable(),
  sports: z.array(z.string()).nullable(),
  state: z.string().nullable(),
  strengths: z.array(z.string()).nullable(),
  student_body: z.enum(["coed", "boys", "girls"]).nullable(),
  student_teacher_ratio: z.string().nullable(),
  website_url: z.string().nullable(),
})

export type AdminSchool = {
  readonly about: string | null
  readonly acceptanceRatePct: number | null
  readonly accreditation: string | null
  readonly admissionsEmail: string | null
  readonly admissionsPhone: string | null
  readonly affiliation: string | null
  readonly apCourses: readonly string[]
  readonly avgClassSize: number | null
  readonly avgSsatPctile: number | null
  readonly boardingTuitionUsd: number | null
  readonly campusAcres: number | null
  readonly city: string | null
  readonly clubs: readonly string[]
  readonly collegeMatriculation: string | null
  readonly enrollment: number | null
  readonly extracurriculars: readonly string[]
  readonly financialAidNotes: string | null
  readonly foundedYear: number | null
  readonly grades: string | null
  readonly ibOffered: boolean | null
  readonly id: string
  readonly isPartner: boolean
  readonly languagesOffered: readonly string[]
  readonly lastCheckedIn: string | null
  readonly name: string
  readonly nicheProfileUrl: string | null
  readonly nicheRank: number | null
  readonly notableAlumni: string | null
  readonly offersFinancialAid: boolean | null
  readonly pctBoarding: number | null
  readonly pctInternational: number | null
  readonly religiousAffiliation: string | null
  readonly setting: "urban" | "suburban" | "rural" | null
  readonly sports: readonly string[]
  readonly state: string | null
  readonly strengths: readonly string[]
  readonly studentBody: "coed" | "boys" | "girls" | null
  readonly studentTeacherRatio: string | null
  readonly websiteUrl: string | null
}

export type AdminSchoolResult =
  | { readonly kind: "ready"; readonly school: AdminSchool }
  | { readonly kind: "configuration" }
  | { readonly kind: "notFound" }
  | { readonly kind: "error" }

export async function getAdminSchool(schoolId: string): Promise<AdminSchoolResult> {
  if (!z.uuid().safeParse(schoolId).success) {
    return { kind: "notFound" }
  }

  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .maybeSingle()
  if (error !== null) {
    return { kind: "error" }
  }
  if (data === null) {
    return { kind: "notFound" }
  }

  const parsed = adminSchoolRowSchema.safeParse(data)
  if (!parsed.success) {
    return { kind: "error" }
  }

  const row = parsed.data
  return {
    kind: "ready",
    school: {
      about: row.about,
      acceptanceRatePct: row.acceptance_rate_pct,
      accreditation: row.accreditation,
      admissionsEmail: row.admissions_email,
      admissionsPhone: row.admissions_phone,
      affiliation: row.affiliation,
      apCourses: row.ap_courses ?? [],
      avgClassSize: row.avg_class_size,
      avgSsatPctile: row.avg_ssat_pctile,
      boardingTuitionUsd: row.boarding_tuition_usd,
      campusAcres: row.campus_acres,
      city: row.city,
      clubs: row.clubs ?? [],
      collegeMatriculation: row.college_matriculation,
      enrollment: row.enrollment,
      extracurriculars: row.extracurriculars ?? [],
      financialAidNotes: row.financial_aid_notes,
      foundedYear: row.founded_year,
      grades: row.grades,
      ibOffered: row.ib_offered,
      id: row.id,
      isPartner: row.is_partner,
      languagesOffered: row.languages_offered ?? [],
      lastCheckedIn: row.last_checked_in,
      name: row.name,
      nicheProfileUrl: row.niche_profile_url,
      nicheRank: row.niche_rank,
      notableAlumni: row.notable_alumni,
      offersFinancialAid: row.offers_financial_aid,
      pctBoarding: row.pct_boarding,
      pctInternational: row.pct_international,
      religiousAffiliation: row.religious_affiliation,
      setting: row.setting,
      sports: row.sports ?? [],
      state: row.state,
      strengths: row.strengths ?? [],
      studentBody: row.student_body,
      studentTeacherRatio: row.student_teacher_ratio,
      websiteUrl: row.website_url,
    },
  }
}

const checkinRowSchema = z.object({
  city: z.string().nullable(),
  id: z.uuid(),
  last_checked_in: z.string().nullable(),
  name: z.string(),
  state: z.string().nullable(),
})

export type CheckinDueSchool = {
  readonly city: string | null
  readonly id: string
  readonly lastCheckedIn: string | null
  readonly name: string
  readonly state: string | null
}

export type CheckinsDueResult =
  | { readonly kind: "ready"; readonly schools: readonly CheckinDueSchool[] }
  | { readonly kind: "configuration" }
  | { readonly kind: "error" }

const CHECKIN_INTERVAL_DAYS = 30

// A partner school is "due" when it has never been checked in, or its last
// check-in is older than the interval. `now` is injectable so the date math is
// unit-testable without a frozen clock.
export function isCheckinDue(lastCheckedIn: string | null, now: Date): boolean {
  if (lastCheckedIn === null) {
    return true
  }
  const last = new Date(`${lastCheckedIn}T00:00:00Z`)
  if (Number.isNaN(last.getTime())) {
    return true
  }
  const cutoff = new Date(now.getTime() - CHECKIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000)
  return last.getTime() < cutoff.getTime()
}

export async function getCheckinsDue(now: Date = new Date()): Promise<CheckinsDueResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await supabase
    .from("schools")
    .select("id,name,state,city,last_checked_in")
    .eq("is_partner", true)
  if (error !== null) {
    return { kind: "error" }
  }

  const parsed = z.array(checkinRowSchema).safeParse(data)
  if (!parsed.success) {
    return { kind: "error" }
  }

  const schools = parsed.data
    .filter((row) => isCheckinDue(row.last_checked_in, now))
    .map((row) => ({
      city: row.city,
      id: row.id,
      lastCheckedIn: row.last_checked_in,
      name: row.name,
      state: row.state,
    }))
    .sort((left, right) => {
      if (left.lastCheckedIn === null && right.lastCheckedIn === null) {
        return 0
      }
      if (left.lastCheckedIn === null) {
        return -1
      }
      if (right.lastCheckedIn === null) {
        return 1
      }
      return left.lastCheckedIn.localeCompare(right.lastCheckedIn)
    })

  return { kind: "ready", schools }
}
