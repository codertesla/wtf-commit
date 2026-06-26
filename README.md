English | [简体中文](README_zh.md)

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/updates/v1_75)
[![Gemini 3.5 Flash](https://img.shields.io/badge/Gemini-3.5%20Flash-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash)

Links: [GitHub](https://github.com/codertesla/wtf-commit) | [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) | [Website](https://codertesla.github.io/wtf-commit/)

WTF Commit is a minimalist VS Code extension that uses AI to generate concise and meaningful Git commit messages from your staged changes (or working tree changes).

## 🆕 Latest (v1.9.0)

- **UI in Chinese or English**: New `wtfCommit.uiLanguage` setting (`en` / `zh`) localizes every button, prompt, and notification — independent of the commit-message language.
- **Safer error messages**: Provider error bodies are trimmed and redacted so echoed keys/tokens don't leak back to you.
- **Actionable auto-push warning**: Auto Push without Auto Commit now offers an "Open Settings" button.
- **Push progress shows remote/branch**: Notifications now say e.g. `origin/main`.
- **Multi-repo memory**: Remembers your last-used repository across sessions.
- **Intent preserved on failure**: If generation fails or is cancelled, your typed hint is restored to the SCM input box.

## 🆕 v1.8.0

- **Refactor & tests**: Push-failure classification and the streaming/masking helpers were extracted from `extension.ts` into testable modules, with new unit tests covering them. No user-facing behavior change; the extension is now easier to maintain and verify.

## 🆕 v1.7.0

- **Smarter retries**: Exponential backoff with jitter replaces fixed delays, and the server's `Retry-After` header is honored on 429/503 — no more re-hammering a rate limit.
- **Stricter commit validation**: The `revert:` type is now recognized and the 72-character subject limit is enforced. AI Repair gets a specific reason and the post-repair warning names exactly what's still off.
- **Stronger normalization**: Strips bold/italic/inline-code/blockquote wrapping and interior code-fence lines that some models add.
- **Full reasoning trace**: All `reasoning_details` segments are joined in the log, not just the first.

## 🆕 v1.6.0

- **Live streaming preview**: The commit message streams into the Source Control input box as the AI writes it — watch the draft form and cancel early if it drifts. The progress notification is throttled to stop flicker.
- **Set API Key no longer hijacks your provider**: Setting a key for another provider now asks before switching, and shows a masked key hint so you can tell keys apart.
- **"Don't Remind Me" for the mixed-stage warning**: Stop the recurring staged/unstaged prompt from nagging you.
- **Friendlier first-run guidance**: Closing the welcome prompt no longer permanently hides it — only an explicit "Don't Show Again" does.

## 🆕 v1.5.0

- **More control, less noise**: Toggle the status bar button, disable the changelog popup, and get warned when a large diff is truncated before being sent to the AI.
- **Safer auto-push**: An optional extra confirmation before pushing protects one-keystroke auto-commit + auto-push flows.
- **Custom ignore list**: Exclude extra files/directories/extensions (e.g. `generated`, `*.snap`, `.gen.ts`) from AI context via `wtfCommit.ignorePaths`.
- **Tunable context limits**: New `wtfCommit.maxDiffChars` and `wtfCommit.maxUntrackedFiles` settings.
- **Show Output command**: Open the extension log channel for troubleshooting.

## 🚀 Features

- **Multi-lingual Support**: Preset support for English, Chinese, Japanese, Classical Chinese, and **Custom** strings.
- **Conventional Commits**: Automatically follows conventional commit standards (feat, fix, docs, etc.).
- **Smart Diffing**: Prioritizes staged changes, confirms mixed staged/unstaged states, falls back to working tree changes, and strips more low-value diff noise before generation.
- **Intent-Aware Generation**: Reuses any text already typed into the SCM input box as a zero-config generation hint.
- **Auto Commit & Push**: Full automation pipeline — generate, commit, and push in one keystroke.
- **Interactive Tuning**: Auto-commit flows support real-time message editing without blocking Git staging.
- **Lightweight Recovery**: Offers an inline `AI Repair` action when the generated title format needs a quick fix.
- **Reliable Request Flow**: Built-in timeout + automatic retry with categorized API error handling, with extended reasoning for DeepSeek and other thinking models.
- **Streaming Generation**: Real-time streaming preview in the progress notification while the commit message is generated.
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
| **UI Language** | Language for the extension's own UI (`en` / `zh`), independent of the commit-message language. |
| **Smart Stage** | With Auto Commit, stage current changes before generation so later edits cannot enter the commit (Default: `true`). |
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
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **Moonshot** | `kimi-k2.6` | `https://api.moonshot.cn/v1` |
| **GLM** | `glm-5.1` | `https://open.bigmodel.cn/api/paas/v4` |
| **Gemini** | `gemini-3.5-flash` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **Custom** | - | - |

> OpenRouter default now targets the free route model: `openrouter/free`.

> Gemini uses Google's native Interactions REST API (`/v1beta/interactions`), authenticates with the `x-goog-api-key` header, and uses the `minimal` thinking level to reduce latency for commit-message generation.

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
