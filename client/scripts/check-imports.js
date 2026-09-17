/* eslint-env node */

/**
 * Offline sanity check for the client source.
 * Verifies that every relative import resolves to a real file and that the
 * named/default bindings it asks for are actually exported there.
 *
 *   npm run check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const files = walk(root);
const errors = [];

for (const file of files) {
  const rel = path.relative(root, file);
  const source = fs.readFileSync(file, "utf8");
  const importRe = /import\s+(?:([^;'"]*?)\s+from\s+)?["'](\.[^"']+)["']/g;

  for (const [, clause = "", specifier] of source.matchAll(importRe)) {
    const target = path.resolve(path.dirname(file), specifier);
    if (!fs.existsSync(target)) {
      errors.push(`${rel}: import target not found -> ${specifier}`);
      continue;
    }

    const targetSource = fs.readFileSync(target, "utf8");

    // Default import, e.g. `import Thing from "./Thing.jsx"`.
    const defaultName = clause.split("{")[0].replace(/^\s*\*\s+as\s+\S+/, "").split(",")[0].trim();
    if (defaultName && !/export\s+default/.test(targetSource)) {
      errors.push(`${rel}: ${specifier} has no default export (imported as "${defaultName}")`);
    }

    // Named imports.
    const named = clause.match(/\{([\s\S]*?)\}/)?.[1];
    if (!named) continue;

    for (const raw of named.split(",")) {
      const name = raw.split(" as ")[0].trim();
      if (!name) continue;
      const exported = new RegExp(
        `export\\s+(?:async\\s+)?(?:const|let|var|function|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`
      ).test(targetSource);
      if (!exported) errors.push(`${rel}: "${name}" is not exported by ${specifier}`);
    }
  }
}

if (errors.length) {
  console.error(`\nFAILED - ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(" - " + error);
  process.exit(1);
}

console.log(`OK - ${files.length} client files checked, all relative imports resolve.`);
