"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useId, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type CalendarTask = {
  readonly description: string | null
  readonly dueDate: string | null
  readonly id: string
  readonly section: string
  readonly status: string
  readonly title: string
}

type TaskAction = (formData: FormData) => void | Promise<void>

type CalendarBoardProps = {
  readonly canEdit: boolean
  readonly deleteAction: TaskAction
  readonly saveAction: TaskAction
  readonly tasks: readonly CalendarTask[]
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

export function CalendarBoard({ canEdit, deleteAction, saveAction, tasks }: CalendarBoardProps) {
  const t = useTranslations("calendar")
  const locale = useLocale()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [editing, setEditing] = useState<string | null>(null)
  // Date pre-seeded into the editor when a calendar day is clicked to add a task.
  const [newDate, setNewDate] = useState<string | null>(null)

  const openNewTask = (date: string | null) => {
    setNewDate(date)
    setEditing("new")
  }

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarTask[]>()
    for (const task of tasks) {
      if (task.dueDate === null) {
        continue
      }
      const list = map.get(task.dueDate) ?? []
      list.push(task)
      map.set(task.dueDate, list)
    }
    return map
  }, [tasks])

  const unscheduled = tasks.filter((task) => task.dueDate === null)
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(year, month, 1),
  )
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(new Date(2024, 0, 7 + index)),
  )
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: ReadonlyArray<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setEditing(null)
    setNewDate(null)
  }

  const editingTask =
    editing !== null && editing !== "new"
      ? (tasks.find((task) => task.id === editing) ?? null)
      : null

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            aria-label={t("prevMonth")}
            onClick={() => shiftMonth(-1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Button>
          <h2 className="min-w-44 text-center text-xl font-black text-slate-950">{monthLabel}</h2>
          <Button
            aria-label={t("nextMonth")}
            onClick={() => shiftMonth(1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </Button>
        </div>
        {canEdit && (
          <Button onClick={() => openNewTask(null)} type="button">
            {t("addTask")}
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200">
        {weekdays.map((label) => (
          <div
            className="bg-slate-50 p-2 text-center text-xs font-black uppercase text-slate-500"
            key={label}
          >
            {label}
          </div>
        ))}
        {cells.map((day, index) => {
          if (day === null) {
            return <div className="min-h-24 bg-white" key={`blank-${index}`} />
          }
          const key = `${year}-${pad(month + 1)}-${pad(day)}`
          const dayTasks = byDay.get(key) ?? []
          const isToday =
            day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const dayBadgeClass = `inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${
            isToday ? "bg-blue-600 text-white" : "text-slate-500"
          }`
          return (
            <div className="min-h-24 bg-white p-1.5" key={key}>
              {canEdit ? (
                <button
                  aria-label={t("addOnDate", { date: key })}
                  className={`${dayBadgeClass} transition hover:bg-blue-100 ${
                    isToday ? "hover:bg-blue-700" : ""
                  }`}
                  onClick={() => openNewTask(key)}
                  type="button"
                >
                  {day}
                </button>
              ) : (
                <span className={dayBadgeClass}>{day}</span>
              )}
              <div className="mt-1 grid gap-1">
                {dayTasks.map((task) =>
                  canEdit ? (
                    <button
                      className="truncate rounded-md bg-blue-50 px-1.5 py-1 text-left text-xs font-bold text-blue-800"
                      key={task.id}
                      onClick={() => setEditing(task.id)}
                      type="button"
                    >
                      {task.title}
                    </button>
                  ) : (
                    <span
                      className="block truncate rounded-md bg-blue-50 px-1.5 py-1 text-xs font-bold text-blue-800"
                      key={task.id}
                    >
                      {task.title}
                    </span>
                  ),
                )}
              </div>
            </div>
          )
        })}
      </div>

      {canEdit && editing !== null && (
        <TaskEditor
          defaultDueDate={newDate ?? undefined}
          deleteAction={deleteAction}
          key={editing === "new" ? `new-${newDate ?? "none"}` : editing}
          onCancel={() => {
            setEditing(null)
            setNewDate(null)
          }}
          saveAction={saveAction}
          task={editingTask}
        />
      )}

      <div className="mt-6">
        <h3 className="text-sm font-black uppercase tracking-wide text-slate-500">
          {t("unscheduled")}
        </h3>
        {unscheduled.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">{t("noUnscheduled")}</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {unscheduled.map((task) =>
              canEdit ? (
                <button
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700"
                  key={task.id}
                  onClick={() => setEditing(task.id)}
                  type="button"
                >
                  {task.title}
                </button>
              ) : (
                <span
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700"
                  key={task.id}
                >
                  {task.title}
                </span>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TaskEditor({
  defaultDueDate,
  deleteAction,
  onCancel,
  saveAction,
  task,
}: {
  readonly defaultDueDate?: string | undefined
  readonly deleteAction: TaskAction
  readonly onCancel: () => void
  readonly saveAction: TaskAction
  readonly task: CalendarTask | null
}) {
  const t = useTranslations("calendar")
  const fieldId = useId()
  return (
    <Card className="mt-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-950">
          {task === null ? t("addTask") : t("editTask")}
        </h3>
        <Button onClick={onCancel} type="button" variant="ghost">
          {t("cancel")}
        </Button>
      </div>
      <form action={saveAction} className="mt-4 grid gap-3">
        {task !== null && <input name="taskId" type="hidden" value={task.id} />}
        <label className="grid gap-1 text-sm font-bold text-slate-700" htmlFor={`${fieldId}-title`}>
          {t("taskTitle")}
          <Input defaultValue={task?.title ?? ""} id={`${fieldId}-title`} name="title" required />
        </label>
        <label
          className="grid gap-1 text-sm font-bold text-slate-700"
          htmlFor={`${fieldId}-section`}
        >
          {t("taskSection")}
          <Input defaultValue={task?.section ?? ""} id={`${fieldId}-section`} name="section" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700" htmlFor={`${fieldId}-due`}>
          {t("taskDueDate")}
          <Input
            defaultValue={task?.dueDate ?? defaultDueDate ?? ""}
            id={`${fieldId}-due`}
            name="dueDate"
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700" htmlFor={`${fieldId}-notes`}>
          {t("taskNotes")}
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 p-3"
            defaultValue={task?.description ?? ""}
            id={`${fieldId}-notes`}
            name="description"
          />
        </label>
        <div>
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
      {task !== null && (
        <form action={deleteAction} className="mt-3">
          <input name="taskId" type="hidden" value={task.id} />
          <Button type="submit" variant="danger">
            {t("delete")}
          </Button>
        </form>
      )}
    </Card>
  )
}
