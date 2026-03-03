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

    this.validateShapes(ds, validator)

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
    validator: ValidationErrorCollector
  ): void {

    for (const shapeNode of quads.nodeShapes) {

      this.validateProperties(
        shapeNode,
        validator
      )

      if (!shapeNode.codeIdentifier) {
        validator.add(
          `Shape ${shapeNode} is missing required sh:codeIdentifier`
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
    validator: ValidationErrorCollector
  ): void {

    for (const property of shapeNode.properties) {

      if (!property.path) {
        validator.add(
          `Property ${property} is missing sh:path`
        )
        continue
      }

      if (!property.codeIdentifier) {
        validator.add(
          `Property ${property} is missing sh:codeIdentifier`
        )
        continue
      }
    }
  }
}