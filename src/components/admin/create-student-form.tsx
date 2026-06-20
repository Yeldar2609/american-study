"use client"

import { useTranslations } from "next-intl"
import { useActionState } from "react"
import { StudentFormField } from "@/components/admin/student-form-field"
import { CurrentSchoolPicker } from "@/components/current-schools/current-school-picker"
import { Button } from "@/components/ui/button"
import { initialAdminStudentActionState } from "@/lib/admin/student-action-state"
import { createStudentAction } from "@/lib/admin/student-actions"
import type { CurrentSchoolOption } from "@/lib/current-schools/options"

type CreateStudentFormProps = {
  readonly locale: string
  readonly currentSchools: readonly CurrentSchoolOption[]
}

const selectClassName =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

export function CreateStudentForm({ currentSchools, locale }: CreateStudentFormProps) {
  const t = useTranslations("adminStudents")
  const action = createStudentAction.bind(null, locale)
  const [actionState, formAction, pending] = useActionState(action, initialAdminStudentActionState)
  const state = actionState ?? initialAdminStudentActionState
  const fieldError = (name: string) => {
    const code = state.fieldErrors[name]?.[0]
    return code === undefined ? undefined : t(`errors.${code}`)
  }

  return (
    <form action={formAction} className="grid gap-6">
      {state.message !== "none" && (
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
      <div className="grid gap-4 sm:grid-cols-2">
        <StudentFormField
          autoComplete="name"
          error={fieldError("studentFullName")}
          label={t("fields.studentFullName")}
          name="studentFullName"
          required
        />
        <StudentFormField
          autoComplete="email"
          error={fieldError("studentEmail")}
          label={t("fields.studentEmail")}
          name="studentEmail"
          required
          type="email"
        />
        <StudentFormField
          error={fieldError("studentPassword")}
          label={t("fields.studentPassword")}
          minLength={12}
          name="studentPassword"
          required
          type="password"
        />
      </div>

      <details className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <summary className="cursor-pointer font-black text-blue-900">{t("parentSection")}</summary>
        <p className="mt-2 text-sm leading-6 text-blue-900/70">{t("parentHint")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <StudentFormField
            error={fieldError("parentFullName")}
            label={t("fields.parentFullName")}
            name="parentFullName"
          />
          <StudentFormField
            error={fieldError("parentEmail")}
            label={t("fields.parentEmail")}
            name="parentEmail"
            type="email"
          />
          <StudentFormField
            error={fieldError("parentPassword")}
            label={t("fields.parentPassword")}
            minLength={12}
            name="parentPassword"
            type="password"
          />
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            {t("fields.parentLanguage")}
            <select className={selectClassName} defaultValue="ru" name="parentLanguage">
              <option value="">{t("options.notSet")}</option>
              <option value="en">{t("options.english")}</option>
              <option value="ru">{t("options.russian")}</option>
              <option value="kk">{t("options.kazakh")}</option>
            </select>
          </label>
        </div>
      </details>

      <details className="rounded-2xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer font-black text-slate-950">
          {t("profileSection")}
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <StudentFormField label={t("fields.dob")} name="dob" type="date" />
          <StudentFormField label={t("fields.phone")} name="phone" type="tel" />
          <StudentFormField label={t("fields.address")} name="address" />
          <CurrentSchoolPicker label={t("fields.currentSchool")} options={currentSchools} />
          <StudentFormField label={t("fields.currentGrade")} name="currentGrade" />
          <StudentFormField label={t("fields.englishLevel")} name="englishLevel" />
          <StudentFormField label={t("fields.parentPhone")} name="parentPhone" type="tel" />
          <StudentFormField label={t("fields.interests")} name="interests" />
          <StudentFormField
            label={t("fields.toefl")}
            max={120}
            min={0}
            name="toefl"
            type="number"
          />
          <StudentFormField label={t("fields.ssat")} max={2400} min={0} name="ssat" type="number" />
          <StudentFormField label={t("fields.det")} max={160} min={10} name="det" type="number" />
          <StudentFormField label={t("fields.prefState")} name="prefStateOrRegion" />
          <StudentFormField
            error={fieldError("passportIdDriveUrl")}
            label={t("fields.passportUrl")}
            name="passportIdDriveUrl"
            type="url"
          />
          <StudentFormField
            error={fieldError("driveFolderUrl")}
            label={t("fields.folderUrl")}
            name="driveFolderUrl"
            type="url"
          />
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            {t("fields.aidNeed")}
            <select className={selectClassName} defaultValue="" name="aidNeedLevel">
              <option value="">{t("options.notSet")}</option>
              <option value="low">{t("options.low")}</option>
              <option value="medium">{t("options.medium")}</option>
              <option value="high">{t("options.high")}</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            {t("fields.prefSize")}
            <select className={selectClassName} defaultValue="" name="prefSize">
              <option value="">{t("options.notSet")}</option>
              <option value="small">{t("options.small")}</option>
              <option value="medium">{t("options.medium")}</option>
              <option value="large">{t("options.large")}</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            {t("fields.prefSetting")}
            <select className={selectClassName} defaultValue="" name="prefSetting">
              <option value="">{t("options.notSet")}</option>
              <option value="urban">{t("options.urban")}</option>
              <option value="suburban">{t("options.suburban")}</option>
              <option value="rural">{t("options.rural")}</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            {t("fields.packageState")}
            <select className={selectClassName} defaultValue="trial" name="packageState">
              <option value="trial">{t("options.trial")}</option>
              <option value="paid">{t("options.paid")}</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            {t("fields.stage")}
            <select className={selectClassName} defaultValue="diagnostic" name="stage">
              {[
                "diagnostic",
                "trial",
                "list_building",
                "finalized",
                "application",
                "submitted",
              ].map((stage) => (
                <option key={stage} value={stage}>
                  {t(`stages.${stage}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
            {t("fields.diagnosticSummary")}
            <textarea className={`${selectClassName} min-h-32 py-3`} name="diagnosticSummary" />
          </label>
        </div>
      </details>

      <Button className="w-full sm:w-fit" disabled={pending} size="large" type="submit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  )
}
