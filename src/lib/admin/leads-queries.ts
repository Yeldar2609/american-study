import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const leadRowSchema = z.object({
  created_at: z.string(),
  email: z.string().nullable(),
  full_name: z.string(),
  grade: z.string().nullable(),
  handled: z.boolean(),
  id: z.string(),
  locale: z.string(),
  phone: z.string(),
  source: z.string().nullable(),
})

export type ConsultationLead = {
  readonly createdAt: string
  readonly email: string | null
  readonly fullName: string
  readonly grade: string | null
  readonly handled: boolean
  readonly id: string
  readonly locale: string
  readonly phone: string
  readonly source: string | null
}

export type ConsultationLeadsResult =
  | { readonly kind: "ready"; readonly leads: readonly ConsultationLead[] }
  | { readonly kind: "configuration" }
  | { readonly kind: "error" }

export async function getConsultationLeads(): Promise<ConsultationLeadsResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await supabase
    .from("consultation_leads")
    .select("id,full_name,phone,email,grade,locale,source,handled,created_at")
    .order("created_at", { ascending: false })
  if (error !== null) {
    return { kind: "error" }
  }

  const parsed = z.array(leadRowSchema).safeParse(data)
  if (!parsed.success) {
    return { kind: "error" }
  }

  return {
    kind: "ready",
    leads: parsed.data.map((lead) => ({
      createdAt: lead.created_at,
      email: lead.email,
      fullName: lead.full_name,
      grade: lead.grade,
      handled: lead.handled,
      id: lead.id,
      locale: lead.locale,
      phone: lead.phone,
      source: lead.source,
    })),
  }
}
