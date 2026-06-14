export type AdminStudentActionState = {
  readonly status: "idle" | "success" | "error"
  readonly message:
    | "none"
    | "created"
    | "updated"
    | "packageUpdated"
    | "configuration"
    | "validation"
    | "duplicate"
    | "unexpected"
  readonly fieldErrors: Readonly<Record<string, readonly string[]>>
}

export const initialAdminStudentActionState: AdminStudentActionState = {
  fieldErrors: {},
  message: "none",
  status: "idle",
}
