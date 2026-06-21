import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  FileText,
  FolderKanban,
  Home,
  Library,
  LogOut,
  Mic,
  School,
  Settings,
  Users,
} from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Logo } from "@/components/brand/logo"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { ROLE_SECTIONS, type UserRole } from "@/lib/auth/access"
import { logoutAction } from "@/lib/auth/actions"

const iconByItem = {
  home: Home,
  roadmap: BookOpen,
  calendar: CalendarRange,
  schools: School,
  essays: FileText,
  interview: Mic,
  applications: FolderKanban,
  bookings: CalendarDays,
  report: ClipboardList,
  people: Users,
  resources: Library,
  settings: Settings,
} as const

type NavigationItem = keyof typeof iconByItem

type SidebarProps = {
  readonly locale: string
  readonly role: UserRole
  readonly activeSection: string
}

export async function AppSidebar({ locale, role, activeSection }: SidebarProps) {
  const t = await getTranslations("app")
  const common = await getTranslations("common")
  const items = ROLE_SECTIONS[role] as readonly NavigationItem[]
  const logout = logoutAction.bind(null, locale)

  return (
    <aside className="flex w-full flex-col border-b border-t-[3px] border-slate-200 border-t-blue-700 bg-white/90 p-4 backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-6 print:hidden">
      <div className="flex items-center justify-between gap-3">
        <Logo label={common("brand")} />
        {/* Students are English-only: no language switcher. Parents/admins may switch. */}
        {role !== "student" && <LocaleSwitcher />}
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
                  ? "bg-blue-700 text-white"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
              href={`/app/${role}?section=${item}`}
              key={item}
            >
              <Icon aria-hidden="true" className="size-5" />
              {t(`nav.${item}`)}
            </Link>
          )
        })}
        <form action={logout} className="shrink-0 lg:hidden">
          <Button type="submit" variant="ghost">
            <LogOut aria-hidden="true" className="size-5" />
            {common("signOut")}
          </Button>
        </form>
      </nav>
      <form action={logout} className="mt-auto hidden pt-8 lg:block">
        <Button className="w-full" type="submit" variant="ghost">
          <LogOut aria-hidden="true" className="size-5" />
          {common("signOut")}
        </Button>
      </form>
    </aside>
  )
}
