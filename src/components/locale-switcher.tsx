"use client"

import { Languages } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { type Locale, locales, parseLocale } from "@/i18n/routing"
import { persistUserLanguage } from "@/lib/i18n/language-action"

// Language selector. Hidden from students (they are English-only) at the call
// site; parents and admins can choose English / Russian / Kazakh.
export function LocaleSwitcher() {
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations("language")
  const [hasError, setHasError] = useState(false)
  const [pending, startTransition] = useTransition()

  function change(next: Locale) {
    if (next === locale) {
      return
    }
    startTransition(async () => {
      const result = await persistUserLanguage(next)
      if (result.kind === "error") {
        setHasError(true)
        return
      }
      setHasError(false)
      router.replace(
        { pathname, query: Object.fromEntries(searchParams.entries()) },
        { locale: next },
      )
    })
  }

  return (
    <div className="relative inline-flex items-center">
      <Languages
        aria-hidden="true"
        className="pointer-events-none absolute left-3 size-4 text-slate-500"
      />
      <select
        aria-label={t("label")}
        className="min-h-11 rounded-xl border border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm font-bold text-slate-700 shadow-sm outline-none transition hover:border-blue-300 focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        onChange={(event) => {
          const next = parseLocale(event.target.value)
          if (next !== null) {
            change(next)
          }
        }}
        value={locale}
      >
        {locales.map((option) => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </select>
      <p aria-live="polite" className="sr-only">
        {hasError ? t("switchError") : ""}
      </p>
    </div>
  )
}
