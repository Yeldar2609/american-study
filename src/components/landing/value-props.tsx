import { getTranslations } from "next-intl/server"
import { Card } from "@/components/ui/card"

export async function ValueProps() {
  const t = await getTranslations("landing")
  const values = [
    { body: t("value1Body"), title: t("value1Title") },
    { body: t("value2Body"), title: t("value2Title") },
    { body: t("value3Body"), title: t("value3Title") },
    { body: t("value4Body"), title: t("value4Title") },
  ]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="max-w-3xl">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {t("valuesTitle")}
        </h2>
        <p className="mt-4 text-lg leading-8 text-slate-600">{t("valuesLead")}</p>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value, index) => (
          <Card className="p-6" key={value.title}>
            <span className="grid size-10 place-items-center rounded-2xl bg-blue-700 font-black text-white">
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-950">{value.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{value.body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}
