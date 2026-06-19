import { AdminAnalyticsView } from "@/components/admin/analytics/admin-analytics-view"
import { getAdminAnalyticsData } from "@/lib/analytics/admin-analytics-query"

export async function AdminAnalytics({ locale }: { readonly locale: string }) {
  const result = await getAdminAnalyticsData()
  return <AdminAnalyticsView locale={locale} result={result} />
}
