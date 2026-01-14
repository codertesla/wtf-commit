[English](README.md) | 简体中文

# WTF Commit ✨

[![Open VSX Version](https://img.shields.io/open-vsx/v/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)
[![GitHub Stars](https://img.shields.io/github/stars/codertesla/wtf-commit?style=social)](https://github.com/codertesla/wtf-commit)

WTF Commit 是一款简约的 VS Code 扩展，利用 AI 根据您暂存的更改（或工作区更改）生成简洁且有意义的 Git 提交信息。

## 📥 安装

[**从 Open VSX Registry 安装**](https://open-vsx.org/extension/codertesla/wtf-commit)

## 🚀 功能特性

- **多语言支持**：预设支持 英文、简体中文、繁体中文、日语、文言文，并支持**自定义语言**（如 "French", "Emoji"）。
- **约定式提交**：自动遵循约定式提交标准（feat, fix, docs 等）。
- **智能差异化**：优先处理暂存的更改，若无则回退到工作区更改。
- **多根工作区支持**：在多根工作区中自动检测当前活动文件所属的仓库。
- **自动提交与推送**：全自动化流水线 —— 一键完成生成、提交和推送。
- **键盘快捷键**：默认绑定 `Cmd+Alt+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux)。
- **高度可定制**：可完全自定义系统提示词（Prompt）和自定义 LLM 端点的 Base URL。

## 🛠️ 配置

现在开始使用 WTF Commit，请按照以下步骤操作：

### 1. 设置 API Key 🔑 (安全存储)
您**不再**需要将 API Key 明文写入 `settings.json`。我们将使用 VS Code 的安全存储机制。

1. 打开命令面板 (`Cmd+Shift+P` 或 `Ctrl+Shift+P`)。
2. 输入并运行命令：**`WTF Commit: Set API Key`**。
3. 选择您的 AI 服务商 (例如 `DeepSeek`, `OpenAI`)。
4. 输入您的 API Key。

设置 API Key 后，插件将**自动切换**当前使用的服务商为您所选的这一项。

### 2.配置设置 (可选)
大多数设置项都有合理的默认值。只有当您想要自定义行为时才需要修改。

1. 打开 **设置** (`Cmd+,`)。
2. 搜索 `WTF Commit`。

| 设置项目 | 描述 |
|---------|-------------|
| **Provider** | 选择您的 AI 服务商 (默认为 `OpenAI`)。支持 OpenAI、DeepSeek、Moonshot、GLM、Gemini 和 Custom。选择服务商后，会自动使用其默认的 API 地址和模型。 |
| **Base URL** | **可选**。留空则使用服务商的默认地址。使用 Custom 模式时，可填写完整的接口地址（如 `https://example.com/v1/chat/completions`）。 |
| **Model** | **可选**。留空则使用服务商的默认模型。仅在需要更换模型时填写。 |
| **Auto Commit** | 生成信息后自动提交。 |
| **Auto Push** | 提交后自动推送（需要开启 Auto Commit）。 |
| **Confirm Before Commit** | 自动提交前显示确认对话框。 |
| **Smart Stage** | 当暂存区为空时，自动将工作区所有变更加入暂存区（默认：`true`）。 |
| **Prompt** | AI 使用的系统提示词。 |
| **Language** | 可选择 `English`, `简体中文`, `繁体中文`, `Japanese`, `Classical Chinese (文言文)` 或 `Custom`。 |
| **Custom Language** | 当 **Language** 设置为 `Custom` 时，可手动输入任何语言描述（如 `French`, `Emoji only`, `粤语`）。 |

### 3. 支持的服务商与模型

WTF Commit 内置了主流 AI 服务商的配置。若 **Base URL** 和 **Model** 留空，将自动使用以下默认值：

| 服务商 (Provider) | 默认 Base URL | 默认模型 (Model) |
|----------|-----------------|---------------|
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` |
| **DeepSeek** | `https://api.deepseek.com` | `deepseek-chat` |
| **Moonshot** | `https://api.moonshot.cn/v1` | `kimi-k2-turbo-preview` |
| **GLM** | `https://open.bigmodel.cn/api/paas/v4` | `glm-4.7` |
| **Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash-lite` |
| **Custom** | - | - |

## 🕹️ 使用方法

### 方法 1: 键盘快捷键 ⚡ (推荐)
按下 `Cmd+Alt+G` (Mac) 或 `Ctrl+Alt+G` (Windows/Linux) 立即生成提交信息。

### 方法 2: 源代码管理按钮
在 **源代码管理** 视图（Git 侧边栏）中，点击标题栏中的 ✨ (闪烁) 图标以生成信息。

### 方法 3: 命令面板
1. 打开命令面板 (**Cmd+Shift+P** 或 **Ctrl+Shift+P**)。
2. 输入 `WTF Commit: Generate` 并按回车。

生成的提交信息将自动填充到源代码管理的输入框中。

## 💡 进阶技巧

**想要更快的触发提交？** 您可以将此命令绑定到组合键（连按）：

1. 打开键盘快捷键设置 (`Cmd+K Cmd+S`)
2. 搜索 `WTF Commit: Generate`
3. 双击并连续按下两次 `Cmd+G` (Chord 绑定)

## 📄 开源协议
MIT License.
