import { getTranslations } from "next-intl/server"
import { updateSchoolPickAction } from "@/lib/workspace/school-admin-actions"
import type { SchoolCatalogItem } from "@/lib/workspace/school-catalog"

type SchoolAdminControlsProps = {
  readonly locale: string
  readonly school: SchoolCatalogItem
  readonly studentId: string
}

export async function SchoolAdminControls({ locale, school, studentId }: SchoolAdminControlsProps) {
  const t = await getTranslations("schools.admin")
  const action = updateSchoolPickAction.bind(null, locale)
  return (
    <details className="mt-5 rounded-2xl border border-slate-200 p-4">
      <summary className="cursor-pointer font-black text-blue-700">{t("edit")}</summary>
      <form action={action} className="mt-4 grid gap-3">
        <input name="schoolId" type="hidden" value={school.id} />
        <input name="studentId" type="hidden" value={studentId} />
        <label className="flex min-h-11 items-center gap-3 font-bold text-slate-700">
          <input defaultChecked={school.adminPick} name="adminPick" type="checkbox" />
          {t("matched")}
        </label>
        <label className="flex min-h-11 items-center gap-3 font-bold text-slate-700">
          <input defaultChecked={school.finalSeven} name="finalSeven" type="checkbox" />
          {t("finalSeven")}
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("override")}
          <input
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            defaultValue={school.matchPercent}
            max="100"
            min="0"
            name="matchOverride"
            type="number"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("reason")}
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 p-3"
            defaultValue={school.matchReason ?? ""}
            name="matchReason"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("deadline")}
          <input
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            defaultValue={school.saoDeadline ?? ""}
            name="saoDeadline"
            type="date"
          />
        </label>
        <label className="grid gap-1 text-sm font-bold text-slate-700">
          {t("status")}
          <select
            className="min-h-11 rounded-xl border border-slate-200 px-3"
            defaultValue={school.status}
            name="status"
          >
            <option value="researching">{t("statuses.researching")}</option>
            <option value="applied">{t("statuses.applied")}</option>
            <option value="submitted">{t("statuses.submitted")}</option>
          </select>
        </label>
        <button
          className="min-h-11 rounded-xl bg-slate-950 px-4 font-bold text-white"
          type="submit"
        >
          {t("save")}
        </button>
      </form>
    </details>
  )
}
