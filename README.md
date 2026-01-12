# WTF Commit ✨

WTF Commit is a minimalist VS Code extension that uses AI to generate concise and meaningful Git commit messages from your staged changes (or working tree changes).

![Icon](icon.png)

## 🚀 Features

- **Multi-Provider Support**: Compatible with OpenAI, DeepSeek, Moonshot (Kimi), Zhipu GLM, and any OpenAI-compatible API.
- **Bi-lingual**: Supports generating commit messages in both **English** and **中文**.
- **Conventional Commits**: Automatically follows conventional commit standards (feat, fix, docs, etc.).
- **Smart Diffing**: Prioritizes staged changes and falls back to working tree changes.
- **Customizable**: Fully adjustable system prompt and Base URL for custom LLM endpoints.

## 🛠️ Configuration

To start using WTF Commit, you need to configure your AI provider and API Key.

1. Open **Settings** (Cmd+, or Ctrl+,).
2. Search for `WTF Commit`.
3. Configure the following fields:

| Setting | Description |
|---------|-------------|
| **Prompt** | The system prompt used by AI. |
| **Language** | Choose between `English` or `中文`. |
| **Provider** | Select your AI provider (OpenAI, DeepSeek, Moonshot, GLM, or Custom). |
| **Base URL** | The API endpoint (auto-filled for known providers). |
| **Model** | The model name (e.g., `gpt-4o-mini`, `deepseek-chat`). |
| **Api Key** | Your secret API Key for the selected provider. |

## 🕹️ How to Use

### Method 1: Source Control Button (Recommended)
In the **Source Control** view (the Git side-bar), look for the ✨ (sparkle) icon in the title bar. Click it to generate your message.

### Method 2: Command Palette
1. Open the Command Palette (**Cmd+Shift+P** or **Ctrl+Shift+P**).
2. Type `WTF Commit: Generate` and press Enter.

The generated message will be automatically filled into the Source Control input box.

## 📄 License
MIT License.
