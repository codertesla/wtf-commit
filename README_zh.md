[English](README.md) | 简体中文

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/updates/v1_75)
[![DeepSeek V4 Flash](https://img.shields.io/badge/DeepSeek-V4%20Flash-4D6BFE?logo=deepseek&logoColor=white)](https://api-docs.deepseek.com/quick_start/pricing)
[![Gemini 3.1 Flash Lite](https://img.shields.io/badge/Gemini-3.1%20Flash%20Lite-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite)

链接： [GitHub](https://github.com/codertesla/wtf-commit) | [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) | [插件介绍页](https://codertesla.github.io/wtf-commit/)

**一键生成 commit message。** WTF Commit 读取你的 git diff，按约定式提交规范生成清晰标题，并写入源代码管理输入框——**使用你自己的 API Key**，不绑定单一厂商。

适用于 **Cursor**、**VSCodium** 等兼容 Open VSX 的编辑器（也可通过 Open VSX / VSIX 安装到 VS Code）。**持续维护**，MIT 免费开源。

| | |
|:--|:--|
| **默认服务商** | **DeepSeek**（`deepseek-v4-flash`）— 提交信息场景又快又便宜 |
| **配置一次** | 填好对应服务商的 API Key（大约一分钟） |
| **默认流程** | 生成后 **自动 commit**（不再多弹确认）。**Auto Push 默认关闭**，避免新用户误推远程 |
| **老手一键流** | 打开 Auto Push（可选再关掉「推送前确认」）→ 一次快捷键完成 生成 → 提交 → 推送 |

上手刻意拆成 **两个阶段**：AI 只配一次，之后就该变成肌肉记忆里的快捷键。

## ① 配置 AI（只需一次）

你只需要「服务商 + Key」，其它都可以保持默认。

1. **安装** — 扩展市场搜索 **`WTF Commit`**（Open VSX）→ 安装。
2. **设置 API Key** — 命令面板 → **`WTF Commit: Set API Key`**。
3. **在列表里选服务商** — 插件默认是 **DeepSeek**（**Gemini** 同样推荐）。**Model** 留空即用内置默认。
4. **粘贴 Key**。若你选的不是 DeepSeek，提示切换时选 **切换 Provider**，让当前服务商与 Key 一致。

申请 Key：[DeepSeek](https://platform.deepseek.com/api_keys) · [Gemini](https://aistudio.google.com/api-keys) · 更多见[支持的服务商](#ℹ️-支持的服务商与模型)。

> 也可以先在设置 → WTF Commit 里改 **Provider**，再为该服务商执行 **Set API Key**，效果相同。

## ② 日常使用（每次提交）

1. 改完代码（尽量先 stage；开启 Auto Commit + Smart Stage 时，未暂存变更也可自动 stage）。
2. 按下生成快捷键 — 信息流式写入，并在默认配置下 **直接 commit**（不再多弹「确认提交」）。
3. 需要推远程时再 push — **Auto Push 默认关闭**，避免新用户误推。

**默认快捷键：** `Cmd+Alt+G`（Mac）/ `Ctrl+Alt+G`（Windows/Linux）。

**改成你顺手的键** — 快捷键完全可自定义。Cursor 用户里很常见的一种是 **连按两次 `Cmd+G` / `Ctrl+G`**：

1. 打开键盘快捷键（`Cmd+K Cmd+S` / `Ctrl+K Ctrl+S`）。
2. 搜索 **`WTF Commit: Generate`**。
3. 双击键位 → **连续按两次 `Cmd+G`**（Windows/Linux 为两次 `Ctrl+G`）→ 回车。

**老手一键流（可选）：** 设置里打开 **Auto Push**。建议先保留 **Confirm Before Push**；完全信任后再关掉该确认，即可一次快捷键走完 生成 → 提交 → 推送。

其它入口：源代码管理标题栏的 ✨，或命令面板 → **`WTF Commit: Generate`**。

> 只想生成信息、自己点提交？把 **Auto Commit** 关掉即可。

## 🆕 最新更新（v1.13.0）

- **默认服务商 DeepSeek** — 首次安装使用 `deepseek-v4-flash`（提交信息场景又快又便宜）。
- **更顺手的默认流程**：默认开启 Auto Commit、关闭提交前确认；Auto Push 仍默认关闭；推送前确认默认开启。
- **上手文档更清晰**：配置一次 AI + 日常快捷键（含改成连按两次 `Cmd+G` 等说明）。

> 更早版本的更新说明请查看 [CHANGELOG](CHANGELOG.md)。

## 功能特性

- **约定式提交** — `feat` / `fix` / `docs` / …，支持本地格式修复 + **AI Repair**。
- **智能 diff** — 优先暂存区；混合状态或仅工作区时会确认，避免「生成依据」和「实际提交」对不上。
- **意图感知** — 复用你已写在 SCM 输入框里的文字作为提示（无需额外表单）。
- **流式预览** — 生成过程实时显示。
- **自动提交与推送** — 可选一键流水线，并带确认开关。
- **多语言提交信息** — 英文、简/繁中文、日语、文言文或 **Custom**。
- **自定义端点** — 内置多家服务商 + **Custom**（Ollama、中转等）。
- **快捷键** — 默认 `Cmd+Alt+G` / `Ctrl+Alt+G`，可改成自己的习惯（例如连按两次 `Cmd+G`）。

---

## 🛠️ 进阶教程

### 1. 更多设置项
您可以进入 VS Code **设置** (`Cmd+,`)，搜索 `WTF Commit` 来深度定制：

| 设置项目 | 描述 |
|---------|-------------|
| **UI Language** | 插件自身界面语言（`en` / `zh`），与提交信息语言相互独立。 |
| **Show Status Bar Item** | 在状态栏显示紧凑的 WTF Commit 图标。 |
| **Changelog Popup** | 更新后显示更新日志通知（默认关闭）。 |
| **Auto Commit** | **默认开启** — 生成后自动 commit。关闭则只写入 SCM，自行提交。 |
| **Auto Push** | **默认关闭** — 开启后自动推送。需同时开启 Auto Commit。 |
| **Smart Stage** | Auto Commit 开启且暂存区为空时，生成前自动 stage。 |
| **Confirm Before Commit** | **默认关闭** — 自动提交前不再弹窗；需要最终确认时再打开。 |
| **Confirm Before Push** | **默认开启** — 自动推送前询问；老手可关掉以做到完全一键。 |
| **Warn On Truncated Diff** | diff 过大而只发送部分内容时弹出提醒（默认关闭）。 |
| **Prompt** | 自定义 AI 的角色和生成规则。 |

### 2. 自定义模型与端点 (Custom Model)
除了内置的服务商，您还可以通过 **Provider: Custom** 或直接修改 **Model** / **Base URL** 来使用任何 OpenAI 兼容的模型（如本地 Ollama 运行的模型）：

1. 在设置中将 **Provider** 设为 `Custom`。
2. 填写 **Base URL** (例如 `http://localhost:11434/v1`)。
3. 填写 **Model** (例如 `llama3`)。

### 3. 自定义提交语言
如果您想让 AI 使用特定的语言（如粤语、法语或仅使用 Emoji）生成提交信息：

1. 在设置中将 **Language** 改为 `Custom`。
2. 在 **Custom Language** 中输入您想要的语言名称或规则（例如 `Emoji only`）。

---

## ℹ️ 支持的服务商与模型

**默认说明**（三个不同概念，请勿混淆）：

| 术语 | 含义 |
|------|------|
| **默认服务商** | **DeepSeek** — 首次安装或未改过设置中的 **Provider** 时使用。 |
| **服务商默认** | 每个内置 Provider 有各自的默认 **Model** 与 **Base URL**（见下表）。仅在该 Provider **被选中**且 **Model** / **Base URL** 留空时生效。 |
| **使用推荐** | 针对提交信息场景的编辑推荐（见[如何选型](#提交信息场景如何选型)）— 现与默认服务商一致时，优先用 DeepSeek。 |

**各服务商默认模型** — 当 **Base URL** 和 **Model** 留空时：

| 服务商 (Provider) | 默认模型 (Model) | 默认 Base URL |
|----------|---------------|-----------------|
| **OpenAI** | `gpt-5-nano` | `https://api.openai.com/v1` |
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **MiMo** | `mimo-v2.5` | `https://api.xiaomimimo.com/v1` |
| **GLM** | `glm-4.7-flashx` | `https://open.bigmodel.cn/api/paas/v4` |
| **Z.AI** | `glm-4.7-flashx` | `https://api.z.ai/api/paas/v4` |
| **Gemini** | `gemini-3.1-flash-lite` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **NVIDIA NIM** | `nvidia/nemotron-3-super-120b-a12b` | `https://integrate.api.nvidia.com/v1` |
| **Custom** | - | - |

### 获取 API Key

| 服务商 | 获取 API Key |
|--------|-------------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |
| **MiMo** | [platform.xiaomimimo.com/console/api-keys](https://platform.xiaomimimo.com/console/api-keys) |
| **GLM**（国内） | [open.bigmodel.cn/apikey/platform](https://open.bigmodel.cn/apikey/platform) |
| **Z.AI**（国际） | [z.ai/manage-apikey/apikey-list](https://z.ai/manage-apikey/apikey-list) |
| **Gemini** | [aistudio.google.com/api-keys](https://aistudio.google.com/api-keys) |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **NVIDIA NIM** | [build.nvidia.com](https://build.nvidia.com/) |

> **GLM** 与 **Z.AI** 的 API Key 不通用 — 请在与你所选服务商对应的平台创建密钥。

### 提交信息场景如何选型

生成 Git 提交信息对模型智能要求不高，不必使用前沿大模型。按 **成本**、**延迟** 和是否已有 API Key 选择即可。

以下为 **使用推荐** — 在设置中修改 **Provider** 即可切换（例如将 **Provider** 设为 **DeepSeek**，**Model** 留空即使用 `deepseek-v4-flash`）。

**价格对比**（美元 / 百万 tokens，输入按未命中缓存计价；来源见文末链接）：

| 服务商 | 模型 | 输入 | 输出 | 约单次成本† | 说明 |
|--------|------|-----:|-----:|------------:|------|
| **OpenRouter** | `openrouter/free` | $0 | $0 | ~$0 | 零成本试用；质量与延迟不稳定 |
| **OpenAI** | `gpt-5-nano` | $0.05 | $0.40 | ~$0.0003 | OpenAI 服务商默认 |
| **Z.AI** | `glm-4.7-flashx` | $0.07 | $0.40 | ~$0.0004 | **Z.AI** 服务商默认；通常较慢 |
| **GLM** | `glm-4.7-flashx` | ¥0.5 | ¥3 | ~¥0.003 | **GLM** 服务商默认；通常较慢 |
| **DeepSeek** | `deepseek-v4-flash` | $0.14 | $0.28 | ~$0.0007 | **默认服务商** — 快、便宜、质量好 |
| **MiMo** | `mimo-v2.5` | $0.14 | $0.28 | ~$0.0007 | 与 DeepSeek 同档；OpenAI 兼容 |
| **Gemini** | `gemini-3.1-flash-lite` | $0.25 | $1.50 | ~$0.0015 | **推荐** — 快；[免费额度](https://ai.google.dev/gemini-api/docs/pricing) 慷慨 |
| **NVIDIA NIM** | `nvidia/nemotron-3-super-120b-a12b` | $0 | $0 | ~$0 | 免费开发端点；限流与可用性可能变化 |

† 按 **约 5K 输入 + 150 输出 tokens** 估算。`glm-4.7-flashx` 国内单次约 **¥0.003**。美元行按未命中缓存计价。

> **GLM 与 Z.AI**：同一模型家族、不同平台 — **GLM** 走国内端点（`open.bigmodel.cn`），**Z.AI** 走国际端点（`api.z.ai`）。API Key 不通用。两者的**服务商默认**均为付费模型 **`glm-4.7-flashx`**。免费档 `glm-4.7-flash` 限流严重，不推荐使用。

MiMo 国内按量（`mimo-v2.5`）：输入 ¥1.00 / 百万 tokens，输出 ¥2.00 / 百万 tokens（[官方定价](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go)）。

**使用推荐**（速度 + 性价比）— 在设置中将 **Provider** 改为对应项：

1. **DeepSeek V4 Flash** — **默认服务商**；**Model** 留空 → `deepseek-v4-flash`。**综合首选**：快、便宜、质量好。扩展已自动关闭思考模式。
2. **Gemini 3.1 Flash Lite** — **Provider** 选 **Gemini**，**Model** 留空 → `gemini-3.1-flash-lite`。**同样推荐**：速度快，免费额度慷慨；使用 `thinking_level: minimal`。
3. **MiMo V2.5** — **Provider** 选 **MiMo**，**Model** 留空 → `mimo-v2.5`。与 DeepSeek 同美元价位。
4. **GLM / Z.AI** — **Provider** 选 **GLM**（国内）或 **Z.AI**（国际），**Model** 留空 → `glm-4.7-flashx`。可用但通常**比 DeepSeek / Gemini Flash Lite 慢**，需账户余额。
5. **`openrouter/free`** — **Provider** 选 **OpenRouter**；适合尝鲜。
6. **NVIDIA NIM** — **Provider** 选 **NVIDIA NIM**，**Model** 留空 → `nvidia/nemotron-3-super-120b-a12b`。适合免费开发测试和跨 NVIDIA 托管模型目录试用；限流较低，且没有生产 SLA。

官方定价：[DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) · [MiMo](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go) · [Gemini](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://developers.openai.com/api/docs/pricing) · [智谱 GLM](https://bigmodel.cn/pricing) · [Z.AI](https://docs.z.ai/guides/overview/pricing) · [OpenRouter](https://openrouter.ai/models) · [NVIDIA NIM](https://build.nvidia.com/explore/discover)

> OpenRouter 的**服务商默认**为 `openrouter/free`。

> NVIDIA NIM 的**服务商默认**为 `nvidia/nemotron-3-super-120b-a12b`。建议将 NVIDIA NIM 视为免费开发/测试端点，而不是稳定生产后端。

> Gemini 使用 Google 原生 Interactions REST API（`/v1beta/interactions`），通过 `x-goog-api-key` 请求头认证，并将思考等级设为 `minimal`，以降低生成提交信息时的延迟。

> [!IMPORTANT]
> **关于 Claude**: 目前**暂不支持** Claude 原生格式。请使用支持 OpenAI 兼容端点的中转服务。

## 🕹️ 其它入口

- **源代码管理**标题栏 ✨ · 命令面板 **`WTF Commit: Generate`** · 可自定义快捷键（见[日常使用](#②-日常使用每次提交)）。
- 更换密钥随时运行 **`WTF Commit: Set API Key`**。

## 💬 反馈与支持

如果 WTF Commit 对你有用：点个 [GitHub Star](https://github.com/codertesla/wtf-commit)、在 [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) 留一句评价，或开一个简短的 [Issue](https://github.com/codertesla/wtf-commit/issues)（Bug / 想法），都能帮更多人发现它，也方便我们持续改进。

## 📄 开源协议
MIT License.
