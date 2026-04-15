import { XSD } from "../vocab/xsd.js";
import { RDF } from "../vocab/rdf.js";

export const datatypeMap = {
  [XSD.integer]: {
    type: "number",
    as: "LiteralAs.number",
    from: "LiteralFrom.number",
  },
  [XSD.double]: {
    type: "number",
    as: "LiteralAs.number",
    from: "LiteralFrom.double",
  },
  [XSD.dateTime]: {
    type: "Date",
    as: "LiteralAs.date",
    from: "LiteralFrom.date",
  },
  [XSD.anyURI]: {
    type: "string",
    as: "LiteralAs.string",
    from: "LiteralFrom.string",
  },
    [XSD.string]: {
    type: "string",
    as: "LiteralAs.string",
    from: "LiteralFrom.string",
  },
  [XSD.boolean]: {
    type: "boolean",
    as: "LiteralAs.boolean",
    from: "LiteralFrom.boolean",
  },
  [RDF.langString]: {
    type: "ILangString",
    as: "LiteralAs.langString",
    from: "LiteralFrom.langString",
  }
} as const;

export const numericDatatypes: readonly string[] = [
  XSD.decimal,
  XSD.double,
  XSD.float,
  XSD.int,
  XSD.integer,
  XSD.long,
  XSD.negativeInteger,
  XSD.nonNegativeInteger,
  XSD.nonPositiveInteger,
  XSD.positiveInteger,
  XSD.short,
  XSD.unsignedByte,
  XSD.unsignedInt,
  XSD.unsignedLong,
  XSD.unsignedShort,
]

export const dateDatatypes: readonly string[] = [
    XSD.dateTime, 
    XSD.date
];

export const integerDatatypes: string[] = [         
    XSD.integer,
    XSD.nonPositiveInteger,
    XSD.long,
    XSD.nonNegativeInteger,
    XSD.negativeInteger,
    XSD.int,
    XSD.unsignedLong,
    XSD.positiveInteger,
    XSD.short,
    XSD.unsignedInt,
    XSD.byte,
    XSD.unsignedShort,
    XSD.unsignedByte
]
