import { CheckCircle2, ExternalLink, FileCheck2 } from "lucide-react"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"
import { LockedCard } from "@/components/locked-card"
import { AdminWorkflowForms } from "@/components/roadmap/admin-workflow-forms"
import { CommentsPanel } from "@/components/roadmap/comments-panel"
import { TaskCard } from "@/components/roadmap/task-card"
import { Card } from "@/components/ui/card"
import { StudentSwitcher, WorkspaceMessage } from "@/components/workspace/workspace-frame"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"
import type { ContentVideo, StudentDocument } from "@/lib/workspace/workflow-data"
import { getRoadmapData } from "@/lib/workspace/workflow-queries"

type RoadmapWorkspaceProps = {
  readonly data: DashboardDataResult
  readonly locale: string
  readonly role: UserRole
  readonly selectedStudentId?: string | undefined
}

export async function RoadmapWorkspace({
  data,
  locale,
  role,
  selectedStudentId,
}: RoadmapWorkspaceProps) {
  const t = await getTranslations("roadmap")
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
          section="roadmap"
          students={data.students}
        />
      </div>
      {role === "admin" && <AdminWorkflowForms locale={locale} studentId={access.studentId} />}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="grid content-start gap-4">
          <h2 className="text-2xl font-black text-slate-950">{t("tasks")}</h2>
          {result.value.tasks.length === 0 ? (
            <WorkspaceMessage body={t("empty.tasks")} title={t("empty.tasksTitle")} />
          ) : (
            result.value.tasks.map((task) => (
              <TaskCard key={task.id} locale={locale} role={role} task={task} />
            ))
          )}
        </div>
        <div className="grid content-start gap-5">
          <DocumentsPanel documents={result.value.documents} />
          <VideosPanel videos={result.value.videos} />
          <CommentsPanel locale={locale} studentId={access.studentId} />
        </div>
      </div>
    </section>
  )
}

async function DocumentsPanel({ documents }: { readonly documents: readonly StudentDocument[] }) {
  const t = await getTranslations("roadmap")
  const format = await getFormatter()
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
        <FileCheck2 className="size-5 text-blue-700" />
        {t("documents")}
      </h2>
      {documents.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{t("empty.documents")}</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {documents.map((document) => (
            <div className="rounded-2xl border border-slate-100 p-3" key={document.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-black text-slate-900">{document.title}</p>
                <span className="text-xs font-bold text-emerald-700">
                  {t(`documentStatuses.${document.status}`)}
                </span>
              </div>
              {document.due_date && (
                <p className="mt-1 text-xs text-slate-500">
                  {format.dateTime(new Date(`${document.due_date}T00:00:00`), {
                    dateStyle: "medium",
                  })}
                </p>
              )}
              {document.drive_link && (
                <a
                  className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-blue-700"
                  href={document.drive_link}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("openDrive")}
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

async function VideosPanel({ videos }: { readonly videos: readonly ContentVideo[] }) {
  const t = await getTranslations("roadmap")
  const locale = await getLocale()
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
        <CheckCircle2 className="size-5 text-blue-600" />
        {t("videos")}
      </h2>
      {videos.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{t("empty.videos")}</p>
      ) : (
        <div className="mt-4 grid gap-4">
          {videos.map((video) => (
            <div key={video.id}>
              <p className="mb-2 font-bold text-slate-900">
                {locale === "ru" ? video.title_ru : video.title_en}
              </p>
              <iframe
                allowFullScreen
                className="aspect-video w-full rounded-2xl"
                src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}`}
                title={locale === "ru" ? video.title_ru : video.title_en}
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
