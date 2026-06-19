export type AccessibleStudent = {
  readonly id: string
  readonly packageState: "trial" | "paid"
}

export type WorkspaceAccess =
  | { readonly kind: "empty" | "not_found" }
  | { readonly kind: "locked"; readonly studentId: string }
  | {
      readonly kind: "ready"
      readonly packageState: "trial" | "paid"
      readonly studentId: string
    }

export function resolveWorkspaceAccess(
  students: readonly AccessibleStudent[],
  requestedStudentId: string | undefined,
  paidOnly: boolean,
): WorkspaceAccess {
  if (students.length === 0) {
    return { kind: "empty" }
  }

  const selected =
    requestedStudentId === undefined
      ? students[0]
      : students.find((student) => student.id === requestedStudentId)

  if (selected === undefined) {
    return { kind: "not_found" }
  }

  if (paidOnly && selected.packageState === "trial") {
    return { kind: "locked", studentId: selected.id }
  }

  return {
    kind: "ready",
    packageState: selected.packageState,
    studentId: selected.id,
  }
}
