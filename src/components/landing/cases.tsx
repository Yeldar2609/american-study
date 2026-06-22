import { getTranslations } from "next-intl/server"

export async function Cases() {
  const t = await getTranslations("cases")
  const images = ["/landing/cases/c1.webp", "/landing/cases/c2.webp", "/landing/cases/c3.webp"]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 text-lg leading-8 text-slate-600">{t("lead")}</p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {images.map((src) => (
          <div
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[var(--elevation)]"
            key={src}
          >
            <img
              alt={t("alt")}
              className="h-auto w-full object-cover"
              height={518}
              loading="lazy"
              src={src}
              width={345}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
