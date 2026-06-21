import { describe, expect, it } from "vitest"
import { isValidBookingLink } from "@/lib/settings/app-settings"

describe("isValidBookingLink", () => {
  it("accepts absolute https links", () => {
    expect(isValidBookingLink("https://calendar.app.google/dJVzVdoJhdCzXSt17")).toBe(true)
  })

  it("rejects http, other protocols, and malformed values", () => {
    expect(isValidBookingLink("http://calendar.app.google/abc")).toBe(false)
    expect(isValidBookingLink("javascript:alert(1)")).toBe(false)
    expect(isValidBookingLink("calendar.app.google/abc")).toBe(false)
    expect(isValidBookingLink("")).toBe(false)
  })
})
