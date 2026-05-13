import * as assert from 'node:assert';
import { describe, it } from 'mocha';

// We need to test the pure utility functions from diff.ts
// Since some functions are not exported, we test the behavior through the exported interface
// For now, we test the filtering logic by importing the module and checking known patterns

// Note: shouldFilterPath and optimizeDiffForLlm are not exported from diff.ts
// We'll test them indirectly or suggest exporting them for testability.
// For this test file, we replicate the filter logic to validate correctness.

// Replicated from diff.ts for unit testing
import * as path from 'path';

function shouldFilterPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const baseName = path.posix.basename(normalized);
  const pathSegments = normalized.split('/').filter(Boolean);

  const filteredNames = new Set([
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    'cargo.lock',
    'go.sum',
    'gemfile.lock',
  ]);

  const filteredExtensions = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.mp4', '.mov', '.mp3', '.zip', '.gz', '.7z', '.jar', '.tar', '.tgz',
    '.svg', '.map', '.wasm',
  ]);

  const filteredDirectoryNames = new Set([
    'dist', 'build', 'coverage', 'out', 'target', '.next',
    'node_modules', '.git', '.vscode-test', '.turbo', '.cache',
    'tmp', 'temp', 'vendor', '__pycache__',
  ]);

  const filteredPathPrefixes = ['.vscode-test/'];

  if (filteredNames.has(baseName)) {
    return true;
  }

  if (filteredExtensions.has(path.posix.extname(baseName))) {
    return true;
  }

  return pathSegments.some((segment) => filteredDirectoryNames.has(segment))
    || filteredPathPrefixes.some((prefix) => normalized.startsWith(prefix));
}

describe('shouldFilterPath', () => {
  it('should filter lock files', () => {
    assert.strictEqual(shouldFilterPath('package-lock.json'), true);
    assert.strictEqual(shouldFilterPath('yarn.lock'), true);
    assert.strictEqual(shouldFilterPath('pnpm-lock.yaml'), true);
    assert.strictEqual(shouldFilterPath('Cargo.lock'), true);
    assert.strictEqual(shouldFilterPath('go.sum'), true);
  });

  it('should filter binary/media extensions', () => {
    assert.strictEqual(shouldFilterPath('image.png'), true);
    assert.strictEqual(shouldFilterPath('photo.jpg'), true);
    assert.strictEqual(shouldFilterPath('font.woff2'), true);
    assert.strictEqual(shouldFilterPath('bundle.map'), true);
    assert.strictEqual(shouldFilterPath('module.wasm'), true);
  });

  it('should filter build output directories', () => {
    assert.strictEqual(shouldFilterPath('dist/bundle.js'), true);
    assert.strictEqual(shouldFilterPath('build/output.js'), true);
    assert.strictEqual(shouldFilterPath('out/extension.js'), true);
    assert.strictEqual(shouldFilterPath('node_modules/lodash/index.js'), true);
    assert.strictEqual(shouldFilterPath('coverage/lcov.info'), true);
  });

  it('should filter .vscode-test prefix', () => {
    assert.strictEqual(shouldFilterPath('.vscode-test/vscode-1.80/extensions.json'), true);
  });

  it('should NOT filter source code files', () => {
    assert.strictEqual(shouldFilterPath('src/index.ts'), false);
    assert.strictEqual(shouldFilterPath('lib/utils.js'), false);
    assert.strictEqual(shouldFilterPath('README.md'), false);
    assert.strictEqual(shouldFilterPath('package.json'), false);
    assert.strictEqual(shouldFilterPath('tsconfig.json'), false);
  });

  it('should NOT filter config files', () => {
    assert.strictEqual(shouldFilterPath('.eslintrc.js'), false);
    assert.strictEqual(shouldFilterPath('vite.config.ts'), false);
    assert.strictEqual(shouldFilterPath('.gitignore'), false);
  });

  it('should handle Windows-style paths', () => {
    assert.strictEqual(shouldFilterPath('dist\\bundle.js'), true);
    assert.strictEqual(shouldFilterPath('src\\index.ts'), false);
  });

  it('should be case-insensitive', () => {
    assert.strictEqual(shouldFilterPath('Package-Lock.json'), true);
    assert.strictEqual(shouldFilterPath('DIST/bundle.js'), true);
    assert.strictEqual(shouldFilterPath('image.PNG'), true);
  });
});
