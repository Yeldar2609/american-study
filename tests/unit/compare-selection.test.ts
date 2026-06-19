import { describe, expect, it } from "vitest"
import { canAddToCompare, MAX_COMPARE, toggleCompare } from "@/lib/match/compare-selection"

describe("toggleCompare", () => {
  it("adds an id when it is not selected and there is room", () => {
    expect(toggleCompare(["a"], "b")).toEqual(["a", "b"])
  })

  it("removes an id that is already selected", () => {
    expect(toggleCompare(["a", "b"], "a")).toEqual(["b"])
  })

  it("never exceeds the maximum when adding a new id", () => {
    const full = ["a", "b", "c"]
    const result = toggleCompare(full, "d")
    expect(result).toHaveLength(MAX_COMPARE)
    expect(result).not.toContain("d")
  })

  it("still removes an already-selected id even when the selection is full", () => {
    expect(toggleCompare(["a", "b", "c"], "b")).toEqual(["a", "c"])
  })
})

describe("canAddToCompare", () => {
  it("allows toggling an id that is already selected", () => {
    expect(canAddToCompare(["a", "b", "c"], "a")).toBe(true)
  })

  it("allows adding while below the maximum", () => {
    expect(canAddToCompare(["a", "b"], "c")).toBe(true)
  })

  it("blocks adding a new id once the maximum is reached", () => {
    expect(canAddToCompare(["a", "b", "c"], "d")).toBe(false)
  })
})
