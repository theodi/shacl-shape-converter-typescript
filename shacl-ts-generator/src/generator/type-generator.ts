import { CardinalityInfo } from "../model/cardinality.js"

export function generatePropertyType(baseType: string, cardinality: CardinalityInfo): string {
  if (cardinality.multiple) return `Set<${baseType}>`
  if (cardinality.required) return baseType
  return `${baseType} | undefined`
}