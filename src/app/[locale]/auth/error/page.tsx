import { AlertCircle } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"

type AuthErrorPageProps = {
  readonly searchParams: Promise<{ code?: string }>
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const t = await getTranslations("auth.error")
  const { code = "unknown" } = await searchParams
  const knownCode = [
    "configuration",
    "login",
    "signup",
    "reset",
    "google",
    "callback",
    "validation",
  ].includes(code)
    ? code
    : "unknown"

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-100 text-red-700">
          <AlertCircle aria-hidden="true" className="size-7" />
        </span>
        <h1 className="mt-5 text-3xl font-black text-slate-950">{t("title")}</h1>
        <p className="mt-3 leading-7 text-slate-600">{t(knownCode)}</p>
        <Link className={`${buttonVariants()} mt-6`} href="/login">
          {t("back")}
        </Link>
      </Card>
    </main>
  )
}
