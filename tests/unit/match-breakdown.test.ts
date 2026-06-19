import { describe, expect, it } from "vitest"
import { bandForScore, MATCH_FACTORS, parseMatchBreakdown } from "@/lib/match/match-breakdown"

const validRow = {
  academic_fit: 64,
  aid_fit: 100,
  english_fit: 88,
  interests_fit: 52,
  overall: 73,
  preference_fit: 61,
}

describe("bandForScore", () => {
  it.each([
    [100, "strong"],
    [80, "strong"],
    [79, "good"],
    [60, "good"],
    [59, "fair"],
    [40, "fair"],
    [39, "weak"],
    [0, "weak"],
  ])("maps %i to the %s band", (score, band) => {
    expect(bandForScore(score)).toBe(band)
  })
})

describe("parseMatchBreakdown", () => {
  it("maps a single-row payload into ordered factors with bands", () => {
    // Given / When
    const result = parseMatchBreakdown([validRow])

    // Then
    expect(result.overall).toBe(73)
    expect(result.factors.map((factor) => factor.key)).toEqual([...MATCH_FACTORS])
    expect(result.factors).toEqual([
      { band: "strong", key: "english", score: 88 },
      { band: "good", key: "academic", score: 64 },
      { band: "fair", key: "interests", score: 52 },
      { band: "strong", key: "aid", score: 100 },
      { band: "good", key: "preference", score: 61 },
    ])
  })

  it.each([
    ["empty result set", []],
    ["a non-array payload", validRow],
    ["a fractional score", [{ ...validRow, english_fit: 88.5 }]],
    ["an out-of-range score", [{ ...validRow, aid_fit: 101 }]],
    ["a missing factor", [{ ...validRow, preference_fit: undefined }]],
    ["an unexpected extra key", [{ ...validRow, surprise: 1 }]],
  ])("throws for %s", (_caseName, payload) => {
    expect(() => parseMatchBreakdown(payload)).toThrow()
  })
})
