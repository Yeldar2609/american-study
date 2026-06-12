import { z } from "zod"

const optionalEnvironmentValue = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional())

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: optionalEnvironmentValue(z.url()),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalEnvironmentValue(z.string().min(1)),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>

export function readPublicEnv(
  source: Readonly<Record<string, string | undefined>> = process.env,
): PublicEnv {
  return publicEnvSchema.parse(source)
}

export function hasSupabaseConfig(env: PublicEnv = readPublicEnv()): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
}
