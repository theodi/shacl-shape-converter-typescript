import { generatePropertyType } from "./type-generator.js"
import { ShapePropertyModel } from "../model/shacl-model.js";

export class PropertyGenerator {

  generateProperty(prop: ShapePropertyModel): string {

    const baseType = this.inferType(prop)
    const path = prop.path
    const mapping = this.inferMapping(prop)
    const identifier = prop.codeIdentifier

    // --------------------------------------------------
    // MULTI VALUE PROPERTY
    // --------------------------------------------------

    if (prop.cardinality.multiple) {

      return `
  get ${identifier}(): Set<string> {
    return this.objects(
      "${path}", 
      ${mapping}, 
      TermMapping.${this.termMapping(baseType, prop)}
      );
}`
    }

    // --------------------------------------------------
    // SINGLE VALUE PROPERTY
    // --------------------------------------------------

    const returnType = generatePropertyType(baseType, prop.cardinality)

    return `
  get ${identifier}(): ${returnType} {
      return this.${prop.cardinality.required && !prop.cardinality.multiple ? 'singular' : 'singularNullable'}(
        "${path}",
        ${mapping}
      );
    }
  set ${identifier}(value: ${baseType}) {
      this.${prop.cardinality.required && !prop.cardinality.multiple ? 'overwrite' : 'overwriteNullable'}(
        "${path}",
        value,
        TermMapping.${this.termMapping(baseType, prop)}
      );
    }`;

  }

  // --------------------------------------------------
  // Type Inference
  // --------------------------------------------------

  private inferType(prop: ShapePropertyModel): string {

    if (!prop.datatype) return "string"

    const dt = prop.datatype.toLowerCase()

    if (dt.includes("integer") || dt.includes("decimal"))
      return "number"

    if (dt.includes("boolean"))
      return "boolean"

    if (dt.includes("date"))
      return "Date"

    return "string"
  }

  // --------------------------------------------------
  // Mapping Inference
  // --------------------------------------------------

  private inferMapping(prop: ShapePropertyModel): string {
    if (!prop.datatype) return "ValueMapping.literalToString"

    const dt = prop.datatype.toLowerCase()

    if (dt.includes("anyuri")) return "ValueMapping.iriToString"
    if (dt.includes("integer") || dt.includes("decimal")) return "ValueMapping.literalToNumber" // change to ValueMapping.literalToNumber if/when available 
    if (dt.includes("boolean")) return "ValueMapping.literalToString" // change to ValueMapping.literalToBoolean if/when available 
    if (dt.includes("date")) return "ValueMapping.literalToDate"  
    return "ValueMapping.literalToString"
  }

  // --------------------------------------------------
  // Term Mapping Selection
  // --------------------------------------------------

  private termMapping(type: string, prop: ShapePropertyModel): string {
    if (prop.datatype?.toLowerCase().includes("anyuri")) return "stringToIri"

    switch (type) {
      case "number": return "numberToLiteral"
      case "boolean": return "stringToLiteral" // replace with booleanToLiteral if/when implemented
      case "Date": return "dateToLiteral"
      default: return "stringToLiteral"
    }
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
}