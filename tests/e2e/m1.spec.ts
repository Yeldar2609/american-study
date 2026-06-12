import { mkdir } from "node:fs/promises"
import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("switches the login page from English to Russian", async ({ page }, testInfo) => {
  await page.goto("/en/login?next=%2Fen%2Fapp%2Fstudent")
  await page.getByRole("button", { name: "Русский" }).click()

  await expect(page).toHaveURL(/\/ru\/login\?next=%2Fen%2Fapp%2Fstudent$/)
  await expect(page.getByRole("heading", { name: "С возвращением" })).toBeVisible()
  await mkdir(".omo/evidence/final", { recursive: true })
  await page.screenshot({
    fullPage: true,
    path: `.omo/evidence/final/${testInfo.project.name}-ru-login.png`,
  })
})

test("shows fixture-only role previews with a locked feature", async ({ page }, testInfo) => {
  await page.goto("/en/preview/student")

  await expect(page.getByText("Preview only · no private data")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Good morning, Alex" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Unlock full support" })).toBeVisible()
  await mkdir(".omo/evidence/final", { recursive: true })
  await page.screenshot({
    fullPage: true,
    path: `.omo/evidence/final/${testInfo.project.name}-student-preview.png`,
  })

  await page.goto("/ru/preview/student")
  await expect(page.getByRole("heading", { name: "Доброе утро, Алекс" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Открыть полное сопровождение" })).toBeVisible()
  await page.screenshot({
    fullPage: true,
    path: `.omo/evidence/final/${testInfo.project.name}-ru-student-preview.png`,
  })
})

test("redirects an unauthenticated protected request to login", async ({ page }) => {
  await page.goto("/en/app")

  await expect(page).toHaveURL(/\/en\/login\?error=configuration$/)
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
})

test("renders the localized password recovery destination", async ({ page }) => {
  await page.goto("/ru/update-password")

  await expect(page.getByRole("heading", { name: "Создайте новый пароль" })).toBeVisible()
  await expect(page.getByLabel("Новый пароль")).toBeVisible()
  await expect(page.getByRole("button", { name: "Обновить пароль" })).toBeVisible()
})

test("keeps the preview within the viewport", async ({ page }) => {
  await page.goto("/ru/preview/parent")

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))

  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
  await expect(page.getByRole("heading", { name: "Понятный прогресс Алекса" })).toBeVisible()
})

test("provides functional navigation and keyboard focus", async ({ page }) => {
  await page.goto("/en/preview/student")
  const schools = page.getByRole("link", { name: "Schools" })

  await schools.focus()
  await expect(schools).toBeFocused()
  const focusStyle = await schools.evaluate((element) => {
    const style = getComputedStyle(element)
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth }
  })
  expect(focusStyle.outlineStyle).not.toBe("none")
  expect(Number.parseFloat(focusStyle.outlineWidth)).toBeGreaterThan(0)
  await schools.press("Enter")

  await expect(page).toHaveURL(/section=schools/)
  await expect(schools).toHaveAttribute("aria-current", "page")
  await expect(page.getByRole("heading", { name: "Schools preview" })).toBeVisible()
})

test("has no serious or critical accessibility violations", async ({ page }) => {
  for (const path of ["/en", "/ru/login", "/en/preview/student"]) {
    await page.goto(path)
    const results = await new AxeBuilder({ page }).setLegacyMode().analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    )

    expect(blocking, `blocking accessibility findings on ${path}`).toEqual([])
  }
})
