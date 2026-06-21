"use client"

import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/navigation"
import type { AdminStudentListItem } from "@/lib/admin/student-queries"

export function StudentSearchList({
  students,
}: {
  readonly students: readonly AdminStudentListItem[]
}) {
  const t = useTranslations("adminStudents")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    if (needle === "") {
      return students
    }
    return students.filter((student) =>
      [
        student.fullName,
        student.email,
        t(`stages.${student.stage}`),
        t(`options.${student.packageState}`),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle),
    )
  }, [query, students, t])

  return (
    <div className="grid gap-3">
      <Input
        aria-label={t("searchLabel")}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        type="search"
        value={query}
      />
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm font-bold text-slate-500">
          {t("searchNoResults")}
        </p>
      ) : (
        filtered.map((student) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/60"
            key={student.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">{student.fullName}</h3>
                <p className="mt-1 text-sm text-slate-500">{student.email}</p>
              </div>
              <Badge
                className={
                  student.packageState === "paid"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-blue-50 text-blue-700"
                }
              >
                {t(`options.${student.packageState}`)}
              </Badge>
            </div>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-blue-700">
              {t(`stages.${student.stage}`)}
            </p>
            <Link
              className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100"
              href={`/app/admin?section=people&student=${student.id}`}
            >
              {t("editProfile")}
            </Link>
          </article>
        ))
      )}
    </div>
  )
}
