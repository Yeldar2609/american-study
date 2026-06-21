"use client"

import { useTranslations } from "next-intl"
import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { initialAccountActionState } from "@/lib/admin/account-action-state"
import { createAccountAction } from "@/lib/admin/account-actions"

const selectClassName =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-200"

type StudentOption = {
  readonly id: string
  readonly name: string
}

export function CreateAccountForm({
  locale,
  students,
}: {
  readonly locale: string
  readonly students: readonly StudentOption[]
}) {
  const t = useTranslations("adminAccounts")
  const action = createAccountAction.bind(null, locale)
  const [state, formAction, pending] = useActionState(action, initialAccountActionState)
  const [role, setRole] = useState("parent")

  return (
    <form action={formAction} className="grid gap-4">
      {state.status !== "idle" && (
        <div
          className={
            state.status === "success"
              ? "rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"
              : "rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700"
          }
          role="status"
        >
          {t(`messages.${state.message}`)}
        </div>
      )}
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        {t("roleLabel")}
        <select
          className={selectClassName}
          name="role"
          onChange={(event) => setRole(event.target.value)}
          value={role}
        >
          <option value="parent">{t("roles.parent")}</option>
          <option value="admin">{t("roles.admin")}</option>
        </select>
      </label>
      {role === "parent" && (
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          {t("linkStudentLabel")}
          <select className={selectClassName} defaultValue="" name="studentId">
            <option value="">{t("linkStudentNone")}</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor="account-name">
        {t("nameLabel")}
        <Input autoComplete="name" id="account-name" name="fullName" required />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor="account-username">
        {t("usernameLabel")}
        <Input autoComplete="username" id="account-username" name="username" required type="text" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700" htmlFor="account-password">
        {t("passwordLabel")}
        <Input autoComplete="off" id="account-password" name="password" required type="text" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        {t("languageLabel")}
        <select className={selectClassName} defaultValue="ru" name="language">
          <option value="en">{t("english")}</option>
          <option value="ru">{t("russian")}</option>
          <option value="kk">{t("kazakh")}</option>
        </select>
      </label>
      <Button className="w-full sm:w-fit" disabled={pending} size="large" type="submit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  )
}
