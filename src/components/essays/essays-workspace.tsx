import { ExternalLink, FileText } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { EssayForm } from "@/components/essays/essay-form"
import { LockedCard } from "@/components/locked-card"
import { Card } from "@/components/ui/card"
import { StudentSwitcher, WorkspaceMessage } from "@/components/workspace/workspace-frame"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"
import type { Essay } from "@/lib/workspace/workflow-data"
import { getEssaysData } from "@/lib/workspace/workflow-queries"

export async function EssaysWorkspace({
  data,
  locale,
  role,
  selectedStudentId,
}: {
  readonly data: DashboardDataResult
  readonly locale: string
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
}) {
  const t = await getTranslations("essays")
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
  const result = await getEssaysData(access.studentId)
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
          section="essays"
          students={data.students}
        />
      </div>
      {role !== "parent" && (
        <details className="mt-6 rounded-3xl border border-blue-100 bg-white p-5">
          <summary className="cursor-pointer text-lg font-black text-blue-800">
            {t("newEssay")}
          </summary>
          <div className="mt-4 max-w-xl">
            <EssayForm locale={locale} role={role} studentId={access.studentId} />
          </div>
        </details>
      )}
      {result.value.length === 0 ? (
        <WorkspaceMessage body={t("empty.items")} title={t("empty.title")} />
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {result.value.map((essay) => (
            <EssayCard
              essay={essay}
              key={essay.id}
              locale={locale}
              readOnly={role === "parent"}
              role={role}
              studentId={access.studentId}
            />
          ))}
        </div>
      )}
    </section>
  )
}

async function EssayCard({
  essay,
  locale,
  readOnly,
  role,
  studentId,
}: {
  readonly essay: Essay
  readonly locale: string
  readonly readOnly: boolean
  readonly role: UserRole
  readonly studentId: string
}) {
  const t = await getTranslations("essays")
  const format = await getFormatter()
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <FileText className="size-6 text-blue-600" />
          <h2 className="mt-3 text-xl font-black text-slate-950">{essay.title}</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
          {t(`statuses.${essay.status}`)}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {format.dateTime(new Date(essay.updated_at), { dateStyle: "medium" })}
      </p>
      {essay.admin_feedback && (
        <div className="mt-4 rounded-2xl bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-blue-700">
            {t("feedback")}
          </p>
          <p className="mt-1 leading-6 text-slate-700">{essay.admin_feedback}</p>
        </div>
      )}
      {essay.drive_link && (
        <a
          className="mt-4 inline-flex min-h-11 items-center gap-2 font-bold text-blue-700"
          href={essay.drive_link}
          rel="noreferrer"
          target="_blank"
        >
          {t("openDrive")}
          <ExternalLink className="size-4" />
        </a>
      )}
      {!readOnly && (
        <details className="mt-4 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer font-black text-blue-700">{t("edit")}</summary>
          <div className="mt-4">
            <EssayForm essay={essay} locale={locale} role={role} studentId={studentId} />
          </div>
        </details>
      )}
    </Card>
  )
}
