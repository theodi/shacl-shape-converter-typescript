import { describe, test } from "node:test"
import assert from "node:assert"
import path from "node:path"
import { ShaclParser } from "../../dist/parser/shacl-parser.js"

describe("ShaclParser integration", () => {
  test("should parse valid TTL file end-to-end", async () => {
    const parser = new ShaclParser()

    const file = path.join(
      process.cwd(),
      "test/fixtures/shacl/valid/person.ttl"
    )

    const shapes = await parser.parse(file)

    // ✔ There are 3 shapes in this TTL
    assert.strictEqual(shapes.length, 3)

    // ✔ Ensure all expected shapes exist
    const codeIdentifiers = shapes.map(s => s.codeIdentifier)

    assert.deepStrictEqual(codeIdentifiers.sort(), [
      "ContactDetailsPerson",
      "ContactPerson",
      "IssueTrackerPerson"
    ].sort())

    // ✔ Validate one specific shape deeply
    const contactDetails = shapes.find(
      s => s.codeIdentifier === "ContactDetailsPerson"
    )

    assert.ok(contactDetails, "ContactDetailsPerson not found")

    assert.strictEqual(contactDetails.properties.size, 8)
    assert.strictEqual(contactDetails.codeIdentifier, "ContactDetailsPerson")
  })
})