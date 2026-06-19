"use server"

import type { Locale } from "@/i18n/routing"
import { createClient } from "@/lib/supabase/server"

export type PersistLanguageResult = { readonly kind: "ready" } | { readonly kind: "error" }

export async function persistUserLanguage(language: Locale): Promise<PersistLanguageResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "ready" }
  }

  const { data } = await supabase.auth.getUser()
  if (data.user === null) {
    return { kind: "ready" }
  }

  const { error } = await supabase.from("users").update({ language }).eq("id", data.user.id)

  return error === null ? { kind: "ready" } : { kind: "error" }
}
