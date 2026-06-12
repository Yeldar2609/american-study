import { describe, expect, it } from "vitest"
import english from "../messages/en.json"
import russian from "../messages/ru.json"

function translationKeys(value: unknown, prefix = ""): readonly string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [prefix]
  }

  return Object.entries(value).flatMap(([key, child]) =>
    translationKeys(child, prefix === "" ? key : `${prefix}.${key}`),
  )
}

describe("translation catalogs", () => {
  it("keeps English and Russian key sets identical", () => {
    // Given
    const englishKeys = translationKeys(english).toSorted()

    // When
    const russianKeys = translationKeys(russian).toSorted()

    // Then
    expect(russianKeys).toEqual(englishKeys)
  })
})
