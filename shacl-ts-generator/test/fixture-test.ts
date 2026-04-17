import { test } from "node:test"
import assert from "node:assert"
import path from "node:path"
import fs from "node:fs"
import { ShaclParser } from "../dist/parser/shacl-parser.js"

test("should parse chat SHACL file", async () => {
  const parser = new ShaclParser()

  const file = path.join(
    process.cwd(),
    "test/fixtures/shacl/valid/chat.ttl"
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
    throw new Error(
      `Parsing failed for file ${file}: ${(err as Error).message}`
    )
  }

  // 3️⃣ Ensure shapes exist
  assert.ok(
    shapes.length > 0,
    `Expected at least 1 shape, but got ${shapes.length}`
  )

  // 4️⃣ Verify this is a chat schema (sanity check)
  const codeIdentifiers = shapes.map(s => s.codeIdentifier)

  const expectedSomeChatShapes = [
    "ChatChannel",
    "ChatMessage",
    "ChatParticipation",
    "ChatAction",
    "LongChatMessage"
  ]

  const hasChatShapes = expectedSomeChatShapes.some(id =>
    codeIdentifiers.includes(id)
  )

  assert.ok(
    hasChatShapes,
    `Expected chat shapes not found. Got: ${JSON.stringify(codeIdentifiers)}`
  )

  // 5️⃣ Validate a key shape exists (ChatMessage is central)
  const chatMessage = shapes.find(
    s => s.codeIdentifier === "ChatMessage"
  )

  assert.ok(
    chatMessage,
    `ChatMessage not found in parsed shapes: ${JSON.stringify(codeIdentifiers)}`
  )

  // 6️⃣ Basic structural sanity check
  assert.ok(
    chatMessage.properties.size > 0,
    "ChatMessage should have properties"
  )

  console.log(
    `Parsed ${shapes.length} shapes, ChatMessage found with ${chatMessage.properties.size} properties`
  )
})