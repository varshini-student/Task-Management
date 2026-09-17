/**
 * Offline static check: parses every server file and verifies that each
 * relative import points at a file that actually exists and exports the
 * named bindings being imported.  Run with: npm run check
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", "drizzle", ".git"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".js")) files.push(full);
  }
  return files;
}

const files = walk(root);
const errors = [];

for (const file of files) {
  const rel = path.relative(root, file);

  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    errors.push(`${rel}: syntax error\n${error.stderr?.toString().trim()}`);
    continue;
  }

  const source = fs.readFileSync(file, "utf8");
  // The clause may not contain a quote or semicolon, which keeps a single
  // match from spanning two separate import statements.
  const importRe = /import\s+(?:([^;'"]*?)\s+from\s+)?["'](\.[^"']+)["']/g;

  for (const [, clause = "", specifier] of source.matchAll(importRe)) {
    const target = path.resolve(path.dirname(file), specifier);
    if (!fs.existsSync(target)) {
      errors.push(`${rel}: import target not found -> ${specifier}`);
      continue;
    }

    const named = clause.match(/\{([\s\S]*?)\}/)?.[1];
    if (!named) continue;

    const targetSource = fs.readFileSync(target, "utf8");
    const reExportsAll = /export\s+\*\s+from/.test(targetSource);
    if (reExportsAll) continue;

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

console.log(`OK - ${files.length} server files parsed, all relative imports resolve.`);
