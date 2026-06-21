import { ArrowRight, CalendarClock, Heart, School, Sparkles } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import type { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { getStudentSchoolSummary } from "@/lib/workspace/school-catalog"

// Schools snapshot for the student dashboard: recommended / saved counts, the
// next school deadline, and one clear call to action. Uses a counts-only RPC so
// the home page never pays for full catalog match scoring.
export async function StudentSchoolsSummary({
  role,
  studentId,
}: {
  readonly role: string
  readonly studentId: string
}) {
  const t = await getTranslations("app.schoolsCard")
  const format = await getFormatter()
  const result = await getStudentSchoolSummary(studentId)
  if (result.kind !== "ready") {
    return null
  }

  const { nextDeadline, recommendedCount, savedCount } = result.summary

  return (
    <section className="mt-4">
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-100 text-blue-700">
            <School aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-blue-700">{t("label")}</p>
            <h2 className="text-xl font-black text-slate-950">{t("title")}</h2>
          </div>
        </div>

        {recommendedCount === 0 ? (
          <p className="mt-4 leading-7 text-slate-600">{t("waitingBody")}</p>
        ) : (
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <SummaryStat
              icon={<Sparkles className="size-4" />}
              label={t("recommended")}
              value={recommendedCount}
            />
            <SummaryStat
              icon={<Heart className="size-4" />}
              label={t("saved")}
              value={savedCount}
            />
          </dl>
        )}

        <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
          <CalendarClock aria-hidden="true" className="size-4 text-blue-700" />
          {nextDeadline === null
            ? t("noDeadline")
            : t("nextDeadline", {
                date: format.dateTime(new Date(`${nextDeadline}T00:00:00`), {
                  dateStyle: "medium",
                }),
              })}
        </p>

        <Link
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white"
          href={`/app/${role}?section=schools`}
        >
          {recommendedCount === 0 ? t("waiting") : t("review")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Card>
    </section>
  )
}

function SummaryStat({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode
  readonly label: string
  readonly value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        {icon}
      </span>
      <dd className="mt-2 text-2xl font-black text-slate-950">{value}</dd>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
    </div>
  )
}
