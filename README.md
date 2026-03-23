# SHACL → TypeScript Class Generator

A Node.js + TypeScript CLI tool that transforms SHACL shape definitions into RDFJS-compatible TypeScript resource wrappers. This enables knowledge graph programming using TypeScript.

## Installation

```
npm install @theodi/shacl-converter
```

## CLI Usage

Run the converter by providing a SHACL shape file and an output directory:

```
npx shacl-converter <shapes-file> <output-directory>
```

For example:

```
npx shacl-converter shapes.ttl output
```

Alternatively, install globally with `npm install -g @theodi/shacl-converter` and run directly:

```
shacl-converter shapes.ttl output
```

Providing a directory containing SHACL shape files is also supported:

```
npx shacl-converter <shapes-file-directory> <output-directory>
```

## Output

Each SHACL shape generates:

* One TypeScript wrapper class
* One index export file

Example:

```
output/
  Person.ts
  index.ts
```

Generated classes expose mutable RDF graph properties, mapped bidirectionally:

* Getters read RDF triples and convert to JavaScript values
* Setters convert JavaScript values back into RDF terms

```ts
get name(): string | undefined
set name(value: string | undefined)
```

---

## SHACL Shape Requirements

### Shapes

Each `sh:NodeShape` must define:

* `sh:codeIdentifier` — used as the TypeScript class name

The identifier must match:

```
^[a-zA-Z_][a-zA-Z0-9_]*$
```

There are reserved words that cannot be used for the `sh:codeIdentifier` value:
* *type*
* *value*

Note: The `sh:codeIdentifier` predicate and the identifier regex above are specific to this generator and are not part of the SHACL Core specification. The `sh:codeIdentifier` predicate is part of the [SHACL 1.2 Core Working Draft](https://www.w3.org/TR/shacl12-core/#codeIdentifier).

### Properties

Each property shape must define:

* `sh:path` — the RDF predicate
* `sh:codeIdentifier` — the TypeScript field name

Missing metadata causes generation failure.

### Cardinality Interpretation

| SHACL Constraint | Meaning             |
| ---------------- | ------------------- |
| sh:minCount 1    | Required property   |
| sh:maxCount 1    | Singular property   |
| sh:maxCount > 1 or absent  | Collection property |

### Supported SHACL Predicates

* sh:property
* sh:path
* sh:datatype
* sh:class
* sh:minCount
* sh:maxCount
* sh:name
* sh:node
* sh:value
* sh:codeIdentifier

---

## Validation

Validation occurs during parsing. If validation fails:

* All errors are reported
* The CLI exits gracefully
* No partial code is generated

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, project structure, and testing instructions.

## License

This work is dual-licensed under MIT and Apache 2.0.
You can choose between one of them if you use this work.

`SPDX-License-Identifier: MIT OR Apache-2.0`
