import { Check } from "lucide-react"
import { getTranslations } from "next-intl/server"

export async function ConsultationTopics() {
  const t = await getTranslations("landing")
  const topics = [t("topic1"), t("topic2"), t("topic3"), t("topic4")]

  return (
    <section className="border-y border-slate-200 bg-blue-50/60">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {t("topicsTitle")}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <li
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-[var(--elevation)]"
              key={topic}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-700 text-white">
                <Check aria-hidden="true" className="size-4" />
              </span>
              <p className="text-base font-semibold text-slate-800">{topic}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
