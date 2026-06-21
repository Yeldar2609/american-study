"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { AppSettingActionState } from "@/lib/admin/app-setting-action-state"
import { requireRole } from "@/lib/auth/session"
import { CALENDAR_BOOKING_LINK_KEY, isValidBookingLink } from "@/lib/settings/app-settings"
import { createClient } from "@/lib/supabase/server"

const schema = z.object({
  calendarBookingLink: z.string().trim().max(2048).refine(isValidBookingLink),
})

export async function updateAppSettingsAction(
  locale: string,
  _previous: AppSettingActionState,
  formData: FormData,
): Promise<AppSettingActionState> {
  await requireRole(locale, "admin")

  const parsed = schema.safeParse({
    calendarBookingLink: formData.get("calendarBookingLink"),
  })
  if (!parsed.success) {
    return { message: "invalid", status: "error" }
  }

  const supabase = await createClient()
  if (supabase === null) {
    return { message: "configuration", status: "error" }
  }

  const { error } = await supabase.rpc("admin_set_app_setting", {
    setting_key: CALENDAR_BOOKING_LINK_KEY,
    setting_value: parsed.data.calendarBookingLink,
  })
  if (error !== null) {
    return { message: "unexpected", status: "error" }
  }

  revalidatePath(`/${locale}/app/admin`)
  return { message: "saved", status: "success" }
}
