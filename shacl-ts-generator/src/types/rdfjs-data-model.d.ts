declare module "@rdfjs/data-model" {
  import type { NamedNode, Literal, BlankNode, Term } from "@rdfjs/types";

  export function namedNode(value: string): NamedNode;
  export function blankNode(value?: string): BlankNode;
  export function literal(value: string, languageOrDatatype?: string | NamedNode): Literal;
}