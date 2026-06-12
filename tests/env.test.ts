import { describe, expect, it } from "vitest"
import { hasSupabaseConfig, readPublicEnv } from "@/lib/env"

describe("public environment", () => {
  it("treats blank optional Supabase values as unconfigured", () => {
    const env = readPublicEnv({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      NEXT_PUBLIC_SUPABASE_URL: "",
    })

    expect(hasSupabaseConfig(env)).toBe(false)
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined()
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBeUndefined()
  })
})
