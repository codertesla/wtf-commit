const chunks = [];

for await (const chunk of process.stdin) {
  chunks.push(chunk);
}

const packageFiles = Buffer.concat(chunks)
  .toString('utf8')
  .split(/\r?\n/)
  .map((file) => file.trim().replace(/\\/g, '/'))
  .filter(Boolean);

const allowedFiles = new Set([
  'package.json',
  'icon.png',
  'README.md',
  'README_zh.md',
  'LICENSE',
  'CHANGELOG.md',
  'out/types.js',
  'out/provider-config.js',
  'out/prompt.js',
  'out/git.js',
  'out/filters.js',
  'out/extension.js',
  'out/diff.js',
  'out/diff-optimize.js',
  'out/config.js',
  'out/settings-resolve.js',
  'out/settings-migrate.js',
  'out/ui.js',
  'out/i18n.js',
  'out/push-failure.js',
  'out/generate-lock.js',
  'out/log.js',
  'out/errors.js',
  'out/status.js',
  'out/staged-snapshot.js',
  'out/flow/diff-source.js',
  'out/commands/generate.js',
  'out/commands/set-api-key.js',
  'out/llm/provider.js',
]);

const unexpectedFiles = packageFiles.filter((file) => !allowedFiles.has(file));
const missingFiles = [...allowedFiles].filter((file) => !packageFiles.includes(file));

if (unexpectedFiles.length > 0 || missingFiles.length > 0) {
  if (unexpectedFiles.length > 0) {
    process.stderr.write(`Unexpected files in VSIX package list:\n${unexpectedFiles.map((file) => `- ${file}`).join('\n')}\n`);
  }
  if (missingFiles.length > 0) {
    process.stderr.write(`Required files missing from VSIX package list:\n${missingFiles.map((file) => `- ${file}`).join('\n')}\n`);
  }
  process.exitCode = 1;
} else {
  process.stdout.write(`VSIX package audit passed (${packageFiles.length} approved files).\n`);
}
