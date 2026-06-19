import { z } from "zod"

export const MATCH_FACTORS = ["english", "academic", "interests", "aid", "preference"] as const

export type MatchFactorKey = (typeof MATCH_FACTORS)[number]

export type MatchBand = "strong" | "good" | "fair" | "weak"

export type MatchFactor = {
  readonly band: MatchBand
  readonly key: MatchFactorKey
  readonly score: number
}

export type MatchBreakdown = {
  readonly factors: readonly MatchFactor[]
  readonly overall: number
}

const scoreSchema = z.coerce.number().int().min(0).max(100)

const breakdownRowSchema = z
  .object({
    academic_fit: scoreSchema,
    aid_fit: scoreSchema,
    english_fit: scoreSchema,
    interests_fit: scoreSchema,
    overall: scoreSchema,
    preference_fit: scoreSchema,
  })
  .strict()

// Score-to-band thresholds. Kept here (not in the RPC) so the explanatory copy
// stays localizable in next-intl and unit-testable without a database.
export function bandForScore(score: number): MatchBand {
  if (score >= 80) {
    return "strong"
  }
  if (score >= 60) {
    return "good"
  }
  if (score >= 40) {
    return "fair"
  }
  return "weak"
}

// get_match_breakdown is a `returns table (...)` RPC, so PostgREST returns an
// array with a single row. Fails closed on malformed or empty payloads.
export function parseMatchBreakdown(value: unknown): MatchBreakdown {
  const rows = z.array(breakdownRowSchema).parse(value)
  const row = rows[0]
  if (row === undefined) {
    throw new Error("Match breakdown returned no rows")
  }

  const scores: Record<MatchFactorKey, number> = {
    academic: row.academic_fit,
    aid: row.aid_fit,
    english: row.english_fit,
    interests: row.interests_fit,
    preference: row.preference_fit,
  }

  return {
    factors: MATCH_FACTORS.map((key) => ({
      band: bandForScore(scores[key]),
      key,
      score: scores[key],
    })),
    overall: row.overall,
  }
}
