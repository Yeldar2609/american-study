import type { MetadataRoute } from "next"
import { readPublicEnv } from "@/lib/env"

// Only the public (unauthenticated) surfaces belong in the sitemap: the
// Russian-only landing and the login page. Everything under /app is gated.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = readPublicEnv().NEXT_PUBLIC_APP_URL
  const lastModified = new Date()

  return [
    {
      changeFrequency: "weekly",
      lastModified,
      priority: 1,
      url: new URL("/ru", base).toString(),
    },
    {
      changeFrequency: "monthly",
      lastModified,
      priority: 0.5,
      url: new URL("/ru/login", base).toString(),
    },
  ]
}
