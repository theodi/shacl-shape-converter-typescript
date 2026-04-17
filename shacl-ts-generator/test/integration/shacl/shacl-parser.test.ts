import { test } from "node:test"
import assert from "node:assert"
import path from "node:path"
import fs from "node:fs"
import { ShaclParser } from "../../../dist/parser/shacl-parser.js"

test("should parse SHACL into internal shape model", async () => {
  const parser = new ShaclParser()

  const file = path.resolve("test/fixtures/shacl/valid/chat.ttl")

  // 1. File exists
  assert.ok(fs.existsSync(file), "Fixture missing")

  // 2. Parse succeeds
  const shapes = await parser.parse(file)

  assert.ok(Array.isArray(shapes), "Parser should return array")

  // 3. Core structure exists
  assert.ok(shapes.length > 0, "No shapes parsed")

  // 4. Key semantic shape exists
  const chatMessage = shapes.find(
    s => s.codeIdentifier === "ChatMessage"
  )

  assert.ok(chatMessage, "ChatMessage not parsed")

  // 5. SHACL structure interpreted as properties
 
  assert.ok(
    chatMessage.properties.size > 0,
    "ChatMessage should have parsed properties"
  )

  // 6. Optional: sanity check one known property exists
  const hasContent = [...chatMessage.properties.values()]
    .some(p => p.codeIdentifier === "content")

  assert.ok(hasContent, "Expected content property not found")
})