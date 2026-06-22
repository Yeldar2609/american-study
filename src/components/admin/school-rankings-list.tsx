"use client"

import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { setSchoolRankAction } from "@/lib/admin/school-rank-actions"
import type { AdminSchoolRow } from "@/lib/admin/school-rank-queries"

function formatLocation(city: string | null, state: string | null): string {
  const parts = [city, state].filter((part): part is string => part !== null && part !== "")
  return parts.length === 0 ? "—" : parts.join(", ")
}

export function SchoolRankingsList({
  locale,
  schools,
}: {
  readonly locale: string
  readonly schools: readonly AdminSchoolRow[]
}) {
  const t = useTranslations("rankings")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (needle === "") {
      return schools
    }
    return schools.filter((school) => school.name.toLocaleLowerCase().includes(needle))
  }, [query, schools])

  return (
    <div className="grid gap-4">
      <Input
        aria-label={t("searchPlaceholder")}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        type="search"
        value={query}
      />
      <p className="text-sm font-bold text-slate-500">{t("count", { count: filtered.length })}</p>
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-bold text-slate-500">
          {t("noResults")}
        </p>
      ) : (
        filtered.map((school) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60"
            key={school.schoolId}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
                  {school.nicheRank === null ? t("unranked") : `${t("rank")} ${school.nicheRank}`}
                </p>
                <h3
                  aria-label={`${t("school")}: ${school.name}`}
                  className="mt-1 font-black text-slate-950"
                >
                  {school.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {`${t("location")}: ${formatLocation(school.city, school.state)}`}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {`${t("grade")}: ${school.nicheGrade ?? "—"}`}
                </p>
              </div>
              <form action={setSchoolRankAction} className="flex shrink-0 items-center gap-2">
                <input name="locale" type="hidden" value={locale} />
                <input name="schoolId" type="hidden" value={school.schoolId} />
                <Input
                  aria-label={t("rank")}
                  className="min-h-11 w-24"
                  defaultValue={school.nicheRank === null ? "" : String(school.nicheRank)}
                  inputMode="numeric"
                  min={1}
                  name="rank"
                  placeholder={t("rank")}
                  type="number"
                />
                <Button size="default" type="submit" variant="secondary">
                  {t("save")}
                </Button>
              </form>
            </div>
          </article>
        ))
      )}
    </div>
  )
}
