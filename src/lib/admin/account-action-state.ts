export type AccountActionState = {
  readonly message: string
  readonly status: "idle" | "success" | "error"
}

export const initialAccountActionState: AccountActionState = { message: "none", status: "idle" }
