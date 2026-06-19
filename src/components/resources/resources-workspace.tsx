import { CircleHelp, Video } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { LockedCard } from "@/components/locked-card"
import { AdminContentForms } from "@/components/resources/admin-content-forms"
import { Card } from "@/components/ui/card"
import { WorkspaceMessage } from "@/components/workspace/workspace-frame"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"
import { getResourcesData } from "@/lib/workspace/collaboration-queries"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"

export async function ResourcesWorkspace({
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
  const t = await getTranslations("resources")
  const activeLocale = await getLocale()
  if (data.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }
  if (role !== "admin") {
    const access = resolveWorkspaceAccess(data.students, selectedStudentId, true)
    if (access.kind === "locked") {
      return (
        <div className="mt-8 max-w-2xl">
          <LockedCard description={t("lockedBody")} title={t("title")} />
        </div>
      )
    }
    if (access.kind === "empty" || access.kind === "not_found") {
      return <WorkspaceMessage body={t(`empty.${access.kind}`)} title={t("title")} />
    }
  }
  const result = await getResourcesData()
  if (result.kind !== "ready") {
    return <WorkspaceMessage body={t("loadError")} title={t("title")} />
  }
  return (
    <section className="mt-8">
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
        {t("eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">{t("title")}</h1>
      <p className="mt-2 max-w-2xl leading-7 text-slate-600">{t("body")}</p>
      {role === "admin" && <AdminContentForms locale={locale} />}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <Video className="size-5 text-blue-600" />
            {t("videos")}
          </h2>
          {result.value.videos.length === 0 ? (
            <p className="mt-3 text-slate-600">{t("empty.videos")}</p>
          ) : (
            <div className="mt-4 grid gap-5">
              {result.value.videos.map((video) => (
                <div key={video.id}>
                  <p className="mb-2 font-bold text-slate-900">
                    {activeLocale === "ru" ? video.title_ru : video.title_en}
                  </p>
                  <iframe
                    allowFullScreen
                    className="aspect-video w-full rounded-2xl"
                    src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}`}
                    title={activeLocale === "ru" ? video.title_ru : video.title_en}
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
            <CircleHelp className="size-5 text-cyan-600" />
            {t("faq")}
          </h2>
          {result.value.faq.length === 0 ? (
            <p className="mt-3 text-slate-600">{t("empty.faq")}</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {result.value.faq.map((item) => (
                <details className="rounded-2xl border border-slate-100 p-4" key={item.id}>
                  <summary className="cursor-pointer font-black text-slate-900">
                    {activeLocale === "ru" ? item.question_ru : item.question_en}
                  </summary>
                  <p className="mt-3 leading-7 text-slate-600">
                    {activeLocale === "ru" ? item.answer_ru : item.answer_en}
                  </p>
                </details>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}
