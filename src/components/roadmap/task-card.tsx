import { CalendarClock, ExternalLink } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { Card } from "@/components/ui/card"
import type { UserRole } from "@/lib/auth/access"
import { updateTaskStatusAction } from "@/lib/workspace/workflow-actions"
import type { ApplicationTask } from "@/lib/workspace/workflow-data"

export async function TaskCard({
  locale,
  role,
  task,
}: {
  readonly locale: string
  readonly role: UserRole
  readonly task: ApplicationTask
}) {
  const t = await getTranslations("roadmap")
  const format = await getFormatter()
  const action = updateTaskStatusAction.bind(null, locale)
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">
            {task.section}
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{task.title}</h2>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
          {t(`statuses.${task.status}`)}
        </span>
      </div>
      {task.description && <p className="mt-3 leading-7 text-slate-600">{task.description}</p>}
      {task.video_youtube_id && (
        <iframe
          allowFullScreen
          className="mt-4 aspect-video w-full rounded-2xl"
          src={`https://www.youtube-nocookie.com/embed/${task.video_youtube_id}`}
          title={t("videoTitle", { title: task.title })}
        />
      )}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-bold text-slate-600">
        {task.due_date && (
          <span className="inline-flex items-center gap-2">
            <CalendarClock className="size-4" />
            {format.dateTime(new Date(`${task.due_date}T00:00:00`), { dateStyle: "medium" })}
          </span>
        )}
        {task.drive_link && (
          <a
            className="inline-flex min-h-11 items-center gap-2 text-blue-700"
            href={task.drive_link}
            rel="noreferrer"
            target="_blank"
          >
            {t("openDrive")}
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>
      {role !== "parent" && (
        <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
          <input name="taskId" type="hidden" value={task.id} />
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            {t("changeStatus")}
            <select
              className="min-h-11 rounded-xl border border-slate-200 px-3"
              defaultValue={task.status}
              name="status"
            >
              {(
                ["not_started", "in_progress", "submitted", "needs_revision", "approved"] as const
              ).map((status) => (
                <option key={status} value={status}>
                  {t(`statuses.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="min-h-11 rounded-xl bg-blue-600 px-4 font-bold text-white"
            type="submit"
          >
            {t("saveStatus")}
          </button>
        </form>
      )}
    </Card>
  )
}
