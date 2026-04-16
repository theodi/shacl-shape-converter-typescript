import test from "node:test"
import assert from "node:assert"
import path from "node:path"
import fs from "node:fs"
import { ShaclParser } from "../dist/parser/shacl-parser.js"

test("should parse person shape", async (t) => {
  const parser = new ShaclParser()

  const file = path.join(
    process.cwd(),
    "test/fixtures/shacl/valid/person.ttl"
  )

  // 1️⃣ Check file exists
  if (!fs.existsSync(file)) {
    throw new Error(`Fixture file not found: ${file}`)
  }

  // 2️⃣ Parse file
  let shapes
  try {
    shapes = await parser.parse(file)
  } catch (err) {
    throw new Error(`Parsing failed for file ${file}: ${(err as Error).message}`)
  }

  // 3️⃣ Ensure shapes exist
  assert.ok(shapes.length > 0, `Expected at least 1 shape, but got ${shapes.length}`)

  // 4️⃣ Find PersonShape
  const person = shapes.find(s => s.name === "PersonShape")
  assert.ok(person, `PersonShape not found in parsed shapes: ${JSON.stringify(shapes.map(s => s.name))}`)

  // 5️⃣ Check codeIdentifier
  if (person?.codeIdentifier !== "Person") {
    throw new Error(`PersonShape codeIdentifier expected "Person", got "${person?.codeIdentifier}"`)
  }

  console.log(`✅ Parsed ${shapes.length} shapes, PersonShape codeIdentifier = ${person?.codeIdentifier}`)
})