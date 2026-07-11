import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.join(root, '.vscode-test');

const result = spawnSync('pnpm', ['exec', 'vscode-test'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

try {
  if (existsSync(cacheDir)) {
    rmSync(cacheDir, { recursive: true, force: true });
    console.log('Cleaned .vscode-test/ after Electron tests.');
  }
} catch (error) {
  console.warn(`Failed to clean .vscode-test/: ${error instanceof Error ? error.message : error}`);
}

process.exit(result.status ?? 1);
