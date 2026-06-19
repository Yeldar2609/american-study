import { getTranslations } from "next-intl/server"
import type { UserRole } from "@/lib/auth/access"
import { saveEssayAction } from "@/lib/workspace/workflow-actions"
import type { Essay } from "@/lib/workspace/workflow-data"

type EssayFormProps = {
  readonly essay?: Essay | undefined
  readonly locale: string
  readonly role: UserRole
  readonly studentId: string
}

export async function EssayForm({ essay, locale, role, studentId }: EssayFormProps) {
  const t = await getTranslations("essays")
  const action = saveEssayAction.bind(null, locale)
  const statuses =
    role === "student"
      ? (["draft", "in_review"] as const)
      : (["draft", "in_review", "needs_revision", "approved"] as const)
  return (
    <form action={action} className="grid gap-3">
      <input name="studentId" type="hidden" value={studentId} />
      <input name="essayId" type="hidden" value={essay?.id ?? ""} />
      <input name="schoolId" type="hidden" value={essay?.school_id ?? ""} />
      <label className="grid gap-1 text-sm font-bold text-slate-700">
        {t("fields.title")}
        <input
          className="min-h-11 rounded-xl border border-slate-200 px-3"
          defaultValue={essay?.title ?? ""}
          name="title"
          required
        />
      </label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">
        {t("fields.driveLink")}
        <input
          className="min-h-11 rounded-xl border border-slate-200 px-3"
          defaultValue={essay?.drive_link ?? ""}
          name="driveLink"
          type="url"
        />
      </label>
      <label className="grid gap-1 text-sm font-bold text-slate-700">
        {t("fields.status")}
        <select
          className="min-h-11 rounded-xl border border-slate-200 px-3"
          defaultValue={essay?.status ?? "draft"}
          name="status"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {t(`statuses.${status}`)}
            </option>
          ))}
        </select>
      </label>
      {role === "admin" ? (
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("fields.feedback")}
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 p-3"
            defaultValue={essay?.admin_feedback ?? ""}
            name="adminFeedback"
          />
        </label>
      ) : (
        <input name="adminFeedback" type="hidden" value="" />
      )}
      <button className="min-h-11 rounded-xl bg-blue-600 px-4 font-bold text-white" type="submit">
        {t(essay ? "save" : "create")}
      </button>
    </form>
  )
}
