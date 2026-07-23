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

Defaults are enough: **Provider = DeepSeek**. You only need a key.

1. **Install** — search **`WTF Commit`** in your editor’s Extensions view (VS Code or Cursor).
2. **Set API Key** — Command Palette → **`WTF Commit: Set API Key`** → accept the DeepSeek default → paste the key.
3. Need a key? [DeepSeek API keys](https://platform.deepseek.com/api_keys) (linked from the extension too).

> Want another provider later? In Set API Key choose **Choose another provider…**, or change **Provider** in Settings. Leave **Model** empty for built-in defaults.

## ② Daily use (every commit)

**What the shortcut does:** prefers **staged** changes → if nothing is staged and Auto Commit is on, **stages your working tree** → generates a Conventional Commit → **commits** (default) → does **not** push (Auto Push off).

1. Make your code changes (stage when you can).
2. Press the generate shortcut — the message streams in, then **commits by default**.
3. Push yourself when ready — **Auto Push is off by default**.

**Default shortcut:** `Cmd+Alt+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux).

**Make it yours** — the binding is fully customizable. A popular Cursor-style habit is a **double press** of `Cmd+G` / `Ctrl+G` (chord):

1. Open Keyboard Shortcuts (`Cmd+K Cmd+S` / `Ctrl+K Ctrl+S`).
2. Search **`WTF Commit: Generate`**.
3. Double-click the keybinding → press **`Cmd+G` twice** (or `Ctrl+G` twice on Windows/Linux) → Enter.

**One-keystroke power flow (optional):** Settings → enable **Auto Push**. Leave **Confirm Before Push** on until you trust it; turn that confirm off only when you want generate → commit → push with zero dialogs.

Other triggers: ✨ on the Source Control title bar, or Command Palette → **`WTF Commit: Generate`**.

> Prefer review-only? Turn **Auto Commit** off — the message stays in Source Control for you to edit and commit manually.

## 🆕 Latest (v1.17.0)

- **Five providers only**: DeepSeek, Gemini, OpenAI, OpenRouter, Custom — former MiMo/GLM/Z.AI/NVIDIA NIM settings migrate to Custom automatically.
- **DeepSeek-first setup**: Set API Key defaults to DeepSeek with a Get API Key link; fewer choices on first run.
- **Fewer interruptions**: Mixed staged/unstaged is a status tip (not a modal); AI repair runs automatically; post-commit tip when unstaged files remain.

> See [CHANGELOG](CHANGELOG.md) for full history.

## 🚀 Features

- **Conventional Commits** — `feat` / `fix` / `docs` / … with optional local format fix + automatic AI repair.
- **Smart diffing** — Prefers staged changes; with Auto Commit, stages the working tree when nothing is staged.
- **Intent-aware** — Text already in the SCM input is used as a generation hint (no extra prompt UI).
- **Streaming preview** — Watch the message appear live while the model runs.
- **Auto Commit & Push** — Optional one-keystroke pipeline with a push confirmation.
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
| **Provider** | AI backend (default DeepSeek). |
| **Auto Commit** | **Default on** — commit after generate. Off = message only in Source Control. |
| **Auto Push** | **Default off** — enable for push after commit. Requires Auto Commit. |
| **Confirm Before Push** | **Default on** — ask before auto-push. Power users can disable for a full hands-off shortcut. |

**Advanced** — Custom Base URL/Model, Provider Overrides, ignore paths, status bar toggle.

> Extension UI language follows VS Code (`vscode.env.language`): `zh*` → 中文, otherwise English. Power-user overrides in `settings.json` only: `wtfCommit.prompt`, and when Commit Message Language is `Custom`, `wtfCommit.customCommitMessageLanguage`.

### 2. Custom Model & Endpoints
You can use any OpenAI-compatible model (like local models via Ollama):

1. In Settings, set **Provider** to `Custom`.
2. Under **WTF Commit › Advanced**, enter the **Base URL** (e.g., `http://localhost:11434/v1`).
3. Enter the **Model** name (e.g., `llama3`).

To override a built-in provider's endpoint/model, use **Provider Overrides** (not the global Base URL / Model fields).

### 3. Custom Commit Language
If you want the AI to use a specific language (e.g., French, Cantonese, or Emoji-only):

1. Set **Commit Message Language** to `Custom`.
2. In `settings.json`, set the target language, for example:

```json
{
  "wtfCommit.commitMessageLanguage": "Custom",
  "wtfCommit.customCommitMessageLanguage": "Emoji only"
}
```

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
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **Gemini** | `gemini-3.5-flash-lite` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenAI** | `gpt-5-nano` | `https://api.openai.com/v1` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **Custom** | - | - |
<!-- provider-manifest:end -->

### Get API Keys

| Provider | Get API Key |
|----------|-------------|
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |
| **Gemini** | [aistudio.google.com/api-keys](https://aistudio.google.com/api-keys) |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) |

> Other OpenAI-compatible APIs (MiMo, GLM, Z.AI, NVIDIA NIM, proxies): set **Provider** to **Custom** and fill **Base URL** + **Model** under Advanced — or route through **OpenRouter**.

### Choosing a model for commit messages

Generating a commit message is a lightweight task — you don't need a frontier model. Pick based on **cost**, **latency**, and whether you already have an API key.

**Stick with the default** unless you already have another key:

1. **DeepSeek V4 Flash** — **Default Provider**; leave **Model** empty → `deepseek-v4-flash`. Fast, cheap, high quality. Thinking mode is disabled automatically.
2. **Gemini 3.5 Flash Lite** — optional alternative with a free tier; set **Provider** to **Gemini**.
3. **OpenAI / OpenRouter / Custom** — use these if you already have keys or a proxy endpoint.

**Pricing comparison** (USD per 1M tokens, cache-miss input; sources linked below):

| Provider | Model | Input | Output | ~Cost / generation† | Notes |
|----------|-------|------:|-------:|--------------------:|-------|
| **OpenRouter** | `openrouter/free` | $0 | $0 | ~$0 | Zero-cost trials; quality/latency vary |
| **OpenAI** | `gpt-5-nano` | $0.05 | $0.40 | ~$0.0003 | OpenAI provider default |
| **DeepSeek** | `deepseek-v4-flash` | $0.14 | $0.28 | ~$0.0007 | **Default — use this** |
| **Gemini** | `gemini-3.5-flash-lite` | $0.30 | $2.50 | ~$0.0019 | Alternative; generous [free tier](https://ai.google.dev/gemini-api/docs/pricing) |

† Rough estimate for **~5K input + 150 output tokens** (typical diff + commit message), no prompt cache. Actual cost depends on diff size and model verbosity.

Official pricing pages: [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) · [Gemini](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://developers.openai.com/api/docs/pricing) · [OpenRouter](https://openrouter.ai/models)

> OpenRouter **provider default** is `openrouter/free`.

> Gemini uses Google's native Interactions REST API (`/v1beta/interactions`), authenticates with the `x-goog-api-key` header, and uses the `minimal` thinking level to reduce latency for commit-message generation.

> Upgrading from an older build that used MiMo / GLM / Z.AI / NVIDIA NIM: the extension migrates that Provider setting to **Custom** and fills Base URL / Model automatically.

> [!IMPORTANT]
> **Claude Support**: Native Claude format is not supported yet. Please use a proxy service that provides an OpenAI-compatible endpoint.

## 🕹️ Other entry points

- **Source Control** title bar ✨ · Command Palette **`WTF Commit: Generate`** · rebindable shortcut (see [Daily use](#②-daily-use-every-commit)).
- Rotate keys anytime with **`WTF Commit: Set API Key`**.

## 💬 Feedback

Using WTF Commit and finding it useful? A [GitHub star](https://github.com/codertesla/wtf-commit), an [Open VSX review](https://open-vsx.org/extension/codertesla/wtf-commit), or a short [issue](https://github.com/codertesla/wtf-commit/issues) (bugs or ideas) all help more people discover it — and help us keep improving.

## 📄 License
MIT License.
