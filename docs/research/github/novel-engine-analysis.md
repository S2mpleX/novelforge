# 开源项目深入剖析：Novel Engine (novel-engine-analysis.md)

- **仓库地址**：`https://github.com/john-paul-ruf/novel-engine`
- **开源许可证**：GNU AGPL v3 (见 `LICENSE`，35,184 字节)
- **技术栈**：Electron Forge + React + TypeScript + Vite + SQLite/FS + Pandoc (DOCX/EPUB)
- **证据级别**：[FACT-SOURCE] 源码与架构实现

---

## 1. 核心架构与设计思想

### 1.1 AI 编辑室团队 (Editorial Team Pairing)
在 `src/infrastructure/agents/` 与 `TECHNICAL.md` 中，Novel Engine 将传统的单一助手分解为一个完整的编辑室体系：
1. **Story Coach (故事教练)**：辅助脑洞探索与核心故事概念打磨；
2. **Ghostwriter (代笔作家 - 角色名 Verity)**：负责依据细纲进行长篇草稿生成；
3. **First Reader (首位读者)**：模拟普通读者的第一反应，提供情感共鸣与节奏反馈；
4. **Developmental Editor (深度结构编辑)**：审查情节漏洞、人物性格动机与篇章结构；
5. **Copy Editor (文字审校)**：逐句审查错别字、标点与文法；
6. **Publisher (出版顾问)**：协助格式排版、元数据配置与投递信 (Query Letter) 撰写。

### 1.2 作者文风档案 (Voice Profile)
- **采访式建档 (Interview Extraction)**：在启动创作前，通过作家角色 Verity 与创作者进行多轮简短问答，提取作者的句式长度偏好、词汇偏好、情绪张力、叙事视角（第一人称/第三人称受限），生成 `Voice Profile`；
- **全链路文风约束**：在正文生成的 System Prompt 中强制注入该 `Voice Profile`，保证生成的章节符合作者的独特语气，避免浓厚的“千篇一律 AI 味”。

### 1.3 15 步从 Pitch 到 Published 的端到端出版管道
- 严格将长篇小说拆分为 15 个连续推进阶段：
  `Pitch` -> `Premise` -> `Story Bible` -> `Characters` -> `Arcs` -> `Chapter Outlines` -> `First Draft` -> `Revisions` -> `Copy Edit` -> `Query Letters` -> `KDP Export`.
- 每阶段产出作为下一阶段的上下文输入。

---

## 2. 核心源码路径与关键证据

| 模块名称 | 关键文件路径 | 核心类 / 接口 | 架构特征 |
| :--- | :--- | :--- | :--- |
| **领域实体定义** | `src/domain/interfaces.ts`, `types.ts` | `IBookService`, `Chapter`, `StoryBible` | 纯净 TypeScript 接口契约 |
| **常态状态机** | `src/domain/constants.ts` | `PIPELINE_STEPS`, `AGENT_ROLES` | 严格固化的 15 步出版生命周期 |
| **文风与提示词** | `prompts/ghostwriter.md`, `style_interview.md` | `VoiceProfile`, `BuildProsePrompt()` | 风格采访与文风约束装配 |
| **多模型适配** | `src/infrastructure/providers/` | `ClaudeCliProvider`, `OllamaProvider` | 支持本地 Ollama 零成本运行与 Claude-Code 接入 |
| **多格式导出** | `src/infrastructure/pandoc/` | `PandocService`, `ExportEpub()`, `ExportDocx()` | 通过 Pandoc 导出符合亚马逊 KDP 规范的电子书 |

---

## 3. 许可证特别警示与合规复用方案 [IMPORTANT]

> [!CAUTION]
> **AGPL v3 强传染性风险**：
> Novel Engine 采用 GNU AGPL v3 许可证。直接复制其任何代码、函数或文件将导致 NovelForge AI 整体代码库产生被强制传染为 AGPL v3 的法律风险。

### 3.1 严格的 Clean-Room 隔离准则
1. **禁止直接复制源码**：不得复制 `src/` 下的任何代码段、样式或提示词；
2. **仅借鉴抽象模式**：
   - 借鉴其**“作者文风档案 (Voice Profile)”**理念：在 NovelForge AI 独立设计基于 Chinese Literary 风格的文风特征模型；
   - 借鉴其**“角色化 AI 编辑室”**分工：与 NovelForge AI 已有的主编、编剧、作家、审稿、润色 Agent 架构结合；
   - 借鉴其**“从创意到成稿的全链路工作流”**思想，融入我们即将开发的本地可视化工作流。
