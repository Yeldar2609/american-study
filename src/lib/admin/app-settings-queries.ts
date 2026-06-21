import "server-only"

import { CALENDAR_BOOKING_LINK_KEY } from "@/lib/settings/app-settings"
import { createClient } from "@/lib/supabase/server"

export type AppSettingsResult =
  | { readonly kind: "ready"; readonly calendarBookingLink: string }
  | { readonly kind: "configuration" }
  | { readonly kind: "error" }

// Reads admin-editable settings for the settings panel. An empty booking link
// means none is stored yet, so the env default (if any) is in effect.
export async function getAppSettings(): Promise<AppSettingsResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", CALENDAR_BOOKING_LINK_KEY)
    .maybeSingle()
  if (error !== null) {
    return { kind: "error" }
  }

  const stored = (data as { readonly value?: string } | null)?.value
  return { calendarBookingLink: stored ?? "", kind: "ready" }
}
