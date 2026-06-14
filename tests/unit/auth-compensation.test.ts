import { describe, expect, it, vi } from "vitest"
import { deleteAuthUsers, restoreAuthUser } from "@/lib/admin/auth-compensation"

describe("auth compensation", () => {
  it("attempts every deletion and reports incomplete cleanup", async () => {
    const deleteUser = vi
      .fn()
      .mockResolvedValueOnce({ error: new Error("failed") })
      .mockResolvedValueOnce({ error: null })

    const cleaned = await deleteAuthUsers({ deleteUser, updateUserById: vi.fn() }, ["one", "two"])

    expect(cleaned).toBe(false)
    expect(deleteUser).toHaveBeenCalledTimes(2)
  })

  it("reports whether a previous Auth profile was restored", async () => {
    const updateUserById = vi.fn().mockResolvedValue({ error: null })

    const restored = await restoreAuthUser({ deleteUser: vi.fn(), updateUserById }, "student-id", {
      email: "student@example.com",
      fullName: "Student Name",
      language: "ru",
    })

    expect(restored).toBe(true)
    expect(updateUserById).toHaveBeenCalledWith("student-id", {
      email: "student@example.com",
      email_confirm: true,
      user_metadata: { full_name: "Student Name", language: "ru" },
    })
  })
})
