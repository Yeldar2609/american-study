"use client"

import { useTranslations } from "next-intl"
import { StudentFormField } from "@/components/admin/student-form-field"
import type { AdminStudentProfile } from "@/lib/admin/student-profile-query"

type StudentProfileFieldsProps = {
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>
  readonly profile: AdminStudentProfile
}

const selectClassName =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

export function StudentProfileFields({ fieldErrors, profile }: StudentProfileFieldsProps) {
  const t = useTranslations("adminStudents")
  const fieldError = (name: string) => {
    const code = fieldErrors[name]?.[0]
    return code === undefined ? undefined : t(`errors.${code}`)
  }
  const score = (name: string) => profile.testScores[name]?.toString() ?? ""

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StudentFormField
        defaultValue={profile.fullName}
        error={fieldError("studentFullName")}
        label={t("fields.studentFullName")}
        name="studentFullName"
        required
      />
      <StudentFormField
        defaultValue={profile.email}
        error={fieldError("studentEmail")}
        label={t("fields.studentEmail")}
        name="studentEmail"
        required
        type="email"
      />
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        {t("fields.studentLanguage")}
        <select className={selectClassName} defaultValue={profile.language} name="studentLanguage">
          <option value="en">{t("options.english")}</option>
          <option value="ru">{t("options.russian")}</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        {t("fields.stage")}
        <select className={selectClassName} defaultValue={profile.stage} name="stage">
          {["diagnostic", "trial", "list_building", "finalized", "application", "submitted"].map(
            (stage) => (
              <option key={stage} value={stage}>
                {t(`stages.${stage}`)}
              </option>
            ),
          )}
        </select>
      </label>
      <StudentFormField
        defaultValue={profile.dob ?? ""}
        label={t("fields.dob")}
        name="dob"
        type="date"
      />
      <StudentFormField
        defaultValue={profile.phone ?? ""}
        label={t("fields.phone")}
        name="phone"
        type="tel"
      />
      <StudentFormField
        defaultValue={profile.address ?? ""}
        label={t("fields.address")}
        name="address"
      />
      <StudentFormField
        defaultValue={profile.currentSchool ?? ""}
        label={t("fields.currentSchool")}
        name="currentSchool"
      />
      <StudentFormField
        defaultValue={profile.currentGrade ?? ""}
        label={t("fields.currentGrade")}
        name="currentGrade"
      />
      <StudentFormField
        defaultValue={profile.englishLevel ?? ""}
        label={t("fields.englishLevel")}
        name="englishLevel"
      />
      <StudentFormField
        defaultValue={profile.parentEmail ?? ""}
        error={fieldError("parentEmail")}
        label={t("fields.parentEmail")}
        name="parentEmail"
        type="email"
      />
      <StudentFormField
        defaultValue={profile.parentPhone ?? ""}
        label={t("fields.parentPhone")}
        name="parentPhone"
        type="tel"
      />
      <StudentFormField
        defaultValue={profile.interests.join(", ")}
        label={t("fields.interests")}
        name="interests"
      />
      <StudentFormField
        defaultValue={score("toefl")}
        label={t("fields.toefl")}
        max={120}
        min={0}
        name="toefl"
        type="number"
      />
      <StudentFormField
        defaultValue={score("ssat")}
        label={t("fields.ssat")}
        max={2400}
        min={0}
        name="ssat"
        type="number"
      />
      <StudentFormField
        defaultValue={score("det")}
        label={t("fields.det")}
        max={160}
        min={10}
        name="det"
        type="number"
      />
      <StudentFormField
        defaultValue={profile.prefStateOrRegion ?? ""}
        label={t("fields.prefState")}
        name="prefStateOrRegion"
      />
      <StudentFormField
        defaultValue={profile.passportIdDriveUrl ?? ""}
        error={fieldError("passportIdDriveUrl")}
        label={t("fields.passportUrl")}
        name="passportIdDriveUrl"
        type="url"
      />
      <StudentFormField
        defaultValue={profile.driveFolderUrl ?? ""}
        error={fieldError("driveFolderUrl")}
        label={t("fields.folderUrl")}
        name="driveFolderUrl"
        type="url"
      />
      <ProfileSelect
        label={t("fields.aidNeed")}
        name="aidNeedLevel"
        options={["low", "medium", "high"]}
        value={profile.aidNeedLevel}
      />
      <ProfileSelect
        label={t("fields.prefSize")}
        name="prefSize"
        options={["small", "medium", "large"]}
        value={profile.prefSize}
      />
      <ProfileSelect
        label={t("fields.prefSetting")}
        name="prefSetting"
        options={["urban", "suburban", "rural"]}
        value={profile.prefSetting}
      />
      <label className="grid gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
        {t("fields.diagnosticSummary")}
        <textarea
          className={`${selectClassName} min-h-36 py-3`}
          defaultValue={profile.diagnosticSummary ?? ""}
          name="diagnosticSummary"
        />
      </label>
    </div>
  )
}

type ProfileSelectProps = {
  readonly label: string
  readonly name: string
  readonly options: readonly string[]
  readonly value: string | null
}

function ProfileSelect({ label, name, options, value }: ProfileSelectProps) {
  const t = useTranslations("adminStudents")
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <select className={selectClassName} defaultValue={value ?? ""} name={name}>
        <option value="">{t("options.notSet")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(`options.${option}`)}
          </option>
        ))}
      </select>
    </label>
  )
}
