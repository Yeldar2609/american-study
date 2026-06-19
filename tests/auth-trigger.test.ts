import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const studentActions = readFileSync("src/lib/admin/student-actions.ts", "utf8")

describe("Auth provisioning metadata", () => {
  it("sends the role in user metadata so the insert trigger can provision profiles", () => {
    expect(studentActions).toMatch(
      /user_metadata:\s*{\s*full_name: value\.studentFullName,\s*language: value\.studentLanguage,\s*role: "student"/,
    )
    expect(studentActions).toMatch(
      /user_metadata:\s*{\s*full_name: value\.parentFullName,\s*language: value\.parentLanguage,\s*role: "parent"/,
    )
  })
})
