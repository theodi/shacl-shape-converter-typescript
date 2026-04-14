// src/generator/property-generator.ts
import { ShapePropertyModel } from "../model/shacl-model.js";

import type { CardinalityInfo } from "../model/cardinality.js";
import type { ShapeRegistryEntry,  MappingUsage } from "../model/generator.js";

function resolveCardinality(cardinality: CardinalityInfo) {
  const isRequired = cardinality.required && !cardinality.multiple;

  return {
    isRequired,
    getter: isRequired
      ? "RequiredFrom.subjectPredicate"
      : "OptionalFrom.subjectPredicate",
    setter: isRequired
      ? "RequiredAs.object"
      : "OptionalAs.object",
  };
}

function resolveType(baseType: string, cardinality: CardinalityInfo) {
  if (cardinality.multiple) {
    return `Set<${baseType}>`;
  }
  return cardinality.required ? baseType : `${baseType} | undefined`;
}

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

  // ---------------- NamedNode detection ----------------
  private isNamedNodeProperty(prop: ShapePropertyModel): boolean {
    return !!(prop.class || prop.nodeTerm);
  }

  generateProperty(
    prop: ShapePropertyModel,
    imports?: Set<string>,
    shapeRegistry?: Map<string, ShapeRegistryEntry>,
    usage?: MappingUsage,
    classPrefix: string = "",
    currentClassName?: string
  ): string {
    const identifier = prop.codeIdentifier;

    // ---------------- Skip sh:in ----------------
    if (prop.hasIn) {
      console.warn(
        `Skipping property "${prop.codeIdentifier}" because sh:in is not supported.`
      );
      return ""; // do not generate code for sh:in properties
    }

    // ---------------- Skip complex or blank-node paths ----------------
    if (!prop.path || !isSimpleNamedNodePath(prop.path.toString())) {
      console.warn(
        `Skipping property ${prop.codeIdentifier} because sh:path is complex or a blank node: ${prop.path}`
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
        // prevent self-imports
        const isSelfReference = currentClassName === codeIdentifier;

        if (!isSelfReference) {
          imports.add(`import { ${codeIdentifier} } from './${codeIdentifier}.js';`);
        }
      }

      if (prop.cardinality.multiple) {
        if (usage) {
          usage.set = true;
        }

        return `
  get ${identifier}(): Set<${codeIdentifier}> {
    return SetFrom.subjectPredicate(this, ${propertyIri}, TermAs.instance(${codeIdentifier}), TermFrom.instance);
  }`;
      }

      if (usage) {
        if (prop.cardinality.required) {
          usage.required = true;
        } else {
          usage.optional = true;
        }
      }

      const { getter, setter } = resolveCardinality(prop.cardinality);
      const nestedType = resolveType(codeIdentifier, prop.cardinality);
      

      return `
  get ${identifier}(): ${nestedType} {
    return ${getter}(this, ${propertyIri}, TermAs.instance(${codeIdentifier}));
  }
  set ${identifier}(value: ${nestedType}) {
    ${setter}(this, ${propertyIri}, value, TermFrom.instance);
  }`;
    }
      

    // ---------------- Primitive / NamedNode property ----------------
    const isNamedNode = this.isNamedNodeProperty(prop);

    const baseType = this.inferType(prop);
    const mapping = this.inferMapping(prop, isNamedNode);
    const termMap = this.termMapping(baseType, prop, isNamedNode);

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
      if (usage) {
          usage.set = true;
        }
      return `
  get ${identifier}(): Set<${baseType}> {
    return SetFrom.subjectPredicate(this, ${propertyIri}, ${mapping}, ${termMap});
  }`;
    }

    if (usage) {
      if (prop.cardinality.required) {
        usage.required = true;
      } else {
          usage.optional = true;
      }
    }

    // ---------------- Single-valued ----------------

    const { getter, setter } = resolveCardinality(prop.cardinality);
    const primitiveType = resolveType(baseType, prop.cardinality);

    return `
  get ${identifier}(): ${primitiveType} {
    return ${getter}(this, ${propertyIri}, ${mapping});
  }
  set ${identifier}(value: ${primitiveType}) {
    ${setter}(this, ${propertyIri}, value, ${termMap});
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