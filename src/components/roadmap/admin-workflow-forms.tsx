import { getTranslations } from "next-intl/server"
import { adminSaveDocumentAction, adminSaveTaskAction } from "@/lib/workspace/workflow-actions"

export async function AdminWorkflowForms({
  locale,
  studentId,
}: {
  readonly locale: string
  readonly studentId: string
}) {
  const t = await getTranslations("roadmap.admin")
  const taskAction = adminSaveTaskAction.bind(null, locale)
  const documentAction = adminSaveDocumentAction.bind(null, locale)
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <details className="rounded-3xl border border-blue-100 bg-white p-5">
        <summary className="cursor-pointer text-lg font-black text-blue-800">
          {t("newTask")}
        </summary>
        <form action={taskAction} className="mt-4 grid gap-3">
          <input name="studentId" type="hidden" value={studentId} />
          <input name="taskId" type="hidden" value="" />
          <input name="schoolId" type="hidden" value="" />
          <TextField label={t("section")} name="section" required />
          <TextField label={t("title")} name="title" required />
          <TextArea label={t("description")} name="description" />
          <TextField label={t("videoId")} name="videoId" />
          <TextField label={t("dueDate")} name="dueDate" type="date" />
          <TextField label={t("driveLink")} name="driveLink" type="url" />
          <Submit label={t("saveTask")} />
        </form>
      </details>
      <details className="rounded-3xl border border-blue-100 bg-white p-5">
        <summary className="cursor-pointer text-lg font-black text-blue-800">
          {t("newDocument")}
        </summary>
        <form action={documentAction} className="mt-4 grid gap-3">
          <input name="studentId" type="hidden" value={studentId} />
          <input name="documentId" type="hidden" value="" />
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            {t("documentType")}
            <select className="min-h-11 rounded-xl border border-slate-200 px-3" name="type">
              {(
                [
                  "passport",
                  "transcript",
                  "recommendation",
                  "financial",
                  "test_score",
                  "photo",
                  "other",
                ] as const
              ).map((type) => (
                <option key={type} value={type}>
                  {t(`documentTypes.${type}`)}
                </option>
              ))}
            </select>
          </label>
          <TextField label={t("title")} name="title" required />
          <TextField label={t("driveLink")} name="driveLink" type="url" />
          <input name="status" type="hidden" value="requested" />
          <label className="flex min-h-11 items-center gap-3 font-bold text-slate-700">
            <input name="required" type="checkbox" />
            {t("required")}
          </label>
          <TextField label={t("dueDate")} name="dueDate" type="date" />
          <TextArea label={t("notes")} name="notes" />
          <Submit label={t("saveDocument")} />
        </form>
      </details>
    </div>
  )
}

function TextField({
  label,
  name,
  required = false,
  type = "text",
}: {
  readonly label: string
  readonly name: string
  readonly required?: boolean
  readonly type?: string
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <input
        className="min-h-11 rounded-xl border border-slate-200 px-3"
        name={name}
        required={required}
        type={type}
      />
    </label>
  )
}

function TextArea({ label, name }: { readonly label: string; readonly name: string }) {
  return (
    <label className="grid gap-1 text-sm font-bold text-slate-700">
      {label}
      <textarea className="min-h-24 rounded-xl border border-slate-200 p-3" name={name} />
    </label>
  )
}

function Submit({ label }: { readonly label: string }) {
  return (
    <button className="min-h-11 rounded-xl bg-slate-950 px-4 font-bold text-white" type="submit">
      {label}
    </button>
  )
}
