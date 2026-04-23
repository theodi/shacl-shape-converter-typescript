// src/generator/dataset-generator.ts
import fs from "fs-extra";
import path from "path";
import { NamingUtils } from "../utils/naming.js";
import type { ShapeModel } from "../model/shacl-model.js";

/**
 * Generates dataset TS files per input file.
 * Each nodeshape in the input becomes a getter method on the dataset class.
 */
export class DatasetGenerator {
  /**
   * Generate dataset classes for all nodeshapes grouped by file prefix
   */
  static async generate(
    shapes: { shape: ShapeModel; prefix: string }[],
    output: string
  ) {
    // Group shapes by prefix
    const prefixMap = new Map<string, ShapeModel[]>();

    for (const entry of shapes) {
      const list = prefixMap.get(entry.prefix) ?? [];
      list.push(entry.shape);
      prefixMap.set(entry.prefix, list);
    }

    // Ensure output dir
    await fs.ensureDir(output);

    // Generate one dataset file per prefix
    for (const [prefix, nodeShapes] of prefixMap.entries()) {
      const className = `${NamingUtils.pascalCase(prefix)}Dataset`;
      const datasetFilePath = path.join(output, `${className}.ts`);

      const imports = new Set<string>();

      const getters = nodeShapes
        .filter(shape => shape.targetClass) // only include shapes with targetClass
        .map(shape => {
          const methodName =
            shape.codeIdentifier[0].toLowerCase() + shape.codeIdentifier.slice(1);

          imports.add(
            `import { ${shape.codeIdentifier} } from "./${shape.codeIdentifier}.js";`
          );

          return `  get ${methodName}() {
    return this.instancesOf("${shape.targetClass}", ${shape.codeIdentifier});
  }`;
        })
        .join("\n\n");

      const datasetClassCode = `
import { DatasetWrapper } from "@rdfjs/wrapper";
${[...imports].sort().join("\n")}

export class ${className} extends DatasetWrapper {
${getters}
}
`;

      await fs.writeFile(datasetFilePath, datasetClassCode.trim() + "\n");
    }
  }
}