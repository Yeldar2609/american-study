import { Clock3 } from "lucide-react"
import { Card } from "@/components/ui/card"
import type {
  AdminAnalyticsRecentStudent,
  AnalyticsStage,
} from "@/lib/analytics/admin-analytics-data"

type AnalyticsActivityProps = {
  readonly empty: string
  readonly items: readonly AdminAnalyticsRecentStudent[]
  readonly locale: string
  readonly packageLabels: Readonly<Record<"paid" | "trial", string>>
  readonly stageLabels: Readonly<Record<AnalyticsStage, string>>
  readonly subtitle: string
  readonly title: string
  readonly updatedLabel: string
}

export function AnalyticsActivity({
  empty,
  items,
  locale,
  packageLabels,
  stageLabels,
  subtitle,
  title,
  updatedLabel,
}: AnalyticsActivityProps) {
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <Card aria-label={title} className="p-5 sm:p-7" role="region">
      <h2 className="text-xl font-black text-slate-950 sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      {items.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-600">{empty}</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {items.slice(0, 8).map((student) => (
            <li className="py-4 first:pt-0 last:pb-0" key={student.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-black text-slate-950">{student.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{updatedLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                    {stageLabels[student.stage]}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                    {packageLabels[student.packageState]}
                  </span>
                </div>
              </div>
              <time
                className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500"
                dateTime={student.lastActiveAt}
              >
                <Clock3 aria-hidden="true" className="size-3.5" />
                {dateFormatter.format(new Date(student.lastActiveAt))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
