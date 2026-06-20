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
    expect(parseLocale("kk")).toBe("kk")
    expect(parseLocale("de")).toBeNull()
  })

  it("replaces the locale prefix while preserving the route", () => {
    // Given
    const pathname = "/en/login"

    // When
    const result = replaceLocale(pathname, "ru")

    // Then
    expect(result).toBe("/ru/login")
  })
})
