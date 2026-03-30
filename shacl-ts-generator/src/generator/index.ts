import fs from "fs-extra";
import path from "path";
import { ShaclParser } from "../parser/shacl-parser.js";
import { ClassGenerator } from "./class-generator.js";
import { DatasetGenerator } from "./dataset-generator.js";
import type { ShapeModel } from "../model/shacl-model.js";
import { NamingUtils } from "../utils/naming.js";
/**
 * Generates TypeScript classes from SHACL shapes, resolving nested shape imports
 * using the full ShapeModel registry. Also creates a dataset file per input .ttl file
 * using the filename as prefix (unless overridden) and exports it in index.ts.
 */
export async function generateFromShacl(
  input: string,
  output: string,
  options?: { classPrefix?: string }  // optional prefix override
) {
  const parser = new ShaclParser();

  // --------------------------------------------------
  // STEP 1: Parse all shapes first
  // --------------------------------------------------
  const stat = await fs.stat(input);

  type ShapeEntry = {
    shape: ShapeModel;
    fileName: string;
    codeIdentifier: string;
    prefix: string;
  };

  const shapes: ShapeEntry[] = [];
  const datasetPrefixes = new Set<string>();

  if (stat.isDirectory()) {
    const files = await fs.readdir(input);

    for (const file of files) {
      if (!file.endsWith(".ttl")) continue;

      const filePath = path.join(input, file);
      const fileStat = await fs.stat(filePath);
      if (!fileStat.isFile()) continue;

      const parsed = await parser.parse(filePath);

      // Determine prefix for this file
      const prefixForFile = (options?.classPrefix && options.classPrefix.length > 0) ? options.classPrefix : path.basename(file, ".ttl");

      datasetPrefixes.add(prefixForFile);

      for (const shape of parsed) {
        shapes.push({
          shape,
          fileName: path.basename(file, ".ttl"),
          codeIdentifier: shape.codeIdentifier,
          prefix: prefixForFile,
        });
      }
    }
    console.log(`Parsed ${shapes.length} shapes from directory "${input}"`);
  } else {
    const parsed = await parser.parse(input);
    const prefixForFile = options?.classPrefix ?? path.basename(input, ".ttl");
    datasetPrefixes.add(prefixForFile);

    for (const shape of parsed) {
      shapes.push({
        shape,
        fileName: path.basename(input, ".ttl"),
        codeIdentifier: shape.codeIdentifier,
        prefix: prefixForFile,
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
    shapeRegistry.set(entry.shape.value, {
      shape: entry.shape,
      fileName: entry.fileName,
      codeIdentifier: entry.codeIdentifier,
    });
  }

  // --------------------------------------------------
  // STEP 3: Generate classes with registry
  // --------------------------------------------------
  const classGenerator = new ClassGenerator(options?.classPrefix ?? "", shapeRegistry);
  await fs.ensureDir(output);

  for (const entry of shapes) {
    const classCode = classGenerator.generate(entry.shape);
    if (!classCode) continue;

    await fs.writeFile(
      path.join(output, `${entry.shape.codeIdentifier}.ts`),
      classCode
    );
  }

  // --------------------------------------------------
  // STEP 4: Generate dataset files per input file
  // --------------------------------------------------
  await DatasetGenerator.generate(shapes, output);

  // --------------------------------------------------
  // STEP 5: Generate index.ts with class + dataset exports
  // --------------------------------------------------
  const indexCode = shapes
    .map(s => `export * from "./${s.shape.codeIdentifier}";`)
    .join("\n");

  const datasetExports = Array.from(new Set(shapes.map(s => s.prefix)))
    .map(p => `export * from "./${NamingUtils.pascalCase(p)}Dataset";`)
    .join("\n");

  await fs.writeFile(
    path.join(output, "index.ts"),
    indexCode + "\n" + datasetExports
  );

  console.log(`Generated ${shapes.length} classes and ${datasetPrefixes.size} dataset files in "${output}"`);
}