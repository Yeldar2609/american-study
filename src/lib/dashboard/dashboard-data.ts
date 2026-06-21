import { z } from "zod"
import { getRequestAuth } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

const dashboardStudentSchema = z.object({
  completed_tasks: z.coerce.number().int().nonnegative(),
  diagnostic_summary: z.string().nullable(),
  next_task_due_date: z.string().nullable(),
  next_task_title: z.string().nullable(),
  overdue_tasks: z.coerce.number().int().nonnegative(),
  package_state: z.enum(["trial", "paid"]),
  stage: z.enum(["diagnostic", "trial", "list_building", "finalized", "application", "submitted"]),
  student_id: z.uuid(),
  student_name: z.string().min(1),
  total_tasks: z.coerce.number().int().nonnegative(),
})

const viewerSchema = z.object({
  full_name: z.string().min(1),
})

export type DashboardStudent = {
  readonly completedTasks: number
  readonly diagnosticSummary: string | null
  readonly id: string
  readonly name: string
  readonly nextTaskDueDate: string | null
  readonly nextTaskTitle: string | null
  readonly overdueTasks: number
  readonly packageState: "trial" | "paid"
  readonly stage:
    | "diagnostic"
    | "trial"
    | "list_building"
    | "finalized"
    | "application"
    | "submitted"
  readonly totalTasks: number
}

export type DashboardDataResult =
  | {
      readonly kind: "ready"
      readonly students: readonly DashboardStudent[]
      readonly viewerName: string
    }
  | { readonly kind: "configuration" | "error" }

export type DashboardMetrics = {
  readonly completedTasks: number
  readonly nextTask: {
    readonly dueDate: string | null
    readonly title: string
  } | null
  readonly overdueTasks: number
  readonly progressPercent: number | null
  readonly studentCount: number
  readonly totalTasks: number
  readonly unlockedStudentCount: number
}

export function summarizeDashboard(students: readonly DashboardStudent[]): DashboardMetrics {
  const totalTasks = students.reduce((total, student) => total + student.totalTasks, 0)
  const completedTasks = students.reduce((total, student) => total + student.completedTasks, 0)
  const overdueTasks = students.reduce((total, student) => total + student.overdueTasks, 0)
  const nextTasks = students.flatMap((student) =>
    student.nextTaskTitle === null
      ? []
      : [{ dueDate: student.nextTaskDueDate, title: student.nextTaskTitle }],
  )
  const datedNextTasks = nextTasks
    .filter((task) => task.dueDate !== null)
    .toSorted((left, right) => String(left.dueDate).localeCompare(String(right.dueDate)))

  return {
    completedTasks,
    nextTask: datedNextTasks[0] ?? nextTasks[0] ?? null,
    overdueTasks,
    progressPercent: totalTasks === 0 ? null : Math.round((completedTasks / totalTasks) * 100),
    studentCount: students.length,
    totalTasks,
    unlockedStudentCount: students.filter((student) => student.packageState === "paid").length,
  }
}

export async function getDashboardData(): Promise<DashboardDataResult> {
  const auth = await getRequestAuth()
  if (!auth.configured) {
    return { kind: "configuration" }
  }
  if (auth.user === null) {
    return { kind: "error" }
  }

  const supabase = await createClient()
  if (supabase === null) {
    return { kind: "configuration" }
  }

  const [viewerResult, studentResult] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", auth.user.id).maybeSingle(),
    supabase.rpc("get_dashboard_students"),
  ])
  const viewer = viewerSchema.safeParse(viewerResult.data)
  const students = z.array(dashboardStudentSchema).safeParse(studentResult.data)
  if (
    viewerResult.error !== null ||
    studentResult.error !== null ||
    !viewer.success ||
    !students.success
  ) {
    return { kind: "error" }
  }

  return {
    kind: "ready",
    students: students.data.map((student) => ({
      completedTasks: student.completed_tasks,
      diagnosticSummary: student.diagnostic_summary,
      id: student.student_id,
      name: student.student_name,
      nextTaskDueDate: student.next_task_due_date,
      nextTaskTitle: student.next_task_title,
      overdueTasks: student.overdue_tasks,
      packageState: student.package_state,
      stage: student.stage,
      totalTasks: student.total_tasks,
    })),
    viewerName: viewer.data.full_name,
  }
}
