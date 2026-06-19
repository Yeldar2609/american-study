import { getTranslations } from "next-intl/server"
import { LockedCard } from "@/components/locked-card"
import { Card } from "@/components/ui/card"
import type { UserRole } from "@/lib/auth/access"
import type { DashboardDataResult } from "@/lib/dashboard/dashboard-data"

type WorkspaceEmptyStateProps = {
  readonly data: DashboardDataResult
  readonly role: UserRole
  readonly sectionLabel: string
}

export async function WorkspaceEmptyState({ data, role, sectionLabel }: WorkspaceEmptyStateProps) {
  const t = await getTranslations("app")
  const isLocked =
    data.kind === "ready" &&
    role !== "admin" &&
    data.students.length > 0 &&
    data.students.every((student) => student.packageState === "trial")

  if (isLocked) {
    return (
      <div className="mt-8 max-w-2xl">
        <LockedCard description={t("lockedDescription")} title={sectionLabel} />
      </div>
    )
  }

  return (
    <Card className="mt-8 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
        {sectionLabel}
      </p>
      <h1 className="mt-2 text-2xl font-black text-slate-950">{t("empty.sectionTitle")}</h1>
      <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">{t("empty.sectionBody")}</p>
    </Card>
  )
}
