English | [简体中文](README_zh.md)

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![GitHub Stars](https://img.shields.io/github/stars/codertesla/wtf-commit?style=social)](https://github.com/codertesla/wtf-commit)

Links: [GitHub](https://github.com/codertesla/wtf-commit) | [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) | [Website](https://codertesla.github.io/wtf-commit/)

WTF Commit is a minimalist VS Code extension that uses AI to generate concise and meaningful Git commit messages from your staged changes (or working tree changes).

## 🆕 Latest (v0.2.2)

- Cancellable generation progress with clearer timeout/network/auth error feedback.
- Dedicated `WTF Commit` output channel for diagnostics.
- Better handling for large untracked files in pseudo-diff generation.

## 🚀 Features

- **Multi-lingual Support**: Preset support for English, Chinese, Japanese, Classical Chinese, and **Custom** strings.
- **Conventional Commits**: Automatically follows conventional commit standards (feat, fix, docs, etc.).
- **Smart Diffing**: Prioritizes staged changes and falls back to working tree changes.
- **Auto Commit & Push**: Full automation pipeline — generate, commit, and push in one keystroke.
- **Large Refactor Support**: Automatically handles massive file moves or renames by providing smart diff summaries, preventing API context length issues.
- **Reliable Request Flow**: Built-in timeout + categorized API error handling for better resilience.
- **Keyboard Shortcut**: Default binding `Cmd+Alt+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux).
- **Customizable**: Fully adjustable system prompt and Base URL for custom LLM endpoints.

---

## ⏱️ Quick Start Tutorial

Get started with AI commits in 3 simple steps:

1. **Install**: Search for `WTF Commit` in the Open VSX Extensions marketplace and install.
2. **Set API Key**: Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows), type **`WTF Commit: Set API Key`**, select your provider, and paste your key.
3. **Generate**: Press **`Cmd+Alt+G`** (Mac) or **`Ctrl+Alt+G`** (Windows). The extension will automatically generate a message based on your code diff.

---

## 🛠️ Advanced Tutorial

### 1. Plugin Settings
Open VS Code **Settings** (`Cmd+,`) and search for `WTF Commit` to customize the behavior:

| Setting | Description |
|---------|-------------|
| **Auto Commit** | Automatically commit after generating the message. |
| **Auto Push** | Automatically push after commit (requires Auto Commit). |
| **Confirm Before Commit** | Show a confirmation dialog before auto-committing. |
| **Smart Stage** | Automatically stage all changes if nothing is staged (Default: `true`). |
| **Prompt** | Customize the AI's persona and generation rules. |

### 2. Custom Model & Endpoints
You can use any OpenAI-compatible model (like local models via Ollama) by changing the **Provider** or **Model/Base URL**:

1. In Settings, set **Provider** to `Custom`.
2. Enter the **Base URL** (e.g., `http://localhost:11434/v1`).
3. Enter the **Model** name (e.g., `llama3`).

### 3. Custom Commit Language
If you want the AI to use a specific language (e.g., French, Cantonese, or Emoji-only):

1. Set **Language** to `Custom`.
2. Enter your target language in **Custom Language** (e.g., `Emoji only`).

---

## ℹ️ Supported Providers & Models

If **Base URL** and **Model** are left empty, the extension uses these defaults:

| Provider | Default Model | Default Base URL |
|----------|---------------|-----------------|
| **OpenAI** | `gpt-5-nano` | `https://api.openai.com/v1` |
| **DeepSeek** | `deepseek-chat` | `https://api.deepseek.com` |
| **Moonshot** | `kimi-k2.5` | `https://api.moonshot.cn/v1` |
| **GLM** | `glm-5` | `https://open.bigmodel.cn/api/paas/v4` |
| **Gemini** | `gemini-2.5-flash-lite` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **Custom** | - | - |

> OpenRouter default now targets the free route model: `openrouter/free`.

> [!IMPORTANT]
> **Claude Support**: Native Claude format is not supported yet. Please use a proxy service that provides an OpenAI-compatible endpoint.

## 🕹️ Other Ways to Trigger

- **Source Control Icon**: Click the ✨ icon at the top of the Git panel.
- **Command Palette**: Run `WTF Commit: Generate`.
- **Command Palette**: Run `WTF Commit: Set API Key` to configure or rotate your API key.
- **Chorded Keybinding**: You can bind a double-press like `Cmd+G` `Cmd+G`. See `💡 Pro Tips`.

## 💡 Pro Tips

**How to set a chorded keybinding?**
1. Open Keyboard Shortcuts (`Cmd+K Cmd+S`).
2. Search for `WTF Commit: Generate`.
3. Double-click and press `Cmd+G` twice.

## 📄 License
MIT License.
