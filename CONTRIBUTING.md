# Contributing

## Development Setup

Clone the repository and install dependencies:

```
cd shacl-ts-generator
npm install
```

Build the project:

```
npm run build
```

## Project Structure

```
shacl-ts-generator/
  dist/
  output/
  src/
    generator/
    model/
    parser/
    templates/
    utils/
    cli.ts
  tests/
  package.json
  tsconfig.json
  vitest.config.ts
```

## Generator Pipeline

The generator follows this pipeline:

```
Parse SHACL RDF
↓
Validate Constraints
↓
Normalize Models (transform parsed + validated SHACL RDF structures into a consistent, generator-friendly internal representation)
↓
Generate TypeScript Classes
```

## Testing

Uses Vitest with fixture-based SHACL inputs.

Run tests:

```
npm test
```

Test layers:

* Unit tests
* Integration tests
* CLI execution tests

## TypeScript Configuration

```json
{
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2020",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["vitest/globals", "node"]
}
```

## Dependencies

Runtime:

```
@rdfjs/types
commander
fs-extra
n3
rdfjs-wrapper
```

Development:

```
typescript
ts-node
vitest
@types/node
@types/fs-extra
@types/n3
execa
```
