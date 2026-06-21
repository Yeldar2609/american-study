"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { AccountActionState } from "@/lib/admin/account-action-state"
import { usernameSchema, usernameToAuthEmail } from "@/lib/auth/identity"
import { requireRole } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

const createSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  language: z.enum(["en", "ru", "kk"]),
  password: z.string().min(1).max(128),
  // Students carry a full profile entity and are created via the student form;
  // this quick action handles parent and admin/staff logins only.
  role: z.enum(["parent", "admin"]),
  // Optional: when creating a parent, link them to this student so they can see
  // everything the student sees (the student form already links its own parent).
  studentId: z
    .union([z.literal(""), z.string().uuid()])
    .nullable()
    .transform((value) => value || null),
  username: usernameSchema,
})

export async function createAccountAction(
  locale: string,
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  await requireRole(locale, "admin")

  const parsed = createSchema.safeParse({
    fullName: formData.get("fullName"),
    language: formData.get("language"),
    password: formData.get("password"),
    role: formData.get("role"),
    studentId: formData.get("studentId"),
    username: formData.get("username"),
  })
  if (!parsed.success) {
    return { message: "validation", status: "error" }
  }

  const admin = createAdminClient()
  if (admin === null) {
    return { message: "configuration", status: "error" }
  }

  const value = parsed.data
  const authEmail = usernameToAuthEmail(value.username)
  const { data: created, error } = await admin.auth.admin.createUser({
    app_metadata: { role: value.role },
    email: authEmail,
    email_confirm: true,
    password: value.password,
    user_metadata: {
      full_name: value.fullName,
      language: value.language,
      role: value.role,
      username: value.username,
    },
  })
  if (error !== null || created.user === null) {
    return { message: "duplicate", status: "error" }
  }

  // The on_auth_user_created trigger races GoTrue's app_metadata write, so write
  // the profile explicitly via the service role. Roll back on failure.
  const profile = await admin.from("users").upsert(
    {
      email: authEmail,
      full_name: value.fullName,
      id: created.user.id,
      language: value.language,
      role: value.role,
      username: value.username,
    },
    { onConflict: "id" },
  )
  if (profile.error !== null) {
    await admin.auth.admin.deleteUser(created.user.id)
    return { message: "unexpected", status: "error" }
  }

  // Link a new parent to the chosen student so they share the same view. Roll
  // back the account if the link cannot be written.
  if (value.role === "parent" && value.studentId !== null) {
    const link = await admin
      .from("parents_students")
      .upsert(
        { parent_user_id: created.user.id, student_id: value.studentId },
        { onConflict: "parent_user_id,student_id" },
      )
    if (link.error !== null) {
      await admin.auth.admin.deleteUser(created.user.id)
      return { message: "unexpected", status: "error" }
    }
  }

  revalidatePath(`/${locale}/app/admin`)
  return { message: "created", status: "success" }
}

const resetPasswordSchema = z.object({
  password: z.string().min(1).max(128),
  userId: z.string().uuid(),
})

export async function resetPasswordAction(
  locale: string,
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  await requireRole(locale, "admin")

  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    userId: formData.get("userId"),
  })
  if (!parsed.success) {
    return { message: "validation", status: "error" }
  }

  const admin = createAdminClient()
  if (admin === null) {
    return { message: "configuration", status: "error" }
  }

  const { error } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    password: parsed.data.password,
  })
  if (error !== null) {
    return { message: "unexpected", status: "error" }
  }

  revalidatePath(`/${locale}/app/admin`)
  return { message: "passwordReset", status: "success" }
}

const changeUsernameSchema = z.object({
  userId: z.string().uuid(),
  username: usernameSchema,
})

export async function changeUsernameAction(
  locale: string,
  _previous: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  await requireRole(locale, "admin")

  const parsed = changeUsernameSchema.safeParse({
    userId: formData.get("userId"),
    username: formData.get("username"),
  })
  if (!parsed.success) {
    return { message: "validation", status: "error" }
  }

  const admin = createAdminClient()
  if (admin === null) {
    return { message: "configuration", status: "error" }
  }

  const authEmail = usernameToAuthEmail(parsed.data.username)
  // Auth is the source of truth for the login key; update it first so a taken
  // username fails here before the profile is touched.
  const authResult = await admin.auth.admin.updateUserById(parsed.data.userId, {
    email: authEmail,
    email_confirm: true,
  })
  if (authResult.error !== null) {
    return { message: "duplicate", status: "error" }
  }

  const profile = await admin
    .from("users")
    .update({ email: authEmail, username: parsed.data.username })
    .eq("id", parsed.data.userId)
  if (profile.error !== null) {
    return { message: "duplicate", status: "error" }
  }

  revalidatePath(`/${locale}/app/admin`)
  return { message: "usernameChanged", status: "success" }
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
