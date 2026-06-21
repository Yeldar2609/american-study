import { Search } from "lucide-react"
import { getTranslations } from "next-intl/server"
import type { ReactNode } from "react"
import { Input } from "@/components/ui/input"
import type { SchoolCatalogFilters } from "@/lib/workspace/school-catalog"

type SchoolFiltersProps = {
  readonly filters: SchoolCatalogFilters
  readonly states: readonly string[]
  readonly studentId?: string | undefined
}

export async function SchoolFilters({ filters, states, studentId }: SchoolFiltersProps) {
  const t = await getTranslations("schools")
  return (
    <form className="mt-5 grid gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm md:grid-cols-6">
      <label className="relative md:col-span-2" htmlFor="school-search">
        <span className="sr-only">{t("filters.search")}</span>
        <Search className="pointer-events-none absolute left-4 top-3.5 size-5 text-slate-400" />
        <Input
          className="pl-11"
          defaultValue={filters.query}
          id="school-search"
          name="q"
          placeholder={t("filters.search")}
        />
      </label>
      <SchoolSelect defaultValue={filters.state} label={t("filters.state")} name="state">
        {states.map((state) => (
          <option key={state} value={state}>
            {state}
          </option>
        ))}
      </SchoolSelect>
      <SchoolSelect defaultValue={filters.setting} label={t("filters.setting")} name="setting">
        {(["urban", "suburban", "rural"] as const).map((setting) => (
          <option key={setting} value={setting}>
            {t(`settings.${setting}`)}
          </option>
        ))}
      </SchoolSelect>
      <SchoolSelect defaultValue={filters.body} label={t("filters.body")} name="body">
        {(["coed", "boys", "girls"] as const).map((body) => (
          <option key={body} value={body}>
            {t(`bodies.${body}`)}
          </option>
        ))}
      </SchoolSelect>
      <SchoolSelect defaultValue={filters.aid} label={t("filters.aid")} name="aid">
        <option value="yes">{t("filters.aidYes")}</option>
        <option value="no">{t("filters.aidNo")}</option>
      </SchoolSelect>
      <input name="section" type="hidden" value="schools" />
      {studentId !== undefined && <input name="student" type="hidden" value={studentId} />}
      <button
        className="min-h-11 rounded-xl bg-blue-600 px-5 font-bold text-white md:col-span-6 md:justify-self-start"
        type="submit"
      >
        {t("filters.apply")}
      </button>
    </form>
  )
}

function SchoolSelect({
  children,
  defaultValue,
  label,
  name,
}: {
  readonly children: ReactNode
  readonly defaultValue?: string | undefined
  readonly label: string
  readonly name: string
}) {
  return (
    <label htmlFor={`school-${name}`}>
      <span className="sr-only">{label}</span>
      <select
        className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 font-semibold text-slate-800"
        defaultValue={defaultValue ?? ""}
        id={`school-${name}`}
        name={name}
      >
        <option value="">{label}</option>
        {children}
      </select>
    </label>
  )
}
