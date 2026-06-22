"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/navigation"
import { updateSchoolAction } from "@/lib/admin/school-edit-actions"
import type { AdminSchool } from "@/lib/admin/school-edit-queries"

const selectClassName =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
const textareaClassName = `${selectClassName} min-h-28 py-3`

type SchoolEditorProps = {
  readonly backHref: string
  readonly locale: string
  readonly school: AdminSchool
}

export function SchoolEditor({ backHref, locale, school }: SchoolEditorProps) {
  const t = useTranslations("schoolEdit")

  return (
    <section className="mt-8 space-y-6">
      <div className="space-y-2">
        <Link
          className="inline-flex min-h-11 items-center text-sm font-black text-blue-700"
          href={backHref}
        >
          {t("back")}
        </Link>
        <h1 className="text-3xl font-black text-slate-950">{school.name}</h1>
        <p className="max-w-2xl leading-7 text-slate-600">{t("intro")}</p>
      </div>

      <form action={updateSchoolAction} className="space-y-6">
        <input name="locale" type="hidden" value={locale} />
        <input name="schoolId" type="hidden" value={school.id} />

        <Group title={t("groups.basics")}>
          <SelectField
            label={t("fields.setting")}
            name="setting"
            options={["urban", "suburban", "rural"]}
            optionsNamespace="settings"
            value={school.setting}
          />
          <SelectField
            label={t("fields.studentBody")}
            name="studentBody"
            options={["coed", "boys", "girls"]}
            optionsNamespace="bodies"
            value={school.studentBody}
          />
          <TextField
            label={t("fields.affiliation")}
            name="affiliation"
            value={school.affiliation}
          />
          <TextField
            label={t("fields.religiousAffiliation")}
            name="religiousAffiliation"
            value={school.religiousAffiliation}
          />
          <TextField label={t("fields.grades")} name="grades" value={school.grades} />
          <NumberField
            label={t("fields.foundedYear")}
            name="foundedYear"
            value={school.foundedYear}
          />
          <TextField
            label={t("fields.accreditation")}
            name="accreditation"
            value={school.accreditation}
          />
        </Group>

        <Group title={t("groups.size")}>
          <NumberField label={t("fields.enrollment")} name="enrollment" value={school.enrollment} />
          <NumberField
            label={t("fields.avgClassSize")}
            name="avgClassSize"
            value={school.avgClassSize}
          />
          <TextField
            label={t("fields.studentTeacherRatio")}
            name="studentTeacherRatio"
            value={school.studentTeacherRatio}
          />
          <NumberField
            label={t("fields.campusAcres")}
            name="campusAcres"
            value={school.campusAcres}
          />
          <NumberField
            label={t("fields.boardingTuitionUsd")}
            name="boardingTuitionUsd"
            value={school.boardingTuitionUsd}
          />
          <NumberField
            label={t("fields.acceptanceRatePct")}
            name="acceptanceRatePct"
            step="0.01"
            value={school.acceptanceRatePct}
          />
          <NumberField
            label={t("fields.avgSsatPctile")}
            name="avgSsatPctile"
            step="0.01"
            value={school.avgSsatPctile}
          />
          <NumberField
            label={t("fields.pctBoarding")}
            name="pctBoarding"
            step="0.01"
            value={school.pctBoarding}
          />
          <NumberField
            label={t("fields.pctInternational")}
            name="pctInternational"
            step="0.01"
            value={school.pctInternational}
          />
          <CheckboxField
            checked={school.offersFinancialAid === true}
            label={t("fields.offersFinancialAid")}
            name="offersFinancialAid"
          />
          <TextareaField
            full
            label={t("fields.financialAidNotes")}
            name="financialAidNotes"
            value={school.financialAidNotes}
          />
        </Group>

        <Group title={t("groups.academics")}>
          <ArrayField label={t("fields.apCourses")} name="apCourses" values={school.apCourses} />
          <CheckboxField
            checked={school.ibOffered === true}
            label={t("fields.ibOffered")}
            name="ibOffered"
          />
          <ArrayField
            label={t("fields.languagesOffered")}
            name="languagesOffered"
            values={school.languagesOffered}
          />
          <ArrayField label={t("fields.clubs")} name="clubs" values={school.clubs} />
          <ArrayField label={t("fields.sports")} name="sports" values={school.sports} />
          <ArrayField
            label={t("fields.extracurriculars")}
            name="extracurriculars"
            values={school.extracurriculars}
          />
          <ArrayField label={t("fields.strengths")} name="strengths" values={school.strengths} />
        </Group>

        <Group title={t("groups.outcomes")}>
          <TextareaField
            full
            label={t("fields.collegeMatriculation")}
            name="collegeMatriculation"
            value={school.collegeMatriculation}
          />
          <TextareaField
            full
            label={t("fields.notableAlumni")}
            name="notableAlumni"
            value={school.notableAlumni}
          />
          <TextareaField full label={t("fields.about")} name="about" value={school.about} />
        </Group>

        <Group title={t("groups.links")}>
          <TextField
            label={t("fields.websiteUrl")}
            name="websiteUrl"
            type="url"
            value={school.websiteUrl}
          />
          <TextField
            label={t("fields.nicheProfileUrl")}
            name="nicheProfileUrl"
            type="url"
            value={school.nicheProfileUrl}
          />
        </Group>

        <Group title={t("groups.admissions")}>
          <TextField
            label={t("fields.admissionsEmail")}
            name="admissionsEmail"
            type="email"
            value={school.admissionsEmail}
          />
          <TextField
            label={t("fields.admissionsPhone")}
            name="admissionsPhone"
            type="tel"
            value={school.admissionsPhone}
          />
        </Group>

        <Group title={t("groups.ops")}>
          <NumberField
            label={t("fields.nicheRank")}
            min={1}
            name="nicheRank"
            value={school.nicheRank}
          />
          <CheckboxField
            checked={school.isPartner}
            label={t("fields.isPartner")}
            name="isPartner"
          />
          <TextField
            label={t("fields.lastCheckedIn")}
            name="lastCheckedIn"
            type="date"
            value={school.lastCheckedIn}
          />
        </Group>

        <Button size="large" type="submit">
          {t("save")}
        </Button>
      </form>
    </section>
  )
}

function Group({ children, title }: { readonly children: ReactNode; readonly title: string }) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  )
}

function FieldShell({
  children,
  full,
  label,
  name,
}: {
  readonly children: ReactNode
  readonly full?: boolean | undefined
  readonly label: string
  readonly name: string
}) {
  return (
    <label
      className={`grid gap-2 text-sm font-bold text-slate-700${full ? " sm:col-span-2" : ""}`}
      htmlFor={name}
    >
      {label}
      {children}
    </label>
  )
}

function TextField({
  label,
  name,
  type,
  value,
}: {
  readonly label: string
  readonly name: string
  readonly type?: string
  readonly value: string | null
}) {
  return (
    <FieldShell label={label} name={name}>
      <Input defaultValue={value ?? ""} id={name} name={name} type={type ?? "text"} />
    </FieldShell>
  )
}

function NumberField({
  label,
  min,
  name,
  step,
  value,
}: {
  readonly label: string
  readonly min?: number
  readonly name: string
  readonly step?: string
  readonly value: number | null
}) {
  return (
    <FieldShell label={label} name={name}>
      <Input
        defaultValue={value === null ? "" : String(value)}
        id={name}
        inputMode="decimal"
        min={min}
        name={name}
        step={step}
        type="number"
      />
    </FieldShell>
  )
}

function TextareaField({
  full,
  label,
  name,
  value,
}: {
  readonly full?: boolean | undefined
  readonly label: string
  readonly name: string
  readonly value: string | null
}) {
  return (
    <FieldShell full={full} label={label} name={name}>
      <textarea className={textareaClassName} defaultValue={value ?? ""} id={name} name={name} />
    </FieldShell>
  )
}

function ArrayField({
  label,
  name,
  values,
}: {
  readonly label: string
  readonly name: string
  readonly values: readonly string[]
}) {
  return (
    <FieldShell label={label} name={name}>
      <Input defaultValue={values.join(", ")} id={name} name={name} type="text" />
    </FieldShell>
  )
}

function CheckboxField({
  checked,
  label,
  name,
}: {
  readonly checked: boolean
  readonly label: string
  readonly name: string
}) {
  return (
    <label className="flex items-center gap-3 text-sm font-bold text-slate-700">
      <input
        className="size-5 rounded border-slate-300 text-blue-600 focus:ring-blue-200"
        defaultChecked={checked}
        name={name}
        type="checkbox"
      />
      {label}
    </label>
  )
}

function SelectField({
  label,
  name,
  options,
  optionsNamespace,
  value,
}: {
  readonly label: string
  readonly name: string
  readonly options: readonly string[]
  readonly optionsNamespace: string
  readonly value: string | null
}) {
  const t = useTranslations("schools")
  const none = useTranslations("schoolEdit")
  return (
    <FieldShell label={label} name={name}>
      <select className={selectClassName} defaultValue={value ?? ""} id={name} name={name}>
        <option value="">{none("notSet")}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(`${optionsNamespace}.${option}`)}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
