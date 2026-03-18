import { DataFactory, Parser, Store } from "n3"
import { readFile } from "node:fs/promises"
import { ShapeModel } from "../model/shacl-model.js"
import { ValidationErrorCollector } from "../utils/validation.js"
import { ShaclDataset } from "../model/shacl-model.js"

export class ShaclParser {

  async parse(filePath: string): Promise<ShapeModel[]> {

    const ttl = await readFile(filePath, "utf-8")

    const store = new Store()
    store.addQuads(new Parser().parse(ttl));
    const ds = new ShaclDataset(store, DataFactory)

    const validator = new ValidationErrorCollector()

    this.validateShapes(ds, validator, filePath)

    if (validator.hasErrors()) {
      validator.printAndExit()
    }

    return [...ds.nodeShapes]
  }

  // ----------------------------------------------------
  // ⭐ Shape Extraction
  // ----------------------------------------------------

  private validateShapes(
    quads: ShaclDataset,
    validator: ValidationErrorCollector,
    filePath: string
  ): void {

    for (const shapeNode of quads.nodeShapes) {

      this.validateProperties(
        shapeNode,
        validator,
        filePath
      )

      if (!shapeNode.codeIdentifier) {
        validator.add(
          `File ${filePath}: Shape ${shapeNode.name} is missing required sh:codeIdentifier \n`
        )
        continue
      }
    }
  }

  // ----------------------------------------------------
  // ⭐ Property Extraction
  // ----------------------------------------------------

  private validateProperties(
    shapeNode: ShapeModel,
    validator: ValidationErrorCollector,
    filePath: string
  ): void {

    for (const property of shapeNode.properties) {

      if (!property.path) {
        validator.add(
          `File ${filePath}: Property ${JSON.stringify(property)} is missing sh:path \n`
        )
        continue
      }

      if (!property.codeIdentifier) {
        validator.add(
          `File ${filePath}: Property ${JSON.stringify(property)} is missing sh:codeIdentifier \n`
        )
        continue
      }
    }
  }
}