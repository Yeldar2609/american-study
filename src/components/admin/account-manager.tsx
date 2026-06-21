import { ShieldCheck, Trash2, UserPlus } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { AccountManageControls } from "@/components/admin/account-manage-controls"
import { CreateAccountForm } from "@/components/admin/create-account-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { removeUserAction } from "@/lib/admin/account-actions"
import { listAccounts } from "@/lib/admin/account-queries"
import { createClient } from "@/lib/supabase/server"

const roleBadgeClass: Record<string, string> = {
  admin: "bg-blue-700 text-white",
  parent: "bg-blue-50 text-blue-700",
  student: "bg-slate-100 text-slate-700",
}

export async function AccountManager({ locale }: { readonly locale: string }) {
  const t = await getTranslations("adminAccounts")
  const result = await listAccounts()
  const supabase = await createClient()
  const currentId =
    supabase === null ? null : ((await supabase.auth.getUser()).data.user?.id ?? null)
  const remove = removeUserAction.bind(null, locale)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 bg-blue-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/20">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-blue-50">{t("listEyebrow")}</p>
              <h2 className="text-2xl font-black">{t("listTitle")}</h2>
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-5">
          {result.kind !== "ready" ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
              {t(result.kind === "configuration" ? "configuration" : "loadError")}
            </div>
          ) : result.accounts.length === 0 ? (
            <p className="text-sm text-slate-600">{t("empty")}</p>
          ) : (
            result.accounts.map((account) => {
              const isSelf = account.id === currentId
              const isLastAdmin = account.role === "admin" && result.adminCount <= 1
              return (
                <article
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                  key={account.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">
                        {account.fullName || account.username}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{account.username}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={roleBadgeClass[account.role] ?? "bg-slate-100 text-slate-700"}
                      >
                        {t(`roles.${account.role}`)}
                      </Badge>
                      {isSelf || isLastAdmin ? (
                        <span className="text-xs font-bold text-slate-400">
                          {isSelf ? t("you") : t("lastAdmin")}
                        </span>
                      ) : (
                        <form action={remove}>
                          <input name="userId" type="hidden" value={account.id} />
                          <Button
                            aria-label={t("removeLabel")}
                            size="icon"
                            type="submit"
                            variant="danger"
                          >
                            <Trash2 aria-hidden="true" className="size-5" />
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                  <AccountManageControls locale={locale} userId={account.id} />
                </article>
              )
            })
          )}
        </div>
      </Card>

      <Card className="h-fit p-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            <UserPlus aria-hidden="true" className="size-6" />
          </span>
          <div>
            <p className="text-sm font-bold text-blue-700">{t("createEyebrow")}</p>
            <h2 className="text-2xl font-black text-slate-950">{t("createTitle")}</h2>
          </div>
        </div>
        <p className="mb-4 text-sm leading-6 text-slate-600">{t("createHint")}</p>
        <CreateAccountForm locale={locale} />
      </Card>
    </div>
  )
}
