import { z } from "zod"

export const userRoles = ["student", "parent", "admin"] as const
export type UserRole = (typeof userRoles)[number]
export const userLanguages = ["en", "ru", "kk"] as const
export type UserLanguage = (typeof userLanguages)[number]

// Single source of truth for which workspace sections each role may reach, in
// sidebar order. The sidebar renders directly from this and the dashboard
// normalizes an incoming ?section against it, so the two can never drift.
export const ROLE_SECTIONS: Record<UserRole, readonly string[]> = {
  admin: [
    "home",
    "people",
    "leads",
    "rankings",
    "schools",
    "applications",
    "essays",
    "interview",
    "report",
    "resources",
    "settings",
  ],
  // Parents see the family's progress, not the school catalog.
  parent: [
    "home",
    "roadmap",
    "calendar",
    "applications",
    "essays",
    "interview",
    "bookings",
    "report",
    "resources",
  ],
  student: [
    "home",
    "roadmap",
    "calendar",
    "schools",
    "applications",
    "essays",
    "interview",
    "bookings",
    "resources",
  ],
}

const userProfileSchema = z.object({
  language: z.enum(userLanguages),
  role: z.enum(userRoles),
})
export type UserProfile = Readonly<z.infer<typeof userProfileSchema>>

const legacyTransitionProfileSchema = z
  .object({
    app_metadata: z.object({
      role: z.enum(userRoles),
    }),
    email: z.string().email(),
    id: z.string().uuid(),
    user_metadata: z.object({
      full_name: z.string().trim().min(1).max(200),
      language: z.enum(userLanguages),
    }),
  })
  .transform(({ app_metadata, email, id, user_metadata }) => ({
    email,
    full_name: user_metadata.full_name,
    id,
    language: user_metadata.language,
    role: app_metadata.role,
  }))
export type LegacyTransitionProfile = Readonly<z.infer<typeof legacyTransitionProfileSchema>>

export function parseUserProfile(value: unknown): UserProfile | null {
  const result = userProfileSchema.safeParse(value)
  return result.success ? result.data : null
}

export function parseLegacyTransitionProfile(value: unknown): LegacyTransitionProfile | null {
  const result = legacyTransitionProfileSchema.safeParse(value)
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

export function authenticatedRoleDestination(
  requestedLocale: string,
  profile: UserProfile | null,
  expected: UserRole,
): string | null {
  if (profile === null) {
    return `/${requestedLocale}/setup-required`
  }

  return profile.role === expected && profile.language === requestedLocale
    ? null
    : roleHomePath(profile.language, profile.role)
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
