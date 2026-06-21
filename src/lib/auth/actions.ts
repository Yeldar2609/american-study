"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { safeRedirectPath } from "@/lib/auth/access"
import { usernameSchema, usernameToAuthEmail } from "@/lib/auth/identity"
import { createClient } from "@/lib/supabase/server"

type AuthAction = "login" | "reset"

const credentialsSchema = z.object({
  password: z.string().min(1).max(128),
  username: usernameSchema,
})

function authErrorPath(locale: string, code: string): string {
  return `/${locale}/auth/error?code=${encodeURIComponent(code)}`
}

async function requireSupabase(locale: string) {
  const supabase = await createClient()

  if (supabase === null) {
    redirect(authErrorPath(locale, "configuration"))
  }

  return supabase
}

export async function emailAuthAction(action: AuthAction, locale: string, formData: FormData) {
  // Passwords are managed by an admin now; there is no self-serve email reset.
  if (action === "reset") {
    redirect(`/${locale}/login`)
  }

  const next = safeRedirectPath(String(formData.get("next") ?? ""), `/${locale}/app`)
  const supabase = await requireSupabase(locale)

  const credentials = credentialsSchema.safeParse({
    password: formData.get("password"),
    username: formData.get("username"),
  })

  if (!credentials.success) {
    redirect(authErrorPath(locale, "validation"))
  }

  const result = await supabase.auth.signInWithPassword({
    email: usernameToAuthEmail(credentials.data.username),
    password: credentials.data.password,
  })
  redirect(result.error ? authErrorPath(locale, "login") : next)
}

export async function logoutAction(locale: string) {
  const supabase = await createClient()

  if (supabase !== null) {
    await supabase.auth.signOut()
  }

  redirect(`/${locale}/login`)
}
