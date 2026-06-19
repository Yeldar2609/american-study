import { readFileSync } from "node:fs"
import { cleanup, render, screen, within } from "@testing-library/react"
import { createTranslator } from "next-intl"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AdminAnalyticsView } from "@/components/admin/analytics/admin-analytics-view"

const localeState = vi.hoisted(() => ({ current: "en" as "en" | "ru" }))

vi.mock("next-intl/server", () => ({
  getTranslations: async ({
    locale,
    namespace,
  }: {
    readonly locale?: "en" | "ru"
    readonly namespace: string
  }) => {
    const selectedLocale = locale ?? localeState.current
    const messages = JSON.parse(readFileSync(`messages/${selectedLocale}.json`, "utf8")) as Record<
      string,
      unknown
    >
    return createTranslator({ locale: selectedLocale, messages, namespace })
  },
}))

const readyResult = {
  analytics: {
    activatedStudents: 5,
    atRiskCount: 2,
    conversionPercent: 60,
    paidStudents: 6,
    recentStudents: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        lastAction: "school_list_submitted",
        lastActiveAt: "2026-06-18T07:30:00.000Z",
        name: "Amina Student",
        packageState: "paid",
        stage: "application",
      },
    ],
    stageCounts: {
      application: 2,
      diagnostic: 1,
      finalized: 1,
      listBuilding: 2,
      submitted: 1,
      trial: 3,
    },
    totalStudents: 10,
    trialStudents: 4,
  },
  kind: "ready",
} as const

describe("admin analytics presentation", () => {
  beforeEach(() => {
    localeState.current = "en"
  })

  afterEach(cleanup)

  it("renders the six metric semantics, pipeline values, and localized recent activity", async () => {
    // Given
    const view = await AdminAnalyticsView({ locale: "en", result: readyResult })

    // When
    render(view)

    // Then
    expect(screen.getByRole("heading", { level: 1, name: "Agency analytics" })).toBeVisible()
    for (const [label, value] of [
      ["Total students", "10"],
      ["Trial students", "4"],
      ["Paid students", "6"],
      ["Trial to paid", "60%"],
      ["Activated", "5"],
      ["At risk", "2"],
    ] as const) {
      const metric = screen.getByRole("group", { name: label })
      expect(within(metric).getByText(value)).toBeVisible()
    }
    expect(screen.getByRole("heading", { name: "Pipeline by stage" })).toBeVisible()
    const recentActivity = screen.getByRole("region", { name: "Recent activity" })
    expect(within(recentActivity).getByText("Amina Student")).toBeVisible()
    expect(within(recentActivity).getByText("Student activity updated")).toBeVisible()
    expect(within(recentActivity).getByText("Application")).toBeVisible()
    expect(within(recentActivity).getByText("Paid")).toBeVisible()
    expect(recentActivity).not.toHaveTextContent("school_list_submitted")
    expect(document.body).not.toHaveTextContent(/adminAnalytics\./)
  })

  it("renders a dedicated recent-activity empty state when students exist", async () => {
    // Given
    const result = {
      ...readyResult,
      analytics: { ...readyResult.analytics, recentStudents: [] },
    }
    const view = await AdminAnalyticsView({ locale: "en", result })

    // When
    render(view)

    // Then
    expect(screen.getByText("No recent student activity has been recorded yet.")).toBeVisible()
  })

  it.each([
    [
      "empty",
      {
        ...readyResult,
        analytics: { ...readyResult.analytics, recentStudents: [], totalStudents: 0 },
      },
      "No student analytics yet",
    ],
    ["configuration", { kind: "configuration" }, "Analytics connection required"],
    ["error", { kind: "error" }, "Analytics are temporarily unavailable"],
  ] as const)("renders friendly %s copy", async (_caseName, result, expectedCopy) => {
    // Given
    const view = await AdminAnalyticsView({ locale: "en", result })

    // When
    render(view)

    // Then
    expect(screen.getByText(expectedCopy)).toBeVisible()
    expect(document.body).not.toHaveTextContent(/adminAnalytics\./)
  })

  it("renders genuine Russian headings and metric labels", async () => {
    // Given
    localeState.current = "ru"
    const view = await AdminAnalyticsView({ locale: "ru", result: readyResult })

    // When
    render(view)

    // Then
    expect(screen.getByRole("heading", { level: 1, name: "Аналитика агентства" })).toBeVisible()
    expect(screen.getByRole("group", { name: "Всего учеников" })).toBeVisible()
    expect(screen.getByRole("heading", { name: "Воронка по этапам" })).toBeVisible()
    expect(document.body).not.toHaveTextContent(/adminAnalytics\./)
  })
})
