"use client"

import { Megaphone } from "lucide-react"
import { useTranslations } from "next-intl"
import { useActionState, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { initialAssignTaskState } from "@/lib/workspace/assign-task-state"
import { adminBroadcastNotificationAction } from "@/lib/workspace/workflow-actions"

type StudentOption = {
  readonly id: string
  readonly name: string
}

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
  const [mode, setMode] = useState<"all" | "selected">("all")
  const [selected, setSelected] = useState<readonly string[]>([])
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return needle === ""
      ? students
      : students.filter((student) => student.name.toLocaleLowerCase().includes(needle))
  }, [query, students])

  const toggle = (id: string) =>
    setSelected((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    )

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
        <input name="mode" type="hidden" value={mode} />
        <input name="studentIds" type="hidden" value={selected.join(",")} />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold text-slate-700">{t("recipients")}</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                checked={mode === "all"}
                name="recipientMode"
                onChange={() => setMode("all")}
                type="radio"
              />
              {t("all", { count: students.length })}
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                checked={mode === "selected"}
                name="recipientMode"
                onChange={() => setMode("selected")}
                type="radio"
              />
              {t("choose")}
            </label>
          </div>
        </fieldset>

        {mode === "selected" && (
          <div className="grid gap-2">
            <Input
              aria-label={t("searchLabel")}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              type="search"
              value={query}
            />
            <p className="text-xs font-bold text-slate-500">
              {t("selectedCount", { count: selected.length })}
            </p>
            <div className="grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {filtered.length === 0 ? (
                <p className="px-1 py-2 text-sm text-slate-500">{t("noStudents")}</p>
              ) : (
                filtered.map((student) => (
                  <label
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 hover:bg-blue-50"
                    key={student.id}
                  >
                    <input
                      checked={selected.includes(student.id)}
                      onChange={() => toggle(student.id)}
                      type="checkbox"
                    />
                    {student.name}
                  </label>
                ))
              )}
            </div>
          </div>
        )}

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
