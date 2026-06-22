"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const rankSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    if (value === "") {
      return
    }
    if (!/^\d+$/.test(value) || Number.parseInt(value, 10) < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Rank must be a positive integer" })
    }
  })
  .transform((value) => (value === "" ? null : Number.parseInt(value, 10)))

const setRankSchema = z.object({
  locale: z.enum(["en", "ru", "kk"]),
  rank: rankSchema,
  schoolId: z.string().uuid(),
})

export async function setSchoolRankAction(formData: FormData): Promise<void> {
  const parsed = setRankSchema.safeParse({
    locale: formData.get("locale"),
    rank: formData.get("rank"),
    schoolId: formData.get("schoolId"),
  })
  if (!parsed.success) {
    return
  }

  await requireRole(parsed.data.locale, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  await supabase.rpc("admin_set_school_rank", {
    new_rank: parsed.data.rank,
    target_school_id: parsed.data.schoolId,
  })

  revalidatePath(`/${parsed.data.locale}/app/admin`)
}
