#!/usr/bin/env node
/**
 * Prints the digests that lib/auth/sitePassword.ts compares a password against.
 *
 * Usage:
 *   pnpm password:hash "my new password"
 *
 * Paste the printed DEFAULT_PASSWORD_* values into lib/auth/sitePassword.ts
 * (or leave the built-in default password, "nealarp").
 */
import { createHash } from "node:crypto";

const password = process.argv.slice(2).join(" ").trim();

if (!password) {
  console.error('Usage: pnpm password:hash "my new site password"');
  process.exit(1);
}

function fnv1aHex(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const sha256 = createHash("sha256").update(password, "utf8").digest("hex");

console.log(`password                : ${password}`);
console.log(`DEFAULT_PASSWORD_SHA256 = "${sha256}"`);
console.log(`DEFAULT_PASSWORD_FNV1A  = "${fnv1aHex(password)}"`);
console.log("");
console.log("Paste both values into lib/auth/sitePassword.ts (they replace the built-in digests).");
