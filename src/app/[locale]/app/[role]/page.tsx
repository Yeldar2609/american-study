import { notFound } from "next/navigation"
import { RoleDashboard } from "@/components/app/role-dashboard"
import { parseUserRole } from "@/lib/auth/access"
import { requireRole } from "@/lib/auth/session"

type RolePageProps = {
  readonly params: Promise<{ locale: string; role: string }>
  readonly searchParams: Promise<{
    body?: string
    q?: string
    section?: string
    setting?: string
    state?: string
    student?: string
  }>
}

export default async function RolePage({ params, searchParams }: RolePageProps) {
  const { locale, role: rawRole } = await params
  const { body, q, section, setting, state, student } = await searchParams
  const role = parseUserRole(rawRole)

  if (role === null) {
    notFound()
  }

  await requireRole(locale, role)
  return (
    <RoleDashboard
      locale={locale}
      role={role}
      schoolFilters={{ body, query: q, setting, state }}
      section={section}
      selectedStudentId={student}
    />
  )
}
