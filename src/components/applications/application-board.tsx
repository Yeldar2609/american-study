"use client"

import { CalendarClock, ExternalLink } from "lucide-react"
import { useFormatter, useTranslations } from "next-intl"
import { useId } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { ApplicationBoardItem } from "@/lib/workspace/application-board-data"
import { APPLICATION_STAGES } from "@/lib/workspace/application-stage"

type Action = (formData: FormData) => void | Promise<void>

export function ApplicationBoard({
  canEdit,
  items,
  saveAction,
  studentId,
}: {
  readonly canEdit: boolean
  readonly items: readonly ApplicationBoardItem[]
  readonly saveAction: Action
  readonly studentId: string
}) {
  return (
    <div className="mt-6 grid gap-3">
      {items.map((item) => (
        <SchoolRow
          canEdit={canEdit}
          item={item}
          key={item.schoolId}
          saveAction={saveAction}
          studentId={studentId}
        />
      ))}
    </div>
  )
}

function SchoolRow({
  canEdit,
  item,
  saveAction,
  studentId,
}: {
  readonly canEdit: boolean
  readonly item: ApplicationBoardItem
  readonly saveAction: Action
  readonly studentId: string
}) {
  const t = useTranslations("applicationBoard")
  const format = useFormatter()
  const fieldId = useId()
  const location = [item.city, item.state].filter(Boolean).join(", ")

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-black text-slate-950">{item.schoolName}</h3>
          {location !== "" && <p className="mt-0.5 text-sm text-slate-500">{location}</p>}
          <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-slate-600">
            <CalendarClock aria-hidden="true" className="size-4 text-blue-700" />
            {item.saoDeadline === null
              ? t("noDeadline")
              : t("deadline", {
                  date: format.dateTime(new Date(`${item.saoDeadline}T00:00:00`), {
                    dateStyle: "medium",
                  }),
                })}
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
          {t(`stages.${item.stage}`)}
        </span>
      </div>

      {item.portalUrl !== null && (
        <a
          className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-blue-700"
          href={item.portalUrl}
          rel="noreferrer"
          target="_blank"
        >
          {t("portal")}
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      )}

      {canEdit && (
        <form
          action={saveAction}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <input name="studentId" type="hidden" value={studentId} />
          <input name="schoolId" type="hidden" value={item.schoolId} />
          <label
            className="grid gap-1 text-xs font-bold text-slate-500"
            htmlFor={`${fieldId}-stage`}
          >
            {t("stageLabel")}
            <select
              className="min-h-11 rounded-xl border border-slate-200 px-3"
              defaultValue={item.stage}
              id={`${fieldId}-stage`}
              name="stage"
            >
              {APPLICATION_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {t(`stages.${stage}`)}
                </option>
              ))}
            </select>
          </label>
          <label
            className="grid gap-1 text-xs font-bold text-slate-500"
            htmlFor={`${fieldId}-portal`}
          >
            {t("portalLabel")}
            <input
              className="min-h-11 rounded-xl border border-slate-200 px-3"
              defaultValue={item.portalUrl ?? ""}
              id={`${fieldId}-portal`}
              name="portalUrl"
              type="url"
            />
          </label>
          <Button type="submit" variant="secondary">
            {t("save")}
          </Button>
        </form>
      )}
    </Card>
  )
}
