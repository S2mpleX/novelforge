# NovelForge AI — 项目持续开发状态 (PROJECT_STATE.md)

## 1. 当前阶段与基线
- **当前阶段**：Phase 0 (工程基础) & Phase 1 (编辑器与纵向 MVP) 已全面达成
- **版本目标**：V2.0
- **更新时间**：2026-10-13
- **代码库状态**：真实可运行、真实编译通过、真实本地 SQLite 持久化验证通过。

---

## 2. 基础设施与工具链状态
- [x] **Node.js**：v24.14.1
- [x] **包管理器**：pnpm 9.15.4 / npm 11.12.0
- [x] **Rust**：1.95.0 (`x86_64-pc-windows-gnu`)
- [x] **C/C++ 链接工具链**：WinLibs MinGW-w64 (MSVCRT runtime + GCC 16.2.0 + GNU Binutils)，部署于 `E:\tools\winlibs_msvcrt`，免管理员权限，节省 C 盘空间
- [x] **桌面运行时**：Tauri 2 + WebView2 原生后端
- [x] **本地数据库**：SQLite 嵌入式存储，已开启 WAL 模式、外键级联检查与 FTS5 全文搜索支持
- [x] **前端生态**：React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Tiptap 编辑器 + Zustand 状态管理 + Lucide 图标库

---

## 3. 已完成核心功能 (Phase 0 & Phase 1)

### 3.1 本地优先数据库与数据模型
- 完整建立规范化 SQLite 表结构：`novels`, `novel_settings`, `volumes`, `chapters`, `chapter_versions`, `characters`, `character_state_events`, `character_relationships`, `world_rules`, `canon_facts`, `plot_threads`, `ai_providers`, `ai_models`, `usage_records`。
- 严密的外键级联约束与自动版本控制：正文每次修订或手动保存均生成不可逆的历史版本快照，严防用户创作内容丢失。
- 专有验证套件 `db_test` 经过真实执行，100% 验证了小说创建、分章、多版本保存、角色档案、世界观法则及模型网关读取。

### 3.2 现代长篇正文写作环境
- 基于 Tiptap 打造沉浸式中文正文编辑器，配备撤销重做、标题分级、引用、加粗斜体等格式工具条与全屏专注模式。
- 实现真正精准的中文字符计数（剔除空白字符）与 800ms 防抖自动保存机制。
- 支持快捷键 `Ctrl+S` 手动保存快照，并在保存状态指示器上实时反馈（已保存 / 保存中 / 未保存修改 / 失败）。
- 历史版本抽屉（VersionDrawer）：可视化浏览每章的所有历史版本，支持一键安全回退至任意历史草稿。
- 单章 TXT / 全本 Markdown 文件直接导出。

### 3.3 模型网关 (Model Gateway) 与流式接入
- 完整实现 OpenAI-compatible 协议适配器，默认支持本地 CPA 网关（`http://127.0.0.1:8317/v1`）及各类第三方兼容网关。
- 提供 API 连通性真实测试功能，即时测量端点延迟（毫秒级）并读取返回的模型列表。
- 支持 Server-Sent Events (SSE) 逐字流式传输，正文作家 Agent 写作时可实时展示生成过程。
- 允许用户对生成内容进行“追加到文末”、“替换正文”或“复制剪贴板”。

### 3.4 故事设定与世界观基础 (Story Bible)
- 人物档案：记录角色姓名、性格特质、核心动机与身世背景。
- 世界观法则：构建战力体系、地理法则与权威分级（`CANON`, `EXTENDED`, `HYPOTHESIS`）。
- 伏笔悬念追踪：登记埋设的故事线索与预期回收节点。
- 装载 **Humanizer** 叙事技能：系统提示词内嵌叙事守则，坚决剔除 AI 腔调、说明文套话与策划术语外露，保障对话呼吸感与场景质感。

---

## 4. 下一阶段任务规划 (Phase 2 & Phase 3)
1. **Phase 2 世界观与故事深化**：扩展分卷大纲树与故事阶段（Phase -> Volume -> Arc -> Chapter）、人物动态关系拓扑图（React Flow）。
2. **Phase 3 多 Agent 创作编排**：落地主编 Agent、章节编剧 Agent、逻辑审稿 Agent 与文学编辑 Agent 之间的流水线协作调度。
3. **Phase 4 长期记忆引擎**：实现 L0~L4 五层记忆组装算法与跨章节历史事实检索。
