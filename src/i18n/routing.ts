import { defineRouting } from "next-intl/routing"

export const locales = ["en", "ru", "kk"] as const
export type Locale = (typeof locales)[number]

export function parseLocale(value: string): Locale | null {
  switch (value) {
    case "en":
    case "ru":
    case "kk":
      return value
    default:
      return null
  }
}

export function replaceLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/")
  const firstSegment = segments[1]

  if (firstSegment !== undefined && parseLocale(firstSegment) !== null) {
    segments[1] = locale
    return segments.join("/")
  }

  return `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`
}

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
  localeCookie: {
    name: "NEXT_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
  },
})
