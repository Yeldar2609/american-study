"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { safeRedirectPath } from "@/lib/auth/access"
import { readPublicEnv } from "@/lib/env"
import { createAdminClient } from "@/lib/supabase/admin"
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

  if (action === "signup") {
    // Supabase's built-in mailer is rate-limited and unreliable, so the default
    // confirm-email signup leaves users stuck unconfirmed. Create the account
    // pre-confirmed via the service-role admin client, then sign in below.
    const admin = createAdminClient()

    if (admin === null) {
      redirect(authErrorPath(locale, "configuration"))
    }

    const language = locale === "ru" ? "ru" : "en"
    const created = await admin.auth.admin.createUser({
      app_metadata: { role: "student" },
      email: credentials.data.email,
      email_confirm: true,
      password: credentials.data.password,
      user_metadata: { language },
    })

    if (created.error || created.data.user === null) {
      redirect(authErrorPath(locale, "signup"))
    }

    // The on_auth_user_created trigger reads app_metadata.role at INSERT time,
    // but GoTrue applies admin app_metadata in a follow-up UPDATE, so the
    // trigger sees no role and skips the profile. Create it explicitly here
    // (service-role bypasses RLS; upsert is a no-op if the trigger did run).
    const profile = await admin.from("users").upsert(
      {
        email: credentials.data.email,
        full_name: credentials.data.email.split("@")[0],
        id: created.data.user.id,
        language,
        role: "student",
      },
      { onConflict: "id" },
    )

    if (profile.error) {
      redirect(authErrorPath(locale, "signup"))
    }
  }

  const result = await supabase.auth.signInWithPassword(credentials.data)
  redirect(result.error ? authErrorPath(locale, action) : next)
}

export async function logoutAction(locale: string) {
  const supabase = await createClient()

  if (supabase !== null) {
    await supabase.auth.signOut()
  }

  redirect(`/${locale}/login`)
}
