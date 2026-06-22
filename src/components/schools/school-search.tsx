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

export type SchoolSearchCollection = {
  readonly id: string
  readonly name: string
  readonly schoolIds: readonly string[]
}

export function SchoolSearch({
  collections = [],
  schools,
}: {
  readonly collections?: readonly SchoolSearchCollection[]
  readonly schools: readonly SearchableSchool[]
}) {
  const t = useTranslations("schools")
  const [query, setQuery] = useState("")
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null)

  const activeSchoolIds = useMemo(() => {
    if (activeCollectionId === null) {
      return null
    }
    const collection = collections.find((candidate) => candidate.id === activeCollectionId)
    return collection === undefined ? null : new Set(collection.schoolIds)
  }, [activeCollectionId, collections])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return schools.filter((school) => {
      if (activeSchoolIds !== null && !activeSchoolIds.has(school.id)) {
        return false
      }
      if (needle === "") {
        return true
      }
      return [school.name, school.city ?? "", school.state ?? ""]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle)
    })
  }, [activeSchoolIds, query, schools])

  return (
    <div className="mt-5 grid gap-5">
      {collections.length > 0 && (
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-blue-700">
            {t("collectionsLabel")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              aria-pressed={activeCollectionId === null}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeCollectionId === null
                  ? "bg-blue-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400"
              }`}
              onClick={() => setActiveCollectionId(null)}
              type="button"
            >
              {t("allSchools")}
            </button>
            {collections.map((collection) => (
              <button
                aria-pressed={activeCollectionId === collection.id}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeCollectionId === collection.id
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-blue-400"
                }`}
                key={collection.id}
                onClick={() => setActiveCollectionId(collection.id)}
                type="button"
              >
                {collection.name}
              </button>
            ))}
          </div>
        </div>
      )}
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
