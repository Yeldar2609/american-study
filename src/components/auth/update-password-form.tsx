"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

type PasswordClient = {
  readonly auth: {
    updateUser(attributes: { readonly password: string }): Promise<{ readonly error: unknown }>
  }
}
export type PasswordUpdateResult = "configuration" | "invalid" | "error" | "success"

export async function updatePassword(
  client: PasswordClient | null,
  password: string,
): Promise<PasswordUpdateResult> {
  if (password.length < 1) {
    return "invalid"
  }

  if (client === null) {
    return "configuration"
  }

  const result = await client.auth.updateUser({ password })
  return result.error ? "error" : "success"
}

export function UpdatePasswordForm() {
  const t = useTranslations("auth.update")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    const password = String(formData.get("password") ?? "")
    setPending(true)
    const result = await updatePassword(createClient(), password)
    setMessage(result === "success" ? t("success") : t("error"))
    setPending(false)
  }

  return (
    <form action={submit} className="mt-6 space-y-4">
      <label className="block" htmlFor="new-password">
        <span className="mb-2 block text-sm font-bold text-slate-800">{t("label")}</span>
        <Input
          autoComplete="new-password"
          id="new-password"
          name="password"
          required
          type="password"
        />
      </label>
      <Button className="w-full" disabled={pending} size="large" type="submit">
        {pending ? t("pending") : t("submit")}
      </Button>
      {message !== null && <p className="text-sm font-semibold text-slate-700">{message}</p>}
    </form>
  )
}
