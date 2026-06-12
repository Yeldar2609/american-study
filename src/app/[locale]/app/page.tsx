import { redirect } from "next/navigation"
import { parseUserRoleFromMetadata, roleHomePath } from "@/lib/auth/access"
import { requireUser } from "@/lib/auth/session"

type AppPageProps = {
  readonly params: Promise<{ locale: string }>
}

export default async function AppPage({ params }: AppPageProps) {
  const { locale } = await params
  const user = await requireUser(locale)
  const role = parseUserRoleFromMetadata(user.app_metadata)

  redirect(role === null ? `/${locale}/setup-required` : roleHomePath(locale, role))
}
