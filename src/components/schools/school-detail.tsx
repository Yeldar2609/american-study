import { ArrowLeft, Bookmark, ExternalLink, Heart, ListChecks } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { MatchBreakdownDisclosure } from "@/components/schools/match-breakdown-disclosure"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { setSchoolShortlistAction, setSchoolStarAction } from "@/lib/workspace/school-actions"
import type { SchoolCatalogItem } from "@/lib/workspace/school-catalog"

type SchoolDetailProps = {
  readonly locale: string
  readonly role: "student" | "parent" | "admin"
  readonly school: SchoolCatalogItem
  readonly studentId: string
  readonly showBreakdown: boolean
  readonly backHref: string
  readonly roadmapHref: string
}

export async function SchoolDetail({
  backHref,
  locale,
  roadmapHref,
  role,
  school,
  showBreakdown,
  studentId,
}: SchoolDetailProps) {
  const t = await getTranslations("schools")
  const format = await getFormatter()
  const starAction = setSchoolStarAction.bind(null, locale)
  const shortlistAction = setSchoolShortlistAction.bind(null, locale)
  const canMutate = role === "student"
  const notListed = t("detail.notListed")

  const percent = (value: number | null) =>
    value === null ? notListed : `${format.number(value)}%`
  const number = (value: number | null) => (value === null ? notListed : format.number(value))
  const text = (value: string | null) => (value && value.length > 0 ? value : notListed)

  const rows: ReadonlyArray<{ readonly key: string; readonly value: string }> = [
    { key: "country", value: t("detail.countryValue") },
    {
      key: "setting",
      value: school.setting ? t(`settings.${school.setting}`) : notListed,
    },
    { key: "body", value: school.body ? t(`bodies.${school.body}`) : notListed },
    { key: "grades", value: text(school.grades) },
    { key: "affiliation", value: text(school.affiliation) },
    { key: "enrollment", value: number(school.enrollment) },
    { key: "boarding", value: percent(school.pctBoarding) },
    { key: "international", value: percent(school.pctInternational) },
    {
      key: "tuition",
      value:
        school.tuition === null
          ? notListed
          : format.number(school.tuition, { currency: "USD", style: "currency" }),
    },
    {
      key: "aid",
      value:
        school.financialAid === null
          ? notListed
          : school.financialAid
            ? t("detail.aidYes")
            : t("detail.aidNo"),
    },
    { key: "acceptance", value: percent(school.acceptanceRate) },
    { key: "ssat", value: number(school.avgSsatPctile) },
    { key: "niche", value: text(school.nicheGrade) },
    { key: "deadline", value: text(school.saoDeadline) },
    { key: "status", value: t(`admin.statuses.${school.status}`) },
  ]

  return (
    <section className="mt-8">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-blue-700"
        href={backHref}
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t("detail.back")}
      </Link>

      <Card className="mt-3 overflow-hidden">
        <div className="bg-blue-700 p-6 text-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black">{school.name}</h1>
              <p className="mt-2 text-sm font-bold text-blue-50">
                {[school.city, school.state].filter(Boolean).join(", ") || t("locationUnknown")}
              </p>
            </div>
            <span className="rounded-2xl bg-white/20 px-4 py-2 text-2xl font-black">
              {t("match", { percent: school.matchPercent })}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {school.adminPick && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">
                {t("actions.recommended")}
              </span>
            )}
            {school.finalSeven && (
              <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-amber-950">
                {t("actions.finalSeven")}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          {school.matchReason && (
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-blue-700">{t("why")}</p>
              <p className="mt-1 leading-7 text-slate-700">{school.matchReason}</p>
            </div>
          )}

          {showBreakdown && <MatchBreakdownDisclosure schoolId={school.id} studentId={studentId} />}

          {school.strengths.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {school.strengths.map((strength) => (
                <span
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                  key={strength}
                >
                  {strength}
                </span>
              ))}
            </div>
          )}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <div className="rounded-2xl border border-slate-100 p-4" key={row.key}>
                <dt className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {t(`detail.fields.${row.key}`)}
                </dt>
                <dd className="mt-1 font-black text-slate-900">{row.value}</dd>
              </div>
            ))}
          </dl>

          {school.notes && (
            <div className="mt-6">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {t("detail.fields.notes")}
              </p>
              <p className="mt-1 whitespace-pre-wrap leading-7 text-slate-700">{school.notes}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {canMutate && (
              <form action={starAction}>
                <input name="schoolId" type="hidden" value={school.id} />
                <input name="studentId" type="hidden" value={studentId} />
                <input name="value" type="hidden" value={String(!school.starred)} />
                <button
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black ${
                    school.starred
                      ? "bg-red-50 text-red-600"
                      : "border border-slate-200 text-slate-700"
                  }`}
                  type="submit"
                >
                  <Heart className="size-4" fill={school.starred ? "currentColor" : "none"} />
                  {t(school.starred ? "actions.saved" : "actions.save")}
                </button>
              </form>
            )}
            {canMutate && (
              <form action={shortlistAction}>
                <input name="schoolId" type="hidden" value={school.id} />
                <input name="studentId" type="hidden" value={studentId} />
                <input name="value" type="hidden" value={String(!school.shortlisted)} />
                <button
                  className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black ${
                    school.shortlisted
                      ? "bg-blue-50 text-blue-700"
                      : "border border-slate-200 text-slate-700"
                  }`}
                  type="submit"
                >
                  <Bookmark
                    className="size-4"
                    fill={school.shortlisted ? "currentColor" : "none"}
                  />
                  {t(school.shortlisted ? "actions.inShortlist" : "actions.shortlist")}
                </button>
              </form>
            )}
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white"
              href={roadmapHref}
            >
              <ListChecks aria-hidden="true" className="size-4" />
              {t("detail.openRoadmap")}
            </Link>
            {school.websiteUrl && (
              <a
                className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-black text-blue-700"
                href={school.websiteUrl}
                rel="noreferrer"
                target="_blank"
              >
                {t("website")}
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            )}
            {school.nicheProfileUrl && (
              <a
                className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-black text-blue-700"
                href={school.nicheProfileUrl}
                rel="noreferrer"
                target="_blank"
              >
                {t("detail.nicheProfile")}
                <ExternalLink aria-hidden="true" className="size-4" />
              </a>
            )}
          </div>
        </div>
      </Card>
    </section>
  )
}
