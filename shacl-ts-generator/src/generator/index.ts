import fs from "fs-extra"
import path from "path"

import { ShaclParser } from "../parser/shacl-parser.js"
import { ClassGenerator } from "./class-generator.js"

export async function generateFromShacl(
  input: string,
  output: string
) {

  const parser = new ShaclParser()
  const classGenerator = new ClassGenerator()

  const stat = await fs.stat(input)

  let shapes = []

  if (stat.isDirectory()) {
    const files = await fs.readdir(input)

    for (const file of files) {

      if (!file.endsWith(".ttl")) continue

      const filePath = path.join(input, file)

      const fileStat = await fs.stat(filePath)
      if (!fileStat.isFile()) continue

      const parsed = await parser.parse(filePath)
      shapes.push(...parsed)
    }

  } else {
    shapes = await parser.parse(input)
  }

  await fs.ensureDir(output)

  for (const shape of shapes) {

    const classCode = classGenerator.generate(shape)

    await fs.writeFile(
      path.join(output, `${shape.codeIdentifier}.ts`),
      classCode
    )
  }

  const indexCode = [...shapes]
    .map(s => `export * from "./${s.codeIdentifier}"`)
    .join("\n")

  await fs.writeFile(
    path.join(output, "index.ts"),
    indexCode
  )
}