import { AuthCard } from "@/components/auth/auth-card"

type LoginPageProps = {
  readonly params: Promise<{ locale: string }>
  readonly searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params
  const { next } = await searchParams
  return <AuthCard locale={locale} mode="login" next={next ?? ""} />
}
