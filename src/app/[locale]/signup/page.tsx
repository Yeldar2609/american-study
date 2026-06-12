import { AuthCard } from "@/components/auth/auth-card"

type SignupPageProps = {
  readonly params: Promise<{ locale: string }>
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = await params
  return <AuthCard locale={locale} mode="signup" />
}
