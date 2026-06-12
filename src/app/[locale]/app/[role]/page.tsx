import { notFound } from "next/navigation"
import { RoleDashboard } from "@/components/app/role-dashboard"
import { parseUserRole } from "@/lib/auth/access"
import { requireRole } from "@/lib/auth/session"

type RolePageProps = {
  readonly params: Promise<{ locale: string; role: string }>
  readonly searchParams: Promise<{ section?: string }>
}

export default async function RolePage({ params, searchParams }: RolePageProps) {
  const { locale, role: rawRole } = await params
  const { section } = await searchParams
  const role = parseUserRole(rawRole)

  if (role === null) {
    notFound()
  }

  await requireRole(locale, role)
  return <RoleDashboard locale={locale} role={role} section={section} />
}
