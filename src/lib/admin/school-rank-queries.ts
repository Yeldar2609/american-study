import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const schoolRowSchema = z.object({
  city: z.string().nullable(),
  name: z.string(),
  niche_grade: z.string().nullable(),
  niche_rank: z.number().int().nullable(),
  school_id: z.string(),
  state: z.string().nullable(),
})

export type AdminSchoolRow = {
  readonly city: string | null
  readonly name: string
  readonly nicheGrade: string | null
  readonly nicheRank: number | null
  readonly schoolId: string
  readonly state: string | null
}

export type AdminSchoolsResult =
  | { readonly kind: "ready"; readonly schools: readonly AdminSchoolRow[] }
  | { readonly kind: "configuration" }
  | { readonly kind: "error" }

export async function getAdminSchools(): Promise<AdminSchoolsResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await supabase.rpc("admin_list_schools")
  if (error !== null) {
    return { kind: "error" }
  }

  const parsed = z.array(schoolRowSchema).safeParse(data)
  if (!parsed.success) {
    return { kind: "error" }
  }

  return {
    kind: "ready",
    schools: parsed.data.map((school) => ({
      city: school.city,
      name: school.name,
      nicheGrade: school.niche_grade,
      nicheRank: school.niche_rank,
      schoolId: school.school_id,
      state: school.state,
    })),
  }
}
