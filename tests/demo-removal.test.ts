import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const roleDashboard = readFileSync("src/components/app/role-dashboard.tsx", "utf8")
const hero = readFileSync("src/components/landing/hero.tsx", "utf8")
const seed = readFileSync("supabase/seed.sql", "utf8")
const migrations = readdirSync("supabase/migrations")
  .filter((fileName) => fileName.endsWith(".sql"))
  .toSorted()
  .map((fileName) => readFileSync(join("supabase/migrations", fileName), "utf8"))
  .join("\n")

describe("demo removal contract", () => {
  it("removes the public preview route and preview-only navigation", () => {
    expect(existsSync("src/app/[locale]/preview/[role]/page.tsx")).toBe(false)
    expect(hero).not.toContain("/preview/")
    expect(roleDashboard).not.toContain("preview")
  })

  it("replaces canned dashboard percentages with application task data", () => {
    expect(roleDashboard).not.toMatch(/\b(?:78|64|58)\b/)
    expect(migrations).toContain("create or replace function public.get_dashboard_students()")
    expect(migrations).toContain("from public.application_tasks")
  })

  it("keeps exactly four test accounts without canned profile content", () => {
    const accountEmails = seed.match(/'[a-z.]+@american-study\.local'/g) ?? []

    expect(new Set(accountEmails).size).toBe(4)
    expect(seed).not.toContain("Local trial diagnostic summary.")
    expect(seed).not.toContain("Local paid diagnostic summary.")
    expect(seed).not.toContain("unrelated@american-study.local")
    expect(seed).not.toContain("trial.parent@american-study.local")
  })
})
