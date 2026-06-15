import { describe, expect, it } from "vitest"
import { runImport } from "../../scripts/import-schools"
import type { SchoolImportRow } from "../../src/lib/schools/school-import"

const liveRequest = {
  kind: "live",
  csvPath: "tests/fixtures/schools-valid.csv",
  serviceRoleKey: "not-a-real-key",
  supabaseUrl: "https://example.supabase.co",
} as const

describe("runImport", () => {
  it("writes the complete accepted batch exactly once", async () => {
    // Given
    const calls: number[] = []
    const writer = {
      async write(rows: readonly SchoolImportRow[]): Promise<number> {
        calls.push(rows.length)
        return rows.length
      },
    }

    // When
    const report = await runImport(liveRequest, writer)

    // Then
    expect(report.acceptedCount).toBe(1)
    expect(calls).toEqual([1])
  })

  it("makes zero persistence calls when any row is rejected", async () => {
    // Given
    let callCount = 0
    const writer = {
      async write(): Promise<number> {
        callCount += 1
        return 0
      },
    }

    // When
    const act = runImport({ ...liveRequest, csvPath: "tests/fixtures/schools-invalid.csv" }, writer)

    // Then
    await expect(act).rejects.toThrow("rejected rows")
    expect(callCount).toBe(0)
  })

  it("keeps the stored natural-key count stable when repeated", async () => {
    // Given
    const storedKeys = new Set<string>()
    const writer = {
      async write(rows: readonly SchoolImportRow[]): Promise<number> {
        for (const row of rows) {
          const key = `${row.name}\u0000${row.state}\u0000${row.city}`
          storedKeys.add(key.toLocaleLowerCase("en-US"))
        }
        return rows.length
      },
    }

    // When
    await runImport(liveRequest, writer)
    const firstCount = storedKeys.size
    await runImport(liveRequest, writer)

    // Then
    expect(firstCount).toBe(1)
    expect(storedKeys.size).toBe(firstCount)
  })

  it("rejects a partial database write", async () => {
    // Given
    const writer = {
      async write(): Promise<number> {
        return 0
      },
    }

    // When
    const act = runImport(liveRequest, writer)

    // Then
    await expect(act).rejects.toThrow("database affected 0 rows; expected 1")
  })
})
