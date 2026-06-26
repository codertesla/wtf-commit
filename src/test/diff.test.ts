import * as assert from 'node:assert';
import { describe, it } from 'mocha';
import { shouldFilterPath, isLikelyBinary, redactSensitiveContent } from '../filters';
import {
  compactDiffSection,
  extractRepresentativeHunk,
  finalizeDiffForLlm,
  splitDiffSections,
} from '../diff-optimize';
import { DEFAULT_COMPACT_FILE_THRESHOLD } from '../types';

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

  it('should respect extra ignore patterns (bare directory name)', () => {
    assert.strictEqual(shouldFilterPath('generated/foo.ts', ['generated']), true);
    assert.strictEqual(shouldFilterPath('src/foo.ts', ['generated']), false);
  });

  it('should respect extra ignore patterns (suffix/glob)', () => {
    assert.strictEqual(shouldFilterPath('tests/click.snap', ['*.snap']), true);
    assert.strictEqual(shouldFilterPath('component.css.gen.ts', ['.gen.ts']), true);
    assert.strictEqual(shouldFilterPath('component.ts', ['.gen.ts']), false);
  });

  it('should ignore empty and whitespace-only extra patterns', () => {
    assert.strictEqual(shouldFilterPath('src/index.ts', ['', '  ']), false);
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

function buildSampleSection(filePath: string, changedLines: string[]): string {
  return [
    `diff --git a/${filePath} b/${filePath}`,
    'index 1111111..2222222 100644',
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    `@@ -1,${changedLines.length} +1,${changedLines.length} @@`,
    ...changedLines,
  ].join('\n');
}

describe('splitDiffSections', () => {
  it('should split multi-file diffs', () => {
    const diff = [
      buildSampleSection('src/a.ts', ['-old', '+new']),
      buildSampleSection('src/b.ts', ['-foo', '+bar']),
    ].join('\n');

    assert.strictEqual(splitDiffSections(diff).length, 2);
  });
});

describe('extractRepresentativeHunk', () => {
  it('should keep only the first hunk sample', () => {
    const section = [
      buildSampleSection('src/a.ts', ['-line1', '+line2', '-line3', '+line4']),
      '@@ -10,2 +10,2 @@',
      '-second hunk',
      '+changed',
    ].join('\n');

    const result = extractRepresentativeHunk(section, 2);
    assert.ok(result.includes('line2'));
    assert.ok(!result.includes('second hunk'));
    assert.ok(result.includes('[sample hunk only: src/a.ts]'));
  });
});

describe('compactDiffSection', () => {
  it('should compact staged new files to metadata plus preview', () => {
    const plusLines = Array.from({ length: 40 }, (_, index) => `+line ${index + 1}`);
    const section = [
      'diff --git a/docs/guide.md b/docs/guide.md',
      'new file mode 100644',
      '--- /dev/null',
      '+++ b/docs/guide.md',
      '@@ -0,0 +1,40 @@',
      ...plusLines,
    ].join('\n');

    const result = compactDiffSection(section, 25);
    assert.ok(result.includes('[new file: docs/guide.md, 40 lines]'));
    assert.ok(result.includes('+line 1'));
    assert.ok(!result.includes('+line 40'));
    assert.ok(result.includes('[preview omitted: 25 more lines]'));
  });
});

describe('finalizeDiffForLlm', () => {
  it('should compact when many files are changed', () => {
    const sections = Array.from({ length: DEFAULT_COMPACT_FILE_THRESHOLD + 1 }, (_, index) => [
      buildSampleSection(`src/file${index}.ts`, ['-old', `+new ${index}`]),
      '@@ -50,2 +50,2 @@',
      '-second hunk',
      '+also changed',
    ].join('\n'));
    const rawDiff = sections.join('\n');

    const result = finalizeDiffForLlm(
      rawDiff,
      [],
      [],
      { maxDiffChars: 50_000, maxUntrackedFiles: 30 }
    );

    assert.strictEqual(result.truncated, false);
    assert.ok(result.diff.includes('[sample hunk only: src/file0.ts]'));
    assert.ok(!result.diff.includes('second hunk'));
    assert.ok(result.diff.length < rawDiff.length);
  });

  it('should summarize when diff exceeds maxDiffChars', () => {
    const longLine = '+'.padEnd(500, 'x');
    const rawDiff = buildSampleSection('src/big.ts', [longLine, longLine, longLine]);

    const result = finalizeDiffForLlm(
      rawDiff,
      [{ relativePath: 'src/big.ts' }],
      [],
      { maxDiffChars: 500, maxUntrackedFiles: 30 }
    );

    assert.strictEqual(result.truncated, true);
    assert.ok(result.diff.includes('compact summary'));
    assert.ok(result.diff.includes('src/big.ts'));
  });

  it('should omit snap files via ignore patterns', () => {
    const rawDiff = buildSampleSection('tests/a.snap', ['-old', '+new']);
    const result = finalizeDiffForLlm(rawDiff, [], ['*.snap'], { maxDiffChars: 10_000, maxUntrackedFiles: 30 });

    assert.ok(result.diff.includes('[omitted: non-code or generated file omitted]'));
    assert.ok(!result.diff.includes('+new'));
  });
});
