export type LeadFormState =
  | { readonly status: "idle" }
  | { readonly status: "success" }
  | { readonly status: "error" }

export const initialLeadFormState: LeadFormState = { status: "idle" }
