import { ArrowRight, CheckCircle2 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export async function Hero() {
  const t = await getTranslations("landing")

  return (
    <main className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-24 lg:pt-16">
      <section className="max-w-2xl">
        <Badge className="mb-6 bg-blue-50 text-blue-700">{t("badge")}</Badge>
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          <span className="block">{t("titleLead")}</span>
          <span className="block text-blue-700">{t("titleAccent")}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{t("subtitle")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a className={buttonVariants({ size: "large" })} href="#consultation">
            {t("primaryCta")}
            <ArrowRight aria-hidden="true" className="size-5" />
          </a>
          <Link className={buttonVariants({ size: "large", variant: "outline" })} href="/login">
            {t("signInCta")}
          </Link>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 aria-hidden="true" className="size-4" />
          {t("priceNote")}
        </p>
      </section>
      <div className="lg:justify-self-end">
        <img
          alt={t("heroImageAlt")}
          className="aspect-square w-full max-w-md rounded-3xl border border-slate-200 object-cover shadow-[var(--elevation)]"
          height={582}
          src="/landing/hero.webp"
          width={582}
        />
      </div>
    </main>
  )
}
