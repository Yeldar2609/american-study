import { BookOpen, CalendarDays, FileText, Home, LogOut, School, Users } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Logo } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import type { UserRole } from "@/lib/auth/access"
import { logoutAction } from "@/lib/auth/actions"

const iconByItem = {
  home: Home,
  roadmap: BookOpen,
  schools: School,
  essays: FileText,
  bookings: CalendarDays,
  people: Users,
} as const

type NavigationItem = keyof typeof iconByItem

type SidebarProps = {
  readonly locale: string
  readonly role: UserRole
  readonly activeSection: string
  readonly preview?: boolean
}

export async function AppSidebar({ locale, role, activeSection, preview = false }: SidebarProps) {
  const t = await getTranslations("app")
  const common = await getTranslations("common")
  const items: readonly NavigationItem[] =
    role === "admin"
      ? ["home", "people", "schools", "essays"]
      : ["home", "roadmap", "schools", "essays", "bookings"]
  const logout = logoutAction.bind(null, locale)

  return (
    <aside className="flex w-full flex-col border-b border-slate-200 bg-white/90 p-4 backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <Logo label={common("brand")} />
        <LocaleSwitcher />
      </div>
      <nav
        aria-label={t("navigation")}
        className="mt-5 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible"
      >
        {items.map((item) => {
          const Icon = iconByItem[item]
          return (
            <Link
              aria-current={activeSection === item ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-sm font-bold transition-colors ${
                activeSection === item
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-800"
              }`}
              href={preview ? `/preview/${role}?section=${item}` : `/app/${role}?section=${item}`}
              key={item}
            >
              <Icon aria-hidden="true" className="size-5" />
              {t(`nav.${item}`)}
            </Link>
          )
        })}
        {!preview && (
          <form action={logout} className="shrink-0 lg:hidden">
            <Button type="submit" variant="ghost">
              <LogOut aria-hidden="true" className="size-5" />
              {common("signOut")}
            </Button>
          </form>
        )}
      </nav>
      {!preview && (
        <form action={logout} className="mt-auto hidden pt-8 lg:block">
          <Button className="w-full" type="submit" variant="ghost">
            <LogOut aria-hidden="true" className="size-5" />
            {common("signOut")}
          </Button>
        </form>
      )}
    </aside>
  )
}
