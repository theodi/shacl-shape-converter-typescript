import { DatasetWrapper, ObjectMapping, TermWrapper, ValueMapping } from "rdfjs-wrapper"
import type { CardinalityInfo } from "./cardinality.js"

export const SHACL = {
    codeIdentifier: "http://www.w3.org/ns/shacl#codeIdentifier",
    datatype: "http://www.w3.org/ns/shacl#datatype",
    minCount: "http://www.w3.org/ns/shacl#minCount",
    maxCount: "http://www.w3.org/ns/shacl#maxCount",
    name: "http://www.w3.org/ns/shacl#name",
    NodeShape: "http://www.w3.org/ns/shacl#NodeShape",
    path: "http://www.w3.org/ns/shacl#path",
    property: "http://www.w3.org/ns/shacl#property",
} as const

export class ShaclDataset extends DatasetWrapper {
    get nodeShapes(): Iterable<ShapeModel> {
        return this.instancesOf(SHACL.NodeShape, ShapeModel)
    }
}

export class ShapePropertyModel extends TermWrapper {
    get path(): string | undefined {
        return this.singularNullable(SHACL.path, ValueMapping.iriToString)
    }

    get codeIdentifier(): string {
        return this.singular(SHACL.codeIdentifier, ValueMapping.literalToString)
    }

    get name(): string {
        return this.singular(SHACL.name, ValueMapping.literalToString)
    }

    get datatype(): string | undefined {
        return this.singularNullable(SHACL.datatype, ValueMapping.iriToString)
    }

    get minCount(): number | undefined {
        return this.singularNullable(SHACL.minCount, ValueMapping.literalToNumber)
    }

    get maxCount(): number | undefined {
        return this.singularNullable(SHACL.maxCount, ValueMapping.literalToNumber)
    }

    get cardinality(): CardinalityInfo {
        const min = this.minCount ?? 0

        return {
            required: min >= 1,
            singular: this.maxCount === 1,
            multiple: this.maxCount === undefined || this.maxCount > 1
        }
    }
}

export class ShapeModel extends TermWrapper {
    get codeIdentifier(): string | undefined {
        return this.singularNullable(SHACL.codeIdentifier, ValueMapping.literalToString)
    }

    get name(): string | undefined {
        return this.term.value.split(/[/#]/).pop() || "Unknown"
    }

    get properties(): Set<ShapePropertyModel> {
        return this.objects(SHACL.property, ObjectMapping.as(ShapePropertyModel), ObjectMapping.as(ShapePropertyModel))
    }
}
