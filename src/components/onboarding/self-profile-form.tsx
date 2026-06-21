"use client"

import { useTranslations } from "next-intl"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { studentUpdateSelfAction } from "@/lib/workspace/self-profile-actions"
import type { StudentSelf, TestField } from "@/lib/workspace/self-profile-data"
import { initialSelfProfileState } from "@/lib/workspace/self-profile-state"

const inputClass = "min-h-11 rounded-xl border border-slate-200 px-3"
const TESTS: readonly TestField[] = ["toefl", "ssat", "det"]

export function SelfProfileForm({
  locale,
  mode,
  self,
}: {
  readonly locale: string
  readonly mode: "onboarding" | "edit"
  readonly self: StudentSelf
}) {
  const t = useTranslations("onboarding")
  const action = studentUpdateSelfAction.bind(null, locale)
  const [state, formAction, pending] = useActionState(action, initialSelfProfileState)

  return (
    <Card className={mode === "onboarding" ? "border-blue-200 bg-blue-50/40 p-6" : "p-6"}>
      <p className="text-sm font-bold text-blue-700">
        {mode === "onboarding" ? t("eyebrow") : t("editEyebrow")}
      </p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">
        {mode === "onboarding" ? t("title", { name: self.fullName }) : t("editTitle")}
      </h2>
      <p className="mt-2 max-w-2xl leading-7 text-slate-600">
        {mode === "onboarding" ? t("intro") : t("editIntro")}
      </p>

      <form action={formAction} className="mt-5 grid gap-4">
        {mode === "onboarding" && <input name="complete" type="hidden" value="true" />}

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("interests")}
          <input className={inputClass} defaultValue={self.interests.join(", ")} name="interests" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            {t("englishLevel")}
            <input className={inputClass} defaultValue={self.englishLevel} name="englishLevel" />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            {t("prefState")}
            <input
              className={inputClass}
              defaultValue={self.prefStateOrRegion}
              name="prefStateOrRegion"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            {t("prefSetting")}
            <select className={inputClass} defaultValue={self.prefSetting} name="prefSetting">
              <option value="">{t("notSet")}</option>
              <option value="urban">{t("setting.urban")}</option>
              <option value="suburban">{t("setting.suburban")}</option>
              <option value="rural">{t("setting.rural")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            {t("prefSize")}
            <select className={inputClass} defaultValue={self.prefSize} name="prefSize">
              <option value="">{t("notSet")}</option>
              <option value="small">{t("size.small")}</option>
              <option value="medium">{t("size.medium")}</option>
              <option value="large">{t("size.large")}</option>
            </select>
          </label>
        </div>

        <fieldset className="grid gap-3">
          <legend className="text-sm font-black uppercase tracking-wide text-blue-700">
            {t("testPrep")}
          </legend>
          {TESTS.map((test) => (
            <div className="grid gap-3 sm:grid-cols-[6rem_1fr_1fr] sm:items-end" key={test}>
              <span className="text-sm font-bold text-slate-700">{t(`test.${test}`)}</span>
              <label className="grid gap-1 text-xs font-bold text-slate-500">
                {t("targetScore")}
                <input
                  className={inputClass}
                  defaultValue={self.testTargets[test]}
                  inputMode="numeric"
                  name={`${test}Target`}
                />
              </label>
              <label className="grid gap-1 text-xs font-bold text-slate-500">
                {t("testDate")}
                <input
                  className={inputClass}
                  defaultValue={self.testDates[test]}
                  name={`${test}Date`}
                  type="date"
                />
              </label>
            </div>
          ))}
        </fieldset>

        <div className="flex items-center gap-3">
          <Button disabled={pending} type="submit">
            {pending ? t("saving") : mode === "onboarding" ? t("finish") : t("save")}
          </Button>
          {state.status === "saved" && (
            <span className="text-sm font-bold text-emerald-700">{t("saved")}</span>
          )}
          {state.status === "error" && (
            <span className="text-sm font-bold text-red-700">{t("error")}</span>
          )}
        </div>
      </form>
    </Card>
  )
}
