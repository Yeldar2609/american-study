import { ArrowLeft } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Logo } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Link } from "@/i18n/navigation"
import { emailAuthAction, googleAuthAction } from "@/lib/auth/actions"

type AuthMode = "login" | "signup" | "reset"

type AuthCardProps = {
  readonly locale: string
  readonly mode: AuthMode
  readonly next?: string
}

export async function AuthCard({ locale, mode, next = "" }: AuthCardProps) {
  const t = await getTranslations("auth")
  const common = await getTranslations("common")
  const action = emailAuthAction.bind(null, mode, locale)
  const googleAction = googleAuthAction.bind(null, locale)

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

          {mode !== "reset" && (
            <>
              <form action={googleAction} className="mt-6">
                <Button className="w-full" type="submit" variant="outline">
                  <span aria-hidden="true" className="text-base font-black text-blue-600">
                    G
                  </span>
                  {t("google")}
                </Button>
              </form>
              <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                {t("or")}
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          )}

          <form action={action} className={mode === "reset" ? "mt-6 space-y-4" : "space-y-4"}>
            <input name="next" type="hidden" value={next} />
            <label className="block" htmlFor={`${mode}-email`}>
              <span className="mb-2 block text-sm font-bold text-slate-800">{t("email")}</span>
              <Input
                autoComplete="email"
                id={`${mode}-email`}
                name="email"
                placeholder={t("emailPlaceholder")}
                required
                type="email"
              />
            </label>
            {mode !== "reset" && (
              <label className="block" htmlFor={`${mode}-password`}>
                <span className="mb-2 block text-sm font-bold text-slate-800">{t("password")}</span>
                <Input
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  id={`${mode}-password`}
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </label>
            )}
            <Button className="w-full" size="large" type="submit">
              {t(`${mode}.submit`)}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            {mode === "login" && (
              <>
                <Link
                  className="font-bold text-blue-700 hover:text-blue-800"
                  href="/forgot-password"
                >
                  {t("forgot")}
                </Link>
                <Link className="font-bold text-slate-600 hover:text-blue-700" href="/signup">
                  {t("needAccount")}
                </Link>
              </>
            )}
            {mode !== "login" && (
              <Link className="font-bold text-blue-700 hover:text-blue-800" href="/login">
                {t("haveAccount")}
              </Link>
            )}
          </div>
        </Card>
      </div>
    </main>
  )
}
