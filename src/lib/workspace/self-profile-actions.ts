"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuthenticatedUser } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"
import type { SelfProfileState } from "@/lib/workspace/self-profile-state"

const TEST_KEYS = ["toefl", "ssat", "det"] as const

const selfSchema = z.object({
  complete: z.string().optional(),
  detDate: z.string().max(20),
  detTarget: z.string().max(10),
  englishLevel: z.string().max(80),
  interests: z.string().max(2000),
  prefSetting: z.enum(["", "urban", "suburban", "rural"]),
  prefSize: z.enum(["", "small", "medium", "large"]),
  prefStateOrRegion: z.string().max(120),
  ssatDate: z.string().max(20),
  ssatTarget: z.string().max(10),
  toeflDate: z.string().max(20),
  toeflTarget: z.string().max(10),
})

const dateSchema = z.iso.date()

function parseInterests(value: string): string[] {
  const unique = new Map<string, string>()
  for (const item of value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)) {
    if (!unique.has(item.toLowerCase())) {
      unique.set(item.toLowerCase(), item)
    }
  }
  return [...unique.values()]
}

export async function studentUpdateSelfAction(
  locale: string,
  _previous: SelfProfileState,
  formData: FormData,
): Promise<SelfProfileState> {
  const authenticated = await requireAuthenticatedUser(locale)
  const parsed = selfSchema.safeParse(Object.fromEntries(formData))
  if (authenticated === null || authenticated.role !== "student" || !parsed.success) {
    return { status: "error" }
  }
  const supabase = await createClient()
  if (supabase === null) {
    return { status: "error" }
  }
  const value = parsed.data

  const rawTargets = { det: value.detTarget, ssat: value.ssatTarget, toefl: value.toeflTarget }
  const rawDates = { det: value.detDate, ssat: value.ssatDate, toefl: value.toeflDate }
  const targets: Record<string, number> = {}
  const dates: Record<string, string> = {}
  for (const key of TEST_KEYS) {
    const score = Number(rawTargets[key])
    if (rawTargets[key].trim() !== "" && Number.isFinite(score) && score >= 0 && score <= 1000) {
      targets[key] = score
    }
    if (dateSchema.safeParse(rawDates[key]).success) {
      dates[key] = rawDates[key]
    }
  }

  const { error } = await supabase.rpc("student_update_self", {
    new_english_level: value.englishLevel,
    new_interests: parseInterests(value.interests),
    new_pref_setting: value.prefSetting === "" ? null : value.prefSetting,
    new_pref_size: value.prefSize === "" ? null : value.prefSize,
    new_pref_state_or_region: value.prefStateOrRegion,
    new_test_dates: dates,
    new_test_targets: targets,
  })
  if (error !== null) {
    return { status: "error" }
  }

  if (value.complete === "true") {
    const { error: completeError } = await supabase.rpc("student_complete_onboarding")
    if (completeError !== null) {
      return { status: "error" }
    }
  }

  revalidatePath(`/${locale}/app/${authenticated.role}`)
  return { status: "saved" }
}
