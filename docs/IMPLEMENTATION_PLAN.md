# NovelForge AI — 实施路线规划 (IMPLEMENTATION_PLAN.md)

本文档制定 NovelForge AI V2.0 系统的分阶段工程落地规划。

---

## 里程碑规划总览

```
[Phase 0: 工程基础与架构规范] (进行中)
  ├── 开发环境确认 (Rust gnu/msvc, Node, pnpm, Git)
  ├── Tauri 2 + React + Vite + Tailwind + TypeScript 基础搭建
  ├── SQLite 架构设计与迁移准备 (WAL, FTS5)
  └── 规范与状态文档输出 (AGENTS.md, PROJECT_STATE.md 等)

[Phase 1: 小说编辑器与单章生成纵向 MVP] (首要任务)
  ├── 小说项目管理 (创建、列表、基础设置)
  ├── 卷与章节目录树管理
  ├── Tiptap 核心正文编辑器 (字数统计、撤销重做、自动保存)
  ├── 章节版本历史管理 (不可逆丢失防护)
  ├── OpenAI-compatible API 网关 (配置持久化、连接测试、流式生成)
  ├── 单章 AI 流式生成与上下文注入
  └── 正文 TXT / Markdown 导出

[Phase 2: 世界观与故事设定管理 (Story Bible)]
  ├── 角色档案系统 (静态属性 + 随章节演变动态状态)
  ├── 角色关系图谱 (类型、描述、生效时间)
  ├── 世界观架构 (规则权威分级、实体管理、冲突检测)
  ├── 故事阶段与分卷大纲系统 (Phase -> Volume -> Arc -> Chapter)
  └── 伏笔与悬念追踪管理 (已埋设、发展中、待回收)

[Phase 3: 多 Agent 协作与编排系统 (Orchestrator)]
  ├── Agent Registry (主编、章节编剧、正文作家、逻辑审稿、记忆管理员)
  ├── 统一 Agent 契约与结构化 Schema 验证
  ├── 提示词模板注册中心 (Prompt Registry & Versioning)
  ├── 调度档位策略 (快速 / 标准 / 精细)
  └── 审稿报告与差异比对修订系统

[Phase 4: 五层长期记忆引擎 (Memory Engine)]
  ├── L0 (工作记忆) ~ L4 (历史检索记忆 SQLite FTS5)
  ├── 权威事实库 (Canon Facts: 范围、权威等级、生效区间)
  ├── 时间线与因果拓扑
  ├── 动态 Context Pack 组装算法
  └── 章节定稿记忆自动提取与候选审核工作流

[Phase 5: 自动连载引擎 (Serialization Engine)]
  ├── 滚动式剧情规划 (Rolling Planner)
  ├── 场景拆分分段生成 (Scene Planner -> Prose Writer)
  ├── 任务队列持久化与状态机 (PENDING, RUNNING, PAUSED, WAITING_REVIEW...)
  ├── 预算与中断停止条件控制 (Token/费用/章节数)
  └── 故障恢复与断点续写机制

[Phase 6: 完整创作团队扩展与优化]
  ├── 扩展 Agent (世界观架构师、角色导演、文学编辑、连载运营、创作评估)
  ├── 差异化模型策略 (快模型提取摘要、主力模型正文创作)
  └── 细粒度成本统计与用量仪表盘

[Phase 7: 专业版完善与发布]
  ├── 全局搜索与高级关系图渲染
  ├── DOCX / EPUB 导出
  └── 自动化备份与灾备恢复
```
