[English](README.md) | 简体中文

# WTF Commit ✨

[![Visual Studio Marketplace Version](https://badgen.net/vs-marketplace/v/CoderTesla.wtf-commit)](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)
[![Visual Studio Marketplace Installs](https://badgen.net/vs-marketplace/i/CoderTesla.wtf-commit)](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)

链接： [GitHub](https://github.com/codertesla/wtf-commit) · [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit) · [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) · [插件介绍页](https://codertesla.github.io/wtf-commit/)

**一键生成 commit message。** WTF Commit 读取你的 git diff，按约定式提交规范生成清晰标题，并写入源代码管理输入框——**使用你自己的 API Key**，不绑定单一厂商。

适用于 **VS Code**（微软 Marketplace：可搜索安装、**自动更新**）、**Cursor**、**VSCodium** 等。**持续维护**，MIT 免费开源。

| | |
|:--|:--|
| **默认服务商** | **DeepSeek**（`deepseek-v4-flash`）— 提交信息场景又快又便宜 |
| **配置一次** | 填好对应服务商的 API Key（大约一分钟） |
| **默认流程** | 生成后 **自动 commit**（不再多弹确认）。**Auto Push 默认关闭**，避免新用户误推远程 |
| **老手一键流** | 打开 Auto Push（可选再关掉「推送前确认」）→ 一次快捷键完成 生成 → 提交 → 推送 |

上手刻意拆成 **两个阶段**：AI 只配一次，之后就该变成肌肉记忆里的快捷键。

### 安装方式

| 编辑器 | 如何安装 | 更新 |
|--------|----------|------|
| **VS Code** | 扩展市场搜索 **`WTF Commit`** → 安装（[Marketplace 页面](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)） | **自动更新**（微软市场） |
| **Cursor / VSCodium** | 扩展市场搜索 **`WTF Commit`** → 安装（[Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit)） | 自动更新（Open VSX） |

**VSIX（可选 / 离线）：** 从 [GitHub Releases](https://github.com/codertesla/wtf-commit/releases) 或上述市场下载 `.vsix`，扩展视图 → **⋯** → **从 VSIX 安装…**，或拖入「已安装」列表。手动 VSIX **不会**自动更新，能走市场安装时请优先用市场。

## ① 配置 AI（只需一次）

默认即可：**Provider = DeepSeek**。你只需要一把 Key。

1. **安装** — 在编辑器扩展视图搜索 **`WTF Commit`**（VS Code 或 Cursor）。
2. **设置 API Key** — 命令面板 → **`WTF Commit: Set API Key`** → 接受 DeepSeek 默认 → 粘贴 Key。
3. 还没有 Key？[DeepSeek API keys](https://platform.deepseek.com/api_keys)（扩展内也可一键打开）。

> 以后要用别的服务商：在 Set API Key 里选 **选择其他服务商…**，或在设置里改 **Provider**。内置服务商请把 **Model** 留空。

## ② 日常使用（每次提交）

**快捷键会做什么：** 优先用**已暂存**变更 → 若暂存区为空且开启 Auto Commit，则**自动 stage 工作区** → 生成约定式提交信息 → **自动 commit**（默认）→ **不 push**（Auto Push 默认关）。

1. 改完代码（尽量先 stage）。
2. 按下生成快捷键 — 信息流式写入，并在默认配置下 **直接 commit**。
3. 需要推远程时再 push — **Auto Push 默认关闭**。

**默认快捷键：** `Cmd+Alt+G`（Mac）/ `Ctrl+Alt+G`（Windows/Linux）。

**改成你顺手的键** — 快捷键完全可自定义。Cursor 用户里很常见的一种是 **连按两次 `Cmd+G` / `Ctrl+G`**：

1. 打开键盘快捷键（`Cmd+K Cmd+S` / `Ctrl+K Ctrl+S`）。
2. 搜索 **`WTF Commit: Generate`**。
3. 双击键位 → **连续按两次 `Cmd+G`**（Windows/Linux 为两次 `Ctrl+G`）→ 回车。

**老手一键流（可选）：** 设置里打开 **Auto Push**。建议先保留 **Confirm Before Push**；完全信任后再关掉该确认，即可一次快捷键走完 生成 → 提交 → 推送。

其它入口：源代码管理标题栏的 ✨，或命令面板 → **`WTF Commit: Generate`**。

> 只想生成信息、自己点提交？把 **Auto Commit** 关掉即可。

## 🆕 最新更新（v1.17.0）

- **仅保留五个服务商**：DeepSeek、Gemini、OpenAI、OpenRouter、Custom；原 MiMo / GLM / Z.AI / NVIDIA NIM 会自动迁移为 Custom。
- **DeepSeek 优先**：Set API Key 默认 DeepSeek，并提供申请 Key 链接，减少首次选择。
- **更少打断**：混合暂存改为状态栏提示；AI 修复自动执行；提交后若仍有未暂存变更会提示。

> 完整历史见 [CHANGELOG](CHANGELOG.md)。

## 功能特性

- **约定式提交** — `feat` / `fix` / `docs` / …，支持本地格式修复 + 自动 AI 修复。
- **智能 diff** — 优先暂存区；开启 Auto Commit 且暂存区为空时自动 stage 工作区。
- **意图感知** — 复用你已写在 SCM 输入框里的文字作为提示（无需额外表单）。
- **流式预览** — 生成过程实时显示。
- **自动提交与推送** — 可选一键流水线，推送前可确认。
- **多语言提交信息** — 英文、简/繁中文、日语、文言文或 **Custom**。
- **自定义端点** — 内置多家服务商 + **Custom**（Ollama、中转等）。
- **快捷键** — 默认 `Cmd+Alt+G` / `Ctrl+Alt+G`，可改成自己的习惯（例如连按两次 `Cmd+G`）。

---

## 🛠️ 进阶教程

### 1. 更多设置项
进入 VS Code **设置** (`Cmd+,`)，搜索 `WTF Commit`。设置分为 **WTF Commit**（基础）与 **WTF Commit › Advanced**（高级）。

**基础** — 大多数人只需要这些：

| 设置项目 | 描述 |
|---------|-------------|
| **Commit Message Language** | 生成的提交信息语言。 |
| **Provider** | AI 服务商（默认 DeepSeek）。 |
| **Auto Commit** | **默认开启** — 生成后自动 commit。关闭则只写入 SCM，自行提交。 |
| **Auto Push** | **默认关闭** — 开启后自动推送。需同时开启 Auto Commit。 |
| **Confirm Before Push** | **默认开启** — 自动推送前询问；老手可关掉以做到完全一键。 |

**高级** — Custom 的 Base URL/Model、Provider Overrides、ignore paths、状态栏开关等。

> 插件界面语言跟随 VS Code（`vscode.env.language`）：`zh*` → 中文，其余回退英文。仅在 `settings.json` 覆盖的进阶项：`wtfCommit.prompt`；以及当 Commit Message Language 为 `Custom` 时的 `wtfCommit.customCommitMessageLanguage`。

### 2. 自定义模型与端点 (Custom Model)
使用任意 OpenAI 兼容模型（如本地 Ollama）：

1. 在设置中将 **Provider** 设为 `Custom`。
2. 在 **WTF Commit › Advanced** 中填写 **Base URL**（例如 `http://localhost:11434/v1`）。
3. 填写 **Model**（例如 `llama3`）。

若要覆盖内置服务商的端点/模型，请使用 **Provider Overrides**（不要改全局 Base URL / Model）。

### 3. 自定义提交语言
如果您想让 AI 使用特定的语言（如粤语、法语或仅使用 Emoji）生成提交信息：

1. 将 **Commit Message Language** 设为 `Custom`。
2. 在 `settings.json` 中填写目标语言，例如：

```json
{
  "wtfCommit.commitMessageLanguage": "Custom",
  "wtfCommit.customCommitMessageLanguage": "Emoji only"
}
```

---

## ℹ️ 支持的服务商与模型

**默认说明**（三个不同概念，请勿混淆）：

| 术语 | 含义 |
|------|------|
| **默认服务商** | **DeepSeek** — 首次安装或未改过设置中的 **Provider** 时使用。 |
| **服务商默认** | 每个内置 Provider 有各自的默认 **Model** 与 **Base URL**（见下表）。仅在该 Provider **被选中**且未设置 **Provider Overrides**（或 Custom 的 Base URL/Model）时生效。 |
| **使用推荐** | 针对提交信息场景的编辑推荐（见[如何选型](#提交信息场景如何选型)）— 现与默认服务商一致时，优先用 DeepSeek。 |

**各服务商默认模型** — 当 **Base URL** 和 **Model** 留空时：

<!-- provider-manifest:start -->
| 服务商 (Provider) | 默认模型 (Model) | 默认 Base URL |
|----------|---------------|-----------------|
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **Gemini** | `gemini-3.5-flash-lite` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenAI** | `gpt-5-nano` | `https://api.openai.com/v1` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **Custom** | - | - |
<!-- provider-manifest:end -->

### 获取 API Key

| 服务商 | 获取 API Key |
|--------|-------------|
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |
| **Gemini** | [aistudio.google.com/api-keys](https://aistudio.google.com/api-keys) |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) |

> 其它 OpenAI 兼容 API（MiMo、GLM、Z.AI、NVIDIA NIM、中转）：将 **Provider** 设为 **Custom**，在 Advanced 填写 **Base URL** 与 **Model**；或走 **OpenRouter**。

### 提交信息场景如何选型

生成 Git 提交信息对模型智能要求不高，不必使用前沿大模型。按 **成本**、**延迟** 和是否已有 API Key 选择即可。

**优先用默认**，除非你已有别家 Key：

1. **DeepSeek V4 Flash** — **默认服务商**；**Model** 留空 → `deepseek-v4-flash`。快、便宜、质量好。扩展已自动关闭思考模式。
2. **Gemini 3.5 Flash Lite** — 可选备选（免费额度）；**Provider** 选 **Gemini**。
3. **OpenAI / OpenRouter / Custom** — 已有 Key 或中转端点时使用。

**价格对比**（美元 / 百万 tokens，输入按未命中缓存计价；来源见文末链接）：

| 服务商 | 模型 | 输入 | 输出 | 约单次成本† | 说明 |
|--------|------|-----:|-----:|------------:|------|
| **OpenRouter** | `openrouter/free` | $0 | $0 | ~$0 | 零成本试用；质量与延迟不稳定 |
| **OpenAI** | `gpt-5-nano` | $0.05 | $0.40 | ~$0.0003 | OpenAI 服务商默认 |
| **DeepSeek** | `deepseek-v4-flash` | $0.14 | $0.28 | ~$0.0007 | **默认 — 就用这个** |
| **Gemini** | `gemini-3.5-flash-lite` | $0.30 | $2.50 | ~$0.0019 | 备选；[免费额度](https://ai.google.dev/gemini-api/docs/pricing) 慷慨 |

† 按 **约 5K 输入 + 150 输出 tokens** 估算。实际成本取决于 diff 大小与模型输出长度。

官方定价：[DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) · [Gemini](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://developers.openai.com/api/docs/pricing) · [OpenRouter](https://openrouter.ai/models)

> OpenRouter 的**服务商默认**为 `openrouter/free`。

> Gemini 使用 Google 原生 Interactions REST API（`/v1beta/interactions`），通过 `x-goog-api-key` 请求头认证，并将思考等级设为 `minimal`，以降低生成提交信息时的延迟。

> 若你从仍包含 MiMo / GLM / Z.AI / NVIDIA NIM 的旧版升级：扩展会把对应 Provider 迁移为 **Custom**，并自动填入 Base URL / Model。

> [!IMPORTANT]
> **关于 Claude**: 目前**暂不支持** Claude 原生格式。请使用支持 OpenAI 兼容端点的中转服务。

## 🕹️ 其它入口

- **源代码管理**标题栏 ✨ · 命令面板 **`WTF Commit: Generate`** · 可自定义快捷键（见[日常使用](#②-日常使用每次提交)）。
- 更换密钥随时运行 **`WTF Commit: Set API Key`**。

## 💬 反馈与支持

如果 WTF Commit 对你有用：点个 [GitHub Star](https://github.com/codertesla/wtf-commit)、在 [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) 留一句评价，或开一个简短的 [Issue](https://github.com/codertesla/wtf-commit/issues)（Bug / 想法），都能帮更多人发现它，也方便我们持续改进。

## 📄 开源协议
MIT License.
