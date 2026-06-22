import { getFormatter, getTranslations } from "next-intl/server"
import type { ReactNode } from "react"
import { getSchoolExtras, type SchoolExtras } from "@/lib/workspace/school-catalog"

type SchoolExtrasSectionProps = {
  readonly schoolId: string
  readonly studentId: string
}

// Renders the rich public profile facts beneath the school detail card. Each
// field/section is only shown when it carries a value, so an unconfigured school
// adds nothing to the page.
export async function SchoolExtrasSection({ schoolId, studentId }: SchoolExtrasSectionProps) {
  const extras = await getSchoolExtras(studentId, schoolId)
  if (extras === null || !hasContent(extras)) {
    return null
  }

  const t = await getTranslations("schools")
  const format = await getFormatter()

  const facts: ReadonlyArray<{ readonly key: string; readonly value: string }> = [
    ...(extras.foundedYear !== null
      ? [{ key: "foundedYear", value: String(extras.foundedYear) }]
      : []),
    ...(extras.headOfSchool ? [{ key: "headOfSchool", value: extras.headOfSchool }] : []),
    ...(extras.religiousAffiliation
      ? [{ key: "religious", value: extras.religiousAffiliation }]
      : []),
    ...(extras.studentTeacherRatio ? [{ key: "ratio", value: extras.studentTeacherRatio }] : []),
    ...(extras.avgClassSize !== null
      ? [{ key: "classSize", value: String(extras.avgClassSize) }]
      : []),
    ...(extras.facultyCount !== null
      ? [{ key: "faculty", value: String(extras.facultyCount) }]
      : []),
    ...(extras.avgSat !== null ? [{ key: "avgSat", value: String(extras.avgSat) }] : []),
    ...(extras.percentStudentsOfColor !== null
      ? [{ key: "studentsOfColor", value: `${extras.percentStudentsOfColor}%` }]
      : []),
    ...(extras.ibOffered !== null
      ? [{ key: "ib", value: extras.ibOffered ? t("detail.yes") : t("detail.no") }]
      : []),
    ...(extras.accreditation ? [{ key: "accreditation", value: extras.accreditation }] : []),
    ...(extras.athleticConference
      ? [{ key: "athleticConference", value: extras.athleticConference }]
      : []),
    ...(extras.campusAcres !== null ? [{ key: "campus", value: String(extras.campusAcres) }] : []),
    ...(extras.dormCount !== null ? [{ key: "dorms", value: String(extras.dormCount) }] : []),
    ...(extras.endowmentUsd !== null
      ? [
          {
            key: "endowment",
            value: format.number(extras.endowmentUsd, {
              currency: "USD",
              maximumFractionDigits: 1,
              notation: "compact",
              style: "currency",
            }),
          },
        ]
      : []),
    ...(extras.applicationFeeUsd !== null
      ? [
          {
            key: "applicationFee",
            value: format.number(extras.applicationFeeUsd, {
              currency: "USD",
              maximumFractionDigits: 0,
              style: "currency",
            }),
          },
        ]
      : []),
  ]

  const chipLists: ReadonlyArray<{ readonly items: readonly string[]; readonly key: string }> = [
    { items: extras.apCourses, key: "apCourses" },
    { items: extras.languagesOffered, key: "languages" },
    { items: extras.clubs, key: "clubs" },
    { items: extras.sports, key: "sports" },
    { items: extras.extracurriculars, key: "extracurriculars" },
  ]

  const textBlocks: ReadonlyArray<{ readonly key: string; readonly value: string | null }> = [
    { key: "collegeMatriculation", value: extras.collegeMatriculation },
    { key: "notableAlumni", value: extras.notableAlumni },
    { key: "financialAid", value: extras.financialAidNotes },
  ]
  const presentTextBlocks = textBlocks.filter((block) => block.value && block.value.length > 0)

  return (
    <div className="mt-8 border-t border-slate-100 pt-8">
      {extras.about && (
        <div>
          <h2 className="text-xl font-black text-slate-950">{t("detail.about")}</h2>
          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">{extras.about}</p>
        </div>
      )}

      {facts.length > 0 && (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((fact) => (
            <div className="rounded-2xl border border-slate-100 p-4" key={fact.key}>
              <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
                {t(`detail.fields.${fact.key}`)}
              </dt>
              <dd className="mt-1 font-black text-slate-900">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {chipLists.some((list) => list.items.length > 0) && (
        <div className="mt-6 grid gap-5">
          {chipLists.map((list) =>
            list.items.length === 0 ? null : (
              <ChipList items={list.items} key={list.key} label={t(`detail.${list.key}`)} />
            ),
          )}
        </div>
      )}

      {presentTextBlocks.length > 0 && (
        <div className="mt-6 grid gap-5">
          {presentTextBlocks.map((block) => (
            <TextBlock
              key={block.key}
              label={t(`detail.${block.key}`)}
              value={block.value as string}
            />
          ))}
        </div>
      )}

      {(extras.admissionsEmail || extras.admissionsPhone) && (
        <div className="mt-6">
          <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">
            {t("detail.admissions")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-4">
            {extras.admissionsEmail && (
              <ContactLink
                href={`mailto:${extras.admissionsEmail}`}
                label={t("detail.email")}
                value={extras.admissionsEmail}
              />
            )}
            {extras.admissionsPhone && (
              <ContactLink
                href={`tel:${extras.admissionsPhone}`}
                label={t("detail.phone")}
                value={extras.admissionsPhone}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ChipList({ items, label }: { readonly items: readonly string[]; readonly label: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
            key={item}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function TextBlock({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-700">{value}</p>
    </div>
  )
}

function ContactLink({
  href,
  label,
  value,
}: {
  readonly href: string
  readonly label: string
  readonly value: string
}): ReactNode {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <a className="text-sm font-black text-blue-700" href={href}>
        {value}
      </a>
    </div>
  )
}

function hasContent(extras: SchoolExtras): boolean {
  return (
    extras.about !== null ||
    extras.accreditation !== null ||
    extras.admissionsEmail !== null ||
    extras.admissionsPhone !== null ||
    extras.apCourses.length > 0 ||
    extras.applicationFeeUsd !== null ||
    extras.athleticConference !== null ||
    extras.avgClassSize !== null ||
    extras.avgSat !== null ||
    extras.campusAcres !== null ||
    extras.clubs.length > 0 ||
    extras.collegeMatriculation !== null ||
    extras.dormCount !== null ||
    extras.endowmentUsd !== null ||
    extras.extracurriculars.length > 0 ||
    extras.facultyCount !== null ||
    extras.financialAidNotes !== null ||
    extras.foundedYear !== null ||
    extras.headOfSchool !== null ||
    extras.ibOffered !== null ||
    extras.languagesOffered.length > 0 ||
    extras.notableAlumni !== null ||
    extras.percentStudentsOfColor !== null ||
    extras.religiousAffiliation !== null ||
    extras.sports.length > 0 ||
    extras.studentTeacherRatio !== null
  )
}
