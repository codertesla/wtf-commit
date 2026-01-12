# WTF Commit ✨

WTF Commit is a minimalist VS Code extension that uses AI to generate concise and meaningful Git commit messages from your staged changes (or working tree changes).


## 🚀 Features

- **Multi-Provider Support**: Compatible with OpenAI, DeepSeek, Moonshot (Kimi), Zhipu GLM, and any OpenAI-compatible API.
- **Bi-lingual**: Supports generating commit messages in both **English** and **中文**.
- **Conventional Commits**: Automatically follows conventional commit standards (feat, fix, docs, etc.).
- **Smart Diffing**: Prioritizes staged changes and falls back to working tree changes.
- **Auto Commit & Push**: Full automation pipeline — generate, commit, and push in one keystroke.
- **Keyboard Shortcut**: Default binding `Cmd+Alt+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux).
- **Customizable**: Fully adjustable system prompt and Base URL for custom LLM endpoints.

## 🛠️ Configuration

To start using WTF Commit, you need to configure your AI provider and API Key.

1. Open **Settings** (Cmd+, or Ctrl+,).
2. Search for `WTF Commit`.
3. Configure the following fields:

| Setting | Description |
|---------|-------------|
| **Auto Commit** | Automatically commit after generating the message. |
| **Auto Push** | Automatically push after commit (requires Auto Commit). |
| **Confirm Before Commit** | Show confirmation dialog before auto-committing. |
| **Prompt** | The system prompt used by AI. |
| **Language** | Choose between `English` or `中文`. |
| **Provider** | Select your AI provider (OpenAI, DeepSeek, Moonshot, GLM, or Custom). |
| **Base URL** | The API endpoint (auto-filled for known providers). |
| **Model** | The model name (e.g., `gpt-4o-mini`, `deepseek-chat`). |
| **Api Key** | Your secret API Key for the selected provider. |

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
