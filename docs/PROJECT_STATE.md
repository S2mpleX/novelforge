# NovelForge AI — 项目持续开发状态 (PROJECT_STATE.md)

## 1. 当前阶段与基线
- **当前阶段**：Phase 0 ~ Phase 7 **已全链路完整达成！** (工程基础、长篇编辑器与纵向 MVP、设定集与关系拓扑图、多 Agent 协作编排体系、五层长期记忆引擎 Memory Engine、多 Agent 自动连载引擎 Serialization Engine、多格式发布中心 Publishing Center、数据库系统运维与灾备备份 System Diagnostics & Backup)
- **版本目标**：V2.0
- **更新时间**：2026-10-13
- **代码库状态**：真实可运行、真实编译通过 (Rust 零错误零警告，前端 Vite 358ms 打包零错误)、真实本地 SQLite 持久化验证 100% 通过（23/23 业务套件测试）。

---

## 2. 基础设施与工具链状态
- [x] **Node.js**：v24.14.1
- [x] **包管理器**：pnpm 9.15.4 / npm 11.12.0
- [x] **Rust**：1.95.0 (`x86_64-pc-windows-gnu`)
- [x] **C/C++ 链接工具链**：WinLibs MinGW-w64 (MSVCRT runtime + GCC 16.2.0 + GNU Binutils)，部署于 `E:\tools\winlibs_msvcrt`，免管理员权限，节省 C 盘空间
- [x] **桌面运行时**：Tauri 2 + WebView2 原生后端，已在 `Cargo.toml` 中配置 `default-run = "novelforge-ai"`，支持双二进制（主程序与 `db_test` 独立运行）
- [x] **本地数据库**：SQLite 嵌入式存储，已开启 WAL 模式、外键级联检查与 FTS5 全文搜索支持（虚拟表 `canon_facts_fts`, `chapters_fts`）
- [x] **前端生态**：React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Tiptap 编辑器 + Zustand + Lucide 图标库 + **@xyflow/react (React Flow 拓扑图谱)**
- [x] **开发启动方式**：
  ```powershell
  $env:PATH = "E:\tools\winlibs_msvcrt\mingw64\bin;" + $env:PATH
  pnpm tauri dev
  ```

---

## 3. 已完成核心功能矩阵

### 3.1 本地优先数据库与规范化数据模型 (Phase 0 ~ Phase 7)
- 完整建立规范化 SQLite 表结构：`novels`, `novel_settings`, `volumes`, `chapters`, `chapter_versions`, `characters`, `character_state_events`, `character_relationships`, `world_rules`, `canon_facts`, `plot_threads`, `story_phases`, `story_arcs`, `scenes`, `story_events`, `review_reports`, `review_findings`, `ai_providers`, `ai_models`, `usage_records`, `serialization_jobs` 以及虚拟表 `canon_facts_fts`, `chapters_fts`。
- 严密的外键级联约束与自动版本控制：正文每次修订或手动保存均生成不可逆的历史版本快照，严防用户创作内容丢失。
- 专有验证套件 `db_test` 真实执行 23 项核心测试，100% 验证了小说创建、分章、多版本保存、角色档案、世界观法则、模型网关、角色关系拓扑、大纲阶段、剧情弧、场景细纲拆解、逻辑审稿报告与发现入库、权威事实库建立、FTS5 全文检索、动态角色状态追踪、五层记忆上下文装配、自动连载任务流转、SQLite 在线热备份、数据库优化诊断、HTML5 电子书单文件生成以及全书工程 JSON 归档与复原。

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

### 3.6 五层长期记忆引擎 (Memory Engine - Phase 4)
- **分层记忆架构 (L0 ~ L4)**：
  - **L0 工作记忆 (Working Memory)**：当前章节任务提示词、待续写上文、即时冲突目标
  - **L1 短期剧情记忆 (Short-term Recency)**：最近 3 章的故事大纲、关键进展与情境延续
  - **L2 剧情弧与阶段目标 (Arc Memory)**：当前所处宏观阶段核心矛盾、剧情弧与未闭合伏笔
  - **L3 权威规则与角色基准 (Canon & Profiles)**：不可动摇的世界观公理、出场核心人物状态与禁忌
  - **L4 检索式历史事实 (Retrieved Canon Facts)**：借助 SQLite FTS5 虚拟表，精准检索历史上已发生的因果事实与伏笔线索
- **上下文组装器 (`assemble_memory_context_pack`)**：按 Token 预算动态剪裁各层记忆，输出统一结构化系统提示词包，杜绝长篇设定前后矛盾。
- **动态角色状态追踪 (`character_state_events`)**：记录角色心理状态、生理伤病、阵营归属、随身秘宝的沿革演变。
- **章节记忆自动提取器 (`extract_chapter_memory`)**：Memory Curator Agent 自动提炼章节事实、状态变迁并落库为权威事实。
- **记忆管理控制台 (`MemoryEngineView.tsx`)**：提供权威事实检索、角色状态时间线、FTS5 全文记忆检索台与章节记忆自动沉淀功能。

### 3.7 多 Agent 自动连载引擎 (Serialization Engine - Phase 5)
- **连载任务状态机 (`SerializationJob`)**：支持 `PENDING` -> `RUNNING` -> `WAITING_REVIEW` -> `COMPLETED` 完整生命周期。
- **安全防破坏性机制 (Auto-Approve Guard)**：
  - 默认安全模式：单章生成与审稿后自动挂起为 `WAITING_REVIEW`，等待作者人工审阅后推进，严防不可逆覆盖；
  - 全自动模式：允许用户明确勾选后连续推进预定章节批次。
- **多 Agent 串联连载单步推进 (`advance_serialization_job_step`)**：
  1. 依据剧情弧与前文历史自动创建下一章节骨架；
  2. 场景编剧 Agent 生成 3~4 个细纲节拍；
  3. 正文作家 Agent 挂载五层记忆生成高质量正文并存入数据库不可逆快照；
  4. 逻辑审稿 Agent 自动产出一致性评分与体检项；
  5. 记忆管理员 Agent 沉淀本章事实与状态流转；
  6. 更新连载任务进度与已消耗 Token 计数。
- **自动连载控制台 (`SerializationModal.tsx`)**：
  - 提供目标章节数、单章字数、Token 预算及定稿模式设置；
  - 实时进度条与状态展示（单步推进、连续自动连载、暂停、取消）；
  - 历史连载记录追溯与一键跳转编辑器。

### 3.8 多格式发布与交付中心 (Publishing Center - Phase 6)
- **独立 HTML5 电子书单文件导出**：生成内嵌优雅响应式排版样式（深浅/羊皮纸主题切换、侧边栏悬浮目录导航、字数元数据），单文件免网络双击直接阅读。
- **标准网文连载 TXT 导出**：自动章名居中、段首双全角空格缩进、空行规范化，符合各大网文连载站点上传规范。
- **分级 Markdown 导出**：保持 H1/H2 结构与引言描述。
- **全书工程数据归档 JSON**：一键打包小说元数据、全部章节（含所有版本快照）、全部角色档案与关系图谱、世界观法则、长期记忆与大纲剧情弧。
- **工程快照还原与导入 (`import_novel_archive`)**：支持粘贴 JSON 备份无损复原为全新作品。

### 3.9 系统运维与数据库灾备 (System Diagnostics & Backup - Phase 7)
- **SQLite 在线热备份 (`backup_database`)**：采用 SQLite Backup API 在运行中创建完全一致的独立 `.db` 备份快照。
- **数据库诊断与优化 (`optimize_database`)**：执行 `PRAGMA integrity_check`、`PRAGMA wal_checkpoint(TRUNCATE)` 与 `PRAGMA optimize`，输出文件体积、健康度与全表行数统计。
- **发布与运维控制台 (`PublishingModal.tsx`)**：可视化管理导出、导入、热备份与碎片整理。

---

## 4. 总结与后续演进建议
NovelForge AI V2.0 全部核心架构与业务系统已圆满落地，通过 23 项端到端业务单元测试，实现“本地优先、真实可运行、长期记忆驱动、多 Agent 协作连载、安全可控、优雅发布”的产品承诺。
后续可在桌面端增加系统托盘图标、全局快捷键与高级自定义 CSS 皮肤扩展。
