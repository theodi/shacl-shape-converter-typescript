import path from "node:path"
import { ShaclParser } from "../../src/parser/shacl-parser.js"

describe("ShaclParser integration", () => {

  const parser = new ShaclParser()

  test("should parse valid TTL file end-to-end", async () => {

    const file = path.join(
      process.cwd(),
      "tests/fixtures/shacl/valid/person.ttl"
    )

    const shapes = await parser.parse(file)

    expect(shapes).toHaveLength(1)

    const shape = shapes[0]

    expect(shape.properties.size).toBe(2)
    expect(shape.codeIdentifier).toBe("Person")
  })

})