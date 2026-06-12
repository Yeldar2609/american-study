import { AuthCard } from "@/components/auth/auth-card"

type ForgotPasswordPageProps = {
  readonly params: Promise<{ locale: string }>
}

export default async function ForgotPasswordPage({ params }: ForgotPasswordPageProps) {
  const { locale } = await params
  return <AuthCard locale={locale} mode="reset" />
}
