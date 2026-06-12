"use client"

import { Languages } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import type { Locale } from "@/i18n/routing"

export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations("language")
  const nextLocale: Locale = locale === "en" ? "ru" : "en"

  return (
    <button
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
      onClick={() =>
        router.replace(
          {
            pathname,
            query: Object.fromEntries(searchParams.entries()),
          },
          { locale: nextLocale },
        )
      }
      type="button"
    >
      <Languages aria-hidden="true" className="size-4" />
      {t(nextLocale)}
    </button>
  )
}
