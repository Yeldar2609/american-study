import { getTranslations } from "next-intl/server"
import { ApplicationBoard } from "@/components/applications/application-board"
import { LockedCard } from "@/components/locked-card"
import { StudentSwitcher, WorkspaceMessage } from "@/components/workspace/workspace-frame"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { setApplicationStageAction } from "@/lib/workspace/application-board-actions"
import { getApplicationBoard } from "@/lib/workspace/application-board-data"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"

type ApplicationBoardWorkspaceProps = {
  readonly data: DashboardDataResult
  readonly locale: string
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
}

export async function ApplicationBoardWorkspace({
  data,
  locale,
  role,
  selectedStudentId,
}: ApplicationBoardWorkspaceProps) {
  const t = await getTranslations("applicationBoard")
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

  const result = await getApplicationBoard(access.studentId)
  if (result.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }

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
          section="applications"
          students={data.students}
        />
      </div>
      {result.items.length === 0 ? (
        <WorkspaceMessage body={t("empty.none")} title={t("emptyTitle")} />
      ) : (
        <ApplicationBoard
          canEdit={role !== "parent"}
          items={result.items}
          saveAction={setApplicationStageAction.bind(null, locale)}
          studentId={access.studentId}
        />
      )}
    </section>
  )
}
