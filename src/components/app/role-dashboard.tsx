import { ArrowUpRight, CalendarClock, CircleCheck, Clock3, Sparkles } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { AppSidebar } from "@/components/app/app-sidebar"
import { LockedCard } from "@/components/locked-card"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Link } from "@/i18n/navigation"
import type { UserRole } from "@/lib/auth/access"

type RoleDashboardProps = {
  readonly locale: string
  readonly role: UserRole
  readonly section?: string | undefined
  readonly preview?: boolean
}

export async function RoleDashboard({
  locale,
  role,
  section = "home",
  preview = false,
}: RoleDashboardProps) {
  const t = await getTranslations("app")
  const progress = role === "admin" ? 78 : role === "parent" ? 64 : 58
  const validSections = ["home", "roadmap", "schools", "essays", "bookings", "people"] as const
  const activeSection =
    section === "diagnostic" || validSections.some((candidate) => candidate === section)
      ? section
      : "home"
  const sectionLabel = activeSection === "diagnostic" ? t("viewDetails") : t(`nav.${activeSection}`)

  return (
    <div className="min-h-screen lg:flex">
      <AppSidebar activeSection={activeSection} locale={locale} preview={preview} role={role} />
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              {preview && (
                <Badge className="mb-3 bg-rose-50 text-rose-800">{t("previewBadge")}</Badge>
              )}
              <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
                {t(`${role}.eyebrow`)}
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {t(`${role}.title`)}
              </h1>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">{t(`${role}.subtitle`)}</p>
            </div>
            <Badge className="w-fit gap-2 bg-emerald-50 text-emerald-800">
              <CircleCheck aria-hidden="true" className="size-4" />
              {t(`${role}.status`)}
            </Badge>
          </div>

          {activeSection !== "home" && (
            <Card className="mt-8 border-blue-200 bg-blue-50/70 p-5">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
                {t("section.eyebrow")}
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {t("section.title", { section: sectionLabel })}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("section.description")}</p>
            </Card>
          )}

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="p-5 md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">{t("progress")}</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">{progress}%</p>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                  <Sparkles aria-hidden="true" className="size-6" />
                </span>
              </div>
              <div className="mt-5">
                <Progress label={t("progress")} value={progress} />
              </div>
              <p className="mt-4 text-sm text-slate-600">{t(`${role}.progressBody`)}</p>
            </Card>
            <Card className="bg-slate-950 p-5 text-white">
              <CalendarClock aria-hidden="true" className="size-6 text-cyan-300" />
              <p className="mt-5 text-sm font-bold text-slate-300">{t("nextMilestone")}</p>
              <p className="mt-1 text-xl font-black">{t(`${role}.next`)}</p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300">
                <Clock3 aria-hidden="true" className="size-4" />
                {t(`${role}.timing`)}
              </p>
            </Card>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card className="p-6">
              <p className="text-sm font-bold text-blue-700">{t(`${role}.cardLabel`)}</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{t(`${role}.cardTitle`)}</h2>
              <p className="mt-3 leading-7 text-slate-600">{t(`${role}.cardBody`)}</p>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700 focus-visible:rounded focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                href={
                  preview
                    ? `/preview/${role}?section=diagnostic`
                    : `/app/${role}?section=diagnostic`
                }
              >
                {t("viewDetails")}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </Card>
            <LockedCard
              description={t("lockedDescription")}
              preview={preview}
              role={role}
              title={t("lockedTitle")}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
