import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { readPublicEnv } from "@/lib/env"

export async function createClient() {
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
}
