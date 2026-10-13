# NovelForge AI V2.0

> 本地优先、多模型接入、多 Agent 协作、长期记忆驱动的专业长篇小说创作与连载管理桌面应用。

---

## 🌟 核心理念与亮点

- **真实可运行**：基于 Tauri 2 + Rust + React 19 + TypeScript + SQLite WAL 打造，所有创作数据全持久化于本地数据库，绝非静态假页面或单次聊天套壳。
- **长篇防护与版本历史**：每次正文修改均支持防抖自动保存与快照生成，支持随时的历史版本对比与一键安全回滚，严禁破坏作者原稿。
- **多模型网关接入**：全面兼容 OpenAI 格式 API，默认兼容本地网关（如 CPA `http://127.0.0.1:8317/v1`）及各类大模型提供商，支持实时延迟检测与流式 SSE 逐字创作。
- **Story Bible 故事设定库**：内置人物档案库、世界观规则库（Canon 权威分级）、伏笔追踪看板。
- **Humanizer 叙事守则装载**：系统提示词内嵌叙事守则，坚决剔除 AI 腔调、说明文套话与策划术语外露，打造富有呼吸感与临场感的文学质感。

---

## 🛠️ 技术栈

- **桌面底座**：Tauri 2 (Rust 1.95, MinGW-w64 MSVCRT)
- **本地存储**：SQLite (WAL 模式, 外键级联, FTS5 全文搜索)
- **前端工作区**：React 19, TypeScript, Vite 8, Tailwind CSS v4
- **正文编辑器**：Tiptap (富文本/Markdown 沉浸式小说写作)
- **状态管理**：Zustand
- **图标系统**：Lucide React

---

## 🚀 启动与测试指南

### 1. 运行数据库全功能自动化测试
```powershell
pnpm test:db
```
该命令将自动运行 `src-tauri/src/bin/db_test.rs`，验证 SQLite 数据库初始化、小说创建、分章、多版本快照、角色档案、世界观法则及模型网关读取。

### 2. 前端打包验证
```powershell
pnpm build
```

### 3. 启动开发模式 (桌面端热重载)
```powershell
pnpm tauri dev
```

### 4. 构建桌面端发布包
```powershell
pnpm tauri build
```
编译产物位于 `E:\tools\novelforge_target\x86_64-pc-windows-gnu\debug\novelforge-ai.exe`。

---

## 📖 规范与文档

- [智能体开发规范与项目规则 (AGENTS.md)](file:///e:/%E5%B0%8F%E8%AF%B4/AGENTS.md)
- [实施路线规划 (docs/IMPLEMENTATION_PLAN.md)](file:///e:/%E5%B0%8F%E8%AF%B4/docs/IMPLEMENTATION_PLAN.md)
- [项目持续开发状态 (docs/PROJECT_STATE.md)](file:///e:/%E5%B0%8F%E8%AF%B4/docs/PROJECT_STATE.md)
- [架构决策记录 (docs/DECISIONS.md)](file:///e:/%E5%B0%8F%E8%AF%B4/docs/DECISIONS.md)
- [测试报告 (docs/TEST_REPORT.md)](file:///e:/%E5%B0%8F%E8%AF%B4/docs/TEST_REPORT.md)
