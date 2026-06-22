"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireRole } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const setHandledSchema = z.object({
  handled: z.enum(["true", "false"]).transform((value) => value === "true"),
  leadId: z.string().uuid(),
  locale: z.enum(["en", "ru", "kk"]),
})

export async function setLeadHandledAction(formData: FormData): Promise<void> {
  const parsed = setHandledSchema.safeParse({
    handled: formData.get("handled"),
    leadId: formData.get("leadId"),
    locale: formData.get("locale"),
  })
  if (!parsed.success) {
    return
  }

  await requireRole(parsed.data.locale, "admin")

  const supabase = await createClient()
  if (supabase === null) {
    return
  }

  await supabase.rpc("admin_set_lead_handled", {
    new_handled: parsed.data.handled,
    target_lead_id: parsed.data.leadId,
  })

  revalidatePath(`/${parsed.data.locale}/app/admin`)
}
