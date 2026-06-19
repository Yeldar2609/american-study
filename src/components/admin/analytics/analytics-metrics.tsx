import { Card } from "@/components/ui/card"

type MetricTone = "blue" | "cyan" | "green" | "rose"

type MetricItem = {
  readonly label: string
  readonly tone: MetricTone
  readonly value: string
}

const toneClasses = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  rose: "border-rose-100 bg-rose-50 text-rose-700",
} as const satisfies Record<MetricTone, string>

export function AnalyticsMetrics({ items }: { readonly items: readonly MetricItem[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <Card
          aria-label={item.label}
          className={`min-w-0 border p-4 sm:p-5 ${toneClasses[item.tone]}`}
          key={item.label}
          role="group"
        >
          <p className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {item.value}
          </p>
          <p className="mt-2 text-xs font-extrabold uppercase leading-5 tracking-[0.08em]">
            {item.label}
          </p>
        </Card>
      ))}
    </div>
  )
}
