import { DatasetWrapper, ObjectMapping, TermWrapper, ValueMapping } from "rdfjs-wrapper";
import type { CardinalityInfo } from "./cardinality.ts";
import type { Term } from "@rdfjs/types";

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
} as const;

export class ShaclDataset extends DatasetWrapper {
  get nodeShapes(): Iterable<ShapeModel> {
    return this.instancesOf(SHACL.NodeShape, ShapeModel);
  }
}

export class ShapePropertyModel extends TermWrapper {
  get path(): string | undefined {
    return this.singularNullable(SHACL.path, ValueMapping.iriToString);
  }

  get codeIdentifier(): string {
    return this.singular(SHACL.codeIdentifier, ValueMapping.literalToString);
  }

  get name(): string {
    return this.singular(SHACL.name, ValueMapping.literalToString);
  }

  get datatypeConstraint(): string | undefined {
    return this.singularNullable(SHACL.datatype, ValueMapping.iriToString);
  }

  get class(): string | undefined {
    return this.singularNullable(SHACL.class, ValueMapping.iriToString);
  }

  get fixedValue(): string | undefined {
    return this.singularNullable(SHACL.value, ValueMapping.iriToString);
  }

  get inversePath(): string | undefined {
    return this.singularNullable(SHACL.inversePath, ValueMapping.iriToString);
  }

  get minCount(): number | undefined {
    return this.singularNullable(SHACL.minCount, ValueMapping.literalToNumber);
  }

  get maxCount(): number | undefined {
    return this.singularNullable(SHACL.maxCount, ValueMapping.literalToNumber);
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
    return this.singularNullable(SHACL.node, ValueMapping.iriOrBlankNodeToString) as Term | undefined;
  }

  get nodeIri(): string | undefined {
    const term = this.nodeTerm;

    if (!term) return undefined;

    if (term.termType === "NamedNode") {
        return term.value;
    }

    return undefined; // ignore blank nodes for now
}

  get isNested(): boolean {
    return !!this.nodeTerm;
  }

  get isBlankNode(): boolean {
    return this.nodeTerm?.termType === "BlankNode";
  }

  get nestedClassName(): string | undefined {
    if (!this.nodeTerm) return undefined;

    let value = this.nodeTerm.value || this.nodeTerm.toString();

    if (value.includes(":")) return value;

    return value.split(/[#/]/).pop() || this.codeIdentifier;
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
    return this.singularNullable(SHACL.codeIdentifier, ValueMapping.literalToString) || "noCodeIdentifier";
  }

  get name(): string {
    return this.value.split(/[/#]/).pop() || "Unknown";
  }

  get properties(): Set<ShapePropertyModel> {
    return this.objects(
      SHACL.property,
      ObjectMapping.as(ShapePropertyModel),
      ObjectMapping.as(ShapePropertyModel)
    );
  }
}