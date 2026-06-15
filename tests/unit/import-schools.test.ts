import { describe, expect, it } from "vitest"
import {
  ensureImportHasNoRejections,
  ImportConfigurationError,
  parseSchoolCsv,
  resolveImportRequest,
  SCHOOL_UPSERT_CONFLICT_TARGET,
} from "../../scripts/import-schools"

const HEADER =
  "name,state,city,setting,student_body,affiliation,grades,enrollment,pct_boarding,pct_international,boarding_tuition_usd,acceptance_rate_pct,avg_ssat_pctile,offers_financial_aid,niche_grade,strengths,website_url,niche_profile_url,notes"

function csvRow(values: Readonly<Record<string, string>>): string {
  const columns = HEADER.split(",")
  return columns.map((column) => values[column] ?? "").join(",")
}

describe("parseSchoolCsv", () => {
  it("characterizes the current canonical header and comma-delimited strengths", () => {
    // Given
    const csv = [
      HEADER,
      'Example Academy,MA,Andover,suburban,coed,,9-12,,,,,,,true,A,"STEM, Arts",https://example.edu,https://example.edu/profile,',
    ].join("\n")

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(report.rejected).toEqual([])
    expect(report.accepted[0]).toMatchObject({
      state: "MA",
      setting: "suburban",
      strengths: ["STEM", "Arts"],
      student_body: "coed",
      website_url: "https://example.edu",
      niche_profile_url: "https://example.edu/profile",
    })
  })

  it("accepts and normalizes the supplied CSV conventions", () => {
    // Given
    const sourceHeader = HEADER.replace("website_url", "website").replace(
      "niche_profile_url",
      "niche_profile",
    )
    const csv = [
      sourceHeader,
      'Cate School,California,Carpinteria,Rural,Coed,Nonsectarian,"9–12",,,,,,,true,A+,"Outdoor/Environmental; Arts; Leadership",,,',
    ].join("\n")

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(report.rejected).toEqual([])
    expect(report.accepted[0]).toMatchObject({
      grades: "9-12",
      setting: "rural",
      state: "CA",
      strengths: ["Outdoor/Environmental", "Arts", "Leadership"],
      student_body: "coed",
      website_url: null,
      niche_profile_url: null,
    })
  })

  it("parses valid blank optional values as database nulls", () => {
    // Given
    const csv = `${HEADER}\nExample Academy,MA,Andover,suburban,coed,,,,,,,,,,,,,,`

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(report.accepted).toEqual([
      {
        name: "Example Academy",
        state: "MA",
        city: "Andover",
        setting: "suburban",
        student_body: "coed",
        affiliation: null,
        grades: null,
        enrollment: null,
        pct_boarding: null,
        pct_international: null,
        boarding_tuition_usd: null,
        acceptance_rate_pct: null,
        avg_ssat_pctile: null,
        offers_financial_aid: null,
        niche_grade: null,
        strengths: [],
        website_url: null,
        niche_profile_url: null,
        notes: null,
      },
    ])
  })

  it("rejects malformed required fields, enums, and numeric ranges", () => {
    // Given
    const csv = [
      HEADER,
      csvRow({ city: "Andover", setting: "suburban", state: "MA", student_body: "coed" }),
      csvRow({
        city: "Andover",
        name: "Bad Setting",
        setting: "remote",
        state: "MA",
        student_body: "coed",
      }),
      csvRow({
        city: "Andover",
        name: "Bad Body",
        setting: "urban",
        state: "MA",
        student_body: "mixed",
      }),
      csvRow({
        acceptance_rate_pct: "101",
        city: "Andover",
        name: "Bad Rate",
        setting: "rural",
        state: "MA",
        student_body: "girls",
      }),
      csvRow({
        city: "Andover",
        enrollment: "-1",
        name: "Bad Enrollment",
        setting: "rural",
        state: "MA",
        student_body: "boys",
      }),
    ].join("\n")

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(report.acceptedCount).toBe(0)
    expect(report.rejectedCount).toBe(5)
    expect(report.rejected.map(({ line }) => line)).toEqual([2, 3, 4, 5, 6])
  })

  it("rejects duplicate normalized keys and documents the database upsert target", () => {
    // Given
    const csv = [
      HEADER,
      "Example Academy,MA,Andover,suburban,coed,,,,,,,,,,,,,,",
      " example academy ,ma, andover ,urban,coed,,,,,,,,,,,,,,",
    ].join("\n")

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(SCHOOL_UPSERT_CONFLICT_TARGET).toBe("natural_key")
    expect(report.acceptedCount).toBe(1)
    expect(report.rejected).toEqual([{ line: 3, reason: "duplicate school key" }])
  })

  it("reports accepted and rejected row counts", () => {
    // Given
    const csv = [
      HEADER,
      'Valid School,NY,New York,urban,coed,,9-12,500,80,20,70000,25,85,true,A+,"STEM, Arts",https://example.edu,,',
      "Invalid School,NY,New York,urban,coed,,,,,,,-1,,,,,,,",
    ].join("\n")

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(report.acceptedCount).toBe(1)
    expect(report.rejectedCount).toBe(1)
  })

  it("rejects an unknown or missing header before accepting rows", () => {
    // Given
    const csv = `${HEADER.replace("notes", "unexpected")}\nExample Academy,MA,Andover,suburban,coed,,,,,,,,,,,,,,`

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(report.acceptedCount).toBe(0)
    expect(report.rejected).toEqual([
      {
        line: 1,
        reason: `header: expected ${HEADER}`,
      },
    ])
  })

  it("rejects non-HTTPS URLs", () => {
    // Given
    const csv = [
      HEADER,
      "Example Academy,MA,Andover,suburban,coed,,,,,,,,,,,,http://example.edu,,",
    ].join("\n")

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(report.acceptedCount).toBe(0)
    expect(report.rejected[0]?.reason).toContain("must use HTTPS")
  })

  it("rejects unknown two-letter state codes", () => {
    // Given
    const csv = [HEADER, "Example Academy,ZZ,Andover,suburban,coed,,,,,,,,,,,,,,"].join("\n")

    // When
    const report = parseSchoolCsv(csv)

    // Then
    expect(report.acceptedCount).toBe(0)
    expect(report.rejected[0]?.reason).toContain("official US state")
  })

  it("refuses a live import report containing any rejected row", () => {
    const report = parseSchoolCsv(
      [
        HEADER,
        "Valid School,NY,New York,urban,coed,,,,,,,,,,,,,,",
        "Invalid School,NY,New York,remote,coed,,,,,,,,,,,,,,",
      ].join("\n"),
    )

    expect(() => ensureImportHasNoRejections(report)).toThrow("rejected rows")
  })
})

describe("resolveImportRequest", () => {
  it("allows dry-run without Supabase credentials", () => {
    // Given
    const env = {}

    // When
    const request = resolveImportRequest(["schools.csv", "--dry-run"], env)

    // Then
    expect(request).toEqual({ kind: "dry-run", csvPath: "schools.csv" })
  })

  it("requires server-only credentials for a live import", () => {
    // Given
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "https://public.example.test",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "browser-safe",
    }

    // When
    const act = () => resolveImportRequest(["schools.csv"], env)

    // Then
    expect(act).toThrow(ImportConfigurationError)
    expect(act).toThrow("SUPABASE_SERVICE_ROLE_KEY")
  })
})
