import { CalendarClock, CircleCheck, Clock3, Sparkles } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { NotificationsPanel } from "@/components/app/notifications-panel"
import { StudentSchoolsSummary } from "@/components/app/student-schools-summary"
import { LockedCard } from "@/components/locked-card"
import { SelfProfileForm } from "@/components/onboarding/self-profile-form"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { UserRole } from "@/lib/auth/access"
import {
  type DashboardDataResult,
  type DashboardStudent,
  isDiagnosticVisible,
  summarizeDashboard,
} from "@/lib/dashboard/dashboard-data"
import { getStudentSelf } from "@/lib/workspace/self-profile-data"

type DashboardHomeProps = {
  readonly data: DashboardDataResult
  readonly locale: string
  readonly role: UserRole
}

export async function DashboardHome({ data, locale, role }: DashboardHomeProps) {
  const t = await getTranslations("app")
  const format = await getFormatter()

  if (data.kind !== "ready") {
    return (
      <Card className="mt-8 border-amber-200 bg-amber-50 p-6">
        <h2 className="text-xl font-black text-amber-950">
          {t(data.kind === "configuration" ? "configuration.title" : "loadError.title")}
        </h2>
        <p className="mt-2 leading-7 text-amber-900">
          {t(data.kind === "configuration" ? "configuration.body" : "loadError.body")}
        </p>
      </Card>
    )
  }

  const metrics = summarizeDashboard(data.students)
  const diagnostics = data.students.filter(isDiagnosticVisible)
  const allStudentFeaturesLocked =
    role !== "admin" && metrics.studentCount > 0 && metrics.unlockedStudentCount === 0
  const self = role === "student" ? await getStudentSelf() : null
  const onboarding = self?.kind === "ready" && !self.self.onboarded ? self.self : null
  const editProfile = self?.kind === "ready" && self.self.onboarded ? self.self : null

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">
            {t(`${role}.eyebrow`)}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {t(`${role}.title`, { name: data.viewerName })}
          </h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">{t(`${role}.subtitle`)}</p>
        </div>
        <Badge className="w-fit gap-2 bg-emerald-50 text-emerald-800">
          <CircleCheck aria-hidden="true" className="size-4" />
          {role === "admin"
            ? t("status.students", { count: metrics.studentCount })
            : t("status.overdue", { count: metrics.overdueTasks })}
        </Badge>
      </div>

      {onboarding !== null && (
        <section className="mt-6">
          <SelfProfileForm locale={locale} mode="onboarding" self={onboarding} />
        </section>
      )}

      {metrics.studentCount === 0 ? (
        <Card className="mt-8 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
          <h2 className="text-xl font-black text-slate-950">{t("empty.studentsTitle")}</h2>
          <p className="mt-2 text-slate-600">{t(`empty.${role}StudentsBody`)}</p>
        </Card>
      ) : allStudentFeaturesLocked ? (
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <DiagnosticCards diagnostics={diagnostics} />
          <LockedCard description={t("lockedDescription")} title={t("lockedTitle")} />
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <Card className="p-5 md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">{t("progress")}</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">
                    {metrics.progressPercent === null
                      ? t("empty.notAvailable")
                      : `${metrics.progressPercent}%`}
                  </p>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                  <Sparkles aria-hidden="true" className="size-6" />
                </span>
              </div>
              {metrics.progressPercent === null ? (
                <p className="mt-5 text-sm text-slate-600">{t("empty.tasksBody")}</p>
              ) : (
                <>
                  <div className="mt-5">
                    <Progress label={t("progress")} value={metrics.progressPercent} />
                  </div>
                  <p className="mt-4 text-sm text-slate-600">
                    {t("progressSummary", {
                      completed: metrics.completedTasks,
                      total: metrics.totalTasks,
                    })}
                  </p>
                </>
              )}
            </Card>
            <Card className="border-blue-800 bg-gradient-to-br from-blue-700 to-blue-900 p-5 text-white">
              <CalendarClock aria-hidden="true" className="size-6 text-blue-200" />
              <p className="mt-5 text-sm font-bold text-blue-100">{t("nextMilestone")}</p>
              <p className="mt-1 text-xl font-black">
                {metrics.nextTask?.title ?? t("empty.nextTask")}
              </p>
              {metrics.nextTask?.dueDate !== null && metrics.nextTask?.dueDate !== undefined && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-blue-100">
                  <Clock3 aria-hidden="true" className="size-4" />
                  {format.dateTime(new Date(`${metrics.nextTask.dueDate}T00:00:00`), {
                    dateStyle: "medium",
                  })}
                </p>
              )}
            </Card>
          </section>
          {role !== "admin" && diagnostics.length > 0 && (
            <section className="mt-4">
              <DiagnosticCards diagnostics={diagnostics} />
            </section>
          )}
        </>
      )}
      {role === "student" && data.students[0] !== undefined && (
        <StudentSchoolsSummary role={role} studentId={data.students[0].id} />
      )}
      {editProfile !== null && (
        <section className="mt-4">
          <SelfProfileForm locale={locale} mode="edit" self={editProfile} />
        </section>
      )}
      <NotificationsPanel locale={locale} />
    </>
  )
}

async function DiagnosticCards({
  diagnostics,
}: {
  readonly diagnostics: readonly DashboardStudent[]
}) {
  const t = await getTranslations("app")

  if (diagnostics.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm font-bold text-blue-700">{t("diagnostic.label")}</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">{t("diagnostic.emptyTitle")}</h2>
        <p className="mt-3 leading-7 text-slate-600">{t("diagnostic.emptyBody")}</p>
      </Card>
    )
  }

  return diagnostics.map((student) => (
    <Card className="p-6" key={student.id}>
      <p className="text-sm font-bold text-blue-700">{t("diagnostic.label")}</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{student.name}</h2>
      <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
        {student.diagnosticSummary}
      </p>
    </Card>
  ))
}
