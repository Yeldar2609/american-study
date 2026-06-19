import { z } from "zod"

const stageSchema = z.enum([
  "diagnostic",
  "trial",
  "list_building",
  "finalized",
  "application",
  "submitted",
])

const countSchema = z.number().int().nonnegative()

const stageCountsSchema = z
  .object({
    application: countSchema,
    diagnostic: countSchema,
    finalized: countSchema,
    list_building: countSchema,
    submitted: countSchema,
    trial: countSchema,
  })
  .strict()

const recentStudentSchema = z
  .object({
    last_action: z.string().trim().min(1),
    last_active_at: z.iso.datetime({ offset: true }),
    package_state: z.enum(["trial", "paid"]),
    stage: stageSchema,
    student_id: z.uuid(),
    student_name: z.string().trim().min(1),
  })
  .strict()

const adminAnalyticsRpcSchema = z
  .object({
    activated_students: countSchema,
    at_risk_count: countSchema,
    conversion_percent: countSchema,
    paid_students: countSchema,
    recent_students: z.array(recentStudentSchema).max(8),
    stage_counts: stageCountsSchema,
    total_students: countSchema,
    trial_students: countSchema,
  })
  .strict()

export type AnalyticsStage = z.infer<typeof stageSchema>

export type AdminAnalyticsStageCounts = {
  readonly application: number
  readonly diagnostic: number
  readonly finalized: number
  readonly listBuilding: number
  readonly submitted: number
  readonly trial: number
}

export type AdminAnalyticsRecentStudent = {
  readonly id: string
  readonly lastAction: string
  readonly lastActiveAt: string
  readonly name: string
  readonly packageState: "trial" | "paid"
  readonly stage: AnalyticsStage
}

export type AdminAnalyticsData = {
  readonly activatedStudents: number
  readonly atRiskCount: number
  readonly conversionPercent: number
  readonly paidStudents: number
  readonly recentStudents: readonly AdminAnalyticsRecentStudent[]
  readonly stageCounts: AdminAnalyticsStageCounts
  readonly totalStudents: number
  readonly trialStudents: number
}

export function parseAdminAnalyticsData(value: unknown): AdminAnalyticsData {
  const parsed = adminAnalyticsRpcSchema.parse(value)

  return {
    activatedStudents: parsed.activated_students,
    atRiskCount: parsed.at_risk_count,
    conversionPercent: parsed.conversion_percent,
    paidStudents: parsed.paid_students,
    recentStudents: parsed.recent_students.map((student) => ({
      id: student.student_id,
      lastAction: student.last_action,
      lastActiveAt: student.last_active_at,
      name: student.student_name,
      packageState: student.package_state,
      stage: student.stage,
    })),
    stageCounts: {
      application: parsed.stage_counts.application,
      diagnostic: parsed.stage_counts.diagnostic,
      finalized: parsed.stage_counts.finalized,
      listBuilding: parsed.stage_counts.list_building,
      submitted: parsed.stage_counts.submitted,
      trial: parsed.stage_counts.trial,
    },
    totalStudents: parsed.total_students,
    trialStudents: parsed.trial_students,
  }
}
