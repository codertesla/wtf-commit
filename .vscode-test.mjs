import { defineConfig } from '@vscode/test-cli';

// Pin to engines.vscode minimum so `stable` does not keep downloading
// a new ~200MB+ VS Code build on every release (old builds accumulate in .vscode-test/).
export default defineConfig({
	files: 'out/test/**/*.test.js',
	version: '1.75.0',
});
