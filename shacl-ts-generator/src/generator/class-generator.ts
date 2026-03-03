import { ShapeModel } from "../model/shacl-model.js"
import { PropertyGenerator } from "./property-generator.js"

export class ClassGenerator {

  constructor(
    private propertyGenerator = new PropertyGenerator()
  ) {}

  generate(shape: ShapeModel): string {

    if (!shape.properties){
      return ``
    }

    const properties = [...shape.properties]
      .map(p => this.propertyGenerator.generateProperty(p))
      .join("\n")

    return `
import { ValueMapping, TermMapping, TermWrapper, ObjectMapping } from "rdfjs-wrapper"

export class ${shape.name} extends TermWrapper {
${properties}
}
`
  }
}