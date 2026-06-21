import { describe, expect, it } from "vitest"
import { filterSchoolCatalog, parseSchoolCatalog } from "@/lib/workspace/school-catalog"

const fullRow = {
  acceptance_rate_pct: 13,
  admin_pick: true,
  affiliation: "Nonsectarian",
  avg_ssat_pctile: 88,
  boarding_tuition_usd: 70000,
  city: "Andover",
  enrollment: 1100,
  grades: "9-12, PG",
  is_final_7: false,
  match_percent: 91,
  match_reason: "Strong academics",
  niche_grade: "A+",
  niche_profile_url: "https://niche.example.com",
  notes: "Beautiful campus",
  offers_financial_aid: true,
  pct_boarding: 75,
  pct_international: 12,
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
  student_interest_level: "interested",
  student_note: "Visited in spring",
  website_url: "https://example.com",
}

// A school with almost everything missing — the detail view must render these
// as "Not listed yet" rather than crash, so the parser must keep them null.
const sparseRow = {
  acceptance_rate_pct: null,
  admin_pick: false,
  affiliation: null,
  avg_ssat_pctile: null,
  boarding_tuition_usd: null,
  city: null,
  enrollment: null,
  grades: null,
  is_final_7: false,
  match_percent: 50,
  match_reason: null,
  niche_grade: null,
  niche_profile_url: null,
  notes: null,
  offers_financial_aid: null,
  pct_boarding: null,
  pct_international: null,
  pick_id: null,
  sao_deadline: null,
  school_id: "33333333-3333-4333-8333-333333333333",
  school_name: "Quiet Hill School",
  setting: null,
  starred: false,
  state: null,
  status: "researching",
  strengths: [],
  student_body: null,
  student_interest_level: "exploring",
  student_note: null,
  website_url: null,
}

describe("school catalog", () => {
  it("parses RPC rows into typed school cards, including student pick state", () => {
    const result = parseSchoolCatalog([fullRow])

    expect(result).toEqual([
      expect.objectContaining({
        id: "22222222-2222-4222-8222-222222222222",
        interestLevel: "interested",
        matchPercent: 91,
        name: "Phillips Academy",
        starred: false,
      }),
    ])
  })

  it("keeps missing detail fields as null instead of dropping the row", () => {
    const [school] = parseSchoolCatalog([sparseRow])

    expect(school).toMatchObject({
      acceptanceRate: null,
      avgSsatPctile: null,
      grades: null,
      nicheProfileUrl: null,
      notes: null,
      pctBoarding: null,
      pctInternational: null,
      tuition: null,
    })
  })

  it("filters by text, setting, student body, and state", () => {
    const schools = parseSchoolCatalog([fullRow, sparseRow])

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

  it("filters by financial aid availability", () => {
    const schools = parseSchoolCatalog([fullRow, sparseRow])

    expect(filterSchoolCatalog(schools, { aid: "yes" })).toHaveLength(1)
    expect(filterSchoolCatalog(schools, { aid: "no" })).toHaveLength(0)
  })

  it("rejects malformed RPC data", () => {
    expect(() => parseSchoolCatalog([{ school_id: "not-a-uuid" }])).toThrow()
  })
})
