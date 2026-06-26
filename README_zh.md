[English](README.md) | 简体中文

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/updates/v1_75)
[![Gemini 3.1 Flash Lite](https://img.shields.io/badge/Gemini-3.1%20Flash%20Lite-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite)
[![DeepSeek V4 Flash](https://img.shields.io/badge/DeepSeek-V4%20Flash-4D6BFE?logo=deepseek&logoColor=white)](https://api-docs.deepseek.com/quick_start/pricing)

链接： [GitHub](https://github.com/codertesla/wtf-commit) | [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) | [插件介绍页](https://codertesla.github.io/wtf-commit/)

WTF Commit 是一款简约的 VS Code 扩展，利用 AI 根据您暂存的更改（或工作区更改）生成简洁且有意义的 Git 提交信息。

## 🆕 最新更新（v1.9.2）

- **Gemini 默认模型**：从 `gemini-3.5-flash` 切换为 GA 版 `gemini-3.1-flash-lite`，成本更低，生成提交信息完全够用。
- **市场徽章**：Gemini 徽章更新为 3.1 Flash Lite；新增 DeepSeek V4 Flash 徽章。
- **模型推荐**：README 新增说明，建议日常提交生成首选轻量模型（Gemini 3.1 Flash Lite、DeepSeek V4 Flash）。

## 🆕 v1.9.1

- **设置页重新排序**：所有设置项按用途分组排序（界面 → 自动化 → 安全确认 → AI 配置 → Diff 过滤），`wtfCommit.uiLanguage` 等不再被埋没。
- **设置描述更清晰**：Auto Commit / Auto Push / Smart Stage / Confirm Before Commit / Confirm Before Push 用加粗分组标签说明依赖关系。
- **Auto Push 自洽引导**：开启 Auto Push 但 Auto Commit 关闭时，提供一键「开启 Auto Commit」操作。

## 🆕 v1.9.0

- **UI 中英双语**：新增 `wtfCommit.uiLanguage` 设置（`en` / `zh`），按钮、提示、通知全部本地化，与提交信息语言相互独立。
- **更安全的错误信息**：裁剪并脱敏 provider 错误体，避免回显的 key/token 泄露给用户。
- **可操作的 auto-push 警告**：Auto Push 开但 Auto Commit 关时，提示带「打开设置」按钮。
- **Push 进度显示 remote/branch**：通知会显示如 `origin/main`。
- **多仓库记忆**：跨会话记住上次使用的仓库，不再每次弹选择器。
- **失败时保留 intent**：生成失败或取消时，你在 SCM 输入框写的提示词会还原，方便重试。

## 🆕 v1.8.0

- **重构与测试**：把 push 失败分类、流式/脱敏等逻辑从 `extension.ts` 抽到可独立测试的模块，并补上单元测试。无用户可见行为变化，便于后续维护与回归。

## 🆕 v1.7.0

- **更聪明的重试**：用指数退避 + 抖动替代固定延迟，并尊重 429/503 响应的 `Retry-After` 头，不再反复撞限流。
- **更严格的提交校验**：识别 `revert:` 类型并强制 72 字符首行上限；AI Repair 会收到具体原因（如「首行 90 字符」），修复后的提示也会精确指出还剩哪些问题。
- **更强的归一化**：去除部分模型给整条消息套上的 加粗/斜体/行内代码/引用 前缀，以及中间的代码围栏空行。
- **完整思维链**：日志中拼接全部 `reasoning_details` 段落，不再只保留第一段。

## 🆕 v1.6.0

- **流式预览**：生成过程中提交信息会实时写入 SCM 输入框，你可以看着雏形成长，跑偏了随时打断；进度通知已做节流，不再频繁跳动。
- **Set API Key 不再强制切换 Provider**：为其它 provider 设置 key 时会先询问是否切换，并在列表中显示脱敏 key 提示（如 `sk-1••••wxyz`），方便区分。
- **混合暂存警告可关闭**：新增 "Don't Remind Me" 选项，永久关闭这条反复出现的提示。
- **首次引导更友好**：关闭欢迎提示不再永久消失，只有明确点 "Don't Show Again" 才会隐藏。

## 🆕 v1.5.0

- **更可控、更安静**：可隐藏状态栏按钮、关闭更新后弹出的 Changelog，并在大型 diff 被裁剪后向用户发出提示。
- **更安全的 Auto Push**：新增推送前二次确认开关，防止一键 自动提交+推送 流程误触。
- **自定义忽略名单**：通过 `wtfCommit.ignorePaths` 排除额外的文件/目录/扩展名（如 `generated`、`*.snap`、`.gen.ts`）。
- **可调上下文上限**：新增 `wtfCommit.maxDiffChars` 与 `wtfCommit.maxUntrackedFiles` 设置。
- **Show Output 命令**：打开插件日志通道，方便排查问题。

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

若 **Base URL** 和 **Model** 留空，插件将根据所选 Provider 自动使用以下默认值：

| 服务商 (Provider) | 默认模型 (Model) | 默认 Base URL |
|----------|---------------|-----------------|
| **OpenAI** | `gpt-5-nano` | `https://api.openai.com/v1` |
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **Moonshot** | `kimi-k2.6` | `https://api.moonshot.cn/v1` |
| **GLM** | `glm-5.1` | `https://open.bigmodel.cn/api/paas/v4` |
| **Gemini** | `gemini-3.1-flash-lite` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **Custom** | - | - |

> OpenRouter 默认使用免费路由模型：`openrouter/free`。

> **模型推荐**：生成 Git 提交信息对智能程度要求不高，不必使用前沿大模型。日常使用时，建议选择性价比更高的轻量模型，例如 **Gemini 3.1 Flash Lite**（`gemini-3.1-flash-lite`）或 **DeepSeek V4 Flash**（`deepseek-v4-flash`）。

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
