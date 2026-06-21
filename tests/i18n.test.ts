import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

type Messages = Readonly<Record<string, unknown>>

function readMessages(locale: "en" | "ru" | "kk"): Messages {
  return JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Messages
}

function leafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix === "" ? key : `${prefix}.${key}`),
  )
}

function leafValues(value: unknown): unknown[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [value]
  }

  return Object.values(value).flatMap(leafValues)
}

function leafEntries(value: unknown, prefix = ""): readonly (readonly [string, string])[] {
  if (typeof value === "string") {
    return [[prefix, value]]
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return []
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafEntries(child, prefix === "" ? key : `${prefix}.${key}`),
  )
}

describe("translation catalogs", () => {
  it("keeps English, Russian, and Kazakh message keys in exact parity", () => {
    const english = leafKeys(readMessages("en")).sort()

    expect(leafKeys(readMessages("ru")).sort()).toEqual(english)
    expect(leafKeys(readMessages("kk")).sort()).toEqual(english)
  })

  it.each(["en", "ru", "kk"] as const)("contains no blank user-facing strings in %s", (locale) => {
    const values = leafValues(readMessages(locale))

    expect(values.every((value) => typeof value === "string" && value.trim() !== "")).toBe(true)
  })

  it("uses genuine Russian copy instead of copied English values", () => {
    const english = new Map(leafEntries(readMessages("en")))
    const russian = new Map(leafEntries(readMessages("ru")))
    const allowedSharedValues = new Set([
      "common.brand",
      "auth.emailPlaceholder",
      "metadata.title",
      // Standardized-test brand names are identical across languages.
      "onboarding.test.toefl",
      "onboarding.test.ssat",
      "onboarding.test.det",
    ])
    const copiedKeys = [...english.entries()].flatMap(([key, value]) =>
      !allowedSharedValues.has(key) && russian.get(key) === value ? [key] : [],
    )

    expect(copiedKeys).toEqual([])
  })
})
