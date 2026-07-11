import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, '.vscode-test');

if (!existsSync(target)) {
  console.log('No .vscode-test/ to clean.');
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
console.log('Removed .vscode-test/ (VS Code Electron test cache).');
