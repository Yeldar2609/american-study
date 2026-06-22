import { GraduationCap, Sparkles, Star } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { ReactNode } from "react"
import {
  type ComparableSchool,
  CompareProvider,
} from "@/components/schools/compare/compare-context"
import { SchoolComparison } from "@/components/schools/compare/school-comparison"
import { SchoolCard } from "@/components/schools/school-card"
import { SchoolDetail } from "@/components/schools/school-detail"
import { SchoolFilters } from "@/components/schools/school-filters"
import { SchoolSearch } from "@/components/schools/school-search"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"
import {
  filterSchoolCatalog,
  getSchoolCatalog,
  type SchoolCatalogFilters,
  type SchoolCatalogItem,
} from "@/lib/workspace/school-catalog"

type SchoolsWorkspaceProps = {
  readonly data: DashboardDataResult
  readonly filters: SchoolCatalogFilters
  readonly locale: string
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
  readonly selectedSchoolId?: string | undefined
}

function toComparable(school: SchoolCatalogItem): ComparableSchool {
  return {
    body: school.body,
    city: school.city,
    enrollment: school.enrollment,
    financialAid: school.financialAid,
    id: school.id,
    matchPercent: school.matchPercent,
    name: school.name,
    saoDeadline: school.saoDeadline,
    setting: school.setting,
    starred: school.starred,
    state: school.state,
    status: school.status,
    strengths: school.strengths,
    tuition: school.tuition,
  }
}

export async function SchoolsWorkspace({
  data,
  filters,
  locale,
  role,
  selectedSchoolId,
  selectedStudentId,
}: SchoolsWorkspaceProps) {
  const t = await getTranslations("schools")
  if (data.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }

  const access = resolveWorkspaceAccess(data.students, selectedStudentId, false)
  switch (access.kind) {
    case "empty":
    case "not_found":
      return <WorkspaceMessage body={t(`empty.${access.kind}`)} title={t("title")} />
    case "locked":
      return <WorkspaceMessage body={t("waiting.body")} title={t("waiting.title")} />
    case "ready":
      break
  }

  const result = await getSchoolCatalog(access.studentId)
  if (result.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }

  const items = result.items
  const recipientName = data.students.find((student) => student.id === access.studentId)?.name ?? ""
  const studentParam = selectedStudentId ? `&student=${selectedStudentId}` : ""
  const sectionBase = `/app/${role}?section=schools${studentParam}`
  const roadmapHref = `/app/${role}?section=roadmap${studentParam}`
  const unlocked = access.packageState === "paid" || role === "admin"

  // Detail view — focused single school. Trial students only have recommended
  // schools in their catalog, so they can only open details for those.
  if (selectedSchoolId !== undefined) {
    const school = items.find((candidate) => candidate.id === selectedSchoolId)
    if (school !== undefined) {
      return (
        <SchoolDetail
          backHref={sectionBase}
          locale={locale}
          roadmapHref={roadmapHref}
          role={role}
          school={school}
          showBreakdown={unlocked}
          studentId={access.studentId}
        />
      )
    }
  }

  const recommended = items.filter((school) => school.adminPick)
  const finalList = items.filter((school) => school.finalSeven)
  const allFiltered = filterSchoolCatalog(items, filters)
  const states = [
    ...new Set(items.flatMap((school) => (school.state ? [school.state] : []))),
  ].toSorted()
  const comparableItems = items.map(toComparable)

  const card = (school: SchoolCatalogItem) => (
    <SchoolCard
      detailHref={`${sectionBase}&school=${school.id}`}
      key={school.id}
      locale={locale}
      role={role}
      school={school}
      showBreakdown={unlocked}
      studentId={access.studentId}
      studentName={recipientName}
    />
  )

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
            {t(access.packageState === "trial" ? "packageTrial" : "packagePaid")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{t("studentTitle")}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">{t("studentSubtitle")}</p>
          <p className="mt-3 font-bold text-blue-700">
            {t(
              access.packageState === "trial"
                ? recommended.length === 0
                  ? "next.trialWaiting"
                  : "next.trialReview"
                : "next.paidBrowse",
            )}
          </p>
        </div>
        {(role === "admin" || data.students.length > 1) && (
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend
              className={
                role === "admin"
                  ? "mb-1 w-full text-sm font-extrabold uppercase tracking-wide text-blue-700"
                  : "sr-only"
              }
            >
              {role === "admin" ? t("recipientLabel") : t("studentPicker")}
            </legend>
            {data.students.map((student) => (
              <Link
                aria-current={student.id === access.studentId ? "true" : undefined}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${
                  student.id === access.studentId
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
                href={`/app/${role}?section=schools&student=${student.id}`}
                key={student.id}
              >
                {student.name}
              </Link>
            ))}
          </fieldset>
        )}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <CountTile
          icon={<Sparkles className="size-5" />}
          label={t("counts.recommended")}
          value={recommended.length}
        />
        <CountTile
          icon={<Star className="size-5" />}
          label={t("counts.final")}
          value={finalList.length}
        />
      </dl>

      <CompareProvider items={comparableItems}>
        <SchoolComparison showBreakdown={unlocked} studentId={access.studentId} />

        <SchoolSection body={t("sections.recommendedBody")} title={t("sections.recommended")}>
          {recommended.length === 0 ? (
            access.packageState === "trial" ? (
              <EmptyTile body={t("waiting.body")} title={t("waiting.title")} />
            ) : (
              <EmptyTile body={t("sections.recommendedEmptyPaid")} title={t("sections.noneYet")} />
            )
          ) : (
            <SchoolGrid>{recommended.map(card)}</SchoolGrid>
          )}
        </SchoolSection>

        {(role !== "admin" || finalList.length > 0) && (
          <SchoolSection body={t("sections.finalBody")} title={t("sections.final")}>
            {finalList.length === 0 ? (
              <EmptyTile body={t("sections.savedEmpty")} title={t("sections.noneYet")} />
            ) : (
              <SchoolGrid>{finalList.map(card)}</SchoolGrid>
            )}
          </SchoolSection>
        )}

        <SchoolSection body={t("sections.allBody")} title={t("sections.all")}>
          <SchoolFilters filters={filters} states={states} studentId={selectedStudentId} />
          {allFiltered.length === 0 ? (
            <EmptyTile body={t("empty.filtered")} title={t("empty.title")} />
          ) : (
            <SchoolSearch
              schools={allFiltered.map((school) => ({
                card: card(school),
                city: school.city,
                id: school.id,
                name: school.name,
                state: school.state,
              }))}
            />
          )}
        </SchoolSection>
      </CompareProvider>
    </section>
  )
}

function CountTile({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode
  readonly label: string
  readonly value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
      <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </span>
      <div>
        <dd className="text-2xl font-black text-slate-950">{value}</dd>
        <dt className="text-xs font-bold text-slate-500">{label}</dt>
      </div>
    </div>
  )
}

function SchoolSection({
  body,
  children,
  title,
}: {
  readonly body: string
  readonly children: ReactNode
  readonly title: string
}) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-black text-slate-950">{title}</h2>
      <p className="mt-1 leading-7 text-slate-600">{body}</p>
      {children}
    </section>
  )
}

function SchoolGrid({ children }: { readonly children: ReactNode }) {
  return <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>
}

function EmptyTile({ body, title }: { readonly body: string; readonly title: string }) {
  return (
    <Card className="mt-4 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
      <GraduationCap aria-hidden="true" className="mx-auto size-7 text-blue-600" />
      <h3 className="mt-3 font-black text-slate-950">{title}</h3>
      <p className="mx-auto mt-1 max-w-md leading-7 text-slate-600">{body}</p>
    </Card>
  )
}

function WorkspaceMessage({ body, title }: { readonly body: string; readonly title: string }) {
  return (
    <Card className="mt-8 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
      <h1 className="text-2xl font-black text-slate-950">{title}</h1>
      <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">{body}</p>
    </Card>
  )
}
