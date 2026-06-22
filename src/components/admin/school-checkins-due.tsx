import { CalendarCheck, CheckCircle2 } from "lucide-react"
import { getFormatter, getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { markCheckedInAction } from "@/lib/admin/school-edit-actions"
import { getCheckinsDue } from "@/lib/admin/school-edit-queries"

function formatLocation(city: string | null, state: string | null): string {
  return [city, state].filter((part): part is string => part !== null && part !== "").join(", ")
}

export async function SchoolCheckinsDue({
  editBase,
  locale,
}: {
  readonly editBase: string
  readonly locale: string
}) {
  const t = await getTranslations("checkins")
  const format = await getFormatter()
  const result = await getCheckinsDue()

  if (result.kind !== "ready") {
    return null
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 bg-blue-700 p-6 text-white">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/20">
          <CalendarCheck aria-hidden="true" className="size-6" />
        </span>
        <div>
          <h2 className="text-2xl font-black">{t("title")}</h2>
          <p className="text-sm font-bold text-blue-50">
            {t("count", { count: result.schools.length })}
          </p>
        </div>
      </div>
      <div className="p-5">
        {result.schools.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-5 py-10 text-center">
            <CheckCircle2 aria-hidden="true" className="size-9 text-emerald-600" />
            <p className="mt-3 font-black text-emerald-900">{t("allCaughtUp")}</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {result.schools.map((school) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                key={school.id}
              >
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{school.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatLocation(school.city, school.state) || "—"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    {school.lastCheckedIn === null
                      ? t("never")
                      : t("lastChecked", {
                          date: format.dateTime(new Date(`${school.lastCheckedIn}T00:00:00Z`), {
                            dateStyle: "medium",
                          }),
                        })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    className="inline-flex min-h-11 items-center rounded-xl bg-blue-50 px-4 text-sm font-black text-blue-700 transition hover:bg-blue-100"
                    href={`${editBase}&school=${school.id}`}
                  >
                    {t("edit")}
                  </Link>
                  <form action={markCheckedInAction}>
                    <input name="locale" type="hidden" value={locale} />
                    <input name="schoolId" type="hidden" value={school.id} />
                    <Button size="default" type="submit" variant="secondary">
                      {t("markToday")}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
