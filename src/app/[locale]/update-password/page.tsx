import { getTranslations } from "next-intl/server"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"
import { Logo } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Card } from "@/components/ui/card"

export default async function UpdatePasswordPage() {
  const auth = await getTranslations("auth.update")
  const common = await getTranslations("common")

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Logo label={common("brand")} />
          <LocaleSwitcher />
        </div>
        <Card className="p-6 sm:p-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">{auth("title")}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{auth("subtitle")}</p>
          <UpdatePasswordForm />
        </Card>
      </div>
    </main>
  )
}
