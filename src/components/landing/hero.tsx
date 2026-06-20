import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"

export async function Hero() {
  const t = await getTranslations("landing")
  const steps = [t("step1"), t("step2"), t("step3")]

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pt-20">
      <section className="max-w-3xl">
        <Badge className="mb-6 gap-2 bg-blue-50 text-blue-700">
          <Sparkles aria-hidden="true" className="size-4" />
          {t("eyebrow")}
        </Badge>
        <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
          {t("subtitle")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className={buttonVariants({ size: "large" })} href="/login">
            {t("primaryCta")}
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "large" })}
            href="/#how-it-works"
          >
            {t("secondaryCta")}
          </Link>
        </div>
      </section>
      <Card className="relative scroll-mt-8 overflow-hidden p-7 sm:p-9" id="how-it-works">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-16 size-48 rounded-full bg-blue-200/50 blur-2xl"
        />
        <p className="relative text-sm font-extrabold uppercase tracking-[0.18em] text-blue-700">
          {t("roadmapLabel")}
        </p>
        <h2 className="relative mt-3 text-3xl font-black text-slate-950">{t("roadmapTitle")}</h2>
        <ol className="relative mt-8 space-y-5">
          {steps.map((step, index) => (
            <li className="flex items-start gap-4" key={step}>
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-blue-700 font-black text-white">
                {index + 1}
              </span>
              <div>
                <p className="font-bold text-slate-900">{step}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{t(`step${index + 1}Body`)}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="relative mt-8 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
          <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-600" />
          {t("parentPromise")}
        </div>
      </Card>
    </main>
  )
}
