import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"

const localeSwitcher = readFileSync("src/components/locale-switcher.tsx", "utf8")
const rootLayout = readFileSync("src/app/layout.tsx", "utf8")
const localeLayout = readFileSync("src/app/[locale]/layout.tsx", "utf8")
const createStudentForm = readFileSync("src/components/admin/create-student-form.tsx", "utf8")

function sourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(path) : path.endsWith(".tsx") ? [path] : []
  })
}

function visibleLiterals(path: string): readonly string[] {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const findings: string[] = []
  const userFacingAttributes = new Set(["alt", "aria-label", "placeholder", "title"])

  function isAriaHidden(node: ts.Node): boolean {
    if (!ts.isJsxElement(node)) {
      return false
    }

    return node.openingElement.attributes.properties.some(
      (attribute) =>
        ts.isJsxAttribute(attribute) &&
        attribute.name.getText(source) === "aria-hidden" &&
        attribute.initializer !== undefined &&
        ts.isStringLiteral(attribute.initializer) &&
        attribute.initializer.text === "true",
    )
  }

  function visit(node: ts.Node): void {
    if (ts.isJsxText(node) && node.text.trim() !== "" && !isAriaHidden(node.parent)) {
      findings.push(`${path}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`)
    }
    if (
      ts.isJsxAttribute(node) &&
      userFacingAttributes.has(node.name.getText(source)) &&
      node.initializer !== undefined &&
      ts.isStringLiteral(node.initializer)
    ) {
      findings.push(`${path}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`)
    }
    if (
      ts.isJsxExpression(node) &&
      node.expression !== undefined &&
      ts.isStringLiteral(node.expression)
    ) {
      findings.push(`${path}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`)
    }
    ts.forEachChild(node, visit)
  }

  visit(source)
  return findings
}

describe("i18n runtime contract", () => {
  it("persists authenticated locale changes before navigating", () => {
    expect(localeSwitcher).toContain("persistUserLanguage")
    expect(localeSwitcher).toContain("startTransition")
  })

  it("localizes metadata inside the locale layout", () => {
    expect(rootLayout).not.toContain("A clear path from Kazakhstan to a US boarding school.")
    expect(localeLayout).toContain("generateMetadata")
    expect(localeLayout).toContain('getTranslations({ locale, namespace: "metadata" })')
  })

  it("contains no visible TSX literals outside the translation layer", () => {
    const findings = sourceFiles("src").flatMap(visibleLiterals)

    expect(findings).toEqual([])
  })

  it("defaults students to English and parents to Russian", () => {
    expect(createStudentForm).toMatch(/defaultValue="en"\s+name="studentLanguage"/)
    expect(createStudentForm).toMatch(/defaultValue="ru"\s+name="parentLanguage"/)
  })
})
