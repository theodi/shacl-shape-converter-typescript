import { describe, test } from "node:test"
import assert from "node:assert"
import path from "node:path"
import { ShaclParser } from "../../dist/parser/shacl-parser.js"

describe("ShaclParser integration", () => {
  test("should parse valid TTL file end-to-end", async () => {
    const parser = new ShaclParser()

    const file = path.join(
      process.cwd(),
      "tests/fixtures/shacl/valid/person.ttl"
    )

    const shapes = await parser.parse(file)

    // expect(shapes).toHaveLength(1)
    assert.strictEqual(shapes.length, 1)

    const shape = shapes[0]

    // expect(shape.properties.size).toBe(2)
    assert.strictEqual(shape.properties.size, 2)

    // expect(shape.codeIdentifier).toBe("Person")
    assert.strictEqual(shape.codeIdentifier, "Person")
  })
})