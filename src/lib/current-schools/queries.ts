import { z } from "zod"
import type { CurrentSchoolOption } from "@/lib/current-schools/options"
import { createClient } from "@/lib/supabase/server"

const currentSchoolSchema = z.object({
  city: z.string().nullable(),
  code: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  region: z.string().nullable(),
})

// Active catalog entries for the picker. Returns [] when Supabase is
// unconfigured or the query fails — the picker degrades to its free-text
// fallback rather than crashing the form.
export async function getCurrentSchoolOptions(): Promise<readonly CurrentSchoolOption[]> {
  const supabase = await createClient()
  if (supabase === null) {
    return []
  }
  const { data, error } = await supabase
    .from("current_schools")
    .select("id,name,city,region,code")
    .eq("active", true)
    .order("name", { ascending: true })
  if (error !== null || data === null) {
    return []
  }
  const parsed = z.array(currentSchoolSchema).safeParse(data)
  return parsed.success ? parsed.data : []
}
