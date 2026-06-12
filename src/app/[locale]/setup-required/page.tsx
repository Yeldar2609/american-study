import { ShieldAlert } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"

export default async function SetupRequiredPage() {
  const t = await getTranslations("setup")

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <ShieldAlert aria-hidden="true" className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-black text-slate-950">{t("title")}</h1>
        <p className="mt-3 leading-7 text-slate-600">{t("body")}</p>
        <Link className={`${buttonVariants()} mt-6`} href="/">
          {t("cta")}
        </Link>
      </Card>
    </main>
  )
}
