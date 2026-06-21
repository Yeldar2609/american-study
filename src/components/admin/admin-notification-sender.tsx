"use client"

import { Megaphone } from "lucide-react"
import { useTranslations } from "next-intl"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  type StudentOption,
  StudentRecipientPicker,
} from "@/components/workspace/student-recipient-picker"
import { initialAssignTaskState } from "@/lib/workspace/assign-task-state"
import { adminBroadcastNotificationAction } from "@/lib/workspace/workflow-actions"

export function AdminNotificationSender({
  locale,
  students,
}: {
  readonly locale: string
  readonly students: readonly StudentOption[]
}) {
  const t = useTranslations("adminNotify")
  const action = adminBroadcastNotificationAction.bind(null, locale)
  const [state, formAction, pending] = useActionState(action, initialAssignTaskState)

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
          <Megaphone aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="text-sm font-bold text-blue-700">{t("eyebrow")}</p>
          <h2 className="text-2xl font-black text-slate-950">{t("title")}</h2>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t("hint")}</p>

      <form action={formAction} className="mt-4 grid gap-3">
        <StudentRecipientPicker
          labels={{
            all: (count) => t("all", { count }),
            choose: t("choose"),
            noStudents: t("noStudents"),
            recipients: t("recipients"),
            searchLabel: t("searchLabel"),
            searchPlaceholder: t("searchPlaceholder"),
            selectedCount: (count) => t("selectedCount", { count }),
          }}
          students={students}
        />

        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("titleLabel")}
          <input
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            maxLength={200}
            name="title"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("bodyLabel")}
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 p-3"
            maxLength={2000}
            name="body"
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("linkLabel")}
          <input className="min-h-11 rounded-xl border border-slate-200 px-3" name="link" />
        </label>

        <div>
          <Button disabled={pending} type="submit">
            {pending ? t("sending") : t("send")}
          </Button>
        </div>

        {state.status === "success" && (
          <p
            className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800"
            role="status"
          >
            {t("success", { count: state.count })}
          </p>
        )}
        {state.status === "error" && (
          <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700" role="status">
            {t(`errors.${state.reason}`)}
          </p>
        )}
      </form>
    </Card>
  )
}
