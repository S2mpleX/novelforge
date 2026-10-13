# NovelForge AI — 项目持续开发状态 (PROJECT_STATE.md)

## 1. 当前阶段与基线
- **当前阶段**：Phase 0 (工程基础)、Phase 1 (编辑器与纵向 MVP)、Phase 2 (世界观与故事深化) & Phase 3 (多 Agent 协作与编排系统) **已全面达成**
- **版本目标**：V2.0
- **更新时间**：2026-10-13
- **代码库状态**：真实可运行、真实编译通过 (Rust 零错误零警告，前端 Vite 358ms 打包零错误)、真实本地 SQLite 持久化验证 100% 通过。

---

## 2. 基础设施与工具链状态
- [x] **Node.js**：v24.14.1
- [x] **包管理器**：pnpm 9.15.4 / npm 11.12.0
- [x] **Rust**：1.95.0 (`x86_64-pc-windows-gnu`)
- [x] **C/C++ 链接工具链**：WinLibs MinGW-w64 (MSVCRT runtime + GCC 16.2.0 + GNU Binutils)，部署于 `E:\tools\winlibs_msvcrt`，免管理员权限，节省 C 盘空间
- [x] **桌面运行时**：Tauri 2 + WebView2 原生后端
- [x] **本地数据库**：SQLite 嵌入式存储，已开启 WAL 模式、外键级联检查与 FTS5 全文搜索支持
- [x] **前端生态**：React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Tiptap 编辑器 + Zustand + Lucide 图标库 + **@xyflow/react (React Flow 拓扑图谱)**

---

## 3. 已完成核心功能矩阵

### 3.1 本地优先数据库与规范化数据模型 (Phase 0/1/2/3)
- 完整建立规范化 SQLite 表结构：`novels`, `novel_settings`, `volumes`, `chapters`, `chapter_versions`, `characters`, `character_state_events`, `character_relationships`, `world_rules`, `canon_facts`, `plot_threads`, `story_phases`, `story_arcs`, `scenes`, `story_events`, `review_reports`, `review_findings`, `ai_providers`, `ai_models`, `usage_records`。
- 严密的外键级联约束与自动版本控制：正文每次修订或手动保存均生成不可逆的历史版本快照，严防用户创作内容丢失。
- 专有验证套件 `db_test` 真实执行 13 项核心测试，100% 验证了小说创建、分章、多版本保存、角色档案、世界观法则、模型网关、角色关系拓扑、大纲阶段、剧情弧、场景细纲拆解、逻辑审稿报告与发现入库。

### 3.2 现代长篇正文写作环境 (Phase 1)
- 基于 Tiptap 打造沉浸式中文正文编辑器，配备撤销重做、标题分级、引用、加粗斜体等格式工具条与全屏专注模式。
- 实现真正精准的中文字符计数（剔除空白字符）与 800ms 防抖自动保存机制。
- 支持快捷键 `Ctrl+S` 手动保存快照，并在保存状态指示器上实时反馈（已保存 / 保存中 / 未保存修改 / 失败）。
- 历史版本抽屉（VersionDrawer）：可视化浏览每章的所有历史版本，支持一键安全回退至任意历史草稿。
- 单章 TXT / 全本 Markdown 文件直接导出。

### 3.3 模型网关 (Model Gateway) 与流式接入 (Phase 1)
- 完整实现 OpenAI-compatible 协议适配器，默认支持本地 CPA 网关（`http://127.0.0.1:8317/v1`）及各类第三方兼容网关。
- 提供 API 连通性真实测试功能，即时测量端点延迟（毫秒级）并读取返回的模型列表。
- 支持 Server-Sent Events (SSE) 逐字流式传输，正文作家 Agent 写作时可实时展示生成过程。
- 允许用户对生成内容进行“追加到文末”、“替换正文”或“复制剪贴板”。

### 3.4 世界观与故事设定管理 (Story Bible) & 人物动态关系拓扑图 (Phase 2)
- **人物关系拓扑图 (React Flow)**：基于 `@xyflow/react` 打造沉浸式拓扑画布，展示角色节点与连线（生死战友、同门师徒、宿命仇敌、情投意合、利益结盟、主仆隶属），支持自由拖拽排列、拉线建立关联、点击删除连线并持久化于 SQLite。
- **大纲与剧情弧线规划 (Plot Arcs)**：按宏观故事阶段 (StoryPhase) 划分剧情弧线 (StoryArc)，支持主线/支线/角色弧/世界揭秘分类，支持剧情弧状态流转（规划中 -> 展开推进中 -> 已完结）。
- **世界观法则**：构建战力体系、地理法则与权威分级（`CANON`, `EXTENDED`, `HYPOTHESIS`）。
- **伏笔悬念追踪**：登记埋设的故事线索与预期回收节点。

### 3.5 多 Agent 协作创作与审稿系统 (Phase 3)
- **独立提示词中心 (`prompts/`)**：建立 `editor_in_chief.md`, `plot_architect.md`, `scene_planner.md`, `prose_writer.md`, `continuity_auditor.md`, `style_editor.md`, `memory_curator.md`，实现彻底的职责隔离与结构化 Schema 约束。
- **装载 Humanizer 叙事法则**：彻底剔除 AI 说明文腔调与空洞概括，严禁游戏策划/引擎术语外露，精修微表情与对话呼吸感。
- **多 Agent 协同流水线 (Collaborative Pipeline)**：
  - 编剧 (Scene Planner)：将章节目标拆解为结构化场景 (Scenes) 节拍
  - 作家 (Prose Writer)：依据场景节拍生成长篇初稿草稿并保存为不可逆版本快照
  - 审稿 (Continuity Auditor)：自动执行逻辑一致性质检并生成审稿报告
- **逻辑审稿报告 (Continuity Auditor)**：审查正文与人物动机、世界观规则 (Canon)、时间线与因果的一致性，输出 0~100 健康度得分及结构化 Findings，标记严重等级（CRITICAL / MAJOR / MINOR / SUGGESTION），展示原文证据引用与整改建议。
- **文学编辑润色 (Style Editor)**：并排对比【原文段落】vs【精修润色】，展示优化理由，支持一键采纳替换或复制。

---

## 4. 下一阶段任务规划 (Phase 4 & Phase 5)
1. **Phase 4 长期记忆引擎 (Memory Engine)**：实现 L0 (工作记忆) ~ L4 (历史全知记忆 SQLite FTS5) 五层记忆提取与检索组装，自动定稿记忆沉淀。
2. **Phase 5 自动连载引擎 (Serialization Engine)**：滚动式长篇剧情规划 (Rolling Planner)，任务队列持久化，Token 与费用预算控制，无人值守安全中断与恢复。
3. **Phase 6 & 7 发布完善**：DOCX / EPUB 导出、数据备份与灾备恢复。
