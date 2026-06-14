import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

type Messages = Readonly<Record<string, unknown>>

function readMessages(locale: "en" | "ru"): Messages {
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

describe("translation catalogs", () => {
  it("keeps English and Russian message keys in exact parity", () => {
    const english = readMessages("en")
    const russian = readMessages("ru")

    expect(leafKeys(russian).sort()).toEqual(leafKeys(english).sort())
  })

  it.each(["en", "ru"] as const)("contains no blank user-facing strings in %s", (locale) => {
    const values = leafValues(readMessages(locale))

    expect(values.every((value) => typeof value === "string" && value.trim() !== "")).toBe(true)
  })
})
