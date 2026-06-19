import { randomBytes, randomUUID } from "node:crypto"
import { mkdir } from "node:fs/promises"
import AxeBuilder from "@axe-core/playwright"
import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const EVIDENCE_DIR = ".omo/ulw-loop/evidence"

const environment = z
  .object({
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
    SUPABASE_URL: z.url(),
  })
  .parse(process.env)

const originalAdminSchema = z.object({
  id: z.uuid(),
  language: z.enum(["en", "ru"]),
  role: z.literal("admin"),
})

const admin = createClient(environment.SUPABASE_URL, environment.SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
})

type Locale = "en" | "ru"
type OriginalAdmin = Readonly<z.infer<typeof originalAdminSchema>>
type Credentials = {
  readonly email: string
  readonly password: string
}

let originalAdmin: OriginalAdmin | null = null
let originalAdminDemoted = false
let temporaryAdminId: string | null = null
let temporaryStudentId: string | null = null
let temporaryAdminCredentials: Credentials
let temporaryStudentCredentials: Credentials

test.use({ trace: "off" })

function temporaryCredentials(label: string): Credentials {
  return {
    email: `e2e-${label}-${randomUUID()}@example.test`,
    password: `E2E-${randomBytes(24).toString("base64url")}`,
  }
}

async function login(page: Page, locale: Locale, credentials: Credentials, destination: string) {
  await page.goto(`/${locale}/login?next=${encodeURIComponent(destination)}`)
  await page.locator("#login-email").fill(credentials.email)
  await page.locator("#login-password").fill(credentials.password)
  await page.getByRole("button", { name: locale === "ru" ? "Войти" : "Sign in" }).click()
  await expect(page).toHaveURL(new RegExp(`${destination}(?:\\?.*)?$`))
}

async function setTemporaryAdminLanguage(locale: Locale) {
  if (temporaryAdminId === null) {
    throw new Error("Temporary admin is unavailable")
  }
  const { error } = await admin
    .from("users")
    .update({ language: locale })
    .eq("id", temporaryAdminId)
  expect(error).toBeNull()
}

async function restoreFixtures() {
  let cleanupError: Error | null = null

  for (const temporaryId of [temporaryStudentId, temporaryAdminId]) {
    if (temporaryId !== null) {
      const { error } = await admin.auth.admin.deleteUser(temporaryId)
      if (error !== null && cleanupError === null) {
        cleanupError = new Error("Temporary Auth user cleanup failed")
      }
    }
  }
  temporaryStudentId = null
  temporaryAdminId = null

  if (originalAdminDemoted && originalAdmin !== null) {
    const { error } = await admin
      .from("users")
      .update({ language: originalAdmin.language, role: originalAdmin.role })
      .eq("id", originalAdmin.id)
    if (error !== null && cleanupError === null) {
      cleanupError = new Error("Original admin profile restoration failed")
    }
    if (error === null) {
      originalAdminDemoted = false
    }
  }

  if (cleanupError !== null) {
    throw cleanupError
  }
}

test.describe
  .serial("admin analytics dashboard", () => {
    test.beforeAll(async () => {
      await mkdir(EVIDENCE_DIR, { recursive: true })
      temporaryAdminCredentials = temporaryCredentials("admin")
      temporaryStudentCredentials = temporaryCredentials("student")

      try {
        const { data, error } = await admin
          .from("users")
          .select("id,role,language")
          .eq("role", "admin")
          .single()
        expect(error).toBeNull()
        originalAdmin = originalAdminSchema.parse(data)

        const demotion = await admin
          .from("users")
          .update({ role: "parent" })
          .eq("id", originalAdmin.id)
        expect(demotion.error).toBeNull()
        originalAdminDemoted = true

        const temporaryAdmin = await admin.auth.admin.createUser({
          email: temporaryAdminCredentials.email,
          email_confirm: true,
          password: temporaryAdminCredentials.password,
          user_metadata: {
            full_name: "E2E Analytics Admin",
            language: "en",
            role: "admin",
          },
        })
        expect(temporaryAdmin.error).toBeNull()
        temporaryAdminId = z.uuid().parse(temporaryAdmin.data.user?.id)

        const temporaryStudent = await admin.auth.admin.createUser({
          email: temporaryStudentCredentials.email,
          email_confirm: true,
          password: temporaryStudentCredentials.password,
          user_metadata: {
            full_name: "E2E Analytics Student",
            language: "en",
            role: "student",
          },
        })
        expect(temporaryStudent.error).toBeNull()
        temporaryStudentId = z.uuid().parse(temporaryStudent.data.user?.id)

        const student = await admin.from("students").insert({ user_id: temporaryStudentId })
        expect(student.error).toBeNull()
      } catch (error: unknown) {
        try {
          await restoreFixtures()
        } catch (cleanupError: unknown) {
          if (cleanupError instanceof Error) {
            throw new Error("Fixture setup and rollback failed", { cause: cleanupError })
          }
          throw cleanupError
        }
        throw error
      }
    })

    test.afterAll(async () => {
      await restoreFixtures()
    })

    test("shows English metrics, pipeline, and recent activity", async ({ page }) => {
      // Given: the temporary administrator is authenticated in English.
      await page.setViewportSize({ height: 1000, width: 1440 })
      await setTemporaryAdminLanguage("en")

      // When: the administrator signs in through the real login form.
      await login(page, "en", temporaryAdminCredentials, "/en/app/admin")

      // Then: the live analytics sections and metrics are visible.
      await expect(page.getByRole("heading", { level: 1, name: "Agency analytics" })).toBeVisible()
      await expect(page.getByRole("group", { name: "Total students" })).toBeVisible()
      await expect(page.getByRole("group", { name: "Trial students" })).toBeVisible()
      await expect(page.getByRole("group", { name: "Paid students" })).toBeVisible()
      await expect(page.getByRole("heading", { name: "Pipeline by stage" })).toBeVisible()
      await expect(page.getByRole("region", { name: "Recent activity" })).toBeVisible()
      await page.screenshot({
        fullPage: true,
        path: `${EVIDENCE_DIR}/admin-analytics-happy-en.png`,
      })
    })

    test("shows the translated Russian analytics dashboard", async ({ page }) => {
      // Given: the temporary administrator profile uses Russian.
      await page.setViewportSize({ height: 1000, width: 1440 })
      await setTemporaryAdminLanguage("ru")

      // When: the administrator signs in through the Russian login form.
      await login(page, "ru", temporaryAdminCredentials, "/ru/app/admin")

      // Then: the translated analytics sections are visible.
      await expect(
        page.getByRole("heading", { level: 1, name: "Аналитика агентства" }),
      ).toBeVisible()
      await expect(page.getByRole("group", { name: "Всего учеников" })).toBeVisible()
      await expect(page.getByRole("heading", { name: "Воронка по этапам" })).toBeVisible()
      await expect(page.getByRole("region", { name: "Недавняя активность" })).toBeVisible()
      await page.screenshot({
        fullPage: true,
        path: `${EVIDENCE_DIR}/admin-analytics-happy-ru.png`,
      })
    })

    test("keeps the admin analytics dashboard within a mobile viewport", async ({ page }) => {
      // Given: the temporary administrator uses a mobile viewport.
      await page.setViewportSize({ height: 844, width: 390 })
      await setTemporaryAdminLanguage("en")

      // When: the administrator signs in and the dashboard renders.
      await login(page, "en", temporaryAdminCredentials, "/en/app/admin")

      // Then: no document content overflows horizontally.
      const dimensions = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }))
      expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
      await page.screenshot({
        fullPage: true,
        path: `${EVIDENCE_DIR}/admin-analytics-mobile.png`,
      })
    })

    test("has zero WCAG 2.1 A and AA violations", async ({ page }) => {
      // Given: the English analytics dashboard is visible to the administrator.
      await setTemporaryAdminLanguage("en")
      await login(page, "en", temporaryAdminCredentials, "/en/app/admin")

      // When: axe audits the rendered dashboard against WCAG 2.1 A and AA.
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze()

      // Then: the audit reports no violations.
      expect(results.violations).toEqual([])
    })

    test("denies a student access to the admin analytics route", async ({ page }) => {
      // Given: the temporary student uses the real login form.

      // When: the student requests the admin route after authentication.
      await login(page, "en", temporaryStudentCredentials, "/en/app/admin")

      // Then: the role guard redirects to the student dashboard without analytics.
      await expect(page).toHaveURL(/\/en\/app\/student(?:\?.*)?$/)
      await expect(page.getByRole("heading", { name: "Agency analytics" })).toHaveCount(0)
      await expect(page.getByRole("heading", { name: "Pipeline by stage" })).toHaveCount(0)
      await expect(page.getByRole("region", { name: "Recent activity" })).toHaveCount(0)
    })
  })
