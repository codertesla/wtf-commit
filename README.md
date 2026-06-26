English | [简体中文](README_zh.md)

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/updates/v1_75)
[![GLM 4.7 Flash](https://img.shields.io/badge/GLM-4.7%20Flash%20Free-345FF2?logo=zhipu&logoColor=white)](https://bigmodel.cn/pricing)
[![Z.AI GLM 4.7 Flash](https://img.shields.io/badge/Z.AI-GLM%204.7%20Flash%20Free-1A1A1A)](https://docs.z.ai/guides/overview/pricing)
[![DeepSeek V4 Flash](https://img.shields.io/badge/DeepSeek-V4%20Flash-4D6BFE?logo=deepseek&logoColor=white)](https://api-docs.deepseek.com/quick_start/pricing)
[![MiMo V2.5](https://img.shields.io/badge/MiMo-V2.5-FF6900?logo=xiaomi&logoColor=white)](https://mimo.mi.com/docs/en-US/price/pay-as-you-go)
[![Gemini 3.1 Flash Lite](https://img.shields.io/badge/Gemini-3.1%20Flash%20Lite-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite)

Links: [GitHub](https://github.com/codertesla/wtf-commit) | [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) | [Website](https://codertesla.github.io/wtf-commit/)

WTF Commit is a minimalist VS Code extension that uses AI to generate concise and meaningful Git commit messages from your staged changes (or working tree changes).

## 🆕 Latest (v1.10.3)

- **GLM / DeepSeek fix**: Automatically disables thinking mode for GLM, Z.AI, and DeepSeek — fixes slow responses and “No content in streaming response” errors with `glm-4.7-flash` and similar models.
- **Gemini**: Uses `thinking_level: minimal` (lowest available) for faster commit-message generation.

> See [CHANGELOG](CHANGELOG.md) for earlier releases.

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
| **UI Language** | Language for the extension's own UI (`en` / `zh`), independent of the commit-message language. |
| **Show Status Bar Item** | Show the WTF Commit button in the status bar. |
| **Changelog Popup** | Show a notification after the extension is updated. |
| **Auto Commit** | Commit automatically after generating. Off = message goes to the Source Control box for manual review (recommended for most users). |
| **Auto Push** | Push automatically after the auto-commit. ⚠️ No effect unless Auto Commit is on. |
| **Smart Stage** | With Auto Commit, stage current changes before generation so later edits cannot sneak in. |
| **Confirm Before Commit** | Confirm before the auto-commit (only when Auto Commit is on). |
| **Confirm Before Push** | Extra confirmation before pushing (only when Auto Commit + Auto Push are on). |
| **Warn On Truncated Diff** | Warn when the diff is large and only a partial diff is sent to the AI. |
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
| **MiMo** | `mimo-v2.5` | `https://api.xiaomimimo.com/v1` |
| **GLM** | `glm-4.7-flash` | `https://open.bigmodel.cn/api/paas/v4` |
| **Z.AI** | `glm-4.7-flash` | `https://api.z.ai/api/paas/v4` |
| **Gemini** | `gemini-3.1-flash-lite` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **Custom** | - | - |

### Get API Keys

| Provider | Get API Key |
|----------|-------------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |
| **MiMo** | [platform.xiaomimimo.com/console/api-keys](https://platform.xiaomimimo.com/console/api-keys) |
| **GLM** (China) | [open.bigmodel.cn/apikey/platform](https://open.bigmodel.cn/apikey/platform) |
| **Z.AI** (International) | [z.ai/manage-apikey/apikey-list](https://z.ai/manage-apikey/apikey-list) |
| **Gemini** | [aistudio.google.com/api-keys](https://aistudio.google.com/api-keys) |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) |

> **GLM** and **Z.AI** keys are not interchangeable — create a key on the platform that matches your provider.

### Choosing a model for commit messages

Generating a commit message is a lightweight task — you don't need a frontier model. Pick based on **cost**, **latency**, and whether you already have an API key.

**Pricing comparison** (USD per 1M tokens, cache-miss input; sources linked below):

| Provider | Model | Input | Output | ~Cost / generation† | Best for |
|----------|-------|------:|-------:|--------------------:|----------|
| **OpenRouter** | `openrouter/free` | $0 | $0 | ~$0 | Zero-cost trials; quality/latency vary |
| **GLM** | `glm-4.7-flash` | $0 | $0 | ~$0 | **China** — [free](https://bigmodel.cn/pricing) on Zhipu BigModel |
| **Z.AI** | `glm-4.7-flash` | $0 | $0 | ~$0 | **International** — [free](https://docs.z.ai/guides/overview/pricing) on Z.AI |
| **OpenAI** | `gpt-5-nano` | $0.05 | $0.40 | ~$0.0003 | Lowest paid input price; small diffs |
| **Z.AI** | `glm-4.7-flashx` | $0.07 | $0.40 | ~$0.0004 | Faster Z.AI tier |
| **GLM** | `glm-4.7-flashx` | ¥0.5 (~$0.07) | ¥3 (~$0.42) | ~$0.0004 | Faster Zhipu tier (~30–40 t/s) |
| **DeepSeek** | `deepseek-v4-flash` | $0.14 | $0.28 | ~$0.0007 | **Top paid pick** — fast, cheap, great quality |
| **MiMo** | `mimo-v2.5` | $0.14 | $0.28 | ~$0.0007 | Same price tier as DeepSeek; OpenAI-compatible |
| **Gemini** | `gemini-3.1-flash-lite` | $0.25 | $1.50 | ~$0.0015 | Generous [free tier](https://ai.google.dev/gemini-api/docs/pricing) |

† Rough estimate for **~5K input + 150 output tokens** (typical diff + commit message), no prompt cache. GLM CNY prices converted at ~¥7.2/$ for comparison. Actual cost depends on diff size and model verbosity.

> **GLM vs Z.AI**: Same model family, different platforms — **GLM** uses the China endpoint (`open.bigmodel.cn`); **Z.AI** uses the international endpoint (`api.z.ai`). API keys are not interchangeable.

**Our recommendation (speed + value):**

1. **GLM-4.7-Flash** (`glm-4.7-flash`) — **free**. Use **GLM** if you have a [Zhipu BigModel](https://bigmodel.cn/pricing) key (China), or **Z.AI** if you have a [Z.AI](https://docs.z.ai/guides/overview/pricing) key (international). Need faster decode? Use **`glm-4.7-flashx`** on the same platform.
2. **DeepSeek V4 Flash** (`deepseek-v4-flash`) — best paid balance globally. WTF Commit automatically disables thinking mode for lower latency and cost.
3. **MiMo V2.5** (`mimo-v2.5`) — same USD price band as DeepSeek; popular on OpenRouter.
4. **Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite`) — slightly pricier on paper, but the free tier is generous for light use.
5. **`openrouter/free`** — fine for experimenting; switch to a paid flash model for production.

Official pricing pages: [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) · [MiMo](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go) · [Gemini](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://developers.openai.com/api/docs/pricing) · [Zhipu GLM](https://bigmodel.cn/pricing) · [Z.AI](https://docs.z.ai/guides/overview/pricing) · [OpenRouter](https://openrouter.ai/models)

> OpenRouter default targets the free route model: `openrouter/free`.

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
