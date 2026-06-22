"use client"

import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"

export type SearchableSchool = {
  readonly card: ReactNode
  readonly city: string | null
  readonly id: string
  readonly name: string
  readonly state: string | null
}

export function SchoolSearch({ schools }: { readonly schools: readonly SearchableSchool[] }) {
  const t = useTranslations("schools")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (needle === "") {
      return schools
    }
    return schools.filter((school) =>
      [school.name, school.city ?? "", school.state ?? ""]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle),
    )
  }, [query, schools])

  return (
    <div className="mt-5 grid gap-5">
      <Input
        aria-label={t("searchLabel")}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        type="search"
        value={query}
      />
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-bold text-slate-500">
          {t("searchEmpty")}
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((school) => (
            <div key={school.id}>{school.card}</div>
          ))}
        </div>
      )}
    </div>
  )
}
