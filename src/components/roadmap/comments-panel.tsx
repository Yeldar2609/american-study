import { ExternalLink, MessageCircle } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { Card } from "@/components/ui/card"
import { postStudentCommentAction } from "@/lib/workspace/collaboration-actions"
import { getStudentComments } from "@/lib/workspace/collaboration-queries"

export async function CommentsPanel({
  locale,
  studentId,
}: {
  readonly locale: string
  readonly studentId: string
}) {
  const t = await getTranslations("comments")
  const format = await getFormatter()
  const result = await getStudentComments(studentId)
  const action = postStudentCommentAction.bind(null, locale)
  if (result.kind !== "ready") {
    return null
  }
  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 text-xl font-black text-slate-950">
        <MessageCircle className="size-5 text-rose-500" />
        {t("title")}
      </h2>
      <form action={action} className="mt-4 grid gap-3">
        <input name="studentId" type="hidden" value={studentId} />
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("message")}
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 p-3"
            name="body"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("attachment")}
          <input
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            name="attachmentLink"
            type="url"
          />
        </label>
        <button className="min-h-11 rounded-xl bg-rose-500 px-4 font-bold text-white" type="submit">
          {t("send")}
        </button>
      </form>
      {result.value.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">{t("empty")}</p>
      ) : (
        <div className="mt-5 grid gap-3">
          {result.value.map((message) => (
            <div className="rounded-2xl bg-slate-50 p-4" key={message.id}>
              <div className="flex flex-wrap justify-between gap-2">
                <p className="font-black text-slate-900">{message.author_name}</p>
                <p className="text-xs text-slate-400">
                  {format.dateTime(new Date(message.created_at), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{message.body}</p>
              {message.attachment_link && (
                <a
                  className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-blue-700"
                  href={message.attachment_link}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("openAttachment")}
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
