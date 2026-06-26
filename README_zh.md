[English](README.md) | 简体中文

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/updates/v1_75)
[![DeepSeek V4 Flash](https://img.shields.io/badge/DeepSeek-V4%20Flash-4D6BFE?logo=deepseek&logoColor=white)](https://api-docs.deepseek.com/quick_start/pricing)
[![Gemini 3.1 Flash Lite](https://img.shields.io/badge/Gemini-3.1%20Flash%20Lite-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite)
[![GLM 4.7 FlashX](https://img.shields.io/badge/GLM-4.7%20FlashX-345FF2?logo=zhipu&logoColor=white)](https://bigmodel.cn/pricing)
[![MiMo V2.5](https://img.shields.io/badge/MiMo-V2.5-FF6900?logo=xiaomi&logoColor=white)](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go)

链接： [GitHub](https://github.com/codertesla/wtf-commit) | [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) | [插件介绍页](https://codertesla.github.io/wtf-commit/)

WTF Commit 是一款简约的 VS Code 扩展，利用 AI 根据您暂存的更改（或工作区更改）生成简洁且有意义的 Git 提交信息。

## 🆕 最新更新（v1.11.0）

- **更精简的 LLM 上下文**：默认 diff 上限降至 10k 字符，多文件自动紧凑、新文件仅发元数据 + 30 行预览 — 生成更快、更省 token。
- **更智能的过滤**：默认 `ignorePaths` 排除快照、压缩产物与生成文件；超大 diff 改为文件列表 + 样本 hunk 摘要。

> 更早版本的更新说明请查看 [CHANGELOG](CHANGELOG.md)。

##  功能特性

- **多语言支持**：预设支持 英文、简体中文、繁体中文、日语、文言文，并支持**自定义语言**。
- **约定式提交**：自动遵循约定式提交标准（feat, fix, docs 等）。
- **智能差异化**：优先处理暂存的更改，混合暂存/未暂存状态会先确认；若无暂存变更则回退到工作区更改，并在生成前过滤更多低价值 diff 噪声。
- **意图感知生成**：会复用你已经写在 SCM 输入框中的文本，作为零配置提示词参与生成。
- **自动提交与推送**：支持一键完成 生成 + 提交 + 推送 (Auto Commit & Push)。
- **实时调优**：Auto-commit 流程现已支持直接进入 Input Box 框二次编辑，避免阻断生成快感。
- **轻量纠偏**：当标题格式不够规范时，支持直接点击 `AI Repair` 做一次快速修正。
- **请求稳定性增强**：内置超时 + 自动重试机制，附带分类错误反馈，支持 DeepSeek 等推理型模型的自动长超时。
- **流式生成**：在进度通知中实时预览生成内容，降低等待感。
- **快捷键支持**: 默认绑定 `Cmd+Alt+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux)。
- **高度可定制**：可完全自定义系统提示词（Prompt）和自定义 LLM 端点的 Base URL。

---

## ⏱️ 极简上手教程

只需要 3 步，即可开启 AI 自动提交之旅：

1. **下载安装**：在 Open VSX 插件市场搜索 `WTF Commit` 并安装。
2. **输入 API Key**：按下 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)，输入 **`WTF Commit: Set API Key`**，选择服务商并粘贴您的 Key。
3. **一键生成**：按下 **`Cmd+Alt+G`** (Mac) 或 **`Ctrl+Alt+G`** (Windows)，插件将自动根据代码变动生成提交信息并填入输入框。

---

## 🛠️ 进阶教程

### 1. 更多设置项
您可以进入 VS Code **设置** (`Cmd+,`)，搜索 `WTF Commit` 来深度定制：

| 设置项目 | 描述 |
|---------|-------------|
| **UI Language** | 插件自身界面语言（`en` / `zh`），与提交信息语言相互独立。 |
| **Auto Commit** | 生成信息后自动提交。关闭时信息放入源代码管理输入框供手动审阅（推荐大多数用户）。 |
| **Auto Push** | 自动提交后自动推送。⚠️ 需开启 Auto Commit 才生效。 |
| **Smart Stage** | 开启自动提交时，在生成前暂存当前更改，避免后续编辑进入本次提交。 |
| **Confirm Before Commit** | 自动提交前确认（仅 Auto Commit 开启时相关）。 |
| **Confirm Before Push** | 推送前额外确认（仅 Auto Commit + Auto Push 都开启时相关）。 |
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
| **默认服务商** | **OpenAI** — 首次安装或未改过设置中的 **Provider** 时使用。 |
| **服务商默认** | 每个内置 Provider 有各自的默认 **Model** 与 **Base URL**（见下表）。仅在该 Provider **被选中**且 **Model** / **Base URL** 留空时生效。 |
| **使用推荐** | 针对提交信息场景的编辑推荐（见[如何选型](#提交信息场景如何选型)）— **不是**插件的默认服务商。 |

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

> **GLM** 与 **Z.AI** 的 API Key 不通用 — 请在与你所选服务商对应的平台创建密钥。

### 提交信息场景如何选型

生成 Git 提交信息对模型智能要求不高，不必使用前沿大模型。按 **成本**、**延迟** 和是否已有 API Key 选择即可。

以下为 **使用推荐** — 在设置中修改 **Provider** 即可切换（例如将 **Provider** 设为 **DeepSeek**，**Model** 留空即使用 `deepseek-v4-flash`）。

**价格对比**（美元 / 百万 tokens，输入按未命中缓存计价；来源见文末链接）：

| 服务商 | 模型 | 输入 | 输出 | 约单次成本† | 说明 |
|--------|------|-----:|-----:|------------:|------|
| **OpenRouter** | `openrouter/free` | $0 | $0 | ~$0 | 零成本试用；质量与延迟不稳定 |
| **OpenAI** | `gpt-5-nano` | $0.05 | $0.40 | ~$0.0003 | **默认服务商**的默认模型 |
| **Z.AI** | `glm-4.7-flashx` | $0.07 | $0.40 | ~$0.0004 | **Z.AI** 服务商默认；通常较慢 |
| **GLM** | `glm-4.7-flashx` | ¥0.5 | ¥3 | ~¥0.003 | **GLM** 服务商默认；通常较慢 |
| **DeepSeek** | `deepseek-v4-flash` | $0.14 | $0.28 | ~$0.0007 | **推荐** — 快、便宜、质量好 |
| **MiMo** | `mimo-v2.5` | $0.14 | $0.28 | ~$0.0007 | 与 DeepSeek 同档；OpenAI 兼容 |
| **Gemini** | `gemini-3.1-flash-lite` | $0.25 | $1.50 | ~$0.0015 | **推荐** — 快；[免费额度](https://ai.google.dev/gemini-api/docs/pricing) 慷慨 |

† 按 **约 5K 输入 + 150 输出 tokens** 估算。`glm-4.7-flashx` 国内单次约 **¥0.003**。美元行按未命中缓存计价。

> **GLM 与 Z.AI**：同一模型家族、不同平台 — **GLM** 走国内端点（`open.bigmodel.cn`），**Z.AI** 走国际端点（`api.z.ai`）。API Key 不通用。两者的**服务商默认**均为付费模型 **`glm-4.7-flashx`**。免费档 `glm-4.7-flash` 限流严重，不推荐使用。

MiMo 国内按量（`mimo-v2.5`）：输入 ¥1.00 / 百万 tokens，输出 ¥2.00 / 百万 tokens（[官方定价](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go)）。

**使用推荐**（速度 + 性价比）— 在设置中将 **Provider** 改为对应项：

1. **DeepSeek V4 Flash** — **Provider** 选 **DeepSeek**，**Model** 留空 → `deepseek-v4-flash`。**综合首选**：快、便宜、质量好。扩展已自动关闭思考模式。
2. **Gemini 3.1 Flash Lite** — **Provider** 选 **Gemini**，**Model** 留空 → `gemini-3.1-flash-lite`。**同样推荐**：速度快，免费额度慷慨；使用 `thinking_level: minimal`。
3. **MiMo V2.5** — **Provider** 选 **MiMo**，**Model** 留空 → `mimo-v2.5`。与 DeepSeek 同美元价位。
4. **GLM / Z.AI** — **Provider** 选 **GLM**（国内）或 **Z.AI**（国际），**Model** 留空 → `glm-4.7-flashx`。可用但通常**比 DeepSeek / Gemini Flash Lite 慢**，需账户余额。
5. **`openrouter/free`** — **Provider** 选 **OpenRouter**；适合尝鲜。

官方定价：[DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) · [MiMo](https://mimo.mi.com/docs/zh-CN/price/pay-as-you-go) · [Gemini](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://developers.openai.com/api/docs/pricing) · [智谱 GLM](https://bigmodel.cn/pricing) · [Z.AI](https://docs.z.ai/guides/overview/pricing) · [OpenRouter](https://openrouter.ai/models)

> OpenRouter 的**服务商默认**为 `openrouter/free`。

> Gemini 使用 Google 原生 Interactions REST API（`/v1beta/interactions`），通过 `x-goog-api-key` 请求头认证，并将思考等级设为 `minimal`，以降低生成提交信息时的延迟。

> [!IMPORTANT]
> **关于 Claude**: 目前**暂不支持** Claude 原生格式。请使用支持 OpenAI 兼容端点的中转服务。

## 🕹️ 其他触发方式

- **源代码管理图标**：点击 Git 面板顶部的 ✨ 图标。
- **命令面板**：运行 `WTF Commit: Generate`。
- **命令面板**：运行 `WTF Commit: Set API Key` 来设置或更新密钥。
- **连击快捷键 (Chord)**：您可以自行绑定双击 `Cmd+G` 触发，设置方法见 `💡 进阶技巧`。

## 💡 进阶技巧

**如何设置连击快捷键？**
1. 打开键盘快捷键设置 (`Cmd+K Cmd+S`)。
2. 搜索 `WTF Commit: Generate`。
3. 双击并连续按下两次 `Cmd+G`。

## 📄 开源协议
MIT License.
