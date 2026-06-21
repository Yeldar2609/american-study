export type AppSettingActionState = {
  readonly message: string
  readonly status: "idle" | "success" | "error"
}

export const initialAppSettingActionState: AppSettingActionState = {
  message: "none",
  status: "idle",
}
