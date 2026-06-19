import { ExternalLink, Heart, MapPin } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { SchoolAdminControls } from "@/components/schools/school-admin-controls"
import { Card } from "@/components/ui/card"
import { setSchoolStarAction } from "@/lib/workspace/school-actions"
import type { SchoolCatalogItem } from "@/lib/workspace/school-catalog"

type SchoolCardProps = {
  readonly locale: string
  readonly readOnly: boolean
  readonly role: "student" | "parent" | "admin"
  readonly school: SchoolCatalogItem
  readonly studentId: string
}

export async function SchoolCard({ locale, readOnly, role, school, studentId }: SchoolCardProps) {
  const t = await getTranslations("schools")
  const format = await getFormatter()
  const starAction = setSchoolStarAction.bind(null, locale)
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-cyan-300 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-2xl bg-white/20 px-3 py-2 text-2xl font-black backdrop-blur">
            {t("match", { percent: school.matchPercent })}
          </span>
          {!readOnly && role === "student" && (
            <form action={starAction}>
              <input name="schoolId" type="hidden" value={school.id} />
              <input name="studentId" type="hidden" value={studentId} />
              <input name="starred" type="hidden" value={String(!school.starred)} />
              <button
                aria-label={t(school.starred ? "unstar" : "star")}
                className="grid size-11 place-items-center rounded-full bg-white text-rose-500 shadow-lg"
                type="submit"
              >
                <Heart className="size-5" fill={school.starred ? "currentColor" : "none"} />
              </button>
            </form>
          )}
        </div>
        <h2 className="mt-8 text-2xl font-black">{school.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-sm font-bold text-blue-50">
          <MapPin className="size-4" />
          {[school.city, school.state].filter(Boolean).join(", ") || t("locationUnknown")}
        </p>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          {school.strengths.map((strength) => (
            <span
              className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-900"
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
        {school.websiteUrl && (
          <a
            className="mt-5 inline-flex min-h-11 items-center gap-2 font-black text-blue-700"
            href={school.websiteUrl}
            rel="noreferrer"
            target="_blank"
          >
            {t("website")}
            <ExternalLink className="size-4" />
          </a>
        )}
        {role === "admin" && (
          <SchoolAdminControls locale={locale} school={school} studentId={studentId} />
        )}
      </div>
    </Card>
  )
}
