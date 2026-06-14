import type { User } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import {
  authenticatedRoleDestination,
  parseUserProfile,
  type UserLanguage,
  type UserRole,
} from "@/lib/auth/access"
import { createClient } from "@/lib/supabase/server"

export type AuthenticatedUser = {
  readonly user: User
  readonly language: UserLanguage
  readonly role: UserRole
}

export async function requireUser(locale: string): Promise<User> {
  const supabase = await createClient()

  if (supabase === null) {
    redirect(`/${locale}/login?error=configuration`)
  }

  const { data } = await supabase.auth.getUser()

  if (data.user === null) {
    redirect(`/${locale}/login?next=/${locale}/app`)
  }

  return data.user
}

export async function requireAuthenticatedUser(locale: string): Promise<AuthenticatedUser | null> {
  const user = await requireUser(locale)
  const supabase = await createClient()

  if (supabase === null) {
    return null
  }

  const { data } = await supabase
    .from("users")
    .select("role, language")
    .eq("id", user.id)
    .maybeSingle()
  const profile = parseUserProfile(data)

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
