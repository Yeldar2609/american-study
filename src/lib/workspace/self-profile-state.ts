export type SelfProfileState = { readonly status: "idle" | "saved" | "error" }

export const initialSelfProfileState: SelfProfileState = { status: "idle" }
