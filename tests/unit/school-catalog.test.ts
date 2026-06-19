import { describe, expect, it } from "vitest"
import { filterSchoolCatalog, parseSchoolCatalog } from "@/lib/workspace/school-catalog"

const rows = [
  {
    admin_pick: true,
    affiliation: "Nonsectarian",
    boarding_tuition_usd: 70000,
    city: "Andover",
    enrollment: 1100,
    is_final_7: false,
    match_percent: 91,
    match_reason: "Strong academics",
    niche_grade: "A+",
    offers_financial_aid: true,
    pick_id: "11111111-1111-4111-8111-111111111111",
    sao_deadline: "2027-01-15",
    school_id: "22222222-2222-4222-8222-222222222222",
    school_name: "Phillips Academy",
    setting: "suburban",
    starred: false,
    state: "MA",
    status: "researching",
    strengths: ["STEM", "Arts"],
    student_body: "coed",
    website_url: "https://example.com",
  },
]

describe("school catalog", () => {
  it("parses RPC rows into typed school cards", () => {
    const result = parseSchoolCatalog(rows)

    expect(result).toEqual([
      expect.objectContaining({
        id: "22222222-2222-4222-8222-222222222222",
        matchPercent: 91,
        name: "Phillips Academy",
      }),
    ])
  })

  it("filters by text, setting, and student body", () => {
    const schools = parseSchoolCatalog(rows)

    expect(
      filterSchoolCatalog(schools, {
        body: "coed",
        query: "STEM",
        setting: "suburban",
        state: "MA",
      }),
    ).toHaveLength(1)
    expect(filterSchoolCatalog(schools, { query: "California" })).toHaveLength(0)
  })

  it("rejects malformed RPC data", () => {
    expect(() => parseSchoolCatalog([{ school_id: "not-a-uuid" }])).toThrow()
  })
})
