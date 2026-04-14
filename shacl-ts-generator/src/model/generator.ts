import { ShapeModel } from "../model/shacl-model.js";


export type MappingUsage = {
  objectMapping?: boolean;
  valueMapping?: boolean;
  termMapping?: boolean;
  set?: boolean;
  optional?: boolean;
  required?: boolean;
};

/**
 * Registry entry type for each shape
 */
export type ShapeRegistryEntry = {
  shape: ShapeModel;
  fileName: string; // filename containing the shape
  codeIdentifier: string; // shape's code identifier
  prefix: string;
};
