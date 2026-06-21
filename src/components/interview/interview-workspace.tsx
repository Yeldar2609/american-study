import { getTranslations } from "next-intl/server"
import { InterviewBoard } from "@/components/interview/interview-board"
import { LockedCard } from "@/components/locked-card"
import { StudentSwitcher, WorkspaceMessage } from "@/components/workspace/workspace-frame"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"
import {
  adminSetInterviewFeedbackAction,
  studentSaveInterviewPracticeAction,
} from "@/lib/workspace/interview-actions"
import { getInterviewPrep } from "@/lib/workspace/interview-data"

type InterviewWorkspaceProps = {
  readonly data: DashboardDataResult
  readonly locale: string
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
}

export async function InterviewWorkspace({
  data,
  locale,
  role,
  selectedStudentId,
}: InterviewWorkspaceProps) {
  const t = await getTranslations("interview")
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

  const result = await getInterviewPrep(access.studentId)
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
          section="interview"
          students={data.students}
        />
      </div>
      <InterviewBoard
        canEdit={role === "student"}
        canReview={role === "admin"}
        feedbackAction={adminSetInterviewFeedbackAction.bind(null, locale)}
        items={result.items}
        saveAction={studentSaveInterviewPracticeAction.bind(null, locale)}
      />
    </section>
  )
}
