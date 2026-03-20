// src/generator/class-generator.ts
import { ShapeModel, ShapePropertyModel } from "../model/shacl-model.js";
import { PropertyGenerator } from "./property-generator.js";

/**
 * Registry entry type for each shape
 */
export type ShapeRegistryEntry = {
  shape: ShapeModel;
  fileName: string; // filename containing the shape
};

export class ClassGenerator {

  constructor(
    private propertyGenerator = new PropertyGenerator(),
    private shapeRegistry?: Map<string, ShapeRegistryEntry> // updated type
  ) {}

  generate(shape: ShapeModel): string {
    const imports = new Set<string>();

    // Generate properties and pass the shapeRegistry
    const properties = [...shape.properties]
      .map(p => this.propertyGenerator.generateProperty(p, imports, this.shapeRegistry))
      .join("");

    // Base RDFJS imports
    imports.add(`import { ValueMapping, TermMapping, TermWrapper, ObjectMapping } from "rdfjs-wrapper";`);

    return [
      ...imports,
      ``,
      `export class ${shape.codeIdentifier} extends TermWrapper {`,
      properties,
      `}`
    ].join("\n");
  }
}