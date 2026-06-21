"use client"

import { useTranslations } from "next-intl"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import {
  type StudentOption,
  StudentRecipientPicker,
} from "@/components/workspace/student-recipient-picker"
import { initialAssignTaskState } from "@/lib/workspace/assign-task-state"
import { adminAssignTaskAction } from "@/lib/workspace/workflow-actions"

export function AdminTaskAssigner({
  locale,
  students,
}: {
  readonly locale: string
  readonly students: readonly StudentOption[]
}) {
  const t = useTranslations("roadmap.admin")
  const action = adminAssignTaskAction.bind(null, locale)
  const [state, formAction, pending] = useActionState(action, initialAssignTaskState)

  return (
    <details className="mt-6 rounded-3xl border border-blue-100 bg-white p-5">
      <summary className="cursor-pointer text-lg font-black text-blue-800">
        {t("assign.title")}
      </summary>
      <form action={formAction} className="mt-4 grid gap-3">
        <StudentRecipientPicker
          labels={{
            all: (count) => t("assign.all", { count }),
            choose: t("assign.choose"),
            noStudents: t("assign.noStudents"),
            recipients: t("assign.recipients"),
            searchLabel: t("assign.searchLabel"),
            searchPlaceholder: t("assign.searchPlaceholder"),
            selectedCount: (count) => t("assign.selectedCount", { count }),
          }}
          students={students}
        />

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("section")}
          <input
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            name="section"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("title")}
          <input
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            name="title"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("description")}
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 p-3"
            name="description"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("videoId")}
          <input className="min-h-11 rounded-xl border border-slate-200 px-3" name="videoId" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("dueDate")}
          <input
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            name="dueDate"
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("driveLink")}
          <input
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            name="driveLink"
            type="url"
          />
        </label>

        <div>
          <Button disabled={pending} type="submit">
            {pending ? t("assign.submitting") : t("assign.submit")}
          </Button>
        </div>

        {state.status === "success" && (
          <p
            className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800"
            role="status"
          >
            {t("assign.success", { count: state.count })}
          </p>
        )}
        {state.status === "error" && (
          <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700" role="status">
            {t(`assign.errors.${state.reason}`)}
          </p>
        )}
      </form>
    </details>
  )
}
