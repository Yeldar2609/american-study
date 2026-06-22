import { ArrowRight, ExternalLink, Heart, MapPin } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { CompareToggle } from "@/components/schools/compare/compare-toggle"
import { MatchBreakdownDisclosure } from "@/components/schools/match-breakdown-disclosure"
import { SchoolAdminControls } from "@/components/schools/school-admin-controls"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { setSchoolStarAction } from "@/lib/workspace/school-actions"
import type { SchoolCatalogItem } from "@/lib/workspace/school-catalog"

type SchoolCardProps = {
  readonly locale: string
  readonly role: "student" | "parent" | "admin"
  readonly school: SchoolCatalogItem
  readonly showBreakdown: boolean
  readonly studentId: string
  readonly studentName: string
  readonly detailHref: string
}

export async function SchoolCard({
  detailHref,
  locale,
  role,
  school,
  showBreakdown,
  studentId,
  studentName,
}: SchoolCardProps) {
  const t = await getTranslations("schools")
  const format = await getFormatter()
  const starAction = setSchoolStarAction.bind(null, locale)
  const canMutate = role === "student"

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="bg-blue-700 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-2xl bg-white/20 px-3 py-2 text-2xl font-black backdrop-blur">
            {t("match", { percent: school.matchPercent })}
          </span>
          <div className="flex flex-wrap justify-end gap-2">
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
        <h2 className="mt-6 text-2xl font-black">{school.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-sm font-bold text-blue-50">
          <MapPin aria-hidden="true" className="size-4" />
          {[school.city, school.state].filter(Boolean).join(", ") || t("locationUnknown")}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          {school.strengths.map((strength) => (
            <span
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
              key={strength}
            >
              {strength}
            </span>
          ))}
        </div>
        {school.matchReason && (
          <div className="mt-5 rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-blue-700">{t("why")}</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{school.matchReason}</p>
          </div>
        )}
        {showBreakdown && <MatchBreakdownDisclosure schoolId={school.id} studentId={studentId} />}
        <CompareToggle schoolId={school.id} />
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="font-bold text-slate-500">{t("enrollment")}</dt>
            <dd className="mt-1 font-black text-slate-900">
              {school.enrollment === null ? t("notAvailable") : format.number(school.enrollment)}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-slate-500">{t("tuition")}</dt>
            <dd className="mt-1 font-black text-slate-900">
              {school.tuition === null
                ? t("notAvailable")
                : format.number(school.tuition, { currency: "USD", style: "currency" })}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-2">
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
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-black text-white"
            href={detailHref}
          >
            {t("actions.viewDetails")}
            <ArrowRight aria-hidden="true" className="size-4" />
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

        {role === "admin" && (
          <SchoolAdminControls
            locale={locale}
            school={school}
            studentId={studentId}
            studentName={studentName}
          />
        )}
      </div>
    </Card>
  )
}
