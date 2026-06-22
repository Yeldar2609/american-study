"use client"

import { useLocale, useTranslations } from "next-intl"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitConsultationLeadAction } from "@/lib/landing/lead-actions"
import { initialLeadFormState } from "@/lib/landing/lead-state"

const selectClassName =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-200"

export function ConsultationForm({ id = "consultation" }: { readonly id?: string }) {
  const t = useTranslations("form")
  const locale = useLocale()
  const [state, formAction, pending] = useActionState(
    submitConsultationLeadAction,
    initialLeadFormState,
  )

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20" id={id}>
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-[var(--elevation)] sm:p-10">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 text-lg leading-8 text-slate-600">{t("subtitle")}</p>
        {state.status === "success" ? (
          <div
            className="mt-8 rounded-2xl bg-emerald-50 p-5 text-base font-bold text-emerald-800"
            role="status"
          >
            {t("success")}
          </div>
        ) : (
          <form action={formAction} className="mt-8 grid gap-5">
            {state.status === "error" && (
              <div
                className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"
                role="status"
              >
                {t("error")}
              </div>
            )}
            <input name="locale" type="hidden" value={locale} />
            <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={`${id}-name`}>
              {t("name")}
              <Input autoComplete="name" id={`${id}-name`} name="name" required type="text" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={`${id}-phone`}>
              {t("phone")}
              <Input
                autoComplete="tel"
                defaultValue="+7"
                id={`${id}-phone`}
                name="phone"
                required
                type="tel"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={`${id}-email`}>
              {t("email")}
              <Input autoComplete="email" id={`${id}-email`} name="email" type="email" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor={`${id}-grade`}>
              {t("grade")}
              <select className={selectClassName} defaultValue="" id={`${id}-grade`} name="grade">
                <option disabled value="">
                  {t("gradePlaceholder")}
                </option>
                <option value="8">{t("grade8")}</option>
                <option value="9">{t("grade9")}</option>
                <option value="10">{t("grade10")}</option>
                <option value="11">{t("grade11")}</option>
                <option value="12">{t("grade12")}</option>
                <option value="other">{t("gradeOther")}</option>
              </select>
            </label>
            <p className="text-sm leading-6 text-slate-500">{t("consent")}</p>
            <Button className="w-full" disabled={pending} size="large" type="submit">
              {t("submit")}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
