import { describe, expect, it } from "vitest"
import { resolveWorkspaceAccess } from "@/lib/workspace/feature-access"

const students = [
  { id: "11111111-1111-4111-8111-111111111111", packageState: "trial" as const },
  { id: "22222222-2222-4222-8222-222222222222", packageState: "paid" as const },
]

describe("resolveWorkspaceAccess", () => {
  it("locks a paid-only feature when a trial student is selected", () => {
    expect(resolveWorkspaceAccess(students, students[0]?.id, true)).toEqual({
      kind: "locked",
      studentId: "11111111-1111-4111-8111-111111111111",
    })
  })

  it("allows matched schools for a trial student", () => {
    expect(resolveWorkspaceAccess(students, students[0]?.id, false)).toEqual({
      kind: "ready",
      packageState: "trial",
      studentId: "11111111-1111-4111-8111-111111111111",
    })
  })

  it("allows paid-only features for a paid student", () => {
    expect(resolveWorkspaceAccess(students, students[1]?.id, true)).toEqual({
      kind: "ready",
      packageState: "paid",
      studentId: "22222222-2222-4222-8222-222222222222",
    })
  })

  it("rejects a student id outside the viewer's accessible list", () => {
    expect(resolveWorkspaceAccess(students, "33333333-3333-4333-8333-333333333333", false)).toEqual(
      { kind: "not_found" },
    )
  })
})
