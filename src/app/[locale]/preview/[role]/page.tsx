import { notFound } from "next/navigation"
import { RoleDashboard } from "@/components/app/role-dashboard"
import { parseUserRole } from "@/lib/auth/access"

type PreviewPageProps = {
  readonly params: Promise<{ locale: string; role: string }>
  readonly searchParams: Promise<{ section?: string }>
}

export default async function PreviewPage({ params, searchParams }: PreviewPageProps) {
  const { locale, role: rawRole } = await params
  const { section } = await searchParams
  const role = parseUserRole(rawRole)

  if (role === null) {
    notFound()
  }

  return <RoleDashboard locale={locale} preview role={role} section={section} />
}
