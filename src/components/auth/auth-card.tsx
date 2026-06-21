import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Logo } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/navigation"
import { emailAuthAction } from "@/lib/auth/actions"

type AuthMode = "login" | "reset"

type AuthCardProps = {
  readonly locale: string
  readonly mode: AuthMode
  readonly next?: string
}

export async function AuthCard({ locale, mode, next = "" }: AuthCardProps) {
  const t = await getTranslations("auth")
  const common = await getTranslations("common")
  const action = emailAuthAction.bind(null, mode, locale)

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Logo label={common("brand")} />
          <LocaleSwitcher />
        </div>
        <Card className="p-6 sm:p-8">
          <Link
            className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-700"
            href="/"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {common("backHome")}
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {t(`${mode}.title`)}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t(`${mode}.subtitle`)}</p>

          {mode === "reset" ? (
            <div className="mt-6 space-y-6">
              <p
                className="rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-800"
                role="status"
              >
                {t("reset.adminManaged")}
              </p>
              <Link className="text-sm font-bold text-blue-700 hover:text-blue-800" href="/login">
                {t("haveAccount")}
              </Link>
            </div>
          ) : (
            <form action={action} className="mt-6 space-y-4">
              <input name="next" type="hidden" value={next} />
              <label className="block" htmlFor="login-username">
                <span className="mb-2 block text-sm font-bold text-slate-800">{t("username")}</span>
                <Input
                  autoComplete="username"
                  id="login-username"
                  name="username"
                  required
                  type="text"
                />
              </label>
              <label className="block" htmlFor="login-password">
                <span className="mb-2 block text-sm font-bold text-slate-800">{t("password")}</span>
                <Input
                  autoComplete="current-password"
                  id="login-password"
                  name="password"
                  required
                  type="password"
                />
              </label>
              <Button className="w-full" size="large" type="submit">
                {t("login.submit")}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  )
}
