# NovelForge AI

> 本地优先 · 多模型接入 · 多 Agent 协作 · 长期记忆驱动的专业长篇小说创作与连载管理桌面应用。

[![Release](https://img.shields.io/github/v/release/S2mpleX/novelforge?color=amber&label=%E6%AD%A3%E5%BC%8F%E7%89%88%E6%9C%AC)](https://github.com/S2mpleX/novelforge/releases/latest)
[![Platform](https://img.shields.io/badge/Platform-Windows%20x64-blue)](https://github.com/S2mpleX/novelforge/releases/latest)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📥 软件下载（创作者开箱即用，无需任何环境）

> 💡 **无需安装 Node.js、Python、Rust 等任何开发环境！** 本软件已将前端引擎、Tauri 底座与 SQLite 数据库全量编译打包为独立运行程序。

| 版本类型 | 下载链接 | 推荐场景 |
| :--- | :--- | :--- |
| 🚀 **Windows 标准安装包（首选）** | [**NovelForge.AI_2.4.1_x64-setup.exe**](https://github.com/S2mpleX/novelforge/releases/latest/download/NovelForge.AI_2.4.1_x64-setup.exe) | 下载后双击运行安装向导，自动生成桌面图标，支持后续应用内一键自动升级 |
| 📦 **Windows 绿色便携版（免安装）** | [**NovelForge-AI-v2.4.1-Windows-Portable.zip**](https://github.com/S2mpleX/novelforge/releases/latest/download/NovelForge-AI-v2.4.1-Windows-Portable.zip) | 下载后解压，直接双击运行 `NovelForge AI.exe` 即可使用，无需向导与注册表写入 |

> ⚠️ **新手避坑提示**：
> - 请**直接点击上方表格中的蓝字链接**下载安装包或便携版；
> - 请**切勿点击** GitHub 页面右上角绿色的 **`Code -> Download ZIP`**，也**不要下载** Release 底部的 **`Source code (zip)`**。那些是供程序员编译二次开发的源代码，解压后是一堆工程脚本，普通创作者无法直接双击运行！

---

## 🌟 核心理念与亮点

- **真实可运行**：基于 Tauri 2 + Rust + React 19 + TypeScript + SQLite WAL 打造，所有创作数据全持久化于本地数据库，绝非静态假页面或单次聊天套壳。
- **纯粹写作 Zen 模式 vs 专业工坊 Studio 模式**：顶栏一键秒级双态流转，独占宣纸居中打字画布与案头磨砂悬浮岛，按键 `F11` / `Ctrl+Alt+Z` 随时无干扰沉浸写作。
- **长篇防护与版本历史**：每次正文修改均支持防抖自动保存与快照生成，支持随时的历史版本对比与一键安全回滚，严禁破坏作者原稿。
- **多模型同台比稿竞技场 (Model Arena)**：支持多模型针对相同章节大纲或细纲同时生成、多视角比对与择优采纳。
- **多模型网关接入**：全面兼容 OpenAI 格式 API，默认兼容本地网关（如 CPA `http://127.0.0.1:8317/v1`）及各类大模型提供商，支持实时延迟检测与流式 SSE 逐字创作。
- **Story Bible 故事设定库**：内置人物档案库、世界观规则库（Canon 权威分级）、伏笔追踪看板与地图沙盘交互。
- **Humanizer 叙事守则装载**：系统提示词内嵌叙事守则，坚决剔除 AI 腔调、说明文套话与策划术语外露，打造富有呼吸感与临场感的文学质感。

---

## 🛠️ 技术栈

- **桌面底座**：Tauri 2 (Rust 1.95, MinGW-w64 MSVCRT)
- **本地存储**：SQLite (WAL 模式, 外键级联, FTS5 全文搜索)
- **前端工作区**：React 19, TypeScript, Vite 8, Tailwind CSS v4, @xyflow/react
- **正文编辑器**：Tiptap (富文本/Markdown 沉浸式小说写作)
- **状态管理**：Zustand
- **图标系统**：Lucide React

---

## 💻 开发者指南（二次开发与本地编译）

> 💡 如果您是软件开发者并希望参与 NovelForge AI 的贡献开发，请按以下步骤配置编译环境：

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
.\scripts\release.ps1 patch   # 自动完成版本升级、测试、编译、NSIS打包、便携版ZIP与Release上传
```

---

## 📖 规范与文档

- [智能体开发规范与项目规则 (AGENTS.md)](file:///e:/%E5%B0%8F%E8%AF%B4/AGENTS.md)
- [更新日志 (CHANGELOG.md)](file:///e:/%E5%B0%8F%E8%AF%B4/CHANGELOG.md)
- [实施路线规划 (docs/IMPLEMENTATION_PLAN.md)](file:///e:/%E5%B0%8F%E8%AF%B4/docs/IMPLEMENTATION_PLAN.md)
- [项目持续开发状态 (docs/PROJECT_STATE.md)](file:///e:/%E5%B0%8F%E8%AF%B4/docs/PROJECT_STATE.md)
- [架构决策记录 (docs/DECISIONS.md)](file:///e:/%E5%B0%8F%E8%AF%B4/docs/DECISIONS.md)
- [测试报告 (docs/TEST_REPORT.md)](file:///e:/%E5%B0%8F%E8%AF%B4/docs/TEST_REPORT.md)
