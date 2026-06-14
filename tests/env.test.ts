import { describe, expect, it } from "vitest"
import { hasSupabaseAdminConfig, hasSupabaseConfig, readPrivateEnv, readPublicEnv } from "@/lib/env"

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

describe("private environment", () => {
  it("keeps the Supabase service-role key in a server-only reader", () => {
    const env = readPrivateEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "server-secret",
    })

    expect(hasSupabaseAdminConfig(env)).toBe(true)
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("server-secret")
  })

  it("treats a blank service-role key as unconfigured", () => {
    const env = readPrivateEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "",
    })

    expect(hasSupabaseAdminConfig(env)).toBe(false)
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined()
  })
})
