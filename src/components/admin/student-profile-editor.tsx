"use client"

import { useTranslations } from "next-intl"
import { useActionState } from "react"
import { StudentProfileFields } from "@/components/admin/student-profile-fields"
import { Button } from "@/components/ui/button"
import { initialAdminStudentActionState } from "@/lib/admin/student-action-state"
import {
  setStudentPackageAction,
  updateStudentProfileAction,
} from "@/lib/admin/student-profile-actions"
import type { AdminStudentProfile } from "@/lib/admin/student-profile-query"

type StudentProfileEditorProps = {
  readonly locale: string
  readonly profile: AdminStudentProfile
}

export function StudentProfileEditor({ locale, profile }: StudentProfileEditorProps) {
  const t = useTranslations("adminStudents")
  const [state, updateAction, pending] = useActionState(
    updateStudentProfileAction.bind(null, locale),
    initialAdminStudentActionState,
  )
  const [packageState, packageAction, packagePending] = useActionState(
    setStudentPackageAction.bind(null, locale),
    initialAdminStudentActionState,
  )
  const nextPackageState = profile.packageState === "trial" ? "paid" : "trial"

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-cyan-800">{t("packageLabel")}</p>
            <p className="mt-1 text-xl font-black text-cyan-950">
              {t(`options.${profile.packageState}`)}
            </p>
          </div>
          <form action={packageAction}>
            <input name="studentId" type="hidden" value={profile.id} />
            <input name="packageState" type="hidden" value={nextPackageState} />
            <Button disabled={packagePending} type="submit" variant="secondary">
              {packagePending
                ? t("updating")
                : t(profile.packageState === "trial" ? "markPaid" : "markTrial")}
            </Button>
          </form>
        </div>
        {packageState.message !== "none" && (
          <p className="mt-3 text-sm font-bold text-cyan-900" role="status">
            {t(`messages.${packageState.message}`)}
          </p>
        )}
      </div>

      <form action={updateAction} className="grid gap-5">
        <input name="studentId" type="hidden" value={profile.id} />
        {state.message !== "none" && (
          <p
            className={
              state.status === "success"
                ? "rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800"
                : "rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800"
            }
            role="status"
          >
            {t(`messages.${state.message}`)}
          </p>
        )}
        <StudentProfileFields fieldErrors={state.fieldErrors} profile={profile} />
        <Button className="w-full sm:w-fit" disabled={pending} size="large" type="submit">
          {pending ? t("updating") : t("saveChanges")}
        </Button>
      </form>
    </div>
  )
}
