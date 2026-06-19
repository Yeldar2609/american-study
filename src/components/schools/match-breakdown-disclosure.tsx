"use client"

import { useTranslations } from "next-intl"
import { useId, useState, useTransition } from "react"
import type { MatchBreakdown } from "@/lib/match/match-breakdown"
import {
  getMatchBreakdownAction,
  type MatchBreakdownResult,
} from "@/lib/match/match-breakdown-actions"

type MatchBreakdownDisclosureProps = {
  readonly schoolId: string
  readonly studentId: string
}

export function MatchBreakdownDisclosure({ schoolId, studentId }: MatchBreakdownDisclosureProps) {
  const t = useTranslations("schools")
  const regionId = useId()
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<MatchBreakdownResult | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && result === null) {
      startTransition(async () => {
        setResult(await getMatchBreakdownAction({ schoolId, studentId }))
      })
    }
  }

  return (
    <div className="mt-5">
      <button
        aria-controls={regionId}
        aria-expanded={open}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-blue-700"
        onClick={toggle}
        type="button"
      >
        {t(open ? "breakdown.hide" : "breakdown.toggle")}
      </button>
      {open && (
        <div className="mt-3" id={regionId}>
          {isPending && <p className="text-sm text-slate-500">{t("breakdown.loading")}</p>}
          {!isPending && result?.kind === "ready" && <BreakdownList breakdown={result.breakdown} />}
          {!isPending && result !== null && result.kind !== "ready" && (
            <p className="text-sm text-slate-500">{t("breakdown.error")}</p>
          )}
        </div>
      )}
    </div>
  )
}

function BreakdownList({ breakdown }: { readonly breakdown: MatchBreakdown }) {
  const t = useTranslations("schools")
  return (
    <dl className="space-y-3">
      {breakdown.factors.map((factor) => {
        const label = t(`breakdown.factors.${factor.key}`)
        return (
          <div key={factor.key}>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm font-black text-slate-800">{label}</dt>
              <dd className="text-sm font-black text-slate-900">{factor.score}</dd>
            </div>
            <div aria-hidden className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ inlineSize: `${factor.score}%` }}
              />
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {t(`breakdown.bands.${factor.band}`, { factor: label })}
            </p>
          </div>
        )
      })}
    </dl>
  )
}
