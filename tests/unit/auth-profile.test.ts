import { describe, expect, it, vi } from "vitest"
import { type AuthIdentity, type ProfileStore, resolveUserProfile } from "@/lib/auth/session"

const legacyIdentity: AuthIdentity = {
  app_metadata: { role: "parent" },
  email: "parent@example.com",
  id: "1825b9d8-7a02-43e9-a79a-f9ff08f7429d",
  user_metadata: { full_name: "Legacy Parent", language: "ru" },
}

function createStore(
  readResult: Awaited<ReturnType<ProfileStore["readProfile"]>>,
  writeResult: Awaited<ReturnType<ProfileStore["writeTransitionProfile"]>> = {
    data: null,
    error: new Error("transition write failed"),
  },
): ProfileStore {
  const writeTransitionProfile = vi.fn().mockResolvedValue(writeResult)

  return {
    readProfile: vi.fn().mockResolvedValue(readResult),
    writeTransitionProfile,
  }
}

describe("authenticated profile resolution", () => {
  it("database profile overrides metadata", async () => {
    // Given
    const store = createStore({
      data: { language: "en", role: "student" },
      error: null,
    })
    const staleIdentity: AuthIdentity = {
      ...legacyIdentity,
      app_metadata: { role: "admin" },
    }

    // When
    const result = await resolveUserProfile(staleIdentity, store)

    // Then
    expect(result).toEqual({ language: "en", role: "student" })
  })

  it("query error fails closed", async () => {
    // Given
    const store = createStore({
      data: { language: "en", role: "admin" },
      error: new Error("database unavailable"),
    })

    // When
    const result = await resolveUserProfile(legacyIdentity, store)

    // Then
    expect(result).toBeNull()
  })

  it("failed transition insert fails closed", async () => {
    // Given
    const store = createStore(
      { data: null, error: null },
      {
        data: {
          full_name: "Plausible Admin",
          language: "en",
          role: "admin",
        },
        error: new Error("transition write failed"),
      },
    )

    // When
    const result = await resolveUserProfile(legacyIdentity, store)

    // Then
    expect(result).toBeNull()
  })

  it("successful migration returns database profile", async () => {
    // Given
    const store = createStore(
      { data: null, error: null },
      {
        data: { language: "en", role: "student" },
        error: null,
      },
    )

    // When
    const result = await resolveUserProfile(legacyIdentity, store)

    // Then
    expect(result).toEqual({ language: "en", role: "student" })
  })

  it("malformed database row fails closed", async () => {
    // Given
    const store = createStore({
      data: { language: "de", role: "admin" },
      error: null,
    })

    // When
    const result = await resolveUserProfile(legacyIdentity, store)

    // Then
    expect(result).toBeNull()
  })

  it("malformed transition response fails closed", async () => {
    // Given
    const store = createStore(
      { data: null, error: null },
      {
        data: { language: "ru", role: "owner" },
        error: null,
      },
    )

    // When
    const result = await resolveUserProfile(legacyIdentity, store)

    // Then
    expect(result).toBeNull()
  })

  it.each([
    ["missing email", { ...legacyIdentity, email: undefined }],
    ["blank full name", { ...legacyIdentity, user_metadata: { full_name: "   ", language: "ru" } }],
    ["malformed role", { ...legacyIdentity, app_metadata: { role: "owner" } }],
    [
      "client-selected role",
      {
        ...legacyIdentity,
        app_metadata: {},
        user_metadata: { full_name: "Legacy Parent", language: "ru", role: "admin" },
      },
    ],
    [
      "malformed language",
      { ...legacyIdentity, user_metadata: { full_name: "Legacy Parent", language: "de" } },
    ],
  ])("malformed trusted metadata fails closed: %s", async (_case, identity) => {
    // Given
    const store = createStore({ data: null, error: null })

    // When
    const result = await resolveUserProfile(identity, store)

    // Then
    expect(result).toBeNull()
  })
})
