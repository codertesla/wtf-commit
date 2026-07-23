English | [简体中文](README_zh.md)

# WTF Commit ✨

[![Visual Studio Marketplace Version](https://badgen.net/vs-marketplace/v/CoderTesla.wtf-commit)](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)
[![Visual Studio Marketplace Installs](https://badgen.net/vs-marketplace/i/CoderTesla.wtf-commit)](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)

Links: [GitHub](https://github.com/codertesla/wtf-commit) · [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit) · [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) · [Website](https://codertesla.github.io/wtf-commit/)

**One shortcut to generate your commit message.** WTF Commit reads your git diff and fills the Source Control box with a clear Conventional Commit — with **your own API key**, not a locked-in vendor.

Works in **VS Code** (Microsoft Marketplace — search, install, **auto-update**), **Cursor**, **VSCodium**, and other Open VSX–compatible editors. **Actively maintained** (MIT, free).

| | |
|:--|:--|
| **Default provider** | **DeepSeek** (`deepseek-v4-flash`) — fast and cheap for commit messages |
| **Setup once** | Paste an API key for your provider (~1 minute) |
| **Default flow** | Generate → **auto commit** (no extra confirm). **Auto Push stays off** until you enable it |
| **Power users** | Turn on Auto Push (+ optionally turn off Confirm Before Push) for generate → commit → push in one shortcut |

Onboarding is intentionally **two phases**. You only configure AI once; after that it should feel like a muscle-memory shortcut.

### Install

| Editor | How to install | Updates |
|--------|----------------|---------|
| **VS Code** | Extensions → search **`WTF Commit`** → Install ([Marketplace page](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)) | **Auto-update** from Microsoft Marketplace |
| **Cursor / VSCodium** | Extensions → search **`WTF Commit`** → Install ([Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit)) | Auto-update from Open VSX |

**VSIX (optional / offline):** download from [GitHub Releases](https://github.com/codertesla/wtf-commit/releases) or the marketplaces above, then Extensions → **⋯** → **Install from VSIX…**, or drag the `.vsix` onto the Installed list. Manual VSIX installs do **not** auto-update — prefer the marketplace install when you can.

## ① Configure AI (once)

You need a provider and a key. Everything else can stay on defaults.

1. **Install** — search **`WTF Commit`** in your editor’s Extensions view (VS Code or Cursor).
2. **Set API Key** — Command Palette → **`WTF Commit: Set API Key`**.
3. **Choose a provider** in the picker — the extension default is **DeepSeek** (also great: **Gemini**). Leave **Model** empty for the built-in default.
4. **Paste the key**. If you picked someone other than DeepSeek, choose **Switch Provider** when prompted so the active provider matches the key.

Need a key? [DeepSeek](https://platform.deepseek.com/api_keys) · [Gemini](https://aistudio.google.com/api-keys) · more in [Supported providers](#ℹ️-supported-providers--models).

> You can also set **Provider** under Settings → WTF Commit, then run **Set API Key** for that provider. Same result.

## ② Daily use (every commit)

1. Make your code changes (stage when you can; with Auto Commit on, unstaged work is staged for you).
2. Press the generate shortcut — the message streams in, then **commits by default** (no extra “confirm commit” dialog).
3. Push yourself when ready — **Auto Push is off by default** so new users never surprise-push.

**Default shortcut:** `Cmd+Alt+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux).

**Make it yours** — the binding is fully customizable. A popular Cursor-style habit is a **double press** of `Cmd+G` / `Ctrl+G` (chord):

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S` / `Ctrl+K Ctrl+S`).
2. Search **`WTF Commit: Generate`**.
3. Double-click the keybinding → press **`Cmd+G` twice** (or `Ctrl+G` twice on Windows/Linux) → Enter.

**One-keystroke power flow (optional):** Settings → enable **Auto Push**. Leave **Confirm Before Push** on until you trust it; turn that confirm off only when you want generate → commit → push with zero dialogs.

Other triggers: ✨ on the Source Control title bar, or Command Palette → **`WTF Commit: Generate`**.

> Prefer review-only? Turn **Auto Commit** off — the message stays in Source Control for you to edit and commit manually.

## 🆕 Latest (v1.16.1)

- **UI follows VS Code**: Extension UI language tracks `vscode.env.language` (`zh*` → 中文, otherwise English); `wtfCommit.uiLanguage` removed.
- **Prompt off Settings UI**: Override `wtfCommit.prompt` in `settings.json` only when you need a custom system prompt.

> See [CHANGELOG](CHANGELOG.md) for earlier releases.

## 🚀 Features

- **Conventional Commits** — `feat` / `fix` / `docs` / … with optional local format fix + **AI Repair**.
- **Smart diffing** — Prefers staged changes; confirms mixed or working-tree-only cases so the message matches what you intend to commit.
- **Intent-aware** — Text already in the SCM input is used as a generation hint (no extra prompt UI).
- **Streaming preview** — Watch the message appear live while the model runs.
- **Auto Commit & Push** — Optional one-keystroke pipeline with confirmations.
- **Multi-language messages** — English, 简体/繁体中文, Japanese, Classical Chinese, or **Custom**.
- **Bring your own endpoint** — Built-in providers plus **Custom** (Ollama, proxies, etc.).
- **Keyboard shortcut** — Default `Cmd+Alt+G` / `Ctrl+Alt+G`; rebind freely (e.g. double `Cmd+G`).

---

## 🛠️ Advanced Tutorial

### 1. Plugin Settings
Open VS Code **Settings** (`Cmd+,`) and search for `WTF Commit`. Settings are split into **WTF Commit** (basics) and **WTF Commit › Advanced**.

**Basics** — what most people need:

| Setting | Description |
|---------|-------------|
| **Commit Message Language** | Language for generated commit messages. |
| **Custom Commit Message Language** | Used only when Commit Message Language is `Custom`. |
| **Provider** | AI backend (default DeepSeek). |
| **Auto Commit** | **Default on** — commit after generate. Off = message only in Source Control. |
| **Auto Push** | **Default off** — enable for push after commit. Requires Auto Commit. |
| **Confirm Before Push** | **Default on** — ask before auto-push. Power users can disable for a full hands-off shortcut. |

**Advanced** — Custom Base URL/Model, Provider Overrides, ignore paths, status bar toggle.

> Extension UI language follows VS Code (`vscode.env.language`): `zh*` → 中文, otherwise English. System prompt can be overridden in `settings.json` via `wtfCommit.prompt` (not shown in the Settings UI).

### 2. Custom Model & Endpoints
You can use any OpenAI-compatible model (like local models via Ollama):

1. In Settings, set **Provider** to `Custom`.
2. Under **WTF Commit › Advanced**, enter the **Base URL** (e.g., `http://localhost:11434/v1`).
3. Enter the **Model** name (e.g., `llama3`).

To override a built-in provider's endpoint/model, use **Provider Overrides** (not the global Base URL / Model fields).

### 3. Custom Commit Language
If you want the AI to use a specific language (e.g., French, Cantonese, or Emoji-only):

1. Set **Commit Message Language** to `Custom`.
2. Enter your target language in **Custom Commit Message Language** (e.g., `Emoji only`).

---

## ℹ️ Supported Providers & Models

**How defaults work** (three separate concepts):

| Term | Meaning |
|------|---------|
| **Default Provider** | **DeepSeek** — used on first install until you change **Provider** in settings. |
| **Provider default** | Each built-in provider has its own default **Model** and **Base URL** (table below). Applies when that provider is **selected** and no **Provider Overrides** (or Custom Base URL/Model) are set. |
| **Our recommendation** | Editorial picks for commit messages (see [Choosing a model](#choosing-a-model-for-commit-messages)) — **not** the extension default provider. |

**Provider defaults** — when **Base URL** and **Model** are left empty:

<!-- provider-manifest:start -->
| Provider | Default Model | Default Base URL |
|----------|---------------|-----------------|
| **OpenAI** | `gpt-5-nano` | `https://api.openai.com/v1` |
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **MiMo** | `mimo-v2.5` | `https://api.xiaomimimo.com/v1` |
| **GLM** | `glm-4.7-flashx` | `https://open.bigmodel.cn/api/paas/v4` |
| **Z.AI** | `glm-4.7-flashx` | `https://api.z.ai/api/paas/v4` |
| **Gemini** | `gemini-3.5-flash-lite` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **NVIDIA NIM** | `nvidia/nemotron-3-super-120b-a12b` | `https://integrate.api.nvidia.com/v1` |
| **Custom** | - | - |
<!-- provider-manifest:end -->

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
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com/) |

> **GLM** and **Z.AI** keys are not interchangeable — create a key on the platform that matches your provider.

### Choosing a model for commit messages

Generating a commit message is a lightweight task — you don't need a frontier model. Pick based on **cost**, **latency**, and whether you already have an API key.

The list below is **our recommendation** — change **Provider** in settings to use a different service (e.g. set **Provider** to **DeepSeek** and leave **Model** empty for `deepseek-v4-flash`).

**Pricing comparison** (USD per 1M tokens, cache-miss input; sources linked below):

| Provider | Model | Input | Output | ~Cost / generation† | Notes |
|----------|-------|------:|-------:|--------------------:|-------|
| **OpenRouter** | `openrouter/free` | $0 | $0 | ~$0 | Zero-cost trials; quality/latency vary |
| **OpenAI** | `gpt-5-nano` | $0.05 | $0.40 | ~$0.0003 | OpenAI provider default |
| **Z.AI** | `glm-4.7-flashx` | $0.07 | $0.40 | ~$0.0004 | **Z.AI** provider default; often slower |
| **GLM** | `glm-4.7-flashx` | ¥0.5 (~$0.07) | ¥3 (~$0.42) | ~$0.0004 | **GLM** provider default; often slower |
| **DeepSeek** | `deepseek-v4-flash` | $0.14 | $0.28 | ~$0.0007 | **Default Provider** — fast, cheap, great quality |
| **MiMo** | `mimo-v2.5` | $0.14 | $0.28 | ~$0.0007 | Same price tier as DeepSeek; OpenAI-compatible |
| **Gemini** | `gemini-3.5-flash-lite` | $0.30 | $2.50 | ~$0.0019 | **Recommended** — fast; generous [free tier](https://ai.google.dev/gemini-api/docs/pricing) |
| **NVIDIA NIM** | `nvidia/nemotron-3-super-120b-a12b` | $0 | $0 | ~$0 | Free development endpoint; rate limits and availability vary |

† Rough estimate for **~5K input + 150 output tokens** (typical diff + commit message), no prompt cache. GLM CNY prices converted at ~¥7.2/$ for comparison. Actual cost depends on diff size and model verbosity.

> **GLM vs Z.AI**: Same model family, different platforms — **GLM** uses the China endpoint (`open.bigmodel.cn`); **Z.AI** uses the international endpoint (`api.z.ai`). API keys are not interchangeable. Each uses **`glm-4.7-flashx`** as its **provider default** (paid). The free `glm-4.7-flash` tier is heavily rate-limited and not recommended.

**Our recommendation** (speed + value) — set **Provider** in settings to match your pick:

1. **DeepSeek V4 Flash** — **Default Provider**; leave **Model** empty → `deepseek-v4-flash`. **Best overall**: fast, cheap, high quality. Thinking mode is disabled automatically.
2. **Gemini 3.5 Flash Lite** — set **Provider** to **Gemini**; leave **Model** empty → `gemini-3.5-flash-lite`. **Also excellent**: fast with a generous free tier; uses `thinking_level: minimal`.
3. **MiMo V2.5** — set **Provider** to **MiMo**; leave **Model** empty → `mimo-v2.5`. Same USD price band as DeepSeek.
4. **GLM / Z.AI** — set **Provider** to **GLM** (China) or **Z.AI** (international); leave **Model** empty → `glm-4.7-flashx`. Works reliably but is often **slower** than DeepSeek or Gemini Flash Lite. Requires a paid balance.
5. **`openrouter/free`** — set **Provider** to **OpenRouter**; fine for experimenting.
6. **NVIDIA NIM** — set **Provider** to **NVIDIA NIM**; leave **Model** empty → `nvidia/nemotron-3-super-120b-a12b`. Good for free development testing across NVIDIA's hosted model catalog; expect lower rate limits and no production SLA.

Official pricing pages: [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) · [MiMo](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go) · [Gemini](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://developers.openai.com/api/docs/pricing) · [Zhipu GLM](https://bigmodel.cn/pricing) · [Z.AI](https://docs.z.ai/guides/overview/pricing) · [OpenRouter](https://openrouter.ai/models) · [NVIDIA NIM](https://build.nvidia.com/explore/discover)

> OpenRouter **provider default** is `openrouter/free`.

> NVIDIA NIM **provider default** is `nvidia/nemotron-3-super-120b-a12b`. NVIDIA NIM is best treated as a free development/testing endpoint, not a guaranteed production backend.

> Gemini uses Google's native Interactions REST API (`/v1beta/interactions`), authenticates with the `x-goog-api-key` header, and uses the `minimal` thinking level to reduce latency for commit-message generation.

> [!IMPORTANT]
> **Claude Support**: Native Claude format is not supported yet. Please use a proxy service that provides an OpenAI-compatible endpoint.

## 🕹️ Other entry points

- **Source Control** title bar ✨ · Command Palette **`WTF Commit: Generate`** · rebindable shortcut (see [Daily use](#②-daily-use-every-commit)).
- Rotate keys anytime with **`WTF Commit: Set API Key`**.

## 💬 Feedback

Using WTF Commit and finding it useful? A [GitHub star](https://github.com/codertesla/wtf-commit), an [Open VSX review](https://open-vsx.org/extension/codertesla/wtf-commit), or a short [issue](https://github.com/codertesla/wtf-commit/issues) (bugs or ideas) all help more people discover it — and help us keep improving.

## 📄 License
MIT License.
