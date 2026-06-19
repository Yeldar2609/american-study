import { mkdir } from "node:fs/promises"
import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("switches the login page from English to Russian", async ({ page }, testInfo) => {
  await page.goto("/en/login?next=%2Fen%2Fapp%2Fstudent")
  await expect(
    page.getByRole("button", { name: "Google sign-in is temporarily unavailable" }),
  ).toBeDisabled()
  await expect(page.getByLabel("Email address")).toBeEditable()
  await expect(page.getByLabel("Password")).toBeEditable()
  await page.getByRole("button", { name: "Russian" }).click()

  await expect(page).toHaveURL(/\/ru\/login\?next=%2Fen%2Fapp%2Fstudent$/)
  await expect(page.getByRole("heading", { name: "С возвращением" })).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Вход через Google временно недоступен" }),
  ).toBeDisabled()
  await expect(page.getByLabel("Электронная почта")).toBeEditable()
  await expect(page.getByLabel("Пароль")).toBeEditable()
  await page.goto("/")
  await expect(page).toHaveURL(/\/ru$/)
  await mkdir(".omo/evidence/final", { recursive: true })
  await page.screenshot({
    fullPage: true,
    path: `.omo/evidence/final/${testInfo.project.name}-ru-login.png`,
  })
})

test("shows the real product journey without a demo portal link", async ({ page }, testInfo) => {
  await page.goto("/en")

  await expect(
    page.getByRole("heading", { name: "Your US school journey, made clear." }),
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "See how it works" })).toBeVisible()
  await expect(page.getByText("Alex")).toHaveCount(0)
  await expect(page.getByText(/preview/i)).toHaveCount(0)
  await page.getByRole("link", { name: "See how it works" }).click()
  await expect(page).toHaveURL(/#how-it-works$/)
  await expect(page.getByRole("heading", { name: "Big goals. Clear next steps." })).toBeVisible()
  await mkdir(".omo/evidence/final", { recursive: true })
  await page.screenshot({
    fullPage: true,
    path: `.omo/evidence/final/${testInfo.project.name}-landing.png`,
  })
})

test("removes the public role preview route", async ({ page }) => {
  const response = await page.goto("/en/preview/student")

  expect(response?.status()).toBe(404)
})

test("redirects an unauthenticated protected request to login with its return path", async ({
  page,
}) => {
  await page.goto("/en/app")

  await expect(page).toHaveURL(/\/en\/login\?next=\/en\/app$/)
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
})

test("renders the localized password recovery destination", async ({ page }) => {
  await page.goto("/ru/update-password")

  await expect(page.getByRole("heading", { name: "Создайте новый пароль" })).toBeVisible()
  await expect(page.getByLabel("Новый пароль")).toBeVisible()
  await expect(page.getByRole("button", { name: "Обновить пароль" })).toBeVisible()
})

test("keeps the Russian landing page within the viewport", async ({ page }) => {
  await page.goto("/ru")

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))

  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
  await expect(
    page.getByRole("heading", { name: "Ваш путь в школу США — по ясному плану." }),
  ).toBeVisible()
})

test("has no serious or critical accessibility violations in English or Russian", async ({
  page,
}) => {
  for (const path of ["/en", "/ru", "/en/login", "/ru/login"]) {
    await page.goto(path)
    const visibleText = await page.locator("body").innerText()
    expect(visibleText).not.toMatch(
      /\b(?:adminStudents|app|auth|common|landing|language|locked|metadata)\.[A-Za-z]/,
    )
    const results = await new AxeBuilder({ page }).setLegacyMode().analyze()
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    )

    expect(blocking, `blocking accessibility findings on ${path}`).toEqual([])
  }
})
