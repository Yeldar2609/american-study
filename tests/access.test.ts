import { describe, expect, it } from "vitest"
import {
  authenticatedRoleDestination,
  callbackDestination,
  parseUserProfile,
  parseUserRole,
  roleHomePath,
  safeRedirectPath,
} from "@/lib/auth/access"

describe("authorization contracts", () => {
  it("parses only trusted application roles", () => {
    // Given
    const trustedRole = "parent"

    // When
    const result = parseUserRole(trustedRole)

    // Then
    expect(result).toBe("parent")
    expect(parseUserRole("owner")).toBeNull()
  })

  it("parses authoritative database profiles and rejects malformed rows", () => {
    expect(parseUserProfile({ language: "ru", role: "parent" })).toEqual({
      language: "ru",
      role: "parent",
    })
    expect(parseUserProfile({ language: "de", role: "parent" })).toBeNull()
    expect(parseUserProfile({ language: "en", role: "owner" })).toBeNull()
    expect(parseUserProfile(null)).toBeNull()
  })

  it("rejects absolute and protocol-relative redirect targets", () => {
    // Given
    const fallback = "/en/app"

    // When
    const external = safeRedirectPath("https://example.com", fallback)
    const protocolRelative = safeRedirectPath("//example.com", fallback)

    // Then
    expect(external).toBe(fallback)
    expect(protocolRelative).toBe(fallback)
  })

  it("rejects browser-normalized backslash redirect targets", () => {
    const fallback = "/en/app"

    expect(safeRedirectPath("/\\evil.example", fallback)).toBe(fallback)
    expect(safeRedirectPath("/%5Cevil.example", fallback)).toBe(fallback)
  })

  it("builds the role-specific localized home route", () => {
    // Given
    const locale = "ru"

    // When
    const result = roleHomePath(locale, "admin")

    // Then
    expect(result).toBe("/ru/app/admin")
  })

  it("routes missing and mismatched roles without opening the requested role", () => {
    expect(authenticatedRoleDestination("en", null, "student")).toBe("/en/setup-required")
    expect(authenticatedRoleDestination("en", { language: "ru", role: "parent" }, "student")).toBe(
      "/ru/app/parent",
    )
    expect(authenticatedRoleDestination("en", { language: "ru", role: "admin" }, "admin")).toBe(
      "/ru/app/admin",
    )
    expect(
      authenticatedRoleDestination("en", { language: "en", role: "admin" }, "admin"),
    ).toBeNull()
  })

  it("selects callback destinations without leaking unsafe next values", () => {
    expect(callbackDestination("en", null, "/\\evil.example")).toBe("/en/app")
    expect(callbackDestination("ru", "exchange failed", "/ru/app")).toBe(
      "/ru/auth/error?code=callback",
    )
    expect(callbackDestination("en", null, "/en/app/student")).toBe("/en/app/student")
  })
})
