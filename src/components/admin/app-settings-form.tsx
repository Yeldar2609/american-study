"use client"

import { useTranslations } from "next-intl"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialAppSettingActionState } from "@/lib/admin/app-setting-action-state"
import { updateAppSettingsAction } from "@/lib/admin/app-settings-actions"

export function AppSettingsForm({
  calendarBookingLink,
  locale,
}: {
  readonly calendarBookingLink: string
  readonly locale: string
}) {
  const t = useTranslations("adminSettings")
  const action = updateAppSettingsAction.bind(null, locale)
  const [state, formAction, pending] = useActionState(action, initialAppSettingActionState)

  return (
    <form action={formAction} className="grid gap-4">
      {state.status !== "idle" && (
        <div
          className={
            state.status === "success"
              ? "rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"
              : "rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"
          }
          role="status"
        >
          {t(`messages.${state.message}`)}
        </div>
      )}
      <label
        className="grid gap-2 text-sm font-bold text-slate-700"
        htmlFor="calendar-booking-link"
      >
        {t("bookingLinkLabel")}
        <Input
          autoComplete="off"
          defaultValue={calendarBookingLink}
          id="calendar-booking-link"
          inputMode="url"
          name="calendarBookingLink"
          required
          type="url"
        />
      </label>
      <p className="text-sm leading-6 text-slate-600">{t("bookingLinkHint")}</p>
      <Button className="w-full sm:w-fit" disabled={pending} size="large" type="submit">
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  )
}
