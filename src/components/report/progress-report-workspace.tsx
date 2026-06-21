import { CalendarClock, CircleAlert, ListChecks, Sparkles } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import type { ReactNode } from "react"
import { PrintButton } from "@/components/report/print-button"
import { Card } from "@/components/ui/card"
import { StudentSwitcher, WorkspaceMessage } from "@/components/workspace/workspace-frame"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { getApplicationBoard } from "@/lib/workspace/application-board-data"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"
import { getRoadmapData } from "@/lib/workspace/workflow-queries"

type ProgressReportWorkspaceProps = {
  readonly data: DashboardDataResult
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
}

export async function ProgressReportWorkspace({
  data,
  role,
  selectedStudentId,
}: ProgressReportWorkspaceProps) {
  const t = await getTranslations("report")
  const stageT = await getTranslations("applicationBoard")
  const format = await getFormatter()
  if (data.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }
  const access = resolveWorkspaceAccess(data.students, selectedStudentId, false)
  switch (access.kind) {
    case "empty":
    case "not_found":
      return <WorkspaceMessage body={t(`empty.${access.kind}`)} title={t("title")} />
    case "locked":
    case "ready":
      break
  }

  const student = data.students.find((candidate) => candidate.id === access.studentId)
  if (student === undefined) {
    return <WorkspaceMessage body={t("empty.not_found")} title={t("title")} />
  }

  const roadmap = await getRoadmapData(access.studentId)
  const tasks = roadmap.kind === "ready" ? roadmap.value.tasks : []
  const board = await getApplicationBoard(access.studentId)
  const applications = board.kind === "ready" ? board.items : []

  const progress =
    student.totalTasks === 0
      ? null
      : Math.round((student.completedTasks / student.totalTasks) * 100)
  const upcoming = tasks
    .filter((task) => task.status !== "approved" && task.due_date !== null)
    .toSorted((left, right) => String(left.due_date).localeCompare(String(right.due_date)))
    .slice(0, 8)
  const generatedAt = format.dateTime(new Date(), { dateStyle: "long" })

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">{t("body")}</p>
        </div>
        <div className="flex items-center gap-3">
          <StudentSwitcher
            activeStudentId={access.studentId}
            label={t("studentPicker")}
            role={role}
            section="report"
            students={data.students}
          />
          <PrintButton />
        </div>
      </div>

      <Card className="mt-6 p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-5">
          <p className="text-sm font-bold text-blue-700">{t("eyebrow")}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{student.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("generated", { date: generatedAt })}</p>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metric
            icon={<Sparkles className="size-5" />}
            label={t("metrics.progress")}
            value={progress === null ? t("metrics.notAvailable") : `${progress}%`}
          />
          <Metric
            icon={<ListChecks className="size-5" />}
            label={t("metrics.tasksDone")}
            value={`${student.completedTasks} / ${student.totalTasks}`}
          />
          <Metric
            icon={<CircleAlert className="size-5" />}
            label={t("metrics.overdue")}
            value={String(student.overdueTasks)}
          />
          <Metric
            icon={<CalendarClock className="size-5" />}
            label={t("metrics.nextDeadline")}
            value={
              student.nextTaskDueDate === null
                ? t("metrics.noDeadline")
                : format.dateTime(new Date(`${student.nextTaskDueDate}T00:00:00`), {
                    dateStyle: "medium",
                  })
            }
          />
        </dl>

        <section className="mt-8">
          <h3 className="text-lg font-black text-slate-950">{t("upcomingTitle")}</h3>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("noUpcoming")}</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {upcoming.map((task) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2"
                  key={task.id}
                >
                  <span className="font-bold text-slate-800">{task.title}</span>
                  <span className="text-sm text-slate-500">
                    {task.due_date === null
                      ? t("metrics.noDeadline")
                      : format.dateTime(new Date(`${task.due_date}T00:00:00`), {
                          dateStyle: "medium",
                        })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-black text-slate-950">{t("applicationsTitle")}</h3>
          {applications.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">{t("noApplications")}</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {applications.map((item) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-2"
                  key={item.schoolId}
                >
                  <span className="font-bold text-slate-800">{item.schoolName}</span>
                  <span className="text-xs font-black uppercase tracking-wide text-blue-700">
                    {stageT(`stages.${item.stage}`)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {student.packageState === "trial" &&
          student.diagnosticSummary !== null &&
          student.diagnosticSummary.trim() !== "" && (
            <section className="mt-8">
              <h3 className="text-lg font-black text-slate-950">{t("diagnosticTitle")}</h3>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                {student.diagnosticSummary}
              </p>
            </section>
          )}
      </Card>
    </section>
  )
}

function Metric({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode
  readonly label: string
  readonly value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </span>
      <dd className="mt-2 text-2xl font-black text-slate-950">{value}</dd>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
    </div>
  )
}
