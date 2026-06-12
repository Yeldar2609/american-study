import { createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import { readPublicEnv } from "@/lib/env"

export async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const env = readPublicEnv()

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          for (const { name, value, options } of items) {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  await supabase.auth.getUser()
}
