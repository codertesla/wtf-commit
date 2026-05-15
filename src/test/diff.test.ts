import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { shouldFilterPath, isLikelyBinary } from '../filters';

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

describe('isLikelyBinary', () => {
  it('should detect null bytes as binary', () => {
    const bytes = new Uint8Array([72, 101, 108, 0, 111]);
    assert.strictEqual(isLikelyBinary(bytes), true);
  });

  it('should detect high ratio of control characters as binary', () => {
    const bytes = new Uint8Array(100);
    // Fill with control characters (not in the allowed set)
    for (let i = 0; i < 100; i++) {
      bytes[i] = 1; // SOH - not an allowed control char
    }
    assert.strictEqual(isLikelyBinary(bytes), true);
  });

  it('should NOT flag normal text as binary', () => {
    const text = 'Hello, world!\nThis is a normal text file.\n';
    const bytes = new TextEncoder().encode(text);
    assert.strictEqual(isLikelyBinary(bytes), false);
  });

  it('should NOT flag empty content as binary', () => {
    assert.strictEqual(isLikelyBinary(new Uint8Array(0)), false);
  });

  it('should allow common control characters (tab, newline, etc.)', () => {
    // Tab (9), LF (10), CR (13) are allowed
    const bytes = new Uint8Array([72, 101, 108, 108, 111, 9, 10, 13, 87, 111, 114, 108, 100]);
    assert.strictEqual(isLikelyBinary(bytes), false);
  });
});
