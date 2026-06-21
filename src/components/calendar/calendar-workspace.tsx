import { getTranslations } from "next-intl/server"
import { CalendarBoard } from "@/components/calendar/calendar-board"
import { LockedCard } from "@/components/locked-card"
import { StudentSwitcher, WorkspaceMessage } from "@/components/workspace/workspace-frame"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"
import { studentDeleteTaskAction, studentSaveTaskAction } from "@/lib/workspace/workflow-actions"
import { getRoadmapData } from "@/lib/workspace/workflow-queries"

type CalendarWorkspaceProps = {
  readonly data: DashboardDataResult
  readonly locale: string
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
}

export async function CalendarWorkspace({
  data,
  locale,
  role,
  selectedStudentId,
}: CalendarWorkspaceProps) {
  const t = await getTranslations("calendar")
  if (data.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }
  const access = resolveWorkspaceAccess(data.students, selectedStudentId, role !== "admin")
  switch (access.kind) {
    case "empty":
    case "not_found":
      return <WorkspaceMessage body={t(`empty.${access.kind}`)} title={t("title")} />
    case "locked":
      return (
        <div className="mt-8 max-w-2xl">
          <LockedCard description={t("lockedBody")} title={t("title")} />
        </div>
      )
    case "ready":
      break
  }

  const result = await getRoadmapData(access.studentId)
  if (result.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }

  const tasks = result.value.tasks.map((task) => ({
    description: task.description,
    dueDate: task.due_date,
    id: task.id,
    section: task.section,
    status: task.status,
    title: task.title,
  }))

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">{t("body")}</p>
        </div>
        <StudentSwitcher
          activeStudentId={access.studentId}
          label={t("studentPicker")}
          role={role}
          section="calendar"
          students={data.students}
        />
      </div>
      <CalendarBoard
        canEdit={role === "student"}
        deleteAction={studentDeleteTaskAction.bind(null, locale)}
        saveAction={studentSaveTaskAction.bind(null, locale)}
        tasks={tasks}
      />
    </section>
  )
}
