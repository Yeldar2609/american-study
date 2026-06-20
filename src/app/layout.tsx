import { Rubik } from "next/font/google"
import { headers } from "next/headers"
import type { ReactNode } from "react"
import "./globals.css"
import { parseLocale } from "@/i18n/routing"

const bodyFont = Rubik({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
})

// Modern Civic uses a geometric sans throughout. variant-C's Manrope lacks
// Cyrillic glyphs, which would break RU headings, so the display face reuses
// Rubik (geometric, Cyrillic-complete) at heavier weights.
const displayFont = Rubik({
  weight: ["500", "700", "800"],
  subsets: ["latin", "cyrillic"],
  variable: "--font-display",
})

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const requestHeaders = await headers()
  const locale = parseLocale(requestHeaders.get("x-next-intl-locale")?.toLowerCase() ?? "") ?? "en"

  return (
    <html
      className={`${bodyFont.variable} ${displayFont.variable}`}
      data-scroll-behavior="smooth"
      lang={locale}
      suppressHydrationWarning
    >
      <body className="font-[family-name:var(--font-body)] antialiased">{children}</body>
    </html>
  )
}
