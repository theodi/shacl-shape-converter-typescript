// src/generator/class-generator.ts
import { ShapeModel } from "../model/shacl-model.js";
import { PropertyGenerator } from "./property-generator.js";
import type { ShapeRegistryEntry } from "../model/generator.js";


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
      set: false,
      optional: false,
      required: false,
    };

    console.log(`Generating class for shape: ${shape.codeIdentifier}`);
    // ---------------- Generate properties ----------------
    const generatedProperties = [...shape.properties]
      .map((p) =>
        this.propertyGenerator.generateProperty(
          p,
          imports,
          this.shapeRegistry,
          usage,
          this.classPrefix,
          shape.codeIdentifier
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
    if (usage) {
      const mappingToImports: Record<keyof typeof usage, string[]> = {
        valueMapping: ["LiteralAs"],
        termMapping: ["LiteralFrom"],
        objectMapping: ["TermAs", "TermFrom"],
        set: ["SetFrom"],
        optional: ["OptionalFrom", "OptionalAs"],
        required: ["RequiredFrom", "RequiredAs"],
      };

      for (const key in mappingToImports) {
        if (usage[key as keyof typeof usage]) {
          rdfImports.push(...mappingToImports[key as keyof typeof usage]);
        }
      }
    }
    imports.add(`import { ${rdfImports.join(", ")} } from "@rdfjs/wrapper";`);

    // ---------------- Class name ----------------
    const className = `${shape.codeIdentifier}`;

    // Determine base class (TermWrapper if no inheritance)
    let baseClass = "TermWrapper";
    if (shape.hasInheritance && shape.parentShape) {
      
      if (this.shapeRegistry?.has(shape.parentShape)) {
        baseClass = this.shapeRegistry.get(shape.parentShape)!.codeIdentifier;
        
        imports.add(`import { ${baseClass} } from './${baseClass}.js';`);
      } else {
        
        baseClass = shape.parentShape;
      }
}
      

    return [
      ...[...imports].sort(),
      ``,
      `export class ${className} extends ${baseClass} {`,
      properties,
      `}`,
      ``,
    ].join("\n");
  }
}