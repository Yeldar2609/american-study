import "server-only"

import { readPrivateEnv } from "@/lib/env"
import { CALENDAR_BOOKING_LINK_KEY, isValidBookingLink } from "@/lib/settings/app-settings"
import { createClient } from "@/lib/supabase/server"

// Resolve the booking link the app should use: the admin-managed value in
// public.app_settings wins, falling back to the CALENDAR_BOOKING_LINK env var.
// Returns undefined when neither source holds a valid https link.
export async function resolveCalendarBookingLink(): Promise<string | undefined> {
  const supabase = await createClient()
  if (supabase !== null) {
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", CALENDAR_BOOKING_LINK_KEY)
      .maybeSingle()
    const stored = (data as { readonly value?: string } | null)?.value
    if (stored !== undefined && isValidBookingLink(stored)) {
      return stored
    }
  }

  const fallback = readPrivateEnv().CALENDAR_BOOKING_LINK
  return fallback !== undefined && isValidBookingLink(fallback) ? fallback : undefined
}
