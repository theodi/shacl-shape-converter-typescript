import test from "node:test"
import assert from "node:assert"
import { execa } from "execa"
import path from "node:path"
import fs from "node:fs"

test("CLI should generate output files", async () => {
  const cli = path.join(process.cwd(), "dist/cli.js")
  const outputDir = "test/output"

  // Clean output dir first (important)
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true })
  }
  fs.mkdirSync(outputDir, { recursive: true })

  await execa("node", [
    cli,
    "tests/fixtures/shacl/valid/person.ttl",
    outputDir
  ])

  const files = fs.readdirSync(outputDir)

  assert.ok(files.length > 0, "No files generated")

  // Optional: ensure TS files exist
  assert.ok(
    files.some(f => f.endsWith(".ts")),
    "No TypeScript files generated"
  )
})