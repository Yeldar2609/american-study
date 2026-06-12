import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { parseLocale } from "@/i18n/routing"

export default async function RootPage() {
  const cookieStore = await cookies()
  const preferredLocale = parseLocale(cookieStore.get("NEXT_LOCALE")?.value ?? "") ?? "en"
  redirect(`/${preferredLocale}`)
}
