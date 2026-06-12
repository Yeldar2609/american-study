export const userRoles = ["student", "parent", "admin"] as const
export type UserRole = (typeof userRoles)[number]

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

export function parseUserRoleFromMetadata(metadata: unknown): UserRole | null {
  if (typeof metadata !== "object" || metadata === null || !("role" in metadata)) {
    return null
  }

  return parseUserRole(metadata.role)
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
