// src/generator/class-generator.ts
import { ShapeModel, ShapePropertyModel } from "../model/shacl-model.js";
import { PropertyGenerator } from "./property-generator.js";

/**
 * Registry entry type for each shape
 */
export type ShapeRegistryEntry = {
  shape: ShapeModel;
  fileName: string; // filename containing the shape
  codeIdentifier: string; // shape's code identifier
};

export class ClassGenerator {
  constructor(
    private classPrefix: string = "", 
    private shapeRegistry?: Map<string, ShapeRegistryEntry>,
    private propertyGenerator = new PropertyGenerator()
  ) {}

  generate(shape: ShapeModel): string | undefined {
    const imports = new Set<string>();

    const usage = {
      objectMapping: false,
      valueMapping: false,
      termMapping: false,
    };

    // ---------------- Generate properties ----------------
    const generatedProperties = [...shape.properties]
      .map((p) =>
        this.propertyGenerator.generateProperty(
          p,
          imports,
          this.shapeRegistry,
          usage,
          this.classPrefix // <-- pass prefix to property generator
        )
      )
      .filter((p) => p.trim().length > 0);

    // Skip file if no properties generated
    if (generatedProperties.length === 0) {
      // return undefined;
    }

    const properties = generatedProperties.join("\n");

    // ---------------- RDF imports ----------------
    const rdfImports = ["TermWrapper"];
    if (usage.valueMapping) rdfImports.push("ValueMapping");
    if (usage.termMapping) rdfImports.push("TermMapping");
    if (usage.objectMapping) rdfImports.push("ObjectMapping");

    imports.add(`import { ${rdfImports.join(", ")} } from "rdfjs-wrapper";`);

    // ---------------- Class name ----------------
    const className = `${shape.codeIdentifier}`;

    return [
      ...[...imports].sort(),
      ``,
      `export class ${className} extends TermWrapper {`,
      properties,
      `}`,
      ``,
    ].join("\n");
  }
}