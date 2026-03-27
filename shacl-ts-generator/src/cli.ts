#!/usr/bin/env node

import { generateFromShacl } from "./generator/index.js";

// ----------------- CLI parsing -----------------
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("Usage:");
  console.log("node dist/cli.js <input-shacl-file> <output-folder> [--prefix=<classPrefix>]");
  process.exit(1);
}

const input = args[0];
const output = args[1];

// Default prefix
let prefix = "";

// Look for optional --prefix argument
args.forEach(arg => {
  if (arg.startsWith("--prefix=")) {
    prefix = arg.split("=")[1];
  }
});

// ----------------- Run generator -----------------
generateFromShacl(input, output, { classPrefix: prefix });