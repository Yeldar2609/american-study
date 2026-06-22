import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const interestLevels = ["exploring", "interested", "shortlisted", "not_interested"] as const
export type SchoolInterestLevel = (typeof interestLevels)[number]

const catalogRowSchema = z.object({
  acceptance_rate_pct: z.coerce.number().nullable(),
  admin_pick: z.boolean(),
  affiliation: z.string().nullable(),
  avg_ssat_pctile: z.coerce.number().nullable(),
  boarding_tuition_usd: z.coerce.number().int().nonnegative().nullable(),
  city: z.string().nullable(),
  enrollment: z.coerce.number().int().nonnegative().nullable(),
  grades: z.string().nullable(),
  is_final_7: z.boolean(),
  match_percent: z.coerce.number().int().min(0).max(100),
  match_reason: z.string().nullable(),
  niche_grade: z.string().nullable(),
  niche_profile_url: z.url().nullable(),
  notes: z.string().nullable(),
  offers_financial_aid: z.boolean().nullable(),
  pct_boarding: z.coerce.number().nullable(),
  pct_international: z.coerce.number().nullable(),
  pick_id: z.uuid().nullable(),
  sao_deadline: z.string().nullable(),
  school_id: z.uuid(),
  school_name: z.string().min(1),
  setting: z.enum(["urban", "suburban", "rural"]).nullable(),
  starred: z.boolean(),
  state: z.string().nullable(),
  status: z.enum(["researching", "applied", "submitted"]),
  strengths: z.array(z.string()),
  student_body: z.enum(["coed", "boys", "girls"]).nullable(),
  student_interest_level: z.enum(interestLevels),
  student_note: z.string().nullable(),
  website_url: z.url().nullable(),
})

export type SchoolCatalogItem = {
  readonly acceptanceRate: number | null
  readonly adminPick: boolean
  readonly affiliation: string | null
  readonly avgSsatPctile: number | null
  readonly body: "coed" | "boys" | "girls" | null
  readonly city: string | null
  readonly enrollment: number | null
  readonly finalSeven: boolean
  readonly financialAid: boolean | null
  readonly grades: string | null
  readonly id: string
  readonly interestLevel: SchoolInterestLevel
  readonly matchPercent: number
  readonly matchReason: string | null
  readonly name: string
  readonly nicheGrade: string | null
  readonly nicheProfileUrl: string | null
  readonly notes: string | null
  readonly pctBoarding: number | null
  readonly pctInternational: number | null
  readonly setting: "urban" | "suburban" | "rural" | null
  readonly saoDeadline: string | null
  readonly starred: boolean
  readonly state: string | null
  readonly status: "researching" | "applied" | "submitted"
  readonly strengths: readonly string[]
  readonly studentNote: string | null
  readonly tuition: number | null
  readonly websiteUrl: string | null
}

export type SchoolCatalogFilters = {
  readonly aid?: string | undefined
  readonly body?: string | undefined
  readonly query?: string | undefined
  readonly setting?: string | undefined
  readonly state?: string | undefined
}

export function parseSchoolCatalog(value: unknown): readonly SchoolCatalogItem[] {
  return z
    .array(catalogRowSchema)
    .parse(value)
    .map((row) => ({
      acceptanceRate: row.acceptance_rate_pct,
      adminPick: row.admin_pick,
      affiliation: row.affiliation,
      avgSsatPctile: row.avg_ssat_pctile,
      body: row.student_body,
      city: row.city,
      enrollment: row.enrollment,
      finalSeven: row.is_final_7,
      financialAid: row.offers_financial_aid,
      grades: row.grades,
      id: row.school_id,
      interestLevel: row.student_interest_level,
      matchPercent: row.match_percent,
      matchReason: row.match_reason,
      name: row.school_name,
      nicheGrade: row.niche_grade,
      nicheProfileUrl: row.niche_profile_url,
      notes: row.notes,
      pctBoarding: row.pct_boarding,
      pctInternational: row.pct_international,
      setting: row.setting,
      saoDeadline: row.sao_deadline,
      starred: row.starred,
      state: row.state,
      status: row.status,
      strengths: row.strengths,
      studentNote: row.student_note,
      tuition: row.boarding_tuition_usd,
      websiteUrl: row.website_url,
    }))
}

export function filterSchoolCatalog(
  schools: readonly SchoolCatalogItem[],
  filters: SchoolCatalogFilters,
): readonly SchoolCatalogItem[] {
  const query = filters.query?.trim().toLocaleLowerCase() ?? ""
  return schools.filter((school) => {
    const searchable = [school.name, school.city, school.state, ...school.strengths]
      .filter((value) => value !== null)
      .join(" ")
      .toLocaleLowerCase()
    const aidMatches =
      !filters.aid ||
      (filters.aid === "yes" && school.financialAid === true) ||
      (filters.aid === "no" && school.financialAid === false)
    return (
      (query.length === 0 || searchable.includes(query)) &&
      (!filters.state || school.state === filters.state) &&
      (!filters.setting || school.setting === filters.setting) &&
      (!filters.body || school.body === filters.body) &&
      aidMatches
    )
  })
}

const schoolSummarySchema = z.object({
  next_deadline: z.string().nullable(),
  recommended_count: z.coerce.number().int().nonnegative(),
  saved_count: z.coerce.number().int().nonnegative(),
})

export type StudentSchoolSummary = {
  readonly nextDeadline: string | null
  readonly recommendedCount: number
  readonly savedCount: number
}

// Lightweight counts + next deadline for the dashboard card. Avoids the full
// catalog load (which computes a match score for every school) on the home page.
export async function getStudentSchoolSummary(
  studentId: string,
): Promise<{ kind: "ready"; summary: StudentSchoolSummary } | { kind: "configuration" | "error" }> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await supabase.rpc("get_student_school_summary", {
    target_student_id: studentId,
  })
  if (error !== null) {
    return { kind: "error" }
  }

  const row = Array.isArray(data) ? data[0] : data
  const parsed = schoolSummarySchema.safeParse(row)
  if (!parsed.success) {
    return { kind: "error" }
  }
  return {
    kind: "ready",
    summary: {
      nextDeadline: parsed.data.next_deadline,
      recommendedCount: parsed.data.recommended_count,
      savedCount: parsed.data.saved_count,
    },
  }
}

const schoolExtrasRowSchema = z.object({
  about: z.string().nullable(),
  accreditation: z.string().nullable(),
  admissions_email: z.string().nullable(),
  admissions_phone: z.string().nullable(),
  ap_courses: z.array(z.string()).nullable(),
  application_fee_usd: z.coerce.number().int().nullable(),
  athletic_conference: z.string().nullable(),
  avg_class_size: z.coerce.number().int().nullable(),
  avg_sat: z.coerce.number().int().nullable(),
  campus_acres: z.coerce.number().int().nullable(),
  clubs: z.array(z.string()).nullable(),
  college_matriculation: z.string().nullable(),
  dorm_count: z.coerce.number().int().nullable(),
  endowment_usd: z.coerce.number().int().nullable(),
  extracurriculars: z.array(z.string()).nullable(),
  faculty_count: z.coerce.number().int().nullable(),
  financial_aid_notes: z.string().nullable(),
  founded_year: z.coerce.number().int().nullable(),
  head_of_school: z.string().nullable(),
  ib_offered: z.boolean().nullable(),
  languages_offered: z.array(z.string()).nullable(),
  notable_alumni: z.string().nullable(),
  percent_students_of_color: z.coerce.number().int().nullable(),
  religious_affiliation: z.string().nullable(),
  sports: z.array(z.string()).nullable(),
  student_teacher_ratio: z.string().nullable(),
})

export type SchoolExtras = {
  readonly about: string | null
  readonly accreditation: string | null
  readonly admissionsEmail: string | null
  readonly admissionsPhone: string | null
  readonly apCourses: readonly string[]
  readonly applicationFeeUsd: number | null
  readonly athleticConference: string | null
  readonly avgClassSize: number | null
  readonly avgSat: number | null
  readonly campusAcres: number | null
  readonly clubs: readonly string[]
  readonly collegeMatriculation: string | null
  readonly dormCount: number | null
  readonly endowmentUsd: number | null
  readonly extracurriculars: readonly string[]
  readonly facultyCount: number | null
  readonly financialAidNotes: string | null
  readonly foundedYear: number | null
  readonly headOfSchool: string | null
  readonly ibOffered: boolean | null
  readonly languagesOffered: readonly string[]
  readonly notableAlumni: string | null
  readonly percentStudentsOfColor: number | null
  readonly religiousAffiliation: string | null
  readonly sports: readonly string[]
  readonly studentTeacherRatio: string | null
}

// On-demand public profile facts for the school detail page. Returns null when
// the RPC is unavailable or the school has no extras row — callers render
// nothing in that case. Admin-only fields (niche_rank/is_partner/
// last_checked_in) are never part of this RPC's contract.
export async function getSchoolExtras(
  studentId: string,
  schoolId: string,
): Promise<SchoolExtras | null> {
  const supabase = await createClient()
  if (supabase === null) {
    return null
  }

  const { data, error } = await supabase.rpc("get_school_extras", {
    target_school_id: schoolId,
    target_student_id: studentId,
  })
  if (error !== null) {
    return null
  }

  const row = Array.isArray(data) ? data[0] : data
  const parsed = schoolExtrasRowSchema.safeParse(row)
  if (!parsed.success) {
    return null
  }

  return {
    about: parsed.data.about,
    accreditation: parsed.data.accreditation,
    admissionsEmail: parsed.data.admissions_email,
    admissionsPhone: parsed.data.admissions_phone,
    apCourses: parsed.data.ap_courses ?? [],
    applicationFeeUsd: parsed.data.application_fee_usd,
    athleticConference: parsed.data.athletic_conference,
    avgClassSize: parsed.data.avg_class_size,
    avgSat: parsed.data.avg_sat,
    campusAcres: parsed.data.campus_acres,
    clubs: parsed.data.clubs ?? [],
    collegeMatriculation: parsed.data.college_matriculation,
    dormCount: parsed.data.dorm_count,
    endowmentUsd: parsed.data.endowment_usd,
    extracurriculars: parsed.data.extracurriculars ?? [],
    facultyCount: parsed.data.faculty_count,
    financialAidNotes: parsed.data.financial_aid_notes,
    foundedYear: parsed.data.founded_year,
    headOfSchool: parsed.data.head_of_school,
    ibOffered: parsed.data.ib_offered,
    languagesOffered: parsed.data.languages_offered ?? [],
    notableAlumni: parsed.data.notable_alumni,
    percentStudentsOfColor: parsed.data.percent_students_of_color,
    religiousAffiliation: parsed.data.religious_affiliation,
    sports: parsed.data.sports ?? [],
    studentTeacherRatio: parsed.data.student_teacher_ratio,
  }
}

const publicCollectionRowSchema = z.object({
  description: z.string().nullable(),
  id: z.string(),
  name: z.string(),
})

const publicMemberRowSchema = z.object({
  collection_id: z.string(),
  school_id: z.string(),
})

export type PublicCollection = {
  readonly description: string | null
  readonly id: string
  readonly name: string
  readonly schoolIds: readonly string[]
}

// Public collections any authenticated user can browse. RLS (migration 021)
// restricts both selects to is_public collections and their members, so this
// returns only the lists an admin has chosen to publish. Null-safe: an empty
// array on any misconfiguration or error, never throws.
export async function getPublicCollections(): Promise<readonly PublicCollection[]> {
  const supabase = await createClient()
  if (supabase === null) {
    return []
  }

  const { data: collectionData, error: collectionError } = await supabase
    .from("school_collections")
    .select("id,name,description")
    .eq("is_public", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (collectionError !== null) {
    return []
  }

  const parsedCollections = z.array(publicCollectionRowSchema).safeParse(collectionData)
  if (!parsedCollections.success) {
    return []
  }
  if (parsedCollections.data.length === 0) {
    return []
  }

  const { data: memberData, error: memberError } = await supabase
    .from("school_collection_members")
    .select("collection_id,school_id")
  if (memberError !== null) {
    return []
  }

  const parsedMembers = z.array(publicMemberRowSchema).safeParse(memberData)
  if (!parsedMembers.success) {
    return []
  }

  const schoolIdsByCollection = new Map<string, string[]>()
  for (const member of parsedMembers.data) {
    const existing = schoolIdsByCollection.get(member.collection_id)
    if (existing === undefined) {
      schoolIdsByCollection.set(member.collection_id, [member.school_id])
    } else {
      existing.push(member.school_id)
    }
  }

  return parsedCollections.data.map((collection) => ({
    description: collection.description,
    id: collection.id,
    name: collection.name,
    schoolIds: schoolIdsByCollection.get(collection.id) ?? [],
  }))
}

export async function getSchoolCatalog(studentId: string) {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" as const }
  }

  const { data, error } = await supabase.rpc("get_school_catalog", {
    target_student_id: studentId,
  })
  if (error !== null) {
    return { kind: "error" as const }
  }

  const parsed = z.array(catalogRowSchema).safeParse(data)
  return parsed.success
    ? { items: parseSchoolCatalog(parsed.data), kind: "ready" as const }
    : { kind: "error" as const }
}
