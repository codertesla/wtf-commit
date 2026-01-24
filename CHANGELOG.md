# Changelog

All notable changes to the "wtf-commit" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2026-01-24
### Changed
- **Default Model Update**: Updated the default OpenAI model to `gpt-5-nano`.

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

## [Unreleased]

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