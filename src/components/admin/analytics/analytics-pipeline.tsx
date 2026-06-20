import { Card } from "@/components/ui/card"
import type { AdminAnalyticsStageCounts } from "@/lib/analytics/admin-analytics-data"

type PipelineLabels = {
  readonly application: string
  readonly diagnostic: string
  readonly finalized: string
  readonly listBuilding: string
  readonly submitted: string
  readonly trial: string
}

// Six funnel stages, six deliberately distinct hues (Modern Civic family) so no
// two adjacent bars collapse together. Not a blanket cyan->blue swap.
const stages = [
  { key: "diagnostic", tone: "bg-blue-700" },
  { key: "trial", tone: "bg-sky-400" },
  { key: "listBuilding", tone: "bg-indigo-500" },
  { key: "finalized", tone: "bg-emerald-500" },
  { key: "application", tone: "bg-red-500" },
  { key: "submitted", tone: "bg-slate-700" },
] as const satisfies readonly {
  readonly key: keyof AdminAnalyticsStageCounts
  readonly tone: string
}[]

type AnalyticsPipelineProps = {
  readonly counts: AdminAnalyticsStageCounts
  readonly labels: PipelineLabels
  readonly subtitle: string
  readonly title: string
  readonly total: number
}

export function AnalyticsPipeline({
  counts,
  labels,
  subtitle,
  title,
  total,
}: AnalyticsPipelineProps) {
  return (
    <Card className="p-5 sm:p-7">
      <h2 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      <div className="mt-6 space-y-5">
        {stages.map((stage) => {
          const count = counts[stage.key]
          const width = total === 0 ? 0 : Math.round((count / total) * 100)
          return (
            <div key={stage.key}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-bold text-slate-700">{labels[stage.key]}</span>
                <span className="font-black tabular-nums text-slate-950">{count}</span>
              </div>
              <div
                aria-label={labels[stage.key]}
                aria-valuemax={total}
                aria-valuemin={0}
                aria-valuenow={count}
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
              >
                <div
                  className={`h-full rounded-full ${stage.tone}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
