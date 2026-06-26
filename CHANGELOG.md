# Changelog

All notable changes to the "wtf-commit" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.10.3] - 2026-06-26
### Fixed
- **GLM / Z.AI / DeepSeek Thinking**: Automatically send `thinking: { type: "disabled" }` so GLM-4.7+ models return answer `content` in streaming mode instead of only `reasoning_content` (which caused slow responses and “No content in streaming response” errors).

### Changed
- **GLM API Key URL**: Updated the China GLM API Key link to [open.bigmodel.cn/apikey/platform](https://open.bigmodel.cn/apikey/platform).

## [1.10.2] - 2026-06-26
### Changed
- **Marketplace Badges**: README badges now highlight recommended commit models — free GLM / Z.AI, DeepSeek V4 Flash, MiMo V2.5, and Gemini 3.1 Flash Lite.
- **API Key Links**: README now lists official API Key pages for each built-in provider.
- **Gitignore**: Ignore `.pnpm-store/` so local pnpm cache does not show up in git status.

## [1.10.1] - 2026-06-26
### Added
- **Z.AI Provider**: Added the international Z.AI endpoint (`https://api.z.ai/api/paas/v4`) with default model `glm-4.7-flash` (free per [Z.AI pricing](https://docs.z.ai/guides/overview/pricing)). Separate from the China **GLM** provider on `open.bigmodel.cn` — API keys are not interchangeable.

## [1.10.0] - 2026-06-26
### Added
- **MiMo Provider**: Added Xiaomi MiMo (`mimo-v2.5`) with OpenAI-compatible endpoint `https://api.xiaomimimo.com/v1`.

### Changed
- **GLM Default Model**: Switched from `glm-5.1` to the free `glm-4.7-flash` on [bigmodel.cn](https://bigmodel.cn/pricing).
- **Model Pricing Guide**: README includes a per-provider pricing comparison table and commit-message recommendations.

### Removed
- **Moonshot Provider**: Removed built-in Moonshot/Kimi support — Kimi models are significantly pricier than flash-tier options for commit messages. Former Moonshot users can switch to **Custom** with `https://api.moonshot.cn/v1` if needed.

## [1.9.2] - 2026-06-26
### Changed
- **Gemini Default Model**: Updated the default Gemini model from `gemini-3.5-flash` to the GA `gemini-3.1-flash-lite`.
- **Marketplace Badges**: Replaced the Gemini 3.5 Flash badge with Gemini 3.1 Flash Lite and added a DeepSeek V4 Flash badge.
- **Model Recommendation**: README now suggests lightweight, cost-effective models (e.g. Gemini 3.1 Flash Lite, DeepSeek V4 Flash) for commit-message generation.

## [1.9.1] - 2026-06-26
### Fixed
- **UI Language setting now visible & ordered**: `wtfCommit.uiLanguage` was stuck with `order: 0` alongside many other settings, burying it. All settings now have explicit `order` values grouped by purpose (Interface → Automation → Safety → AI → Diff Filtering) so the settings page reads top-to-bottom in the order you actually use them.
- **Setting descriptions clarified**: Auto Commit / Auto Push / Smart Stage / Confirm Before Commit / Confirm Before Push now lead with a bolded group label and spell out their dependencies, removing the previous ambiguity between the two confirm toggles.

### Added
- **Auto Push self-correction**: Turning on Auto Push while Auto Commit is off now triggers an inline notification offering a one-click "Enable Auto Commit" action, instead of silently no-oping until the next generation.

## [1.9.0] - 2026-06-26
### Added
- **UI Internationalization (中/英)**: New `wtfCommit.uiLanguage` setting (`en` / `zh`). All extension UI — buttons, prompts, notifications, warnings — now localizes independently of the commit-message language. Chinese users get a fully localized experience.
- **Error Response Sanitization**: Provider error bodies shown to the user are trimmed and redacted (strips echoed `sk-...` keys, `Bearer` tokens, `x-goog-api-key` values) to avoid leaking credentials back in error messages.

### Changed
- **Actionable Auto-Push-Without-Commit Warning**: When Auto Push is on but Auto Commit is off, the warning now offers an "Open Settings" action instead of a fleeting status-bar message.
- **Push Progress With Context**: The push progress notification and success message now include the remote/branch (e.g. `origin/main`) when available.
- **Multi-Repository Memory**: With multiple Git repos open, WTF Commit now remembers the last-used repository and reuses it (instead of showing the picker every time) until you switch.
- **Intent Preservation**: If generation fails, is cancelled, or returns an empty message, the text you had typed in the SCM input box is restored so you can retry without retyping your hint. A successful generation is never clobbered.

## [1.8.0] - 2026-06-25
### Changed
- **Internal Refactor & Test Coverage**: Extracted push-failure classification (`src/push-failure.ts`) and streaming/`maskApiKey` helpers (`src/ui.ts`) out of `extension.ts` so the core logic is unit-testable. Added `push-failure.test.ts` and `ui.test.ts`. The extension entry now loads cleanly with all imports resolved.

## [1.7.0] - 2026-06-25
### Changed
- **Smarter Retry Backoff**: Retries now use exponential backoff with equal jitter (instead of fixed linear delays), and respect the server's `Retry-After` header on 429/503 responses to avoid re-hitting rate limits.
- **Stricter Conventional-Commit Validation**: The validator now accepts the `revert:` type and checks the 72-character subject-line limit. When AI Repair is offered, it receives a specific reason (e.g. "first line is 90 characters") instead of a generic format message, and the post-repair warning lists exactly which issues remain.
- **Stronger Message Normalization**: Strips bold/italic/inline-code wrapping and blockquote prefixes that some models add around the whole message, plus interior code-fence lines.
- **Full Reasoning Trace**: All `reasoning_details` segments are now joined (previously only the first was kept), so DeepSeek/o-series thinking traces aren't truncated in the log.

## [1.6.0] - 2026-06-25
### Added
- **Streaming Preview in SCM Input Box**: The commit message now streams live into the Source Control input box as the AI generates it, so you can watch the draft form and cancel early if it goes off track. The progress notification is throttled to avoid flicker.
- **Non-Destructive Set API Key**: Setting an API key for a provider no longer forcibly switches your active provider. You're asked whether to switch, and the picker shows a masked key hint (e.g. `sk-1••••wxyz`) so you can tell keys apart.
- **"Don't Remind Me" for Mixed-Stage Warning**: The recurring "staged and unstaged changes detected" prompt now offers a Don't Remind Me option (persisted).
- **Friendlier First-Run Guidance**: The welcome prompt no longer permanently dismisses itself if you close it or click Set API Key — only an explicit "Don't Show Again" hides it for good, so a slip no longer buries the setup nudge forever.

## [1.5.0] - 2026-06-25
### Added
- **Status Bar Toggle**: New `wtfCommit.showStatusBarItem` setting to hide the status bar button.
- **Changelog Popup Toggle**: New `wtfCommit.changelogPopup` setting to disable the post-update changelog notification.
- **Truncation Warnings**: New `wtfCommit.warnOnTruncatedDiff` setting; the extension now warns when a large diff is summarized or when untracked files are omitted due to limits.
- **Auto-Push Safety Net**: New `wtfCommit.confirmAutoPush` setting that asks for an extra confirmation before pushing, so one-keystroke auto-push flows can't surprise you.
- **Custom Diff Ignore List**: New `wtfCommit.ignorePaths` setting to exclude additional files/directories/extensions (e.g. `generated`, `*.snap`, `.gen.ts`) from the AI context.
- **Configurable Diff Limits**: New `wtfCommit.maxDiffChars` and `wtfCommit.maxUntrackedFiles` settings to tune how much context is sent to the AI.
- **Show Output Command**: New `WTF Commit: Show Output` command to open the extension log channel for troubleshooting.

## [1.4.2] - 2026-06-24
### Changed
- **Package Privacy Guard**: Expanded VSIX exclusions for environment files, credentials, private keys, development metadata, and other non-runtime files.
- **Package Allowlist Audit**: Packaging now fails if any file outside the approved runtime and documentation allowlist would enter the VSIX.

## [1.4.1] - 2026-06-24
### Changed
- **Marketplace Badges**: Replaced the low-signal GitHub Stars badge with VS Code compatibility and Gemini 3.5 Flash support badges.
- **Release Workflow**: Added source commit and remote push steps so repository code stays aligned with each Open VSX release.

## [1.4.0] - 2026-06-24
### Changed
- **Native Gemini Integration**: Replaced the OpenAI-compatible Gemini endpoint with Google's native Interactions REST API, including native authentication, request/response mapping, SSE streaming, and `minimal` thinking for lower latency.
- **Gemini Default Update**: Updated the default Gemini model to `gemini-3.5-flash` and the base URL to `https://generativelanguage.googleapis.com/v1beta`.
- **Safer AI Context**: Sensitive credential files are excluded from model context, and common tokens, secret assignments, and private keys are redacted from diffs.
- **Consistent Auto Commits**: Smart Stage now stages before generation and verifies the staged snapshot immediately before committing, preventing later edits from entering an unrelated commit.
- **Provider Configuration Isolation**: Built-in providers no longer inherit the Custom provider's global endpoint or model settings, avoiding incompatible protocol combinations.
- **Bounded Retry Flow**: Requests only retry transient failures and now share one overall timeout instead of resetting the timeout for every attempt.
- **More Representative Large Diffs**: Large change sets allocate context across files instead of only sending the beginning of the combined diff.
- **Smaller Generation Budget**: Commit message output is capped at 512 tokens to reduce unnecessary latency and cost.

## [1.3.3] - 2026-06-04
### Changed
- **Safer Mixed Change Flow**: When staged and unstaged changes both exist, generation now confirms that only staged changes will be used before calling the model.
- **Clearer Auto Push Feedback**: If Auto Push is enabled without Auto Commit, the extension now explains the dependency instead of silently ignoring the push setting.
- **More Accurate Streaming Errors**: Streaming generation now reports cancellation and timeout cases with the correct error category instead of a generic network failure.
- **Repair Failure Recovery**: If AI Repair fails, the original generated message stays in the Source Control input box for manual editing.

## [1.3.2] - 2025-05-15
### Fixed
- **Package Cleanup**: Removed stale temporary files accidentally included in the v1.3.1 VSIX.

## [1.3.1] - 2025-05-15
### Changed
- **New Icon**: Replaced the dark-background icon with a clean sparkle icon on transparent background for better visibility across all VS Code themes.

## [1.3.0] - 2025-05-15
### Added
- **Status Bar Button**: A persistent `$(sparkle) WTF` button in the status bar for one-click commit message generation — no need to remember the shortcut.
- **First-Use Guidance**: New users are greeted with a welcome notification prompting them to set up an API key, instead of discovering the requirement only after triggering generation.

### Changed
- **Keybinding Always Available**: Removed the `editorTextFocus` restriction from `Cmd+Alt+G` / `Ctrl+Alt+G`. The shortcut now works from anywhere — including the Source Control panel.
- **Node Types Upgraded**: `@types/node` upgraded from `16.x` to `18.x`, matching the VS Code extension host runtime.
- **Stronger ESLint Rules**: Added `no-explicit-any`, `no-unused-vars`, `consistent-type-imports`, `prefer-const`, `no-console`, and `no-duplicate-imports` rules with type-aware linting.
- **Cleaner VSIX Package**: `.vscodeignore` now explicitly excludes `.env.example`, `.DS_Store`, `.git/`, and `assets/icon-drafts/`.

## [1.2.1] - 2025-05-15
### Changed
- **Temperature Default**: Changed default temperature from `0.7` to `1.0`, aligning with recommendations from Gemini, DeepSeek, and other modern model providers.
- **Removed MiniMax Provider**: MiniMax has been removed from the built-in provider list. Users who need MiniMax can still use the Custom provider with their own Base URL and model.
- **Automatic Retry**: Network errors and transient API failures (5xx, timeouts) now retry up to 2 times with exponential backoff, reducing false failures on flaky connections.
- **Modular Filter Layer**: Extracted path filtering and binary detection into a dedicated `filters.ts` module for better testability and reuse.
- **Improved Config Errors**: Missing Base URL or Model for Custom provider now shows actionable guidance pointing to the correct settings path.

### Added
- **Binary Detection Tests**: 5 new unit tests for the `isLikelyBinary` utility (total: 41 tests).

## [1.2.0] - 2025-05-13
### Added
- **Streaming Output**: LLM responses now stream in real-time via SSE, showing generation progress as it happens. Significantly reduces perceived latency, especially with reasoning models.
- **Configurable Temperature**: New `wtfCommit.temperature` setting (default `0.7`) gives users control over generation creativity. Previously hardcoded at `1.0`.
- **Unit Test Suite**: Added 36 unit tests covering commit message normalization, Conventional Commits validation, URL endpoint building, and diff path filtering. New `test:unit` script for fast local testing.

### Changed
- **Stricter TypeScript Checks**: Enabled `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `noUnusedParameters` for better code safety.
- **Codebase Cleanup**: Removed dead empty files (`src/llm.ts`, `src/llm/index.ts`) and stale build artifacts.

## [1.1.0] - 2026-05-13
### Changed
- **Gemini Model GA Update**: Updated default Gemini model from `gemini-3.1-flash-lite-preview` to `gemini-3.1-flash-lite` following the model's General Availability release.

## [1.0.9] - 2026-04-29
### Changed
- **Runtime Request Compatibility**: Replaced the global `fetch` call with a Node `http`/`https` request path and aligned Node types with the supported VS Code extension host range.
- **Smarter Staged Diff Handling**: When staged changes exist, generated messages now stay focused on staged content instead of mixing in unrelated untracked files.
- **Safer Untracked File Context**: Added binary detection and broader generated-file filtering before untracked file content is sent to the model.
- **Provider Type Safety**: Tightened provider typings so built-in provider names are checked as explicit string literals.
- **Smaller Marketplace Icon**: Resized the PNG icon from 1024x1024 to 256x256, reducing package size while keeping a crisp marketplace image.

## [1.0.8] - 2026-04-29
### Changed
- **Refined Marketplace Icon**: Replaced the extension logo with a simpler abstract commit-and-sparkle mark for clearer marketplace recognition.
- **Default Model Refresh**: Updated provider defaults to DeepSeek `deepseek-v4-flash`, MiniMax `MiniMax-M2.7`, Moonshot/Kimi `kimi-k2.6`, and GLM `glm-5.1`.

## [1.0.7] - 2026-04-12
### Fixed
- **Push Success Notification Restored**: Auto-push now shows a clear VS Code information notification again after a successful push, alongside the status bar success signal.

## [1.0.6] - 2026-04-12
### Changed
- **Notification Hierarchy Refresh**: Success and passive states now use status bar feedback with clearer codicon symbols, making commit creation, commit success, push progress, push success, cancellation, and empty-diff states easier to scan.
- **Cleaner Commit Confirmation**: Auto-commit confirmation now uses a modal title plus detail area for the generated message, making long commit messages easier to review before execution.
- **Faster Multi-Repo Picking**: Repository selection now shows the folder name first and the full path as supporting context, which improves scan speed in multi-root workspaces.

## [1.0.5] - 2026-04-12
### Fixed
- **Auto Push False Failures**: Auto-push no longer reports a hard failure when the underlying `git push` succeeds but VS Code's follow-up repository refresh throws an error.
- **Safer Push Recovery**: The `Undo Commit` action is now withheld for post-push refresh failures to avoid encouraging a local undo after the commit may already be on the remote.
- **Clearer Git Diagnostics**: Git operation errors now surface the underlying command and `stderr` output instead of the generic `Failed to execute git` message when available.

## [1.0.4] - 2026-03-25
### Changed
- **Package Cleanup**: Excluded the entire `scripts/` directory from both the repository package and the published VSIX, and moved Open VSX publishing to an inline release command.

## [1.0.3] - 2026-03-25
### Added
- **Zero-Config Intent Hint**: If you type a short hint in the Source Control input box before generation, WTF Commit now uses it as an intent cue so the resulting message stays focused on what you meant to commit.
- **AI Repair Action**: When a generated title does not look like a Conventional Commit, the extension now offers an `AI Repair` action to quickly rewrite the message without leaving the flow.

### Changed
- **Cleaner Diff Context**: Diff filtering now omits more non-code noise up front, including lockfiles, assets, common build outputs, and oversized file patches while still preserving useful file-level context for the model.

## [1.0.2] - 2026-03-06
### Changed
- **Settings Overhaul**: Simplified the extension configuration page by consolidating 16 separate AI provider Base URL/Model settings into a single `wtfCommit.providerOverrides` JSON configuration block, drastically reducing UI clutter.

## [1.0.1] - 2026-03-04
### Fixed
- **Engine Compatibility**: Cleaned up `activationEvents` warnings by explicitly targeting the VS Code `^1.75.0` engine.

## [1.0.0] - 2026-03-04
### Added
- **Interactive Commit Flow**: Introduce an 'Edit in Input Box' action during the auto-commit confirmation dialog, letting users seamlessly review and tweak AI-generated messages before committing.
- **Smart Diff Scaling**: Intelligently skips unhelpful `lock` files in diffs preventing token overrun on massive commits, and keeping the logic strictly focused on your source changes.
- **Extended Reasoner Timeout**: Deep-thinking models (e.g., DeepSeek Reasoner, MiniMax) automatically receive double the timeout allocation (up to 90s) to prevent generation failures.

### Changed
- **Architecture Overhaul**: Internal codebase rewritten and split into modular domains (`git`, `llm`, `diff`, `config`) ensuring better long-term reliability and maintainability.

## [0.2.8] - 2026-03-04
### Changed
- **Default Model Update**: Updated default model for Gemini to `gemini-3.1-flash-lite-preview`.

## [0.2.7] - 2026-03-04
### Added
- **Provider-specific Configuration**: Added independent `Base URL` and `Model` settings for each AI provider. Switching providers now correctly maintains their respective custom values without interference.

## [0.2.6] - 2026-02-19
### Added
- **UI Enhancement**: Improved the provider selection menu (`Set API Key`) to display API key setup status and current provider indicator.

## [0.2.5] - 2026-02-19
### Added
- **New AI Provider**: Added **MiniMax** with support for separate reasoning split (`MiniMax-M2.5`). Reasoning/Thinking process is logged to the `WTF Commit` output channel.

### Changed
- **Kimi Model Update**: Updated default model for Moonshot (Kimi) to `kimi-k2-turbo-preview` for enhanced performance.

## [0.2.4] - 2026-02-18
### Changed
- **API Optimization**: Increased default temperature to `1.0` and `max_tokens` to `1024` for better response quality and compatibility.

## [0.2.3] - 2026-02-18
### Changed
- **Default Models Update**: Updated default model for Moonshot to `kimi-k2.5` and GLM to `glm-5`.

## [0.2.2] - 2026-02-10
### Added
- **Cancelable Generation**: The commit-generation progress notification now supports cancellation.
- **Diagnostic Logging**: Added a dedicated `WTF Commit` output channel to help troubleshoot runtime/API issues.

### Changed
- **Command Registration**: Added `WTF Commit: Set API Key` to command contributions and activation events.
- **Untracked Diff Optimization**: Added limits for large untracked files and long file content when building pseudo-diff.

### Fixed
- **Request Reliability**: Added timeout handling and clearer error categories for authentication, rate limit, timeout, network, and invalid API responses.
- **Message Normalization**: Automatically strips accidental markdown fences and surrounding blank lines in generated commit messages.

## [0.2.1] - 2026-02-09
### Changed
- Updated OpenRouter default model to `openrouter/free` while keeping the OpenAI-compatible base URL as `https://openrouter.ai/api/v1`.

## [0.2.0] - 2026-02-04
### Changed
- **Default Model Update**: Updated the default OpenAI model to `gpt-5-nano`.

### Fixed
- **Improved Error Handling**: Fixed misleading error messages during Git operations. Now displays specific error messages for each stage:
  - `Failed to stage changes` for `git add` errors
  - `Failed to commit` for `git commit` errors
  - `Commit successful, but push failed` for `git push` errors

## [0.1.8] - 2026-01-18
### Changed
- **Package Optimization**: Excluded `UPDATEFLOW.md` and `test` files from the final extension package (VSIX) to reduce size and remove development-only files.

## [0.1.7] - 2026-01-18
### Fixed
- **Support for Untracked Files**: Fixed the "No diff content found" error when only new (untracked) files are present. The extension now intelligently reads content from these files and generates a pseudo-diff for AI processing.

## [0.1.6] - 2026-01-18
### Added
- **Optimization for Large Refactors**: Improved support for large commits (e.g., massive file moves or renames). If the diff exceeds 20,000 characters, the extension now provides a high-level summary of the changes and directory statistics to prevent API context length errors while maintaining generation accuracy.

## [0.1.5] - 2026-01-18
### Fixed
- **Thinking Tag Filter**: Automatically strips `<think>...</think>` tags from AI responses. This fixes the issue where models with Chain-of-Thought reasoning (e.g., DeepSeek-R1, MiniMax-M2.1) would include their reasoning process in the commit message. ([#1](https://github.com/codertesla/wtf-commit/issues/1))

## [0.1.4] - 2026-01-17
### Added
- New AI provider: **OpenRouter** with default model `mistralai/devstral-2512:free`.
  - Supports a wide range of models via the OpenRouter API.
  - Pre-configured with a high-performance free coding model.

## [0.1.3] - 2026-01-15
### Changed
- **Repository Cleanup**: Removed developer-specific configuration files (`.npmrc`, `.vscode/settings.json`) for better open source practices
- **Updated .gitignore**: Added rules to ignore `.npmrc` and `.vscode` personal settings while preserving shared configurations (`launch.json`, `tasks.json`, `extensions.json`)

## [0.1.2] - 2026-01-14
### Added
- **Provider Info in Notifications**: The active AI provider (e.g., [OpenAI], [GLM]) is now displayed in the generation progress and confirmation dialogs, making it clear which model is being used.

## [0.1.1] - 2026-01-14
### Fixed
- **Provider Auto-Selection**: Automatically switches the active provider when a new API Key is set via the command palette. This ensures users don't see "OpenAI key not set" errors after configuring a different provider (e.g., GLM).

## [0.1.0] - 2026-01-13
### Added
- New AI provider: **Gemini** (Google) with default model `gemini-2.5-flash-lite`.
  - Uses Google's OpenAI-compatible endpoint for seamless integration.

## [0.0.10] - 2026-01-12
### Added
- New configuration `wtfCommit.smartStage`:
  - Prevents accidental commits by allowing users to disable auto-staging when the staging area is empty.
  - Default is `true` (maintain existing behavior).
  - If set to `false`, an error will be shown if you try to commit with an empty staging area.

## [0.0.9] - 2026-01-12
### Added
- Enhanced Multi-language support:
  - New presets: 简体中文, 繁体中文, Japanese, Classical Chinese (文言文).
  - Custom Language support: Select "Custom" and enter any target language (e.g., "French", "Emoji only").
- Dynamic prompt injection: Removed hardcoded language logic for better flexibility.

## [0.0.8] - 2026-01-12
### Fixed
- Progress notification: The "Generating commit message..." notification now disappears immediately after generation, even if awaiting user confirmation for auto-commit.

## [0.0.7] - 2026-01-12
### Fixed
- API URL concatenation: Prevents duplicate `/chat/completions` path when Custom provider URL already includes it.

## [0.0.6] - 2026-01-12
### Added
- Multi-root workspace support: Automatically detects and uses the repository of the active file.
- Repository selection dialog when working with multiple Git repositories.

### Changed
- Moved changelog notification to Unreleased section for better tracking.

## [0.0.5] - 2026-01-12
### Added
- Multi-provider support (OpenAI, DeepSeek, Moonshot, GLM, Custom).
- Secure API key storage using `SecretStorage`.
- Enhanced configuration management with refined defaults.

## [0.0.4] - 2026-01-12
### Added
- Repository field in `package.json` for VSCE compliance.
- Chinese translation of README.

## [0.0.3] - 2026-01-12
### Added
- Auto-commit and Auto-push features.
- Keyboard shortcuts (`cmd+alt+g` / `ctrl+alt+g`).
- Confirmation dialog before auto-committing.

## [0.0.2] - 2026-01-12
### Added
- Language support (English and Chinese).
- Configurable AI prompt for more granular control.

## [0.0.1] - 2026-01-12
### Added
- Initial release of AI-powered Git commit message generator.
