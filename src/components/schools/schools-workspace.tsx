import { getTranslations } from "next-intl/server"
import { SchoolCard } from "@/components/schools/school-card"
import { SchoolFilters } from "@/components/schools/school-filters"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"
import {
  filterSchoolCatalog,
  getSchoolCatalog,
  type SchoolCatalogFilters,
} from "@/lib/workspace/school-catalog"

type SchoolsWorkspaceProps = {
  readonly data: DashboardDataResult
  readonly filters: SchoolCatalogFilters
  readonly locale: string
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
}

export async function SchoolsWorkspace({
  data,
  filters,
  locale,
  role,
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
      return <WorkspaceMessage body={t("loadError")} title={t("title")} />
    case "ready":
      break
  }

  const result = await getSchoolCatalog(access.studentId)
  if (result.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }

  const schools = filterSchoolCatalog(result.items, filters)
  const states = [
    ...new Set(result.items.flatMap((school) => (school.state ? [school.state] : []))),
  ].toSorted()

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
            {t(access.packageState === "trial" ? "trialEyebrow" : "paidEyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            {t(access.packageState === "trial" ? "trialBody" : "paidBody")}
          </p>
        </div>
        {data.students.length > 1 && (
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">{t("studentPicker")}</legend>
            {data.students.map((student) => (
              <Link
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

      {access.packageState === "paid" && <SchoolFilters filters={filters} states={states} />}

      {schools.length === 0 ? (
        <WorkspaceMessage body={t("empty.filtered")} title={t("empty.title")} />
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {schools.map((school) => (
            <SchoolCard
              key={school.id}
              locale={locale}
              readOnly={role === "parent" || access.packageState === "trial"}
              role={role}
              school={school}
              studentId={access.studentId}
            />
          ))}
        </div>
      )}
    </section>
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
