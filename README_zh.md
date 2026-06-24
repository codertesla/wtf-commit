[English](README.md) | 简体中文

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/updates/v1_75)
[![Gemini 3.5 Flash](https://img.shields.io/badge/Gemini-3.5%20Flash-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash)

链接： [GitHub](https://github.com/codertesla/wtf-commit) | [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) | [插件介绍页](https://codertesla.github.io/wtf-commit/)

WTF Commit 是一款简约的 VS Code 扩展，利用 AI 根据您暂存的更改（或工作区更改）生成简洁且有意义的 Git 提交信息。

## 🆕 最新更新（v1.4.2）

- **原生接入 Gemini 3.5 Flash**：使用 Google Interactions API 和原生 SSE 流式输出，并以 `minimal` 思考等级提升提交信息生成速度。
- **更安全的提交与 AI 上下文**：过滤敏感文件、脱敏常见凭据，并在 Auto Commit 前校验暂存区快照。
- **更可靠的生成流程**：隔离各 Provider 配置、统一重试总超时、按文件均衡提取大型 diff，并将输出限制为 512 tokens。

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
| **Auto Commit** | 生成信息后自动提交。 |
| **Auto Push** | 提交后自动推送（需要开启 Auto Commit）。 |
| **Confirm Before Commit** | 自动提交前显示确认对话框，防止误操作。 |
| **Smart Stage** | 开启自动提交时，在生成前暂存当前更改，避免后续编辑进入本次提交（默认：`true`）。 |
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

若 **Base URL** 和 **Model** 留空，插件将根据所选 Provider 自动使用以下默认值：

| 服务商 (Provider) | 默认模型 (Model) | 默认 Base URL |
|----------|---------------|-----------------|
| **OpenAI** | `gpt-5-nano` | `https://api.openai.com/v1` |
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **Moonshot** | `kimi-k2.6` | `https://api.moonshot.cn/v1` |
| **GLM** | `glm-5.1` | `https://open.bigmodel.cn/api/paas/v4` |
| **Gemini** | `gemini-3.5-flash` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **Custom** | - | - |

> OpenRouter 默认使用免费路由模型：`openrouter/free`。

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
