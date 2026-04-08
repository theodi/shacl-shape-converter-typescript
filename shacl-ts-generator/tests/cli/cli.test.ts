import test from "node:test"
import assert from "node:assert"
import { execa } from "execa"
import path from "node:path"
import fs from "node:fs"

test("CLI should generate output files", async () => {
  const cli = path.join(
    process.cwd(),
    "dist/cli.js"
  )

  const outputDir = "tests/output"

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  await execa("node", [
    cli,
    "tests/fixtures/shacl/valid/person.ttl",
    outputDir
  ])

  // Verify file generation
  const files = fs.readdirSync(outputDir)

  // expect(files.length).toBeGreaterThan(0)
  assert.ok(files.length > 0)
})