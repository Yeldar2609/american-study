import { z } from "zod"

// Login identity. Usernames are case-insensitive (citext in the DB); we
// normalize to lowercase when deriving the synthetic Supabase auth email so the
// derived login key is stable regardless of how the username was typed/stored.
const USERNAME_AUTH_DOMAIN = "users.american-study.internal"

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(/^[A-Za-z0-9._-]+$/)

// The Supabase auth email is synthetic and never receives mail — it exists only
// to give GoTrue a unique login key behind the username.
export function usernameToAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_AUTH_DOMAIN}`
}
