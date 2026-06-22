import { getTranslations } from "next-intl/server"
import { SchoolEditor } from "@/components/admin/school-editor"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { getAdminSchool } from "@/lib/admin/school-edit-queries"

export async function SchoolEditorWorkspace({
  locale,
  schoolId,
}: {
  readonly locale: string
  readonly schoolId: string
}) {
  const t = await getTranslations("schoolEdit")
  const backHref = `/app/admin?section=rankings`
  const result = await getAdminSchool(schoolId)

  if (result.kind === "ready") {
    return <SchoolEditor backHref={backHref} locale={locale} school={result.school} />
  }

  return (
    <section className="mt-8 space-y-4">
      <Link
        className="inline-flex min-h-11 items-center text-sm font-black text-blue-700"
        href={backHref}
      >
        {t("back")}
      </Link>
      <Card className="border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
        <p className="mx-auto max-w-xl leading-7 text-slate-600">
          {t(result.kind === "notFound" ? "notFound" : "loadError")}
        </p>
      </Card>
    </section>
  )
}
