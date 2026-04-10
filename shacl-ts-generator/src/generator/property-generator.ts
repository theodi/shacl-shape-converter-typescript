// src/generator/property-generator.ts
import { ShapePropertyModel, SHACL } from "../model/shacl-model.js";
import { generatePropertyType } from "./type-generator.js";
import type { ShapeRegistryEntry } from "./class-generator.js";
import type { Term } from "@rdfjs/types";

type MappingUsage = {
  objectMapping?: boolean;
  valueMapping?: boolean;
  termMapping?: boolean;
};

// ------------------------
// Detect simple named node paths
// ------------------------
function isSimpleNamedNodePath(path: any): boolean {
  if (!path) return false;

  // Only strings are expected, check for complex path indicators
  if (typeof path === "string") {
    const trimmed = path.trim();
    // Skip blank nodes, sequences, inverse paths, path alternatives (/), negations (!), property sets ({})
    if (
      trimmed.startsWith("[") ||
      trimmed.startsWith("{") ||
      trimmed.startsWith("^") ||
      trimmed.includes("!")
    ) {
      return false;
    }
    return true;
  }

  // If path is something else (unexpected), consider it complex
  return false;
}

export class PropertyGenerator {

  // ---------------- Check for sh:in ----------------
  private hasShIn(prop: ShapePropertyModel): boolean {
    // Identity functions typed to Term to avoid 'any'
    const values = (prop as any).objects?.(
      SHACL.in,
      (t: Term) => t,
      (t: Term) => t
    );
    return values && values.size > 0;
  }

  // ---------------- NamedNode detection ----------------
  private isNamedNodeProperty(prop: ShapePropertyModel): boolean {
    if (this.hasShIn(prop)) {
      console.warn(
        `Skipping property "${prop.codeIdentifier}" because it uses sh:in, which is not supported.`
      );
      return false;
    }
    return !!(prop.class || prop.nodeTerm);
  }

  generateProperty(
    prop: ShapePropertyModel,
    imports?: Set<string>,
    shapeRegistry?: Map<string, ShapeRegistryEntry>,
    usage?: MappingUsage,
    classPrefix: string = ""
  ): string {
    const identifier = prop.codeIdentifier;

    // ---------------- Skip sh:in ----------------
    if (this.hasShIn(prop)) {
      return ""; // do not generate code for sh:in properties
    }

    // ---------------- Skip complex or blank-node paths ----------------
    if (!prop.path || !isSimpleNamedNodePath(prop.path.toString())) {
      console.warn(
        `Skipping property "${prop.codeIdentifier}" because sh:path is complex or a blank node: ${prop.path}`
      );
      return "";
    }

    const propertyIri = `"${prop.path || prop.codeIdentifier}"`;

    // ---------------- Nested property (sh:node or sh:class) ----------------
    if (prop.isNested && prop.nestedClassName) {
      let className = prop.nestedClassName;

      if (className.includes("://")) {
        className = className.split(/[#/]/).pop() || className;
      }

      if (shapeRegistry) {
        const entry = shapeRegistry.get(prop.nestedClassName);
        if (entry) className = entry.shape.codeIdentifier;
      }

      const codeIdentifier = `${classPrefix}${className}`;

      if (usage) usage.objectMapping = true;

      if (imports) {
        imports.add(`import { ${codeIdentifier} } from './${codeIdentifier}.js';`);
      }

      if (prop.cardinality.multiple) {
        return `
  get ${identifier}(): Set<${codeIdentifier}> {
    return this.objects(${propertyIri}, TermAs.instance(${codeIdentifier}), TermFrom.instance);
  }`;
      }

      return `
  get ${identifier}(): ${codeIdentifier} | undefined {
    return OptionalFrom.subjectPredicate(this, ${propertyIri}, TermAs.instance(${codeIdentifier}));
  }
  set ${identifier}(value: ${codeIdentifier} | undefined) {
    OptionalAs.object(this, ${propertyIri}, value, TermAs.instance(${codeIdentifier}));
  }`;
    }

    // ---------------- Primitive / NamedNode property ----------------
    const isNamedNode = this.isNamedNodeProperty(prop);

    const baseType = this.inferType(prop);
    const mapping = this.inferMapping(prop, isNamedNode);
    const termMap = this.termMapping(baseType, prop, isNamedNode);
    const getSetType = generatePropertyType(baseType, prop.cardinality);

    if (usage) {
      usage.valueMapping = true;
      usage.termMapping = true;
    }

    // ---------------- Import handling ----------------
    if (imports) {
      if (isNamedNode) {
        imports.add(`import { NamedNodeAs, NamedNodeFrom } from "@rdfjs/wrapper";`);
      } 
    }

    // ---------------- Multi-valued ----------------
    if (prop.cardinality.multiple) {
      return `
  get ${identifier}(): Set<${baseType}> {
    return SetFrom.subjectPredicate(this, ${propertyIri}, ${mapping}, ${termMap});
  }`;
    }

    // ---------------- Single-valued ----------------
    const getterMethod =
      prop.cardinality.required && !prop.cardinality.multiple
        ? "RequiredFrom.subjectPredicate"
        : "OptionalFrom.subjectPredicate";

    const setterMethod =
      prop.cardinality.required && !prop.cardinality.multiple
        ? "RequiredAs.object"
        : "OptionalAs.object";

    return `
  get ${identifier}(): ${getSetType} {
    return ${getterMethod}(this, ${propertyIri}, ${mapping});
  }
  set ${identifier}(value: ${getSetType}) {
    ${setterMethod}(this, ${propertyIri}, value, ${termMap});
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
  private inferMapping(prop: ShapePropertyModel, isNamedNode: boolean): string {
    if (!prop.datatypeConstraint) {
      return isNamedNode ? "NamedNodeAs.string" : "LiteralAs.string";
    }

    const dt = prop.datatypeConstraint.toLowerCase();

    if (dt.includes("anyuri")) return "LiteralAs.string";
    if (dt.includes("integer") || dt.includes("decimal")) return "LiteralAs.number";
    if (dt.includes("boolean")) return "LiteralAs.boolean";
    if (dt.includes("date")) return "LiteralAs.date";

    return "LiteralAs.string";
  }

  // ---------------- Term mapping ----------------
  private termMapping(type: string, prop: ShapePropertyModel, isNamedNode: boolean): string {
    if (isNamedNode) {
      return "NamedNodeFrom.string";
    }

    if (prop.datatypeConstraint?.toLowerCase().includes("anyuri")) {
      return "LiteralFrom.anyUriString";
    }

    switch (type) {
      case "number": return "LiteralFrom.double";
      case "boolean": return "LiteralFrom.boolean";
      case "Date": return "LiteralFrom.date";
      default: return "LiteralFrom.string";
    }
  }
}