# Changelog

All notable changes to the "wtf-commit" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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