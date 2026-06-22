import { getTranslations } from "next-intl/server"
import { SchoolRankingsList } from "@/components/admin/school-rankings-list"
import { Card } from "@/components/ui/card"
import { getAdminSchools } from "@/lib/admin/school-rank-queries"

export async function SchoolRankings({ locale }: { readonly locale: string }) {
  const t = await getTranslations("rankings")
  const result = await getAdminSchools()

  return (
    <section className="mt-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-950">{t("title")}</h1>
        <p className="max-w-2xl leading-7 text-slate-600">{t("intro")}</p>
      </div>
      {result.kind === "ready" ? (
        <SchoolRankingsList locale={locale} schools={result.schools} />
      ) : (
        <Card className="border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
          <p className="mx-auto max-w-xl leading-7 text-slate-600">{t("loadError")}</p>
        </Card>
      )}
    </section>
  )
}
