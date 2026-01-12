English | [简体中文](README_zh.md)

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![GitHub Stars](https://img.shields.io/github/stars/codertesla/wtf-commit?style=social)](https://github.com/codertesla/wtf-commit)

WTF Commit is a minimalist VS Code extension that uses AI to generate concise and meaningful Git commit messages from your staged changes (or working tree changes).

## 📥 Installation

[**Install via Open VSX Registry**](https://open-vsx.org/extension/codertesla/wtf-commit)


## 🚀 Features

- **Multi-Provider Support**: Compatible with OpenAI, DeepSeek, Moonshot (Kimi), Zhipu GLM, and any OpenAI-compatible API.
- **Bi-lingual**: Supports generating commit messages in both **English** and **中文**.
- **Conventional Commits**: Automatically follows conventional commit standards (feat, fix, docs, etc.).
- **Smart Diffing**: Prioritizes staged changes and falls back to working tree changes.
- **Multi-Root Workspace**: Automatically detects the correct repository for your active file in multi-root workspaces.
- **Auto Commit & Push**: Full automation pipeline — generate, commit, and push in one keystroke.
- **Keyboard Shortcut**: Default binding `Cmd+Alt+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux).
- **Customizable**: Fully adjustable system prompt and Base URL for custom LLM endpoints.

## 🛠️ Configuration

To start using WTF Commit, follow these steps:

### 1. Set API Key 🔑 (Secure)
You **do not** put your API Key in `settings.json` anymore. Instead, we use VS Code's secure storage.

1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
2. Run command: **`WTF Commit: Set API Key`**.
3. Select your provider (e.g., `DeepSeek`, `OpenAI`).
4. Enter your API Key.

### 2. Configure Settings (Optional)
Most settings have sensible defaults. You only need to change them if you want to customize behavior.

1. Open **Settings** (`Cmd+,`).
2. Search for `WTF Commit`.

| Setting | Description |
|---------|-------------|
| **Provider** | Select your AI provider (Default: `OpenAI`). Selecting a provider automatically uses its default Base URL and Model. |
| **Base URL** | **Optional**. Leave empty to use the provider's default. For Custom provider, you can provide a full endpoint URL (e.g. `https://example.com/v1/chat/completions`). |
| **Model** | **Optional**. Leave empty to use the provider's default. Set this to override the model name. |
| **Auto Commit** | Automatically commit after generating the message. |
| **Auto Push** | Automatically push after commit (requires Auto Commit). |
| **Confirm Before Commit** | Show confirmation dialog before auto-committing. |
| **Prompt** | The system prompt used by AI. |
| **Language** | Choose between `English` or `中文`. |

## 🕹️ How to Use

### Method 1: Keyboard Shortcut ⚡ (Recommended)
Press `Cmd+Alt+G` (Mac) or `Ctrl+Alt+G` (Windows/Linux) to generate a commit message instantly.

### Method 2: Source Control Button
In the **Source Control** view (the Git side-bar), look for the ✨ (sparkle) icon in the title bar. Click it to generate your message.

### Method 3: Command Palette
1. Open the Command Palette (**Cmd+Shift+P** or **Ctrl+Shift+P**).
2. Type `WTF Commit: Generate` and press Enter.

The generated message will be automatically filled into the Source Control input box.

## 💡 Pro Tips

**Want to trigger commits even faster?** You can bind this command to a chord keybinding (double-press):

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`)
2. Search for `WTF Commit: Generate`
3. Double-click and press `Cmd+G` twice (Chord)

## 📄 License
MIT License.
