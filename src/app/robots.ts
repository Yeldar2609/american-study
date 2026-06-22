import type { MetadataRoute } from "next"
import { readPublicEnv } from "@/lib/env"

// Allow crawling of the public marketing surfaces; keep the authenticated app
// (every /<locale>/app/* route) out of the index.
export default function robots(): MetadataRoute.Robots {
  const base = readPublicEnv().NEXT_PUBLIC_APP_URL

  return {
    rules: {
      allow: "/",
      disallow: ["/en/app", "/ru/app", "/kk/app"],
      userAgent: "*",
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  }
}
