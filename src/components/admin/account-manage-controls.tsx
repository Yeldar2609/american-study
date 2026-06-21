"use client"

import { useTranslations } from "next-intl"
import { useActionState, useId } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialAccountActionState } from "@/lib/admin/account-action-state"
import { changeUsernameAction, resetPasswordAction } from "@/lib/admin/account-actions"

const bannerClass = (status: "idle" | "success" | "error") =>
  status === "success" ? "text-sm font-bold text-emerald-700" : "text-sm font-bold text-red-700"

export function AccountManageControls({
  locale,
  userId,
}: {
  readonly locale: string
  readonly userId: string
}) {
  const t = useTranslations("adminAccounts")
  const fieldId = useId()
  const renameAction = changeUsernameAction.bind(null, locale)
  const resetAction = resetPasswordAction.bind(null, locale)
  const [renameState, renameForm, renamePending] = useActionState(
    renameAction,
    initialAccountActionState,
  )
  const [resetState, resetForm, resetPending] = useActionState(
    resetAction,
    initialAccountActionState,
  )

  return (
    <details className="w-full border-t border-slate-100 pt-3">
      <summary className="cursor-pointer text-sm font-bold text-blue-700">{t("manage")}</summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <form action={renameForm} className="grid gap-2">
          <input name="userId" type="hidden" value={userId} />
          <label
            className="grid gap-1 text-sm font-bold text-slate-700"
            htmlFor={`${fieldId}-username`}
          >
            {t("changeUsernameLabel")}
            <Input
              autoComplete="off"
              id={`${fieldId}-username`}
              name="username"
              required
              type="text"
            />
          </label>
          {renameState.status !== "idle" && (
            <p className={bannerClass(renameState.status)} role="status">
              {t(`messages.${renameState.message}`)}
            </p>
          )}
          <Button disabled={renamePending} type="submit" variant="secondary">
            {renamePending ? t("saving") : t("changeUsername")}
          </Button>
        </form>
        <form action={resetForm} className="grid gap-2">
          <input name="userId" type="hidden" value={userId} />
          <label
            className="grid gap-1 text-sm font-bold text-slate-700"
            htmlFor={`${fieldId}-password`}
          >
            {t("newPasswordLabel")}
            <Input
              autoComplete="off"
              id={`${fieldId}-password`}
              name="password"
              required
              type="text"
            />
          </label>
          {resetState.status !== "idle" && (
            <p className={bannerClass(resetState.status)} role="status">
              {t(`messages.${resetState.message}`)}
            </p>
          )}
          <Button disabled={resetPending} type="submit" variant="secondary">
            {resetPending ? t("saving") : t("resetPassword")}
          </Button>
        </form>
      </div>
    </details>
  )
}
