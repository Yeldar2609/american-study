"use server"

import type { LeadFormState } from "@/lib/landing/lead-state"
import { createClient } from "@/lib/supabase/server"

export async function submitConsultationLeadAction(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const name = String(formData.get("name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const grade = String(formData.get("grade") ?? "").trim()
  const locale = String(formData.get("locale") ?? "ru").trim()

  const supabase = await createClient()
  if (supabase === null) {
    return { status: "error" }
  }

  const { error } = await supabase.rpc("submit_consultation_lead", {
    lead_email: email === "" ? null : email,
    lead_grade: grade === "" ? null : grade,
    lead_locale: locale === "" ? "ru" : locale,
    lead_name: name,
    lead_phone: phone,
  })

  return error === null ? { status: "success" } : { status: "error" }
}
