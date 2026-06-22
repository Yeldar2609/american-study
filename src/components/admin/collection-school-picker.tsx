"use client"

import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addSchoolToCollectionAction } from "@/lib/admin/collection-actions"
import type { AdminSchoolRow } from "@/lib/admin/school-rank-queries"

function formatLocation(city: string | null, state: string | null): string {
  const parts = [city, state].filter((part): part is string => part !== null && part !== "")
  return parts.length === 0 ? "—" : parts.join(", ")
}

export function CollectionSchoolPicker({
  collectionId,
  locale,
  memberIds,
  schools,
}: {
  readonly collectionId: string
  readonly locale: string
  readonly memberIds: readonly string[]
  readonly schools: readonly AdminSchoolRow[]
}) {
  const t = useTranslations("collections")
  const [query, setQuery] = useState("")

  const memberSet = useMemo(() => new Set(memberIds), [memberIds])

  const available = useMemo(
    () => schools.filter((school) => !memberSet.has(school.schoolId)),
    [memberSet, schools],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (needle === "") {
      return available
    }
    return available.filter((school) => school.name.toLocaleLowerCase().includes(needle))
  }, [available, query])

  return (
    <div className="grid gap-3">
      <Input
        aria-label={t("addSchoolsSearch")}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("addSchoolsSearch")}
        type="search"
        value={query}
      />
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-bold text-slate-500">
          {t("schoolPickerEmpty")}
        </p>
      ) : (
        <ul className="grid max-h-96 gap-2 overflow-y-auto pr-1">
          {filtered.slice(0, 50).map((school) => (
            <li key={school.schoolId}>
              <form
                action={addSchoolToCollectionAction}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-blue-300"
              >
                <input name="collectionId" type="hidden" value={collectionId} />
                <input name="locale" type="hidden" value={locale} />
                <input name="schoolId" type="hidden" value={school.schoolId} />
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{school.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatLocation(school.city, school.state)}
                  </p>
                </div>
                <Button size="default" type="submit" variant="secondary">
                  {t("add")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
