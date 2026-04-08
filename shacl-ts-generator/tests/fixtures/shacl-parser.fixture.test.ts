import { describe, test } from "node:test"
import assert from "node:assert"
import path from "node:path"
import { ShaclParser } from "../../dist/parser/shacl-parser.js"

describe("Fixture parsing", () => {
  test("should parse person shape", async () => {
    const parser = new ShaclParser()

    const file = path.join(
      process.cwd(),
      "tests/fixtures/shacl/valid/person.ttl"
    )

    const shapes = await parser.parse(file)

    // expect(shapes.length).toBeGreaterThan(0)
    assert.ok(shapes.length > 0)

    const person = shapes.find(
      s => s.name === "PersonShape"
    )

    // expect(person?.codeIdentifier).toBe("Person")
    assert.strictEqual(person?.codeIdentifier, "Person")
  })
})