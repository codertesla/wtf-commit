[English](README.md) | 简体中文

# WTF Commit ✨

WTF Commit 是一款简约的 VS Code 扩展，利用 AI 根据您暂存的更改（或工作区更改）生成简洁且有意义的 Git 提交信息。

## 🚀 功能特性

- **多服务商支持**：兼容 OpenAI, DeepSeek, Moonshot (Kimi), Zhipu GLM 以及任何兼容 OpenAI 接口的服务。
- **双语支持**：支持生成 **英文** 和 **中文** 的提交信息。
- **约定式提交**：自动遵循约定式提交标准（feat, fix, docs 等）。
- **智能差异化**：优先处理暂存的更改，若无则回退到工作区更改。
- **自动提交与推送**：全自动化流水线 —— 一键完成生成、提交和推送。
- **键盘快捷键**：默认绑定 `Cmd+Alt+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux)。
- **高度可定制**：可完全自定义系统提示词（Prompt）和自定义 LLM 端点的 Base URL。

## 🛠️ 配置

在开始使用 WTF Commit 之前，您需要配置您的 AI 服务商和 API Key。

1. 打开 **设置** (Cmd+, 或 Ctrl+,)。
2. 搜索 `WTF Commit`。
3. 配置以下字段：

| 设置项目 | 描述 |
|---------|-------------|
| **Auto Commit** | 生成信息后自动提交。 |
| **Auto Push** | 提交后自动推送（需要开启 Auto Commit）。 |
| **Confirm Before Commit** | 自动提交前显示确认对话框。 |
| **Prompt** | AI 使用的系统提示词。 |
| **Language** | 选择 `English` 或 `中文`。 |
| **Provider** | 选择您的 AI 服务商 (OpenAI, DeepSeek, Moonshot, GLM 或 Custom)。 |
| **Base URL** | API 终结点（已知服务商会自动填充）。 |
| **Model** | 模型名称（如 `gpt-4o-mini`, `deepseek-chat`）。 |
| **Api Key** | 所选服务商的 API 密钥。 |

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
