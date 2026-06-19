import { beforeEach, describe, expect, it, vi } from "vitest"
import { parseAdminAnalyticsData } from "@/lib/analytics/admin-analytics-data"
import { getAdminAnalyticsData } from "@/lib/analytics/admin-analytics-query"

const createClientMock = vi.hoisted(() => vi.fn())

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}))

const validPayload = {
  activated_students: 5,
  at_risk_count: 2,
  conversion_percent: 60,
  paid_students: 6,
  recent_students: [
    {
      last_action: "Submitted school list",
      last_active_at: "2026-06-18T12:30:00+05:00",
      package_state: "paid",
      stage: "application",
      student_id: "11111111-1111-4111-8111-111111111111",
      student_name: "Amina Student",
    },
  ],
  stage_counts: {
    application: 2,
    diagnostic: 1,
    finalized: 1,
    list_building: 2,
    submitted: 1,
    trial: 3,
  },
  total_students: 10,
  trial_students: 4,
}

describe("admin analytics RPC boundary", () => {
  it("maps a valid RPC payload into readonly camelCase domain data", () => {
    // Given
    const payload = validPayload

    // When
    const result = parseAdminAnalyticsData(payload)

    // Then
    expect(result).toEqual({
      activatedStudents: 5,
      atRiskCount: 2,
      conversionPercent: 60,
      paidStudents: 6,
      recentStudents: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          lastAction: "Submitted school list",
          lastActiveAt: "2026-06-18T12:30:00+05:00",
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
    })
  })

  it("accepts the stable empty analytics payload", () => {
    // Given
    const payload = {
      activated_students: 0,
      at_risk_count: 0,
      conversion_percent: 0,
      paid_students: 0,
      recent_students: [],
      stage_counts: {
        application: 0,
        diagnostic: 0,
        finalized: 0,
        list_building: 0,
        submitted: 0,
        trial: 0,
      },
      total_students: 0,
      trial_students: 0,
    }

    // When
    const result = parseAdminAnalyticsData(payload)

    // Then
    expect(result).toEqual({
      activatedStudents: 0,
      atRiskCount: 0,
      conversionPercent: 0,
      paidStudents: 0,
      recentStudents: [],
      stageCounts: {
        application: 0,
        diagnostic: 0,
        finalized: 0,
        listBuilding: 0,
        submitted: 0,
        trial: 0,
      },
      totalStudents: 0,
      trialStudents: 0,
    })
  })

  it.each([
    ["negative count", { ...validPayload, total_students: -1 }],
    ["fractional count", { ...validPayload, conversion_percent: 12.5 }],
    [
      "incomplete stage counts",
      {
        ...validPayload,
        stage_counts: { ...validPayload.stage_counts, submitted: undefined },
      },
    ],
    [
      "malformed recent student",
      {
        ...validPayload,
        recent_students: [{ ...validPayload.recent_students[0], student_name: " " }],
      },
    ],
    [
      "too many recent students",
      {
        ...validPayload,
        recent_students: Array.from({ length: 9 }, (_, index) => ({
          ...validPayload.recent_students[0],
          student_id: `11111111-1111-4111-8111-11111111111${index}`,
        })),
      },
    ],
  ])("fails closed for %s", (_caseName, payload) => {
    // Given
    const rpcData: unknown = payload

    // When / Then
    expect(() => parseAdminAnalyticsData(rpcData)).toThrow()
  })
})

describe("admin analytics server query", () => {
  beforeEach(() => {
    createClientMock.mockReset()
  })

  it("returns ready domain data when the RPC succeeds", async () => {
    // Given
    const rpc = vi.fn().mockResolvedValue({ data: validPayload, error: null })
    createClientMock.mockResolvedValue({ rpc })

    // When
    const result = await getAdminAnalyticsData()

    // Then
    expect(result).toEqual({
      analytics: parseAdminAnalyticsData(validPayload),
      kind: "ready",
    })
    expect(rpc).toHaveBeenCalledOnce()
    expect(rpc).toHaveBeenCalledWith("get_admin_analytics")
  })

  it("returns configuration when the authenticated client is unavailable", async () => {
    // Given
    createClientMock.mockResolvedValue(null)

    // When
    const result = await getAdminAnalyticsData()

    // Then
    expect(result).toEqual({ kind: "configuration" })
  })

  it("returns error and ignores data when the RPC reports an error", async () => {
    // Given
    const rpc = vi.fn().mockResolvedValue({
      data: validPayload,
      error: new Error("RPC failed"),
    })
    createClientMock.mockResolvedValue({ rpc })

    // When
    const result = await getAdminAnalyticsData()

    // Then
    expect(result).toEqual({ kind: "error" })
  })

  it("returns error when successful RPC data is malformed", async () => {
    // Given
    const rpc = vi.fn().mockResolvedValue({
      data: { ...validPayload, stage_counts: null },
      error: null,
    })
    createClientMock.mockResolvedValue({ rpc })

    // When
    const result = await getAdminAnalyticsData()

    // Then
    expect(result).toEqual({ kind: "error" })
  })
})
