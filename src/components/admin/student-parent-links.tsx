import { Link2, Users, X } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { linkParentAction, unlinkParentAction } from "@/lib/admin/parent-link-actions"
import { getStudentParentLinks } from "@/lib/admin/parent-link-queries"

export async function StudentParentLinks({
  locale,
  studentId,
}: {
  readonly locale: string
  readonly studentId: string
}) {
  const t = await getTranslations("adminStudents.parents")
  const result = await getStudentParentLinks(studentId)
  if (result.kind !== "ready") {
    return null
  }
  const link = linkParentAction.bind(null, locale)
  const unlink = unlinkParentAction.bind(null, locale)
  const selectClassName =
    "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-950"

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Users aria-hidden="true" className="size-5" />
        </span>
        <h3 className="text-lg font-black text-slate-950">{t("title")}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t("hint")}</p>

      <div className="mt-4 grid gap-2">
        {result.linked.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
            {t("none")}
          </p>
        ) : (
          result.linked.map((parent) => (
            <div
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2"
              key={parent.userId}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">
                  {parent.name || parent.username}
                </p>
                <p className="truncate text-xs text-slate-500">{parent.username}</p>
              </div>
              <form action={unlink}>
                <input name="studentId" type="hidden" value={studentId} />
                <input name="parentUserId" type="hidden" value={parent.userId} />
                <Button aria-label={t("unlink")} size="icon" type="submit" variant="ghost">
                  <X aria-hidden="true" className="size-5" />
                </Button>
              </form>
            </div>
          ))
        )}
      </div>

      {result.available.length > 0 && (
        <form action={link} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <input name="studentId" type="hidden" value={studentId} />
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            {t("linkLabel")}
            <select className={selectClassName} name="parentUserId">
              {result.available.map((parent) => (
                <option key={parent.userId} value={parent.userId}>
                  {`${parent.name || parent.username} (${parent.username})`}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">
            <Link2 aria-hidden="true" className="size-4" />
            {t("link")}
          </Button>
        </form>
      )}
    </Card>
  )
}
