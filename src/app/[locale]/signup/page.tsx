import { redirect } from "next/navigation"

type SignupPageProps = {
  readonly params: Promise<{ locale: string }>
}

// Self-serve signup is disabled — accounts are created by the admin only.
export default async function SignupPage({ params }: SignupPageProps) {
  const { locale } = await params
  redirect(`/${locale}/login`)
}
