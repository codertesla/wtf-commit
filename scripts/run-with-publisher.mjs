#!/usr/bin/env node
/**
 * Temporarily set package.json "publisher" for a single command, then restore.
 * Used so Microsoft Marketplace (CoderTesla) and Open VSX (codertesla) can
 * share one repo with different publisher IDs.
 *
 * Usage:
 *   node scripts/run-with-publisher.mjs CoderTesla -- pnpm exec vsce publish -p "$PAT"
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const publisher = process.argv[2];
const separator = process.argv.indexOf('--');
const command = separator >= 0 ? process.argv.slice(separator + 1) : [];

if (!publisher || command.length === 0) {
  process.stderr.write(
    'Usage: node scripts/run-with-publisher.mjs <PublisherId> -- <command> [args...]\n'
  );
  process.exit(1);
}

const pkgPath = path.resolve(process.cwd(), 'package.json');
const original = fs.readFileSync(pkgPath, 'utf8');
/** @type {{ publisher?: string }} */
const pkg = JSON.parse(original);
const previous = pkg.publisher;

pkg.publisher = publisher;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
process.stdout.write(`[publisher] ${previous ?? '(none)'} → ${publisher}\n`);

let exitCode = 1;
try {
  const result = spawnSync(command[0], command.slice(1), {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  });
  if (result.error) {
    process.stderr.write(`${result.error.message}\n`);
    exitCode = 1;
  } else {
    exitCode = result.status === null ? 1 : result.status;
  }
} finally {
  fs.writeFileSync(pkgPath, original);
  process.stdout.write(`[publisher] restored → ${previous ?? '(none)'}\n`);
}

process.exit(exitCode);
