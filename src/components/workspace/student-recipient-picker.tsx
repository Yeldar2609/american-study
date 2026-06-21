"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"

export type StudentOption = {
  readonly id: string
  readonly name: string
}

export type RecipientPickerLabels = {
  readonly all: (count: number) => string
  readonly choose: string
  readonly noStudents: string
  readonly recipients: string
  readonly searchLabel: string
  readonly searchPlaceholder: string
  readonly selectedCount: (count: number) => string
}

// Shared recipient chooser for the admin task-assigner and notification-sender
// forms: an all/selected radio fieldset plus a searchable checkbox list, and the
// two hidden inputs (`mode`, comma-joined `studentIds`) the server actions read.
export function StudentRecipientPicker({
  labels,
  students,
}: {
  readonly labels: RecipientPickerLabels
  readonly students: readonly StudentOption[]
}) {
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
    <>
      <input name="mode" type="hidden" value={mode} />
      <input name="studentIds" type="hidden" value={selected.join(",")} />

      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold text-slate-700">{labels.recipients}</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              checked={mode === "all"}
              name="recipientMode"
              onChange={() => setMode("all")}
              type="radio"
            />
            {labels.all(students.length)}
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input
              checked={mode === "selected"}
              name="recipientMode"
              onChange={() => setMode("selected")}
              type="radio"
            />
            {labels.choose}
          </label>
        </div>
      </fieldset>

      {mode === "selected" && (
        <div className="grid gap-2">
          <Input
            aria-label={labels.searchLabel}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            type="search"
            value={query}
          />
          <p className="text-xs font-bold text-slate-500">
            {labels.selectedCount(selected.length)}
          </p>
          <div className="grid max-h-48 gap-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
            {filtered.length === 0 ? (
              <p className="px-1 py-2 text-sm text-slate-500">{labels.noStudents}</p>
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
    </>
  )
}
