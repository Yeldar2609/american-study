// Pure constants for the application pipeline. Kept free of any server-only
// import so client components can use APPLICATION_STAGES without pulling in the
// Supabase server client.
export const APPLICATION_STAGES = [
  "not_started",
  "in_progress",
  "submitted",
  "interview",
  "accepted",
  "waitlisted",
  "rejected",
] as const

export type ApplicationStage = (typeof APPLICATION_STAGES)[number]
