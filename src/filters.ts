import * as path from 'path';

/**
 * Determines whether a file path should be filtered out from diff context
 * sent to the LLM. Filters lock files, binary assets, build outputs, etc.
 */
export function shouldFilterPath(filePath: string): boolean {
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
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico',
    '.pdf',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.otf',
    '.mp4',
    '.mov',
    '.mp3',
    '.zip',
    '.gz',
    '.7z',
    '.jar',
    '.tar',
    '.tgz',
    '.svg',
    '.map',
    '.wasm',
  ]);

  const filteredDirectoryNames = new Set([
    'dist',
    'build',
    'coverage',
    'out',
    'target',
    '.next',
    'node_modules',
    '.git',
    '.vscode-test',
    '.turbo',
    '.cache',
    'tmp',
    'temp',
    'vendor',
    '__pycache__',
  ]);

  const filteredPathPrefixes = [
    '.vscode-test/',
  ];

  if (filteredNames.has(baseName)) {
    return true;
  }

  if (filteredExtensions.has(path.posix.extname(baseName))) {
    return true;
  }

  return pathSegments.some((segment) => filteredDirectoryNames.has(segment))
    || filteredPathPrefixes.some((prefix) => normalized.startsWith(prefix));
}

/**
 * Detects if a byte buffer is likely binary content.
 */
export function isLikelyBinary(bytes: Uint8Array): boolean {
  const sample = bytes.slice(0, Math.min(bytes.length, 8_000));
  if (sample.length === 0) {
    return false;
  }

  let suspiciousBytes = 0;
  for (const byte of sample) {
    if (byte === 0) {
      return true;
    }

    const isAllowedControlChar = byte === 7 || byte === 8 || byte === 9 || byte === 10 || byte === 12 || byte === 13 || byte === 27;
    if (byte < 32 && !isAllowedControlChar) {
      suspiciousBytes += 1;
    }
  }

  return suspiciousBytes / sample.length > 0.1;
}
