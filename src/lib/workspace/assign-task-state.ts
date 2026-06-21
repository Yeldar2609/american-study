export type AssignTaskState =
  | { readonly status: "idle" }
  | { readonly status: "success"; readonly count: number }
  | {
      readonly status: "error"
      readonly reason: "validation" | "none" | "configuration" | "unexpected"
    }

export const initialAssignTaskState: AssignTaskState = { status: "idle" }
