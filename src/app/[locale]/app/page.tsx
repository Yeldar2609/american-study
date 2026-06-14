import { redirect } from "next/navigation"
import { roleHomePath } from "@/lib/auth/access"
import { requireAuthenticatedUser } from "@/lib/auth/session"

type AppPageProps = {
  readonly params: Promise<{ locale: string }>
}

export default async function AppPage({ params }: AppPageProps) {
  const { locale } = await params
  const authenticated = await requireAuthenticatedUser(locale)

  redirect(
    authenticated === null ? `/${locale}/setup-required` : roleHomePath(locale, authenticated.role),
  )
}
