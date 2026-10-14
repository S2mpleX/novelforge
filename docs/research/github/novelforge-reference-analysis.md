# 开源项目深入剖析：novelforge 参考仓库 (novelforge-reference-analysis.md)

- **仓库地址**：`https://github.com/sheengoa/novelforge`
- **开源许可证**：Apache License 2.0 (见 `Cargo.toml`)
- **技术栈**：Rust (Axum + SQLx + SQLite) + React/Vite + Tailwind CSS
- **证据级别**：[FACT-SOURCE] 源码与架构规范

---

## 1. 核心架构与设计思想

### 1.1 模块解耦与 Rust Crates 划分
在 `crates/` 下拆分为 6 个高内聚低耦合的子包：
1. `novelforge-core`：定义小说、卷、章、设定、角色、大纲、审稿等核心 Domain 数据模型；
2. `novelforge-store`：基于 SQLx + SQLite 的本地持久化、版本快照与事务管理；
3. `novelforge-llm`：抽象 `LLMProvider` Trait，提供 MockProvider 与 OpenAI-Compatible 适配；
4. `novelforge-engine`：驱动 Director 对话、正文生成、Auditor 审稿与快照导出；
5. `novelforge-server`：基于 Axum 暴露 RESTful API 与 WebSocket 实时流通道；
6. `novelforge-cli`：命令行接口，支持一键自检 (`doctor`)、备份 (`backup`) 与还原 (`restore`)。

### 1.2 Director 模式与分屏工作台
- **双栏响应式工作台**：左侧为多 Agent 对话（Director、编剧、作家、审稿员在同一聊天流中发言），右侧为正文编辑器与流式正文草稿区；
- **版本仲裁与人工介入闭环 (Arbitration)**：
  - 审稿系统 (Auditor) 检测出知识泄露或世界观冲突时，将问题标记为“致命 / 重要 / 建议”；
  - 创作者可以一键点击【确认接受】（触发自动修订或替换正文）或【标记误报/忽略】；
  - 严格确保 AI 生成的修订方案不会悄然覆盖作者原文，而是以可接受的差异 (Diff) 呈现。

### 1.3 `novel-workbench/v1` 契约快照
- 前后端共享强类型的 `novel-workbench/v1` JSON 快照；
- 支持将全书（含元数据、各章版本、角色库、世界观卡片、剧情线状态）一键打包为单 JSON 文件，或从 JSON 完全原地还原。

---

## 2. 与当前 NovelForge AI 的关系与差异对比

> [!IMPORTANT]
> **同名项目严格隔离原则**：
> `sheengoa/novelforge` 是一个采用独立 C/S 架构（Axum HTTP 服务端 + Vite 浏览器前端）的开源参考项目；
> 本地当前项目是基于 **Tauri 2 原生嵌入式桌面架构**（Tauri IPC + WebView2 + SQLite WAL + 拖拽式 Docking 工作台），二者在代码库、运行时与架构形态上完全独立。禁止混淆或覆盖！

| 维度 | 参考项目 `sheengoa/novelforge` | 当前项目 NovelForge AI (本地 V2.2) |
| :--- | :--- | :--- |
| **运行时** | Web C/S (Axum 监听 3000 端口，浏览器访问) | Tauri 2 原生桌面端 (零网络端口暴露，WebView2 深度集成) |
| **UI 架构** | 传统双栏左右分屏 | 专业级 Docking 可拖拽停靠工作台 (20 个面板任意拖动、悬浮、切分) |
| **内容层级** | 基础二级目录 (书籍 -> 章节) | 8 层弹性小说层级 (Series/Novel/Part/Volume/Chapter/Scene/Beat/Para) |
| **剧情关系** | 简单主线/支线进度条 | 独立 M:N 因果矩阵 (角色成长弧、故事弧、伏笔、并行线网状关联) |
| **长期记忆** | 基础上下文拼接 | 五层记忆引擎 (L0~L4，SQLite FTS5 全文秒级召回) |

---

## 3. 可借鉴的设计亮点

1. **审稿仲裁与“标记误报”机制**：
   - 目前 NovelForge AI 的审稿报告仅有评分与建议，借鉴其**“标记误报”**与**“采纳修订并生成版本差异”**，完善作者与审稿 Agent 的闭环互动；
2. **Director 统一调度流**：
   - 允许在 AI 助手面板中以统一的“总导演”身份组织多 Agent 研讨并推演情节。
