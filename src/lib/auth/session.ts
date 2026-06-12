import type { User } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import {
  authorizedRoleDestination,
  parseUserRoleFromMetadata,
  type UserRole,
} from "@/lib/auth/access"
import { createClient } from "@/lib/supabase/server"

export type AuthenticatedUser = {
  readonly user: User
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

export async function requireRole(locale: string, expected: UserRole): Promise<AuthenticatedUser> {
  const user = await requireUser(locale)
  const role = parseUserRoleFromMetadata(user.app_metadata)
  const destination = authorizedRoleDestination(locale, role, expected)

  if (destination !== null) {
    redirect(destination)
  }

  return { user, role: expected }
}
