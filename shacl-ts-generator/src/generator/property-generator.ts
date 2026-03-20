// src/generator/property-generator.ts
import { ShapePropertyModel } from "../model/shacl-model.js";
import { generatePropertyType } from "./type-generator.js";
import type { ShapeRegistryEntry } from "./class-generator.js";

export class PropertyGenerator {

  /**
   * Generate TypeScript property code for a SHACL property
   */
  generateProperty(
    prop: ShapePropertyModel,
    imports?: Set<string>,
    shapeRegistry?: Map<string, ShapeRegistryEntry>
  ): string {

    const identifier = prop.codeIdentifier;
    const path = prop.path;

    // --------------------------------------------------
    // NESTED PROPERTY (sh:node)
    // --------------------------------------------------
    if (prop.isNested && prop.nestedClassName) {
      const className = prop.nestedClassName;

      // Lookup the registry for the nested shape
      
      let codeIdentifier = className; // fallback

      if (shapeRegistry) {
        const entry = shapeRegistry.get(className);
        if (entry) {
          codeIdentifier = entry.shape.codeIdentifier;
        }
      }

      // Register import
      if (imports) {
        imports.add(`import { ${codeIdentifier} } from './${codeIdentifier}';`);
      }

      // Multi-valued
      if (prop.cardinality.multiple) {
        return `
  get ${identifier}(): Set<${codeIdentifier}> {
    return this.objects("${path}", ObjectMapping.as(${codeIdentifier}), ObjectMapping.as(${codeIdentifier}));
  }`;
      }

      // Single-valued
      return `
  get ${identifier}(): ${codeIdentifier} | undefined {
    return this.singularNullable("${path}", ObjectMapping.as(${codeIdentifier}), ObjectMapping.as(${codeIdentifier}));
  }
  set ${identifier}(value: ${codeIdentifier} | undefined) {
    this.overwriteNullable("${path}", value, ObjectMapping.as(${codeIdentifier}));
  }`;
    }

    // --------------------------------------------------
    // PRIMITIVE PROPERTY
    // --------------------------------------------------
    const baseType = this.inferType(prop);
    const mapping = this.inferMapping(prop);
    const termMapping = this.termMapping(baseType, prop);
    const returnType = generatePropertyType(baseType, prop.cardinality);

    const getterMethod = prop.cardinality.required && !prop.cardinality.multiple ? "singular" : "singularNullable";
    const setterMethod = prop.cardinality.required && !prop.cardinality.multiple ? "overwrite" : "overwriteNullable";

    if (prop.cardinality.multiple) {
      return `
  get ${identifier}(): Set<${baseType}> {
    return this.objects("${path}", ${mapping}, TermMapping.${termMapping});
  }`;
    }

    return `
  get ${identifier}(): ${returnType} {
    return this.${getterMethod}("${path}", ${mapping});
  }
  set ${identifier}(value: ${baseType}) {
    this.${setterMethod}("${path}", value, TermMapping.${termMapping});
  }`;
  }

  // ---------------- Type inference ----------------
  private inferType(prop: ShapePropertyModel): string {
    if (!prop.datatype) return "string";
    const dt = prop.datatype.toLowerCase();
    if (dt.includes("integer") || dt.includes("decimal")) return "number";
    if (dt.includes("boolean")) return "boolean";
    if (dt.includes("date")) return "Date";
    return "string";
  }

  // ---------------- Mapping inference ----------------
  private inferMapping(prop: ShapePropertyModel): string {
    if (!prop.datatype) return "ValueMapping.literalToString";
    const dt = prop.datatype.toLowerCase();
    if (dt.includes("anyuri")) return "ValueMapping.iriToString";
    if (dt.includes("integer") || dt.includes("decimal")) return "ValueMapping.literalToNumber";
    if (dt.includes("boolean")) return "ValueMapping.literalToString"; // upgrade later
    if (dt.includes("date")) return "ValueMapping.literalToDate";
    return "ValueMapping.literalToString";
  }

  // ---------------- Term mapping ----------------
  private termMapping(type: string, prop: ShapePropertyModel): string {
    if (prop.datatype?.toLowerCase().includes("anyuri")) return "stringToIri";
    switch (type) {
      case "number": return "numberToLiteral";
      case "boolean": return "stringToLiteral";
      case "Date": return "dateToLiteral";
      default: return "stringToLiteral";
    }
  }
}