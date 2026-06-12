declare namespace NodeJS {
  interface ProcessEnv {
    readonly NEXT_PUBLIC_APP_URL?: string
    readonly NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
    readonly NEXT_PUBLIC_SUPABASE_URL?: string
  }
}
