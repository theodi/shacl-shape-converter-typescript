import { DatasetWrapper, LiteralAs, NamedNodeAs, TermAs, TermFrom, TermWrapper } from "@rdfjs/wrapper";
import type { CardinalityInfo } from "./cardinality.ts";
import type { Term } from "@rdfjs/types";
import { firstNamedNodeInList } from "../utils/rdfListHelpers.js"; 



export const SHACL = {
  codeIdentifier: "http://www.w3.org/ns/shacl#codeIdentifier",
  datatype: "http://www.w3.org/ns/shacl#datatype",
  minCount: "http://www.w3.org/ns/shacl#minCount",
  maxCount: "http://www.w3.org/ns/shacl#maxCount",
  name: "http://www.w3.org/ns/shacl#name",
  NodeShape: "http://www.w3.org/ns/shacl#NodeShape",
  path: "http://www.w3.org/ns/shacl#path",
  property: "http://www.w3.org/ns/shacl#property",
  node: "http://www.w3.org/ns/shacl#node",
  class: "http://www.w3.org/ns/shacl#class",
  value: "http://www.w3.org/ns/shacl#value",
  inversePath: "http://www.w3.org/ns/shacl#inversePath",
  in: "http://www.w3.org/ns/shacl#in",
  and: "http://www.w3.org/ns/shacl#and",
} as const;

function unwrapTerm(tw: any): Term | undefined {
  let current = tw;
  while (current) {
    if ("term" in current) return current.term as Term;
    if ("original" in current) current = current.original;
    else break;
  }
  return undefined;
}

function getSubjectTerm(wrapper: TermWrapper): Term | undefined {
  let current: any = wrapper;
  while (current) {
    if (current.termType) {
      // It's a real RDFJS Term
      return current as Term;
    }
    current = current.original;
  }
  return undefined;
}

export class ShaclDataset extends DatasetWrapper {
  get nodeShapes(): Iterable<ShapeModel> {
    return this.instancesOf(SHACL.NodeShape, ShapeModel);
  }
}

export class ShapePropertyModel extends TermWrapper {
  get path(): string | undefined {
    return this.singularNullable(SHACL.path, NamedNodeAs.string);
  }

  get codeIdentifier(): string {
    return this.singular(SHACL.codeIdentifier, LiteralAs.string);
  }

  get name(): string {
    return this.singular(SHACL.name, LiteralAs.string);
  }

  get datatypeConstraint(): string | undefined {
    return this.singularNullable(SHACL.datatype, NamedNodeAs.string);
  }

  get class(): string | undefined {
    return this.singularNullable(SHACL.class, NamedNodeAs.string);
  }

  get fixedValue(): string | undefined {
    return this.singularNullable(SHACL.value, NamedNodeAs.string);
  }

  get inversePath(): string | undefined {
    return this.singularNullable(SHACL.inversePath, NamedNodeAs.string);
  }

  get minCount(): number | undefined {
    return this.singularNullable(SHACL.minCount, LiteralAs.number);
  }

  get maxCount(): number | undefined {
    return this.singularNullable(SHACL.maxCount, LiteralAs.number);
  }

  get cardinality(): CardinalityInfo {
    const min = this.minCount ?? 0;
    const max = this.maxCount;

    const isSingle = max === 1;
    const isMultiple = !isSingle;

    return {
      required: min >= 1,
      singular: isSingle,
      multiple: isMultiple,
    };
  }

  get nodeTerm(): Term | undefined {
    return this.singularNullable(SHACL.node, TermAs.term);
  }

  get nodeIri(): string | undefined {
    const term = this.nodeTerm;

    if (!term) return undefined;

    if (term.termType === "NamedNode") {
        return term.value;
    }

    return undefined; // ignore blank nodes for now
}

  get isNodeNested(): boolean { return !!this.nodeTerm; }
  get isClassNested(): boolean { return !!this.class; }
  get isNested(): boolean { return this.isNodeNested || this.isClassNested; }

  get isBlankNode(): boolean {
    return this.nodeTerm?.termType === "BlankNode";
  }

  get nestedClassName(): string | undefined {
    if (this.nodeTerm) {
        // Existing logic
        let value = this.nodeTerm.value || this.nodeTerm.toString();
        if (value.includes(":")) return value;
        return value.split(/[#/]/).pop() || this.codeIdentifier;
    }

    if (this.class) {
        let value = this.class;
        if (value.includes(":")) return value;
        return value.split(/[#/]/).pop() || this.codeIdentifier;
    }

    return undefined;
}

  /**
   * Returns the sh:codeIdentifier of the nested shape if available in registry
   */
   nestedShapeCodeIdentifier(shapeRegistry?: Map<string, ShapeModel>): string | undefined {
    if (!this.isNested || !this.nestedClassName) return undefined;
    if (!shapeRegistry) return this.nestedClassName;

    const nestedShape = shapeRegistry.get(this.nestedClassName);
    return nestedShape?.codeIdentifier ?? this.nestedClassName;
  }
}

export class ShapeModel extends TermWrapper {
  get codeIdentifier(): string {
    return this.singularNullable(SHACL.codeIdentifier, LiteralAs.string) || "noCodeIdentifier";
  }

  get name(): string {
    return this.value.split(/[/#]/).pop() || "Unknown";
  }

  get properties(): Set<ShapePropertyModel> {
    return this.objects(
      SHACL.property,
      TermAs.instance(ShapePropertyModel),
      TermFrom.instance
    );
  }

  
  get extends(): string[] {
  
  if (!this.dataset) {
    return [];
  }

  const subjectTerm = getSubjectTerm(this);
  if (!subjectTerm) {
    return [];
  }

  const shAndTerm = this.factory.namedNode(SHACL.and);

  const quads = this.dataset.match(subjectTerm, shAndTerm, null);

  if (quads.size === 0) {
    return [];
  }

  for (const quad of quads) {
    const object = quad.object;

    if (object.termType === "NamedNode") {
      console.log("    - NamedNode found:", object.value);
      return [object.value];
    }

    if (object.termType === "BlankNode") {

      const firstNode = firstNamedNodeInList(object, this.dataset);
      
      if (firstNode) return [firstNode];
    }
  }

  console.log("[DEBUG] No valid parent shape found in sh:and");
  return [];
}

  get parentShape(): string | undefined {
    return this.extends[0];
  }

  get hasInheritance(): boolean {
    return !!this.parentShape;
  }
  




}