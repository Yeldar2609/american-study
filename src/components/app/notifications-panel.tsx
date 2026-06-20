import { Bell, Check } from "lucide-react"
import { getFormatter, getLocale, getTranslations } from "next-intl/server"
import { Card } from "@/components/ui/card"
import { markNotificationReadAction } from "@/lib/workspace/workflow-actions"
import { getNotificationsData } from "@/lib/workspace/workflow-queries"

export async function NotificationsPanel({ locale }: { readonly locale: string }) {
  const t = await getTranslations("notifications")
  const activeLocale = await getLocale()
  const format = await getFormatter()
  const result = await getNotificationsData()
  if (result.kind !== "ready") {
    return null
  }
  const action = markNotificationReadAction.bind(null, locale)
  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">
        <Bell className="size-6 text-blue-700" />
        {t("title")}
      </h2>
      {result.value.length === 0 ? (
        <p className="mt-3 text-slate-600">{t("empty")}</p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {result.value.map((notification) => (
            <Card
              className={notification.read ? "p-4 opacity-70" : "border-blue-200 p-4"}
              key={notification.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">
                    {activeLocale === "ru" ? notification.title_ru : notification.title_en}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {activeLocale === "ru" ? notification.body_ru : notification.body_en}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {format.dateTime(new Date(notification.created_at), {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <form action={action}>
                    <input name="notificationId" type="hidden" value={notification.id} />
                    <button
                      aria-label={t("markRead")}
                      className="grid size-10 place-items-center rounded-full bg-blue-50 text-blue-700"
                      type="submit"
                    >
                      <Check className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
