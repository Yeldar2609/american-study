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
  student_shortlisted: z.boolean(),
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
  readonly shortlisted: boolean
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
      shortlisted: row.student_shortlisted,
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
