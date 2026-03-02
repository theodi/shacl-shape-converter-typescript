import { generatePropertyType } from "./type-generator.js"

import { ShapePropertyModel } from "../model/shacl-model.js";

export class PropertyGenerator {

  generateProperty(prop: ShapePropertyModel): string {

    const baseType = this.inferType(prop)

    const path = prop.path

    const mapping = this.inferMapping(prop)

    const identifier = prop.codeIdentifier
    const capitalized = this.capitalize(identifier)

    // --------------------------------------------------
    // MULTI VALUE PROPERTY
    // --------------------------------------------------

    if (prop.cardinality.multiple) {

      return `
  get ${identifier}(): Set<${baseType}> {
    const values = new Set<${baseType}>()

    for (const value of this.objects(
      "${path}",
      ${mapping},
      TermMapping.stringToLiteral
    )) {
      values.add(value as ${baseType})
    }

    return values
  }

  add${capitalized}(value: ${baseType}) {
      
      const valueSet = this.objects(
        "${path}",
        ValueMapping.literalToString,
        TermMapping.stringToLiteral
        )
        valueSet.add(value)
       
      }

  delete${capitalized}(value: ${baseType}) {
      const valueSet = this.objects(
        "${path}",
        ValueMapping.literalToString,
        TermMapping.stringToLiteral
        )
        valueSet.delete(value)
  }
`
    }

    // --------------------------------------------------
    // SINGLE VALUE PROPERTY
    // --------------------------------------------------

    const returnType = generatePropertyType(baseType, prop.cardinality)

    return `
  get ${identifier}(): ${returnType} | undefined {
    
    return this.singularNullable(
      "${path}",
      ${mapping}
      ) 
  }



  set ${identifier}(value: ${baseType} | undefined) {

    if (!value || value === undefined || value === null) {
      throw new Error("${identifier} cannot be empty")
    }

    this.overwriteNullable(
      "${path}",
      value,
      TermMapping.${this.termMapping(baseType)}
    )
  }
`
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

    if (!prop.datatype)
      return "ValueMapping.literalToString"

    const dt = prop.datatype.toLowerCase()

    if (dt.includes("integer") || dt.includes("decimal"))
      return "ValueMapping.literalToNumber"

    if (dt.includes("boolean"))
      return "ValueMapping.literalToBoolean"

    return "ValueMapping.literalToString"
  }

  // --------------------------------------------------
  // Term Mapping Selection
  // --------------------------------------------------

  private termMapping(type: string): string {

    switch (type) {

      case "number":
        return "numberToLiteral"

      case "boolean":
        return "booleanToLiteral"

      case "Date":
        return "dateToLiteral"

      default:
        return "stringToLiteral"
    }
  }

  private capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
}