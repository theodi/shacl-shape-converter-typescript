import test from "node:test";
import assert from "node:assert/strict";

import { VCardAddress } from "../../fixtures/typescript/VCardAddress.js";

function stringify(addr: VCardAddress) {
  return [...addr.locality].join(",");
}

test("consumer code runs with RDF mapping", () => {
  const mock = {
    locality: new Set(["Berlin"])
  } as unknown as VCardAddress;

  assert.equal(stringify(mock), "Berlin");
});