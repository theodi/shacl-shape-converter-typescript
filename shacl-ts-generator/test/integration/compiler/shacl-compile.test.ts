import { test } from "node:test"
import assert from "node:assert"
import path from "node:path"
import fs from "node:fs"
import { execa } from "execa"

test("should generate valid TypeScript from SHACL via CLI", async () => {
  const cli = path.join(process.cwd(), "dist/cli.js")

  const inputDir = path.join(
    process.cwd(),
    "test/fixtures/shacl/valid"
  )

  const outputDir = path.join(
    process.cwd(),
    "test/output"
  )

  fs.rmSync(outputDir, { recursive: true, force: true })
  fs.mkdirSync(outputDir, { recursive: true })

  await execa("node", [cli, inputDir, outputDir])

  const files = fs.readdirSync(outputDir)
  assert.ok(files.length > 0, "No files generated")

  const tsFiles = files.filter(f => f.endsWith(".ts"))
  assert.ok(tsFiles.length > 0, "No TypeScript files generated")

  for (const file of tsFiles) {
    const fullPath = path.join(outputDir, file)
    const content = fs.readFileSync(fullPath, "utf-8")

    assert.ok(
      content.includes("export"),
      `${file} has no exports`
    )

    if (content.includes("import")) {
      assert.ok(
        /import\s+.*\s+from\s+['"].+['"]/.test(content),
        `${file} has invalid import syntax`
      )
    }

  }

  await execa("npx", ["tsc", "-p", "test/tsconfig.output.json"])

  console.log(`Generated and validated ${tsFiles.length} TypeScript files`)
})