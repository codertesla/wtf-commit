English | [简体中文](README_zh.md)

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/updates/v1_75)
[![DeepSeek V4 Flash](https://img.shields.io/badge/DeepSeek-V4%20Flash-4D6BFE?logo=deepseek&logoColor=white)](https://api-docs.deepseek.com/quick_start/pricing)
[![Gemini 3.1 Flash Lite](https://img.shields.io/badge/Gemini-3.1%20Flash%20Lite-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite)
[![GLM 4.7 FlashX](https://img.shields.io/badge/GLM-4.7%20FlashX-345FF2?logo=zhipu&logoColor=white)](https://bigmodel.cn/pricing)
[![MiMo V2.5](https://img.shields.io/badge/MiMo-V2.5-FF6900?logo=xiaomi&logoColor=white)](https://mimo.mi.com/docs/en-US/price/pay-as-you-go)

Links: [GitHub](https://github.com/codertesla/wtf-commit) | [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) | [Website](https://codertesla.github.io/wtf-commit/)

WTF Commit is a minimalist VS Code extension that uses AI to generate concise and meaningful Git commit messages from your staged changes (or working tree changes).

## 🆕 Latest (v1.10.4)

- **GLM / Z.AI default**: Provider default model is now `glm-4.7-flashx` (free `glm-4.7-flash` removed — heavily rate-limited).
- **Recommendations**: DeepSeek V4 Flash and Gemini 3.1 Flash Lite are the top picks for speed; README clarifies **Default Provider** (OpenAI) vs **provider default** vs **our recommendation**.

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

**How defaults work** (three separate concepts):

| Term | Meaning |
|------|---------|
| **Default Provider** | **OpenAI** — used on first install until you change **Provider** in settings. |
| **Provider default** | Each built-in provider has its own default **Model** and **Base URL** (table below). Applies only when that provider is **selected** and **Model** / **Base URL** are left empty. |
| **Our recommendation** | Editorial picks for commit messages (see [Choosing a model](#choosing-a-model-for-commit-messages)) — **not** the extension default provider. |

**Provider defaults** — when **Base URL** and **Model** are left empty:

| Provider | Default Model | Default Base URL |
|----------|---------------|-----------------|
| **OpenAI** | `gpt-5-nano` | `https://api.openai.com/v1` |
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **MiMo** | `mimo-v2.5` | `https://api.xiaomimimo.com/v1` |
| **GLM** | `glm-4.7-flashx` | `https://open.bigmodel.cn/api/paas/v4` |
| **Z.AI** | `glm-4.7-flashx` | `https://api.z.ai/api/paas/v4` |
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

The list below is **our recommendation** — change **Provider** in settings to use a different service (e.g. set **Provider** to **DeepSeek** and leave **Model** empty for `deepseek-v4-flash`).

**Pricing comparison** (USD per 1M tokens, cache-miss input; sources linked below):

| Provider | Model | Input | Output | ~Cost / generation† | Notes |
|----------|-------|------:|-------:|--------------------:|-------|
| **OpenRouter** | `openrouter/free` | $0 | $0 | ~$0 | Zero-cost trials; quality/latency vary |
| **OpenAI** | `gpt-5-nano` | $0.05 | $0.40 | ~$0.0003 | **Default Provider** default model |
| **Z.AI** | `glm-4.7-flashx` | $0.07 | $0.40 | ~$0.0004 | **Z.AI** provider default; often slower |
| **GLM** | `glm-4.7-flashx` | ¥0.5 (~$0.07) | ¥3 (~$0.42) | ~$0.0004 | **GLM** provider default; often slower |
| **DeepSeek** | `deepseek-v4-flash` | $0.14 | $0.28 | ~$0.0007 | **Recommended** — fast, cheap, great quality |
| **MiMo** | `mimo-v2.5` | $0.14 | $0.28 | ~$0.0007 | Same price tier as DeepSeek; OpenAI-compatible |
| **Gemini** | `gemini-3.1-flash-lite` | $0.25 | $1.50 | ~$0.0015 | **Recommended** — fast; generous [free tier](https://ai.google.dev/gemini-api/docs/pricing) |

† Rough estimate for **~5K input + 150 output tokens** (typical diff + commit message), no prompt cache. GLM CNY prices converted at ~¥7.2/$ for comparison. Actual cost depends on diff size and model verbosity.

> **GLM vs Z.AI**: Same model family, different platforms — **GLM** uses the China endpoint (`open.bigmodel.cn`); **Z.AI** uses the international endpoint (`api.z.ai`). API keys are not interchangeable. Each uses **`glm-4.7-flashx`** as its **provider default** (paid). The free `glm-4.7-flash` tier is heavily rate-limited and not recommended.

**Our recommendation** (speed + value) — set **Provider** in settings to match your pick:

1. **DeepSeek V4 Flash** — set **Provider** to **DeepSeek**; leave **Model** empty → `deepseek-v4-flash`. **Best overall**: fast, cheap, high quality. Thinking mode is disabled automatically.
2. **Gemini 3.1 Flash Lite** — set **Provider** to **Gemini**; leave **Model** empty → `gemini-3.1-flash-lite`. **Also excellent**: fast with a generous free tier; uses `thinking_level: minimal`.
3. **MiMo V2.5** — set **Provider** to **MiMo**; leave **Model** empty → `mimo-v2.5`. Same USD price band as DeepSeek.
4. **GLM / Z.AI** — set **Provider** to **GLM** (China) or **Z.AI** (international); leave **Model** empty → `glm-4.7-flashx`. Works reliably but is often **slower** than DeepSeek or Gemini Flash Lite. Requires a paid balance.
5. **`openrouter/free`** — set **Provider** to **OpenRouter**; fine for experimenting.

Official pricing pages: [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) · [MiMo](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go) · [Gemini](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://developers.openai.com/api/docs/pricing) · [Zhipu GLM](https://bigmodel.cn/pricing) · [Z.AI](https://docs.z.ai/guides/overview/pricing) · [OpenRouter](https://openrouter.ai/models)

> OpenRouter **provider default** is `openrouter/free`.

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
