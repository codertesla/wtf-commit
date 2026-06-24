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
    '.npmrc',
    '.pypirc',
    '.netrc',
    'credentials.json',
    'credentials',
    'secrets.json',
    'secrets.yaml',
    'secrets.yml',
    'service-account.json',
    'id_rsa',
    'id_ed25519',
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
    '.pem',
    '.key',
    '.p12',
    '.pfx',
    '.jks',
    '.keystore',
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

  if (baseName === '.env' || (baseName.startsWith('.env.') && !isSafeEnvTemplate(baseName))) {
    return true;
  }

  if (filteredExtensions.has(path.posix.extname(baseName))) {
    return true;
  }

  return pathSegments.some((segment) => filteredDirectoryNames.has(segment))
    || filteredPathPrefixes.some((prefix) => normalized.startsWith(prefix));
}

function isSafeEnvTemplate(baseName: string): boolean {
  return baseName === '.env.example' || baseName === '.env.sample' || baseName === '.env.template';
}

/**
 * Redacts common credentials that may appear inside otherwise legitimate source files.
 */
export function redactSensitiveContent(content: string): string {
  const lines = content.split('\n');
  const redactedLines: string[] = [];
  let insidePrivateKey = false;

  for (const line of lines) {
    if (/-----BEGIN [^-]*PRIVATE KEY-----/i.test(line)) {
      insidePrivateKey = true;
      redactedLines.push(`${getDiffMarker(line)}[REDACTED PRIVATE KEY]`);
      continue;
    }

    if (insidePrivateKey) {
      if (/-----END [^-]*PRIVATE KEY-----/i.test(line)) {
        insidePrivateKey = false;
      }
      continue;
    }

    redactedLines.push(redactSecretsInLine(line));
  }

  return redactedLines.join('\n');
}

function getDiffMarker(line: string): string {
  return line.startsWith('+') || line.startsWith('-') ? line[0] : '';
}

function redactSecretsInLine(line: string): string {
  return line
    .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, '[REDACTED AWS ACCESS KEY]')
    .replace(/\bAIza[\w-]{30,}\b/g, '[REDACTED GOOGLE API KEY]')
    .replace(/\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g, '[REDACTED GITHUB TOKEN]')
    .replace(/\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g, '[REDACTED SLACK TOKEN]')
    .replace(/\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b/g, '[REDACTED API KEY]')
    .replace(/(\bBearer\s+)[A-Za-z0-9._~+/-]{16,}={0,2}/gi, '$1[REDACTED]')
    .replace(
      /(["']?\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|refresh[_-]?token|client[_-]?secret|private[_-]?key|password|passwd|secret)\b["']?\s*[=:]\s*["']?)([^\s"',;}]+)/gi,
      '$1[REDACTED]'
    );
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
