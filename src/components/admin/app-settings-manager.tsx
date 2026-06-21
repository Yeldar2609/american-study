import { Settings } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { AppSettingsForm } from "@/components/admin/app-settings-form"
import { Card } from "@/components/ui/card"
import { getAppSettings } from "@/lib/admin/app-settings-queries"

export async function AppSettingsManager({ locale }: { readonly locale: string }) {
  const t = await getTranslations("adminSettings")
  const result = await getAppSettings()

  return (
    <section className="mt-8 max-w-2xl">
      <Card className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            <Settings aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-bold text-blue-700">{t("eyebrow")}</p>
            <h2 className="text-2xl font-black text-slate-950">{t("title")}</h2>
          </div>
        </div>
        {result.kind === "ready" ? (
          <>
            <p className="mb-4 text-sm leading-6 text-slate-600">{t("subtitle")}</p>
            <AppSettingsForm calendarBookingLink={result.calendarBookingLink} locale={locale} />
          </>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
            {t(result.kind === "configuration" ? "configuration" : "loadError")}
          </div>
        )}
      </Card>
    </section>
  )
}
