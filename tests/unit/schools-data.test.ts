import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { parseSchoolCsv, SCHOOL_CSV_HEADER } from "../../src/lib/schools/school-import"

const provenanceSchema = z.object({
  source_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  canonical_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  source_row_count: z.number().int().nonnegative(),
  canonical_row_count: z.number().int().nonnegative(),
  canonical_header: z.array(z.string()),
})

const authoritativeSql = readFileSync(
  "supabase/migrations/202606150002_authoritative_schools.sql",
  "utf8",
)

describe("canonical school data", () => {
  it("matches its provenance and accepts every row", () => {
    // Given
    const csv = readFileSync("data/schools.csv", "utf8")
    const provenance = provenanceSchema.parse(
      JSON.parse(readFileSync("data/schools.provenance.json", "utf8")),
    )

    // When
    const report = parseSchoolCsv(csv)
    const sha256 = createHash("sha256").update(csv, "utf8").digest("hex")

    // Then
    expect(csv.split(/\r?\n/u)[0]).toBe(SCHOOL_CSV_HEADER.join(","))
    expect(report.rejected).toEqual([])
    expect(report.acceptedCount).toBe(70)
    expect(report.acceptedCount).toBe(provenance.canonical_row_count)
    expect(provenance.source_row_count).toBe(70)
    expect(provenance.canonical_header).toEqual(SCHOOL_CSV_HEADER)
    expect(sha256).toBe(provenance.canonical_sha256)
  })

  it("matches the authoritative migration payload exactly", () => {
    // Given
    const csv = readFileSync("data/schools.csv", "utf8")
    const payloadStart = authoritativeSql.indexOf("$schools$") + "$schools$".length
    const payloadEnd = authoritativeSql.indexOf("$schools$::jsonb", payloadStart)

    // When
    const report = parseSchoolCsv(csv)
    const migrationRows = z
      .array(z.unknown())
      .parse(JSON.parse(authoritativeSql.slice(payloadStart, payloadEnd)))

    // Then
    expect(payloadStart).toBeGreaterThan("$schools$".length - 1)
    expect(payloadEnd).toBeGreaterThan(payloadStart)
    expect(migrationRows).toEqual(report.accepted)
  })

  it("preserves representative normalized values and blank fields", () => {
    // Given
    const csv = readFileSync("data/schools.csv", "utf8")

    // When
    const report = parseSchoolCsv(csv)
    const cate = report.accepted.find(({ name }) => name === "Cate School")

    // Then
    expect(cate).toMatchObject({
      state: "CA",
      grades: "9-12",
      strengths: ["Outdoor/Environmental", "Arts", "Leadership"],
      enrollment: null,
      website_url: null,
      niche_profile_url: null,
    })
  })
})
