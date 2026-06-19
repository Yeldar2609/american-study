import { ZodError } from "zod"
import {
  type AdminAnalyticsData,
  parseAdminAnalyticsData,
} from "@/lib/analytics/admin-analytics-data"
import { createClient } from "@/lib/supabase/server"

export type AdminAnalyticsDataResult =
  | {
      readonly analytics: AdminAnalyticsData
      readonly kind: "ready"
    }
  | { readonly kind: "configuration" | "error" }

export async function getAdminAnalyticsData(): Promise<AdminAnalyticsDataResult> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await supabase.rpc("get_admin_analytics")
  if (error !== null) {
    return { kind: "error" }
  }

  try {
    return {
      analytics: parseAdminAnalyticsData(data),
      kind: "ready",
    }
  } catch (parseError) {
    if (parseError instanceof ZodError) {
      return { kind: "error" }
    }
    throw parseError
  }
}
