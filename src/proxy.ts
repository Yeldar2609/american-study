import type { NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"
import { routing } from "@/i18n/routing"
import { refreshSupabaseSession } from "@/lib/supabase/proxy"

const intlMiddleware = createMiddleware(routing)

export default async function proxy(request: NextRequest) {
  const response = intlMiddleware(request)
  await refreshSupabaseSession(request, response)
  return response
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*|auth/callback).*)"],
}
