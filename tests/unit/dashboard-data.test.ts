import { describe, expect, it } from "vitest"
import { type DashboardStudent, summarizeDashboard } from "@/lib/dashboard/dashboard-data"

function dashboardStudent(overrides: Partial<DashboardStudent> = {}): DashboardStudent {
  return {
    completedTasks: 0,
    diagnosticSummary: null,
    id: "00000000-0000-0000-0000-000000000100",
    name: "Student",
    nextTaskDueDate: null,
    nextTaskTitle: null,
    overdueTasks: 0,
    packageState: "paid",
    stage: "application",
    totalTasks: 0,
    ...overrides,
  }
}

describe("dashboard task metrics", () => {
  it("calculates approved-task progress from persisted task counts", () => {
    // Given
    const students = [
      dashboardStudent({ completedTasks: 2, totalTasks: 3 }),
      dashboardStudent({
        completedTasks: 1,
        id: "00000000-0000-0000-0000-000000000101",
        totalTasks: 2,
      }),
    ]

    // When
    const result = summarizeDashboard(students)

    // Then
    expect(result.progressPercent).toBe(60)
    expect(result.completedTasks).toBe(3)
    expect(result.totalTasks).toBe(5)
  })

  it("returns an honest empty state when no tasks exist", () => {
    // Given
    const students = [dashboardStudent()]

    // When
    const result = summarizeDashboard(students)

    // Then
    expect(result.progressPercent).toBeNull()
    expect(result.nextTask).toBeNull()
  })

  it("selects the earliest dated next task across linked students", () => {
    // Given
    const students = [
      dashboardStudent({
        nextTaskDueDate: "2026-07-10",
        nextTaskTitle: "Later task",
      }),
      dashboardStudent({
        id: "00000000-0000-0000-0000-000000000101",
        nextTaskDueDate: "2026-06-30",
        nextTaskTitle: "Earlier task",
      }),
    ]

    // When
    const result = summarizeDashboard(students)

    // Then
    expect(result.nextTask).toEqual({
      dueDate: "2026-06-30",
      title: "Earlier task",
    })
  })
})
