"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"
import { type ComparableSchool, useCompare } from "@/components/schools/compare/compare-context"
import { Card } from "@/components/ui/card"
import {
  MATCH_FACTORS,
  type MatchBreakdown,
  type MatchFactorKey,
} from "@/lib/match/match-breakdown"
import { getMatchBreakdownAction } from "@/lib/match/match-breakdown-actions"

type BreakdownState = MatchBreakdown | "error" | "loading"

export function SchoolComparison({
  showBreakdown,
  studentId,
}: {
  readonly showBreakdown: boolean
  readonly studentId: string
}) {
  const t = useTranslations("schools")
  const { clear, items, selected } = useCompare()
  const [breakdowns, setBreakdowns] = useState<Record<string, BreakdownState>>({})
  const requested = useRef(new Set<string>())

  useEffect(() => {
    let cancelled = false
    for (const id of selected) {
      if (requested.current.has(id)) {
        continue
      }
      requested.current.add(id)
      setBreakdowns((prev) => ({ ...prev, [id]: "loading" }))
      getMatchBreakdownAction({ schoolId: id, studentId }).then((result) => {
        if (cancelled) {
          return
        }
        setBreakdowns((prev) => ({
          ...prev,
          [id]: result.kind === "ready" ? result.breakdown : "error",
        }))
      })
    }
    return () => {
      cancelled = true
    }
  }, [selected, studentId])

  const columns = selected.flatMap((id) => {
    const item = items.find((candidate) => candidate.id === id)
    return item ? [item] : []
  })

  return (
    <section aria-labelledby="school-compare-heading" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-950" id="school-compare-heading">
          {t("compare.title")}
        </h2>
        {columns.length > 0 && (
          <button
            className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700"
            onClick={clear}
            type="button"
          >
            {t("compare.clear")}
          </button>
        )}
      </div>
      {columns.length === 0 ? (
        <Card className="mt-3 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
          <p className="leading-7 text-slate-600">{t("compare.hint")}</p>
        </Card>
      ) : (
        <Card className="mt-3 overflow-x-auto p-0">
          <ComparisonTable
            breakdowns={breakdowns}
            columns={columns}
            showBreakdown={showBreakdown}
          />
        </Card>
      )}
    </section>
  )
}

function ComparisonTable({
  breakdowns,
  columns,
  showBreakdown,
}: {
  readonly breakdowns: Record<string, BreakdownState>
  readonly columns: readonly ComparableSchool[]
  readonly showBreakdown: boolean
}) {
  const t = useTranslations("schools")
  const format = useFormatter()

  function factorScore(id: string, factor: MatchFactorKey): string {
    const state = breakdowns[id]
    if (state === undefined || state === "loading") {
      return t("compare.loading")
    }
    if (state === "error") {
      return "—"
    }
    const score = state.factors.find((entry) => entry.key === factor)?.score
    return score === undefined ? "—" : String(score)
  }

  const attributeRows: ReadonlyArray<{
    readonly key: string
    readonly label: string
    readonly value: (school: ComparableSchool) => string
  }> = [
    {
      key: "location",
      label: t("compare.rows.location"),
      value: (school) =>
        [school.city, school.state].filter(Boolean).join(", ") || t("notAvailable"),
    },
    {
      key: "tuition",
      label: t("compare.rows.tuition"),
      value: (school) =>
        school.tuition === null
          ? t("notAvailable")
          : format.number(school.tuition, { currency: "USD", style: "currency" }),
    },
    {
      key: "enrollment",
      label: t("compare.rows.enrollment"),
      value: (school) =>
        school.enrollment === null ? t("notAvailable") : format.number(school.enrollment),
    },
    {
      key: "aid",
      label: t("compare.rows.aid"),
      value: (school) =>
        school.financialAid === null
          ? t("compare.aid.unknown")
          : school.financialAid
            ? t("compare.aid.yes")
            : t("compare.aid.no"),
    },
    {
      key: "setting",
      label: t("compare.rows.setting"),
      value: (school) => (school.setting ? t(`settings.${school.setting}`) : t("notAvailable")),
    },
    {
      key: "body",
      label: t("compare.rows.body"),
      value: (school) => (school.body ? t(`bodies.${school.body}`) : t("notAvailable")),
    },
    {
      key: "deadline",
      label: t("compare.rows.deadline"),
      value: (school) => school.saoDeadline ?? t("notAvailable"),
    },
    {
      key: "strengths",
      label: t("compare.rows.strengths"),
      value: (school) =>
        school.strengths.length > 0 ? school.strengths.join(", ") : t("notAvailable"),
    },
    {
      key: "status",
      label: t("compare.rows.status"),
      value: (school) => t(`admin.statuses.${school.status}`),
    },
    {
      key: "saved",
      label: t("compare.rows.saved"),
      value: (school) => (school.starred ? t("yes") : t("no")),
    },
    {
      key: "shortlist",
      label: t("compare.rows.shortlist"),
      value: (school) => (school.shortlisted ? t("yes") : t("no")),
    },
  ]

  const headCell = "border-b border-slate-200 p-3 align-top text-sm font-black text-slate-900"
  const rowHead =
    "border-b border-slate-100 p-3 text-left align-top text-sm font-bold text-slate-500"
  const cell = "border-b border-slate-100 p-3 align-top text-sm font-bold text-slate-800"

  return (
    <table className="w-full min-w-[34rem] border-collapse text-left">
      <caption className="sr-only">{t("compare.title")}</caption>
      <thead>
        <tr>
          <th className={headCell} scope="col">
            <span className="sr-only">{t("compare.attribute")}</span>
          </th>
          {columns.map((school) => (
            <th className={headCell} key={school.id} scope="col">
              {school.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th className={rowHead} scope="row">
            {t("compare.rows.match")}
          </th>
          {columns.map((school) => (
            <td className={cell} key={school.id}>
              {t("match", { percent: school.matchPercent })}
            </td>
          ))}
        </tr>
        {showBreakdown &&
          MATCH_FACTORS.map((factor) => (
            <tr key={factor}>
              <th className={rowHead} scope="row">
                {t(`breakdown.factors.${factor}`)}
              </th>
              {columns.map((school) => (
                <td className={cell} key={school.id}>
                  {factorScore(school.id, factor)}
                </td>
              ))}
            </tr>
          ))}
        {attributeRows.map((row) => (
          <tr key={row.key}>
            <th className={rowHead} scope="row">
              {row.label}
            </th>
            {columns.map((school) => (
              <td className={cell} key={school.id}>
                {row.value(school)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
