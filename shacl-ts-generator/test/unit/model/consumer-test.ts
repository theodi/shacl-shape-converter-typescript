// test/unit/model/consumer.test.ts

import test from "node:test";
import assert from "node:assert/strict";

import { VCardAddress } from "../../output/VCardAddress.js";

export function stringify(addr: VCardAddress) {
  return [...addr.locality].join(",");
}

test("consumer code compiles and runs", () => {
  const mock = {
    locality: new Set(["Berlin"])
  } as unknown as VCardAddress;

  assert.equal(stringify(mock), "Berlin");
});