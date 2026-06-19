import { getTranslations } from "next-intl/server"
import { AnalyticsActivity } from "@/components/admin/analytics/analytics-activity"
import { AnalyticsMetrics } from "@/components/admin/analytics/analytics-metrics"
import { AnalyticsPipeline } from "@/components/admin/analytics/analytics-pipeline"
import { Card } from "@/components/ui/card"
import type { AdminAnalyticsDataResult } from "@/lib/analytics/admin-analytics-query"

type AdminAnalyticsViewProps = {
  readonly locale: string
  readonly result: AdminAnalyticsDataResult
}

export async function AdminAnalyticsView({ locale, result }: AdminAnalyticsViewProps) {
  const t = await getTranslations({ locale, namespace: "adminAnalytics" })

  if (result.kind !== "ready") {
    const state = result.kind === "configuration" ? "configuration" : "error"
    return (
      <Card className="mt-8 border-amber-200 bg-amber-50 p-6 sm:p-8">
        <h1 className="text-2xl font-black text-amber-950">{t(`${state}.title`)}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-amber-900">{t(`${state}.body`)}</p>
      </Card>
    )
  }

  if (result.analytics.totalStudents === 0) {
    return (
      <section className="mt-8">
        <AnalyticsHeader eyebrow={t("eyebrow")} subtitle={t("subtitle")} title={t("title")} />
        <Card className="mt-8 border-dashed border-blue-200 bg-blue-50/60 p-8 text-center">
          <h2 className="text-xl font-black text-slate-950">{t("empty.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">{t("empty.body")}</p>
        </Card>
      </section>
    )
  }

  const { analytics } = result
  return (
    <section className="mt-8">
      <AnalyticsHeader eyebrow={t("eyebrow")} subtitle={t("subtitle")} title={t("title")} />
      <AnalyticsMetrics
        items={[
          { label: t("metrics.total"), tone: "blue", value: String(analytics.totalStudents) },
          { label: t("metrics.trial"), tone: "cyan", value: String(analytics.trialStudents) },
          { label: t("metrics.paid"), tone: "green", value: String(analytics.paidStudents) },
          {
            label: t("metrics.conversion"),
            tone: "blue",
            value: `${analytics.conversionPercent}%`,
          },
          {
            label: t("metrics.activated"),
            tone: "green",
            value: String(analytics.activatedStudents),
          },
          { label: t("metrics.atRisk"), tone: "rose", value: String(analytics.atRiskCount) },
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <AnalyticsPipeline
          counts={analytics.stageCounts}
          labels={{
            application: t("stages.application"),
            diagnostic: t("stages.diagnostic"),
            finalized: t("stages.finalized"),
            listBuilding: t("stages.listBuilding"),
            submitted: t("stages.submitted"),
            trial: t("stages.trial"),
          }}
          subtitle={t("pipeline.subtitle")}
          title={t("pipeline.title")}
          total={analytics.totalStudents}
        />
        <AnalyticsActivity
          empty={t("recent.empty")}
          items={analytics.recentStudents}
          locale={locale}
          packageLabels={{ paid: t("packages.paid"), trial: t("packages.trial") }}
          stageLabels={{
            application: t("stages.application"),
            diagnostic: t("stages.diagnostic"),
            finalized: t("stages.finalized"),
            list_building: t("stages.listBuilding"),
            submitted: t("stages.submitted"),
            trial: t("stages.trial"),
          }}
          subtitle={t("recent.subtitle")}
          title={t("recent.title")}
          updatedLabel={t("recent.updated")}
        />
      </div>
    </section>
  )
}

function AnalyticsHeader({
  eyebrow,
  subtitle,
  title,
}: {
  readonly eyebrow: string
  readonly subtitle: string
  readonly title: string
}) {
  return (
    <header>
      <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-blue-700">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">{subtitle}</p>
    </header>
  )
}
