import { ArrowRight } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"

export async function ConsultationCta({
  bookingLink,
}: {
  readonly bookingLink?: string | undefined
}) {
  const t = await getTranslations("landing")

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <Card className="border-t-[3px] border-t-blue-700 p-8 text-center sm:p-12">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {t("ctaTitle")}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">{t("ctaBody")}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {bookingLink ? (
            <a
              className={buttonVariants({ size: "large" })}
              href={bookingLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("ctaButton")}
              <ArrowRight aria-hidden="true" className="size-5" />
            </a>
          ) : (
            <Link className={buttonVariants({ size: "large" })} href="/login">
              {t("ctaButton")}
              <ArrowRight aria-hidden="true" className="size-5" />
            </Link>
          )}
          <Link
            className="text-sm font-bold text-blue-700 underline-offset-4 hover:underline"
            href="/login"
          >
            {t("ctaSignIn")}
          </Link>
        </div>
      </Card>
    </section>
  )
}
