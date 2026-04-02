// src/generator/class-generator.ts
import { ShapeModel } from "../model/shacl-model.js";
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

  private isTargetOnlyShape(shape: ShapeModel): boolean {
    const hasTargetSubjectsOf = shape.targetSubjectsOf.size > 0;
  
    const hasOtherTargets =
      shape.targetObjectsOf.size > 0 ||
      shape.targetClass.size > 0;
  
    const hasConstraints =
      shape.properties.size > 0 ||
      !!shape.class ||
      !!shape.nodeKind ||
      !!shape.datatype;
  
    return (hasTargetSubjectsOf || hasOtherTargets) && !hasConstraints;
  }

  generate(shape: ShapeModel): string | undefined {

    if (this.isTargetOnlyShape(shape)) {
      return undefined;
    }
    
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
      return undefined;
    }

    const properties = generatedProperties.join("\n");

    // ---------------- RDF imports ----------------
    const rdfImports = ["TermWrapper"];
    if (usage) {
      const mappingToImports: Record<keyof typeof usage, string[]> = {
        valueMapping: ["LiteralAs"],
        termMapping: ["LiteralFrom"],
        objectMapping: ["TermAs", "TermFrom"]
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