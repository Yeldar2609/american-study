"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { AccountActionState } from "@/lib/admin/account-action-state"
import { requireRole } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

const createSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1).max(120),
  language: z.enum(["en", "ru", "kk"]),
  password: z.string().min(12).max(128),
  // Students carry a full profile entity and are created via the student form;
  // this quick action handles parent and admin/staff logins only.
  role: z.enum(["parent", "admin"]),
})

export async function createAccountAction(
  locale: string,
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  await requireRole(locale, "admin")

  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    language: formData.get("language"),
    password: formData.get("password"),
    role: formData.get("role"),
  })
  if (!parsed.success) {
    return { message: "validation", status: "error" }
  }

  const admin = createAdminClient()
  if (admin === null) {
    return { message: "configuration", status: "error" }
  }

  const value = parsed.data
  const { data: created, error } = await admin.auth.admin.createUser({
    app_metadata: { role: value.role },
    email: value.email,
    email_confirm: true,
    password: value.password,
    user_metadata: { full_name: value.fullName, language: value.language, role: value.role },
  })
  if (error !== null || created.user === null) {
    return { message: "duplicate", status: "error" }
  }

  // The on_auth_user_created trigger races with GoTrue's app_metadata write, so
  // write the profile explicitly via the service role (which the protect trigger
  // permits). Roll back the auth user if the profile cannot be written.
  const profile = await admin.from("users").upsert(
    {
      email: value.email,
      full_name: value.fullName,
      id: created.user.id,
      language: value.language,
      role: value.role,
    },
    { onConflict: "id" },
  )
  if (profile.error !== null) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { message: "unexpected", status: "error" }
  }

  revalidatePath(`/${locale}/app/admin`)
  return { message: "created", status: "success" }
}

export async function removeUserAction(locale: string, formData: FormData): Promise<void> {
  const { user } = await requireRole(locale, "admin")

  const targetId = z.string().uuid().safeParse(formData.get("userId"))
  // Never let an admin delete their own account.
  if (!targetId.success || targetId.data === user.id) {
    return
  }

  const admin = createAdminClient()
  if (admin === null) {
    return
  }

  // Guard: never remove the last remaining admin.
  const { data: target } = await admin
    .from("users")
    .select("role")
    .eq("id", targetId.data)
    .maybeSingle()
  const targetRole = (target as { readonly role?: string } | null)?.role
  if (targetRole === "admin") {
    const { count } = await admin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
    if ((count ?? 0) <= 1) {
      return
    }
  }

  await admin.auth.admin.deleteUser(targetId.data)
  revalidatePath(`/${locale}/app/admin`)
}
