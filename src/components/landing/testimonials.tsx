import { getTranslations } from "next-intl/server"

export async function Testimonials() {
  const t = await getTranslations("testimonials")
  const images = ["/landing/testimonials/t1.webp", "/landing/testimonials/t2.webp"]

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        {t("title")}
      </h2>
      <div className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
        {images.map((src) => (
          <div
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[var(--elevation)]"
            key={src}
          >
            <img
              alt={t("alt")}
              className="h-auto w-full object-cover"
              height={560}
              loading="lazy"
              src={src}
              width={560}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
