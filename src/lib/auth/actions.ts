"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { safeRedirectPath } from "@/lib/auth/access"
import { readPublicEnv } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

type AuthAction = "login" | "signup" | "reset"

const emailSchema = z.string().trim().email()
const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
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
  const next = safeRedirectPath(String(formData.get("next") ?? ""), `/${locale}/app`)
  const supabase = await requireSupabase(locale)

  if (action === "reset") {
    const email = emailSchema.safeParse(formData.get("email"))

    if (!email.success) {
      redirect(authErrorPath(locale, "validation"))
    }

    const env = readPublicEnv()
    const result = await supabase.auth.resetPasswordForEmail(email.data, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/${locale}/update-password`,
    })
    redirect(result.error ? authErrorPath(locale, "reset") : `/${locale}/login?status=reset-sent`)
  }

  const credentials = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!credentials.success) {
    redirect(authErrorPath(locale, "validation"))
  }

  const result =
    action === "signup"
      ? await supabase.auth.signUp(credentials.data)
      : await supabase.auth.signInWithPassword(credentials.data)

  redirect(result.error ? authErrorPath(locale, action) : next)
}

export async function logoutAction(locale: string) {
  const supabase = await createClient()

  if (supabase !== null) {
    await supabase.auth.signOut()
  }

  redirect(`/${locale}/login`)
}
