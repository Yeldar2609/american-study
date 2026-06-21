"use client"

import { useTranslations } from "next-intl"
import { useActionState, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialAssignTaskState } from "@/lib/workspace/assign-task-state"
import { adminAssignTaskAction } from "@/lib/workspace/workflow-actions"

type StudentOption = {
  readonly id: string
  readonly name: string
}

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
    <details className="mt-6 rounded-3xl border border-blue-100 bg-white p-5">
      <summary className="cursor-pointer text-lg font-black text-blue-800">
        {t("assign.title")}
      </summary>
      <form action={formAction} className="mt-4 grid gap-3">
        <input name="mode" type="hidden" value={mode} />
        <input name="studentIds" type="hidden" value={selected.join(",")} />

        <fieldset className="grid gap-2">
          <legend className="text-sm font-bold text-slate-700">{t("assign.recipients")}</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                checked={mode === "all"}
                name="recipientMode"
                onChange={() => setMode("all")}
                type="radio"
              />
              {t("assign.all", { count: students.length })}
            </label>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <input
                checked={mode === "selected"}
                name="recipientMode"
                onChange={() => setMode("selected")}
                type="radio"
              />
              {t("assign.choose")}
            </label>
          </div>
        </fieldset>

        {mode === "selected" && (
          <div className="grid gap-2">
            <Input
              aria-label={t("assign.searchLabel")}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("assign.searchPlaceholder")}
              type="search"
              value={query}
            />
            <p className="text-xs font-bold text-slate-500">
              {t("assign.selectedCount", { count: selected.length })}
            </p>
            <div className="grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {filtered.length === 0 ? (
                <p className="px-1 py-2 text-sm text-slate-500">{t("assign.noStudents")}</p>
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
