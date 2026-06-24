import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { shouldFilterPath, isLikelyBinary, redactSensitiveContent } from '../filters';

describe('shouldFilterPath', () => {
  it('should filter lock files', () => {
    assert.strictEqual(shouldFilterPath('package-lock.json'), true);
    assert.strictEqual(shouldFilterPath('yarn.lock'), true);
    assert.strictEqual(shouldFilterPath('pnpm-lock.yaml'), true);
    assert.strictEqual(shouldFilterPath('Cargo.lock'), true);
    assert.strictEqual(shouldFilterPath('go.sum'), true);
  });

  it('should filter credential files while allowing env templates', () => {
    assert.strictEqual(shouldFilterPath('.env'), true);
    assert.strictEqual(shouldFilterPath('.env.local'), true);
    assert.strictEqual(shouldFilterPath('config/credentials.json'), true);
    assert.strictEqual(shouldFilterPath('certs/service.pem'), true);
    assert.strictEqual(shouldFilterPath('.env.example'), false);
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

describe('redactSensitiveContent', () => {
  it('should redact common tokens and secret assignments', () => {
    const input = [
      '+API_KEY="super-secret-value"',
      '+"password": "hunter2"',
      '+token = ghp_abcdefghijklmnopqrstuvwxyz1234567890',
      '+Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456',
      '+const harmless = "visible";',
    ].join('\n');

    const result = redactSensitiveContent(input);
    assert.ok(!result.includes('super-secret-value'));
    assert.ok(!result.includes('hunter2'));
    assert.ok(!result.includes('ghp_abcdefghijklmnopqrstuvwxyz1234567890'));
    assert.ok(!result.includes('abcdefghijklmnopqrstuvwxyz123456'));
    assert.ok(result.includes('const harmless = "visible";'));
  });

  it('should replace an entire private key block', () => {
    const input = [
      '+-----BEGIN PRIVATE KEY-----',
      '+sensitive-key-material',
      '+-----END PRIVATE KEY-----',
      '+safe content',
    ].join('\n');

    assert.strictEqual(
      redactSensitiveContent(input),
      '+[REDACTED PRIVATE KEY]\n+safe content'
    );
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
