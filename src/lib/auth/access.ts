import { z } from "zod"

export const userRoles = ["student", "parent", "admin"] as const
export type UserRole = (typeof userRoles)[number]
export const userLanguages = ["en", "ru"] as const
export type UserLanguage = (typeof userLanguages)[number]

const userProfileSchema = z.object({
  language: z.enum(userLanguages),
  role: z.enum(userRoles),
})
export type UserProfile = Readonly<z.infer<typeof userProfileSchema>>

export function parseUserProfile(value: unknown): UserProfile | null {
  const result = userProfileSchema.safeParse(value)
  return result.success ? result.data : null
}

export function parseUserRole(value: unknown): UserRole | null {
  switch (value) {
    case "student":
    case "parent":
    case "admin":
      return value
    default:
      return null
  }
}

export function safeRedirectPath(value: string | null, fallback: string): string {
  if (value === null || !value.startsWith("/")) {
    return fallback
  }

  try {
    const decoded = decodeURIComponent(value)
    const base = new URL("https://american-study.invalid")
    const destination = new URL(decoded, base)

    return destination.origin === base.origin && !decoded.includes("\\") ? value : fallback
  } catch {
    return fallback
  }
}

export function roleHomePath(locale: string, role: UserRole): string {
  return `/${locale}/app/${role}`
}

export function authorizedRoleDestination(
  locale: string,
  actual: UserRole | null,
  expected: UserRole,
): string | null {
  if (actual === null) {
    return `/${locale}/setup-required`
  }

  return actual === expected ? null : roleHomePath(locale, actual)
}

export function callbackDestination(
  locale: string,
  exchangeError: string | null,
  requestedNext: string | null,
): string {
  if (exchangeError !== null) {
    return `/${locale}/auth/error?code=callback`
  }

  return safeRedirectPath(requestedNext, `/${locale}/app`)
}
