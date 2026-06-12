import { getTranslations } from "next-intl/server"
import { Logo } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { buttonVariants } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

export async function SiteHeader() {
  const t = await getTranslations("common")

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
      <Logo label={t("brand")} />
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <Link className={buttonVariants({ variant: "primary" })} href="/login">
          {t("signIn")}
        </Link>
      </div>
    </header>
  )
}
