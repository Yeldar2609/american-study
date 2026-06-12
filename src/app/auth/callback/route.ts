import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { parseLocale } from "@/i18n/routing"
import { callbackDestination } from "@/lib/auth/access"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const locale = parseLocale(request.nextUrl.searchParams.get("locale") ?? "") ?? "en"
  const next = request.nextUrl.searchParams.get("next")
  const supabase = await createClient()

  if (code === null || supabase === null) {
    return NextResponse.redirect(new URL(`/${locale}/auth/error?code=callback`, request.url))
  }

  const result = await supabase.auth.exchangeCodeForSession(code)
  const destination = callbackDestination(locale, result.error?.message ?? null, next)
  return NextResponse.redirect(new URL(destination, request.url))
}
