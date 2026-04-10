// src/shacl/utils/rdfListHelpers.ts
import DataFactory from "@rdfjs/data-model";
import type { Term, DatasetCore, Quad } from "@rdfjs/types";

const { namedNode } = DataFactory;

const RDF_FIRST = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#first");
const RDF_REST  = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#rest");
const RDF_NIL   = namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#nil");

/**
 * Get the first NamedNode in an RDF list starting from a blank node.
 */
export function firstNamedNodeInList(root: Term, dataset: DatasetCore<Quad>): string | undefined {
  let current: Term | undefined = root;

  while (current && current.termType === "BlankNode") {
    const firstQuad = [...dataset.match(current, RDF_FIRST)][0];
    const first = firstQuad?.object;

    if (first?.termType === "NamedNode") return first.value;

    const restQuad: Quad | undefined = [...dataset.match(current, RDF_REST)][0];
    const rest: Term | undefined = restQuad?.object;

    if (!rest || rest.equals(RDF_NIL)) break;

    current = rest;
  }

  return undefined;
}
