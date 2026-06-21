import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const scoreMapSchema = z.record(z.string(), z.unknown()).default({})

const selfRowSchema = z.object({
  english_level: z.string().nullable(),
  full_name: z.string(),
  interests: z.array(z.string()),
  onboarded: z.boolean(),
  package_state: z.enum(["trial", "paid"]),
  pref_setting: z.string().nullable(),
  pref_size: z.string().nullable(),
  pref_state_or_region: z.string().nullable(),
  stage: z.string(),
  test_dates: scoreMapSchema,
  test_targets: scoreMapSchema,
})

export type TestField = "toefl" | "ssat" | "det"

export type StudentSelf = {
  readonly englishLevel: string
  readonly fullName: string
  readonly interests: readonly string[]
  readonly onboarded: boolean
  readonly packageState: "trial" | "paid"
  readonly prefSetting: string
  readonly prefSize: string
  readonly prefStateOrRegion: string
  readonly stage: string
  readonly testDates: Readonly<Record<TestField, string>>
  readonly testTargets: Readonly<Record<TestField, string>>
}

function field(map: Record<string, unknown>, key: TestField): string {
  const value = map[key]
  return value === undefined || value === null ? "" : String(value)
}

export async function getStudentSelf(): Promise<
  { kind: "ready"; self: StudentSelf } | { kind: "none" } | { kind: "configuration" | "error" }
> {
  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }
  const { data, error } = await supabase.rpc("get_student_self")
  if (error !== null) {
    return { kind: "error" }
  }
  const row = Array.isArray(data) ? data[0] : data
  if (row === undefined || row === null) {
    return { kind: "none" }
  }
  const parsed = selfRowSchema.safeParse(row)
  if (!parsed.success) {
    return { kind: "error" }
  }
  return {
    kind: "ready",
    self: {
      englishLevel: parsed.data.english_level ?? "",
      fullName: parsed.data.full_name,
      interests: parsed.data.interests,
      onboarded: parsed.data.onboarded,
      packageState: parsed.data.package_state,
      prefSetting: parsed.data.pref_setting ?? "",
      prefSize: parsed.data.pref_size ?? "",
      prefStateOrRegion: parsed.data.pref_state_or_region ?? "",
      stage: parsed.data.stage,
      testDates: {
        det: field(parsed.data.test_dates, "det"),
        ssat: field(parsed.data.test_dates, "ssat"),
        toefl: field(parsed.data.test_dates, "toefl"),
      },
      testTargets: {
        det: field(parsed.data.test_targets, "det"),
        ssat: field(parsed.data.test_targets, "ssat"),
        toefl: field(parsed.data.test_targets, "toefl"),
      },
    },
  }
}
