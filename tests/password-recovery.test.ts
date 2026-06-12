import { describe, expect, it, vi } from "vitest"
import { updatePassword } from "@/components/auth/update-password-form"

describe("password recovery", () => {
  it("updates a valid password through Supabase", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const client = { auth: { updateUser } }

    const result = await updatePassword(client, "secure-passphrase")

    expect(result).toBe("success")
    expect(updateUser).toHaveBeenCalledWith({ password: "secure-passphrase" })
  })

  it("reports provider and input failures", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: new Error("expired") })
    const client = { auth: { updateUser } }

    expect(await updatePassword(client, "secure-passphrase")).toBe("error")
    expect(await updatePassword(client, "short")).toBe("invalid")
    expect(await updatePassword(null, "secure-passphrase")).toBe("configuration")
  })
})
