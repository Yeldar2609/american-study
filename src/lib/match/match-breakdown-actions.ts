"use server"

import { z } from "zod"
import { type MatchBreakdown, parseMatchBreakdown } from "@/lib/match/match-breakdown"
import { createClient } from "@/lib/supabase/server"

export type MatchBreakdownResult =
  | { readonly breakdown: MatchBreakdown; readonly kind: "ready" }
  | { readonly kind: "configuration" | "error" | "locked" }

const inputSchema = z.object({
  schoolId: z.uuid(),
  studentId: z.uuid(),
})

export type MatchBreakdownInput = z.infer<typeof inputSchema>

// Reads are gated in the database: get_match_breakdown raises SQLSTATE 42501
// (insufficient_privilege) for viewers who are not unlocked, which we surface
// as "locked" so trial students never see a breakdown even via a direct call.
export async function getMatchBreakdownAction(
  input: MatchBreakdownInput,
): Promise<MatchBreakdownResult> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    return { kind: "error" }
  }

  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const { data, error } = await supabase.rpc("get_match_breakdown", {
    target_school_id: parsed.data.schoolId,
    target_student_id: parsed.data.studentId,
  })
  if (error !== null) {
    return { kind: error.code === "42501" ? "locked" : "error" }
  }

  try {
    return { breakdown: parseMatchBreakdown(data), kind: "ready" }
  } catch {
    return { kind: "error" }
  }
}
