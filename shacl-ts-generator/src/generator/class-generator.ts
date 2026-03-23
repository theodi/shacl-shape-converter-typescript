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


  generate(shape: ShapeModel): string | undefined {
  const imports = new Set<string>();

  const usage = {
    objectMapping: false,
    valueMapping: false,
    termMapping: false
  };

  const generatedProperties = [...shape.properties]
    .map(p => this.propertyGenerator.generateProperty(p, imports, this.shapeRegistry, usage))
    .filter(p => p.trim().length > 0);

  // Skip file if no properties generated
  if (generatedProperties.length === 0) {
    return undefined;
  }

  const properties = generatedProperties.join("");

  const rdfImports = ["TermWrapper"];

  if (usage.valueMapping) rdfImports.push("LiteralAs");
  if (usage.termMapping) rdfImports.push("LiteralFrom");

  imports.add(`import { ${rdfImports.join(", ")} } from "@rdfjs/wrapper";`);

  return [
    ...[...imports].sort(),
    ``,
    `export class ${shape.codeIdentifier} extends TermWrapper {`,
    properties,
    `}`,
    ``
  ].join("\n");
}
}