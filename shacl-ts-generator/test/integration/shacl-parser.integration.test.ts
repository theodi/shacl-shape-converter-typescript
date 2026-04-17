import { describe, test } from "node:test"
import assert from "node:assert"
import path from "node:path"
import { ShaclParser } from "../../dist/parser/shacl-parser.js"

describe("ShaclParser integration", () => {
  test("should parse valid TTL file end-to-end", async () => {
    const parser = new ShaclParser()

    const file = path.join(
      process.cwd(),
      "test/fixtures/shacl/valid/chat.ttl"
    )

    const shapes = await parser.parse(file)

    // ✔ There are 11 shapes in this TTL
    assert.strictEqual(shapes.length, 11)

    // ✔ Ensure all expected shapes exist
    const codeIdentifiers = shapes.map(s => s.codeIdentifier)

    assert.deepStrictEqual(
      codeIdentifiers.sort(),
      [
        "ChatChannel",
        "ChatMessage",
        "Participation",
        "ChatSharedPreferences",
        "ChatAction",
        "LongChatChannel",
        "LongChatMessage",
        "AppendOnlyMessageVersion",
        "DeletedLongChatMessage",
        "LongChatThread",
        "LongChatAction"
      ].sort()
    )

    // ✔ Validate one shape exists
    const chatMessage = shapes.find(
      s => s.codeIdentifier === "ChatMessage"
    )

    assert.ok(chatMessage, "ChatMessage not found")
    assert.ok(chatMessage.properties.size >= 3)
  })
})