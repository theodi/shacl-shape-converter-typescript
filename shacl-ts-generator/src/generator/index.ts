import fs from "fs-extra";
import path from "path";
import { ShaclParser } from "../parser/shacl-parser.js";
import { ClassGenerator } from "./class-generator.js";
import type { ShapeModel } from "../model/shacl-model.js";

/**
 * Generates TypeScript classes from SHACL shapes, resolving nested shape imports
 * using the full ShapeModel registry.
 */
export async function generateFromShacl(
  input: string,
  output: string,
  options?: { classPrefix?: string }  // optional prefix
) {
  const parser = new ShaclParser();
  const prefix = options?.classPrefix ?? "Volunteer";

  // --------------------------------------------------
  // STEP 1: Parse all shapes first
  // --------------------------------------------------
  const stat = await fs.stat(input);

  let shapes: { shape: ShapeModel; fileName: string; codeIdentifier: string }[] = [];

  if (stat.isDirectory()) {
    const files = await fs.readdir(input);

    for (const file of files) {
      if (!file.endsWith(".ttl")) continue;

      const filePath = path.join(input, file);
      const fileStat = await fs.stat(filePath);
      if (!fileStat.isFile()) continue;

      const parsed = await parser.parse(filePath);

      for (const shape of parsed) {
        shapes.push({
          shape,
          fileName: path.basename(file, ".ttl"),
          codeIdentifier: shape.codeIdentifier,
        });
      }
    }
  } else {
    const parsed = await parser.parse(input);
    for (const shape of parsed) {
      shapes.push({
        shape,
        fileName: path.basename(input, ".ttl"),
        codeIdentifier: shape.codeIdentifier,
      });
    }
  }

  // --------------------------------------------------
  // STEP 2: Build shape registry (codeIdentifier → shape + filename)
  // --------------------------------------------------
  type ShapeRegistryEntry = {
    shape: ShapeModel;
    fileName: string;
    codeIdentifier: string;
  };

  const shapeRegistry = new Map<string, ShapeRegistryEntry>();

  for (const entry of shapes) {
    const shape = entry.shape;
    shapeRegistry.set(shape.value, {
      shape,
      fileName: entry.fileName,
      codeIdentifier: entry.codeIdentifier,
    });
  }

  // --------------------------------------------------
  // STEP 3: Generate classes with registry
  // --------------------------------------------------
  const classGenerator = new ClassGenerator(prefix, shapeRegistry); // <-- pass prefix

  await fs.ensureDir(output);

  for (const entry of shapes) {
    const shape = entry.shape;

    // Generate class code using the prefix
    const classCode = classGenerator.generate(shape);

    if (!classCode) continue;

    await fs.writeFile(
      path.join(output, `${shape.codeIdentifier}.ts`), 
      classCode
    );
  }

  // --------------------------------------------------
  // STEP 4: Generate index.ts with prefixed exports
  // --------------------------------------------------
  const indexCode = shapes
    .map((s) => {
      const codeId = s.shape.codeIdentifier;
      return `export * from "./${codeId}";`; 
    })
    .join("\n");

  await fs.writeFile(path.join(output, "index.ts"), indexCode);
}