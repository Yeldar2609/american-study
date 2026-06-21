import type { User } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { cache } from "react"
import {
  authenticatedRoleDestination,
  type LegacyTransitionProfile,
  parseLegacyTransitionProfile,
  parseUserProfile,
  type UserLanguage,
  type UserProfile,
  type UserRole,
} from "@/lib/auth/access"
import { createClient } from "@/lib/supabase/server"

// One authenticated-user read per request. getUser() verifies the JWT with the
// auth server, so without this it ran 2-3x per page (requireUser + dashboard
// data + role guard). React cache() memoizes it for the render.
export const getRequestAuth = cache(
  async (): Promise<{ readonly configured: boolean; readonly user: User | null }> => {
    const supabase = await createClient()
    if (supabase === null) {
      return { configured: false, user: null }
    }
    const { data } = await supabase.auth.getUser()
    return { configured: true, user: data.user }
  },
)

export type AuthIdentity = {
  readonly app_metadata: unknown
  readonly email?: unknown
  readonly id: unknown
  readonly user_metadata: unknown
}

export type ProfileQueryResult = {
  readonly data: unknown
  readonly error: unknown
}

export interface ProfileStore {
  readProfile(userId: string): Promise<ProfileQueryResult>
  writeTransitionProfile(profile: LegacyTransitionProfile): Promise<ProfileQueryResult>
}

export type AuthenticatedUser = {
  readonly user: User
  readonly language: UserLanguage
  readonly role: UserRole
}

export async function resolveUserProfile(
  identity: AuthIdentity,
  store: ProfileStore,
): Promise<UserProfile | null> {
  if (typeof identity.id !== "string") {
    return null
  }

  const readResult = await store.readProfile(identity.id)

  if (readResult.error !== null) {
    return null
  }

  if (readResult.data !== null) {
    return parseUserProfile(readResult.data)
  }

  const transitionProfile = parseLegacyTransitionProfile(identity)

  if (transitionProfile === null) {
    return null
  }

  const writeResult = await store.writeTransitionProfile(transitionProfile)
  return writeResult.error === null ? parseUserProfile(writeResult.data) : null
}

export async function requireUser(locale: string): Promise<User> {
  const { configured, user } = await getRequestAuth()

  if (!configured) {
    redirect(`/${locale}/login?error=configuration`)
  }

  if (user === null) {
    redirect(`/${locale}/login?next=/${locale}/app`)
  }

  return user
}

export async function requireAuthenticatedUser(locale: string): Promise<AuthenticatedUser | null> {
  const user = await requireUser(locale)
  const supabase = await createClient()

  if (supabase === null) {
    return null
  }

  const store: ProfileStore = {
    async readProfile(userId) {
      return supabase.from("users").select("role, language").eq("id", userId).maybeSingle()
    },
    async writeTransitionProfile(transitionProfile) {
      return supabase.from("users").insert(transitionProfile).select("role, language").single()
    },
  }
  const profile = await resolveUserProfile(user, store)

  if (profile !== null) {
    return { user, ...profile }
  }

  return null
}

export async function requireRole(locale: string, expected: UserRole): Promise<AuthenticatedUser> {
  const authenticated = await requireAuthenticatedUser(locale)
  const destination = authenticatedRoleDestination(locale, authenticated, expected)

  if (destination !== null) {
    redirect(destination)
  }

  if (authenticated === null) {
    redirect(`/${locale}/setup-required`)
  }

  return authenticated
}
