// src/generator/property-generator.ts
import { ShapePropertyModel } from "../model/shacl-model.js";
import { generatePropertyType } from "./type-generator.js";
import type { ShapeRegistryEntry } from "./class-generator.js";

type MappingUsage = {
  objectMapping?: boolean;
  valueMapping?: boolean;
  termMapping?: boolean;
};

export class PropertyGenerator {
  /**
   * Generate TypeScript property code for a SHACL property
   * @param prop The SHACL property
   * @param imports Set of import statements
   * @param shapeRegistry Registry of shapes
   * @param usage Tracks which mappings are used
   * @param classPrefix Optional prefix for class names
   */
  generateProperty(
    prop: ShapePropertyModel,
    imports?: Set<string>,
    shapeRegistry?: Map<string, ShapeRegistryEntry>,
    usage?: MappingUsage,
    classPrefix: string = ""
  ): string {
    const identifier = prop.codeIdentifier;

    // Keep full IRI for RDF predicate
    const propertyIri = prop.path ? `"${prop.path}"` : `"${identifier}"`;

    // --------------------------------------------------
    // NESTED PROPERTY (sh:node or sh:class)
    // --------------------------------------------------
    if (prop.isNested && prop.nestedClassName) {
      let className = prop.nestedClassName;

      // Strip full IRI to simple name for prefixing
      if (className.includes("://")) {
        className = className.split(/[#/]/).pop() || className;
      }

      // Lookup registry for the nested class
      if (shapeRegistry) {
        const entry = shapeRegistry.get(prop.nestedClassName);
        if (entry) className = entry.shape.codeIdentifier;
      }

      const codeIdentifier = `${classPrefix}${className}`;

      if (usage) usage.objectMapping = true;

      // Register import for nested class
      if (imports) imports.add(`import { ${codeIdentifier} } from './${codeIdentifier}.js';`);

      // Multi-valued nested property
      if (prop.cardinality.multiple) {
        return `
  get ${identifier}(): Set<${codeIdentifier}> {
    return this.objects(${propertyIri}, TermAs.instance(${codeIdentifier}), TermFrom.instance);
  }`;
      }

      // Single-valued nested property
      return `
  get ${identifier}(): ${codeIdentifier} | undefined {
    return this.singularNullable(${propertyIri}, TermAs.instance(${codeIdentifier}), TermFrom.instance);
  }
  set ${identifier}(value: ${codeIdentifier} | undefined) {
    this.overwriteNullable(${propertyIri}, value, TermAs.instance(${codeIdentifier}));
  }`;
    }

    // ------------------ Primitive property ----------------
    const baseType = this.inferType(prop);
    const mapping = this.inferMapping(prop);
    const termMap = this.termMapping(baseType, prop);
    const getSetType = generatePropertyType(baseType, prop.cardinality);

    if (usage) {
      usage.valueMapping = true;
      usage.termMapping = true;
    }

    // Multi-valued primitive
    if (prop.cardinality.multiple) {
      return `
  get ${identifier}(): Set<${baseType}> {
    return this.objects(${propertyIri}, ${mapping}, ${termMap});
  }`;
    }

    // Single-valued primitive
    const getterMethod =
      prop.cardinality.required && !prop.cardinality.multiple
        ? "singular"
        : "singularNullable";
    const setterMethod =
      prop.cardinality.required && !prop.cardinality.multiple
        ? "overwrite"
        : "overwriteNullable";

    return `
  get ${identifier}(): ${getSetType} {
    return this.${getterMethod}(${propertyIri}, ${mapping});
  }
  set ${identifier}(value: ${getSetType}) {
    this.${setterMethod}(${propertyIri}, value, ${termMap});
  }`;
  }

  // ---------------- Type inference ----------------
  private inferType(prop: ShapePropertyModel): string {
    if (!prop.datatypeConstraint) return "string";
    const dt = prop.datatypeConstraint.toLowerCase();
    if (dt.includes("integer") || dt.includes("decimal")) return "number";
    if (dt.includes("boolean")) return "boolean";
    if (dt.includes("date")) return "Date";
    return "string";
  }

  // ---------------- Mapping inference ----------------
  private inferMapping(prop: ShapePropertyModel): string {
    if (!prop.datatypeConstraint) return "LiteralAs.string";
    const dt = prop.datatypeConstraint.toLowerCase();
    if (dt.includes("anyuri")) return "LiteralAs.anyUriString";
    if (dt.includes("integer") || dt.includes("decimal")) return "LiteralAs.number";
    if (dt.includes("boolean")) return "LiteralAs.boolean";
    if (dt.includes("date")) return "LiteralAs.date";
    return "LiteralAs.string";
  }

  // ---------------- Term mapping ----------------
  private termMapping(type: string, prop: ShapePropertyModel): string {
    if (prop.datatypeConstraint?.toLowerCase().includes("anyuri")) return "LiteralFrom.anyUriString";
    switch (type) {
      case "number":
        return "LiteralFrom.double";
      case "boolean":
        return "LiteralFrom.boolean";
      case "Date":
        return "LiteralFrom.Date";
      default:
        return "LiteralFrom.string";
    }
  }
}