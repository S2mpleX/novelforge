# 开源项目与闭源竞品架构横向对比 (architecture-comparison.md)

- **评估日期**：2026-10-14
- **对比对象**：星月写作、novel-studio、Novel Engine、sheengoa/novelforge、当前 NovelForge AI (V2.2)

---

## 1. 核心技术栈与部署架构对比

| 产品 / 项目 | 编程语言 / 核心框架 | 数据库 / 存储方案 | 运行形态 | 模型接入协议 | 许可证 / 商业形态 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **星月写作** | Vue 3 + Capacitor | 云端后端存储 + LocalStorage 缓存 | Web SPA / 移动端封装 | 云端闭源中转 (DeepSeek/Kimi/Claude等) | 闭源商业 SaaS (字数/会员扣费) |
| **novel-studio** | Go 1.25.5 | 磁盘文件快照 + SQLite + 本地/Qdrant 向量 | CLI / 本地 Web 看板 | OpenAI-Compatible / DeepSeek / 本地模型 | Apache 2.0 开源 |
| **Novel Engine** | Electron + React + TS | 本地 SQLite + 文件系统 + Pandoc | 桌面客户端 (Win/macOS/Linux) | 本地 Ollama / Claude CLI / Codex | GNU AGPL v3 开源 (强传染) |
| **novelforge (参考)** | Rust (Axum) + React + TS | 本地 SQLite (SQLx) | 本地 Web C/S (默认 3000 端口) | OpenAI-Compatible + Mock Provider | Apache 2.0 开源 |
| **NovelForge AI (当前)** | Tauri 2 (Rust) + React 19 + TS | 本地嵌入式 SQLite (WAL + FTS5) | 纯原生桌面客户端 (无网络端口暴露) | OpenAI-Compatible + 本地 CPA 网关 + SSE 流式 | 自主产权 (商业级闭源架构规范) |

---

## 2. 创作流水线与 Agent 编排机制对比

| 架构维度 | 星月写作 | novel-studio | Novel Engine | novelforge (参考) | 当前 NovelForge AI |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **工作流范式** | 可配置步骤流水线 (一键/分步) | 严格双阶段推演 (Seal -> Promote -> Render) | 15 步出版流水线 (Pitch to Published) | Director 对话驱动 | 连载状态机 + 任务流转推进 |
| **Agent 角色分工** | 隐式步骤模板 (大纲/正文/润色) | 角色模拟器 + Drafter + 独立 Reviewer + Editor | 7 位专业编辑室角色 (Coach/Verity/Auditor等) | Director + Writer + Auditor | 7 独立提示词 Agent (编剧/作家/审稿/润色/记忆等) |
| **长篇因果保证** | 步骤间变量绑定 + 关联角色词条 | 强因果义务链 (前章后果必须作为后章原因消费) | 人设世界观卡片作为全局 Prompt 上下文 | 故事线追踪 (主线/支线/暗线推进状态) | 8 层内容层级 + M:N 独立剧情因果矩阵 |
| **长期记忆体系** | 显式关联词条/角色卡 (云端 RAG) | 正史根 + 设定根 + RAG 根三级物理隔离 | Story Bible 注入 | 档案与世界观绑定 | 五层长期记忆 (L0~L4) + FTS5 全文毫秒检索 |
| **人机介入与容错** | 步骤卡片内原地编辑 + 失败断点继续 | 3 次重渲染硬熔断 + 不可变 Phase Receipt | 手动编辑章节正文 + 变更追踪 | 审稿问题标记“确认/误报”闭环仲裁 | 审稿报告打分 + 润色对比采纳 + 历史版本抽屉 |
| **工作台交互模式** | 固定三段式页面 | 浏览器看板只读展示，CLI 驱动推进 | 传统单文档/多标签编辑视图 | 双栏分屏 (对话 + 编辑) | 专业级 Docking 可拖拽停靠工作台 (20 面板自由停靠/悬浮) |
