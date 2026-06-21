import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"
import { readPublicEnv } from "@/lib/env"

// One cookie-bound client per request render. Without cache() this was rebuilt
// (and the cookie store re-read) ~5x per page across the auth/data helpers.
export const createClient = cache(async () => {
  const env = readPublicEnv()

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (items) => {
          for (const { name, value, options } of items) {
            cookieStore.set(name, value, options)
          }
        },
      },
    },
  )
})
