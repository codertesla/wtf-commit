[English](README.md) | 简体中文

# WTF Commit ✨

[![Visual Studio Marketplace Version](https://badgen.net/vs-marketplace/v/CoderTesla.wtf-commit)](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)
[![Visual Studio Marketplace Installs](https://badgen.net/vs-marketplace/i/CoderTesla.wtf-commit)](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/codertesla/wtf-commit)](https://open-vsx.org/extension/codertesla/wtf-commit)
[![License](https://img.shields.io/github/license/codertesla/wtf-commit)](https://github.com/codertesla/wtf-commit)

链接： [GitHub](https://github.com/codertesla/wtf-commit) · [VS Marketplace](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit) · [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) · [插件介绍页](https://codertesla.github.io/wtf-commit/)

**一个快捷键：几秒内写完提交信息、完成提交、可选推送。**

WTF Commit 读取你的 `git diff`，生成规范 Conventional Commit（如 `feat: add dark mode`），写入源代码管理输入框并在同一按键下直接 commit——开启 Auto Push 后连推送一起完成。不再为「提交信息写什么」卡壳，告别手打模板。

**流程：** `git diff → ✨ 快捷键 → 生成信息 → commit →（可选）push`

| | |
|:--|:--|
| ⚡ **约 1 分钟配置** | 粘贴一次自己的 API Key（默认 DeepSeek） |
| 🎁 **OpenCode Go（可选）** | 同一 Flash 模型——经[我们的链接](https://opencode.ai/go?ref=J9E8732NMP)订阅额外 +**$5** Go 额度，提交计入 Go 配额 |
| 🔑 **自带 Key，无锁定** | DeepSeek / OpenAI / Gemini / OpenRouter，或任意 OpenAI 兼容端点（Ollama、代理），无需订阅 |
| 🚀 **一键流水线** | Auto Commit 默认开；开启 Auto Push 后一次快捷键「生成 → 提交 → 推送」 |
| 🖥️ **全编辑器可用** | VS Code（Marketplace 自动更新）、Cursor、VSCodium、其他 Open VSX 编辑器。MIT 免费开源，持续维护 |

**已安装？** 直接看 [① 配置 AI](#-配置-ai只需一次)（约 1 分钟）→ [② 日常使用](#-日常使用每次提交)。

### 安装方式

| 编辑器 | 如何安装 | 更新 |
|--------|----------|------|
| **VS Code** | 扩展市场搜索 **`WTF Commit`** → 安装（[Marketplace 页面](https://marketplace.visualstudio.com/items?itemName=CoderTesla.wtf-commit)） | **自动更新**（微软市场） |
| **Cursor / VSCodium** | 扩展市场搜索 **`WTF Commit`** → 安装（[Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit)） | 自动更新（Open VSX） |

**VSIX（可选 / 离线）：** 从 [GitHub Releases](https://github.com/codertesla/wtf-commit/releases) 或上述市场下载 `.vsix`，扩展视图 → **⋯** → **从 VSIX 安装…**，或拖入「已安装」列表。手动 VSIX **不会**自动更新；能通过市场安装时，请优先使用市场。

## ① 配置 AI（只需一次）

默认设置就够了：**Provider = DeepSeek**，你只需要一个 Key。

1. **安装** — 在编辑器扩展视图搜索 **`WTF Commit`**（VS Code 或 Cursor）。
2. **设置 API Key** — 命令面板 → **`WTF Commit: Set API Key`**，然后：
   - 第一项就是**当前服务商**（会显示 Key 是否已设置）；要换别的服务商，选 **选择其他服务商…**。
   - 首次设置会出现向导：**我已有 Key，开始粘贴** 直接回车即可；还没有 Key 就选 **打开申请页** —— 浏览器打开后向导会留在原地，拿到 Key 回来继续粘贴就行。
   - 粘贴 Key 时输入框遮罩显示并带实时校验（能拦下复制不全、混入空格等明显错误）；保存成功后在状态栏回显掩码（如 **`sk-ab••••wxyz`**）方便核对。
   - 若设置的是**其他服务商**的 Key，会询问是否**切换 Provider**。
3. 还没有 Key？[DeepSeek API keys](https://platform.deepseek.com/api_keys)（扩展内也可一键打开）。

> 以后要用别的服务商：在 Set API Key 里选 **选择其他服务商…**，或在设置里改 **Provider**。内置服务商请把 **Model** 留空。

## ② 日常使用（每次提交）

**快捷键会做什么：** 优先使用**已暂存**的变更 → 若暂存区为空且开启 Auto Commit，则**自动 stage 工作区** → 生成约定式提交信息 → **自动 commit**（默认）→ **不 push**（Auto Push 默认关）。

1. 改完代码（尽量先 stage）。
2. 按下生成快捷键 — 提交信息流式写入输入框，默认直接 **commit**。
3. 需要推远程时再 push — **Auto Push 默认关闭**。

**默认快捷键：** `Cmd+Alt+G`（Mac）/ `Ctrl+Alt+G`（Windows/Linux）。

**改成你顺手的键** — 快捷键完全可自定义。很多 Cursor 用户喜欢设置成 **连按两次 `Cmd+G` / `Ctrl+G`**：

1. 打开键盘快捷键（`Cmd+K Cmd+S` / `Ctrl+K Ctrl+S`）。
2. 搜索 **`WTF Commit: Generate`**。
3. 双击键位 → **连续按两次 `Cmd+G`**（Windows/Linux 为两次 `Ctrl+G`）→ 回车。

**老手一键流（可选）：** 设置里打开 **Auto Push**。建议先保留 **Confirm Before Push**，等用熟了再关掉，即可一次快捷键走完「生成 → 提交 → 推送」。

其它入口：源代码管理标题栏的 ✨，或命令面板 → **`WTF Commit: Generate`**。

> 只想生成提交信息、自己点提交？把 **Auto Commit** 关掉即可。

## 🆕 最新更新（v1.19.3）

- **文档与定价同步**：更新文档中的 OpenCode Go 定价说明，移除已下线的首月特惠，同步为标准 $10/月 订阅说明。

> 完整历史见 [CHANGELOG](CHANGELOG.md)。

## 功能特性

- **约定式提交** — `feat` / `fix` / `docs` / …，支持本地格式修复 + 自动 AI 修复。
- **智能 diff** — 优先使用暂存区；Auto Commit 开启且暂存区为空时，自动 stage 工作区。
- **意图感知** — 把你已写在 SCM 输入框里的文字当作提示（无需额外表单）。
- **流式预览** — 生成过程实时显示。
- **自动提交与推送** — 可选一键全流程，推送前可确认。
- **多语言提交信息** — 英文、简体/繁体中文、日语、文言文或 **Custom**。
- **自定义端点** — 内置多家服务商 + **Custom**（Ollama、中转等）。
- **快捷键** — 默认 `Cmd+Alt+G` / `Ctrl+Alt+G`，可按自己的习惯修改（例如连按两次 `Cmd+G`）。

---

## 🛠️ 进阶教程

### 1. 更多设置项
进入 VS Code **设置** (`Cmd+,`)，搜索 `WTF Commit`。设置分为 **WTF Commit**（基础）与 **WTF Commit › Advanced**（高级）。

**基础** — 大多数人只需要这些：

| 设置项目 | 描述 |
|---------|-------------|
| **Commit Message Language** | 生成的提交信息语言。 |
| **Provider** | AI 服务商（默认 DeepSeek）。 |
| **Auto Commit** | **默认开启** — 生成后自动 commit。关闭后只写入 SCM 输入框，由你自己提交。 |
| **Auto Push** | **默认关闭** — 开启后自动推送（需同时开启 Auto Commit）。 |
| **Confirm Before Push** | **默认开启** — 自动推送前询问；老手可以关掉，实现完全一键。 |

**高级** — Custom 的 Base URL/Model、Provider Overrides、ignore paths、状态栏开关等。

> 插件界面语言跟随 VS Code（`vscode.env.language`）：`zh*` → 中文，其余显示英文。以下进阶设置只能在 `settings.json` 里改：`wtfCommit.prompt`；以及当 Commit Message Language 为 `Custom` 时的 `wtfCommit.customCommitMessageLanguage`。

### 2. 自定义模型与端点
使用任意 OpenAI 兼容模型（如本地 Ollama）：

1. 在设置中将 **Provider** 设为 `Custom`。
2. 在 **WTF Commit › Advanced** 中填写 **Base URL**（例如 `http://localhost:11434/v1`）。
3. 填写 **Model**（例如 `llama3`）。

若要覆盖内置服务商的端点/模型，请使用 **Provider Overrides**（不要改全局 Base URL / Model）。

### 3. 自定义提交语言
如果你想让 AI 使用特定的语言（如粤语、法语或仅使用 Emoji）生成提交信息：

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

**默认值说明**（注意区分三个概念）：

| 术语 | 含义 |
|------|------|
| **默认服务商** | **DeepSeek** — 首次安装、设置里的 **Provider** 保持默认时使用。 |
| **服务商默认** | 每个内置 Provider 有各自的默认 **Model** 与 **Base URL**（见下表）。仅当该 Provider **被选中**，且未设置 **Provider Overrides**（或 Custom 的 Base URL/Model）时生效。 |
| **我们的推荐** | 针对生成提交信息的场景做的推荐（见[如何选型](#提交信息场景如何选型)）— DeepSeek 与 OpenCode Go 都推荐；这和扩展的「默认服务商」不是同一个概念。 |

**各服务商默认模型** — 当 **Base URL** 和 **Model** 留空时：

<!-- provider-manifest:start -->
| 服务商 (Provider) | 默认模型 (Model) | 默认 Base URL |
|----------|---------------|-----------------|
| **DeepSeek** | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **OpenCode Go** | `deepseek-v4-flash` | `https://opencode.ai/zen/go/v1` |
| **Gemini** | `gemini-3.5-flash-lite` | `https://generativelanguage.googleapis.com/v1beta` |
| **OpenAI** | `gpt-5.6-luna` | `https://api.openai.com/v1` |
| **OpenRouter** | `openrouter/free` | `https://openrouter.ai/api/v1` |
| **Custom** | - | - |
<!-- provider-manifest:end -->

### 获取 API Key

| 服务商 | 获取 API Key |
|--------|-------------|
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |
| **OpenCode Go** | [订阅 / 获取 Key](https://opencode.ai/go?ref=J9E8732NMP)（额外 +$5 Go 额度）· [定价文档](https://opencode.ai/docs/zh-cn/go) |
| **Gemini** | [aistudio.google.com/api-keys](https://aistudio.google.com/api-keys) |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) |

> 其它 OpenAI 兼容 API（MiMo、GLM、Z.AI、NVIDIA NIM、中转）：将 **Provider** 设为 **Custom**，在 Advanced 填写 **Base URL** 与 **Model**；或用 **OpenRouter**。

### 提交信息场景如何选型

生成 Git 提交信息对模型智能要求不高，不必使用前沿大模型。按 **场景需求**、**成本偏好** 和是否已有 API Key 选择即可：

**推荐选型路径：**

1. 🎯 **国内直连 / 极简开箱（推荐）** 👉 **DeepSeek**（`deepseek-v4-flash`）
   - **默认服务商**；设置中 **Model** 留空。
   - 支持微信/支付宝充值、国内网络直连、纯按量计费（无月租门槛，充 $5 可用大半年）。
   - 扩展已自动关闭思考模式，生成极速，对中文与 Conventional Commits 格式理解精准。
2. 🎁 **已有编程订阅 / 海外网络（推荐）** 👉 **OpenCode Go**（`deepseek-v4-flash`）
   - 若已有或打算开通 [OpenCode Go](https://opencode.ai/go?ref=J9E8732NMP) 订阅（经链接订阅可额外获 **$5** 额度）：**Provider** 选 **OpenCode Go**，填入 Go Key。
   - 全球多节点海外访问极稳，提交消耗计入每月包含的 **$30** Flash 额度，无需再给 DeepSeek 充值。
3. 🆓 **零成本白嫖** 👉 **Gemini**（`gemini-3.5-flash-lite`）
   - Google AI Studio 提供 15 RPM / 1M TPD 慷慨免费层；使用 Google 原生 Interactions API，首字延迟秒级响应。
4. 🔑 **已有官方 API Key** 👉 **OpenAI**（`gpt-5.6-luna`）
   - 新一代性价比主力模型，指令遵循最稳健，格式合格率极高。
5. 🧪 **零门槛尝鲜 / 自定义端点** 👉 **OpenRouter**（`openrouter/free` 免费试用）或 **Custom**（本地 Ollama、MiMo、GLM、企业网关等）。

**DeepSeek vs OpenCode Go（同一模型）：** `deepseek-v4-flash` 的标价与 DeepSeek 官方 API 一致（闲时输入 **$0.22** / 输出 **$0.66**，高峰输入 **$0.44** / 输出 **$1.32** / 百万 tokens）。Go 在标价上**并不**更便宜——优势在订阅：**$10**/月，含 **$30**/月 的 Flash 使用额度（约 **3 倍**订阅价值；按其公布的口径估算，约 3.78 万次 Agent 风格请求/月）。如果只是写提交信息、用量很轻，官方 DeepSeek 按量付费仍然更省；如果你已经在付 Go 订阅，那就用 **OpenCode Go**，提交消耗计入订阅额度。

**价格对比**（美元 / 百万 tokens，输入按未命中缓存计价；来源见文末链接）：

| 服务商 | 模型 | 输入 | 输出 | 约单次成本† | 说明 |
|--------|------|-----:|-----:|------------:|------|
| **OpenRouter** | `openrouter/free` | $0 | $0 | ~$0 | 零成本试用；质量与延迟不稳定 |
| **DeepSeek** | `deepseek-v4-flash` | $0.22 / $0.44* | $0.66 / $1.32* | ~$0.0012 / ~$0.0024* | **默认** — 按量付费；闲时享受 5 折优惠 |
| **OpenCode Go** | `deepseek-v4-flash` | $0.22‡ / $0.44*‡ | $0.66‡ / $1.32*‡ | ~$0.0012‡ / 额度内约 $0 | **推荐**（已有 Go 时）— 标价相同；$10/月约含 $30 Flash 额度（~3×） |
| **OpenAI** | `gpt-5.6-luna` | $0.20 | $1.20 | ~$0.0012 | OpenAI 服务商默认 |
| **Gemini** | `gemini-3.5-flash-lite` | $0.30 | $2.50 | ~$0.0019 | 备选；[免费额度](https://ai.google.dev/gemini-api/docs/pricing) 慷慨 |

* DeepSeek 与 OpenCode Go 实行高峰/闲时阶梯计价（UTC 01:00–04:00 与 06:00–10:00，即北京时间工作日 09:00–12:00 与 14:00–18:00 为高峰，其余时段为闲时 5 折）。

† 按 **约 5K 输入 + 150 输出 tokens** 估算。实际成本取决于 diff 大小与模型输出长度。

‡ OpenCode Go 按与 DeepSeek 相同的 Flash 标价计量订阅额度（见 [Go 定价](https://opencode.ai/docs/zh-cn/go)）；额度内，写提交信息的边际成本约等于 $0，直到用完 Go 额度。

官方定价：[DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) · [OpenCode Go](https://opencode.ai/docs/zh-cn/go) · [Gemini](https://ai.google.dev/gemini-api/docs/pricing) · [OpenAI](https://developers.openai.com/api/docs/pricing) · [OpenRouter](https://openrouter.ai/models)

> OpenRouter 的**服务商默认**为 `openrouter/free`。

> Gemini 使用 Google 原生 Interactions REST API（`/v1beta/interactions`），通过 `x-goog-api-key` 请求头认证，并将思考等级设为 `minimal`，以降低生成提交信息时的延迟。

> 如果你从还内置 MiMo / GLM / Z.AI / NVIDIA NIM 的旧版本升级：扩展会把对应 Provider 迁移为 **Custom**，并自动填入 Base URL / Model。

> [!IMPORTANT]
> **关于 Claude**: 目前**暂不支持** Claude 原生格式。请使用支持 OpenAI 兼容端点的中转服务。

## 🕹️ 其它入口

- **源代码管理**标题栏 ✨ · 命令面板 **`WTF Commit: Generate`** · 可自定义快捷键（见[日常使用](#②-日常使用每次提交)）。
- 想更换密钥，随时运行 **`WTF Commit: Set API Key`**。

## 💬 反馈与支持

如果 WTF Commit 对你有用：点个 [GitHub Star](https://github.com/codertesla/wtf-commit)、在 [Open VSX](https://open-vsx.org/extension/codertesla/wtf-commit) 留一句评价，或开一个简短的 [Issue](https://github.com/codertesla/wtf-commit/issues)（Bug / 想法），都能帮更多人发现它，也方便我们持续改进。

## 📄 开源协议
MIT License.
