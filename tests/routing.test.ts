import { describe, expect, it } from "vitest"
import { parseLocale, replaceLocale } from "@/i18n/routing"

describe("locale routing", () => {
  it("accepts only supported locales", () => {
    // Given
    const supported = "ru"

    // When
    const result = parseLocale(supported)

    // Then
    expect(result).toBe("ru")
    expect(parseLocale("kk")).toBeNull()
  })

  it("replaces the locale prefix while preserving the route", () => {
    // Given
    const pathname = "/en/preview/student"

    // When
    const result = replaceLocale(pathname, "ru")

    // Then
    expect(result).toBe("/ru/preview/student")
  })
})
