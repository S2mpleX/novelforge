# 开源项目深入剖析：novel-studio (novel-studio-analysis.md)

- **仓库地址**：`https://github.com/Xiaoyangy/novel-studio`
- **分析分支/Commit**：`main` (2026-07-20 生产基线，最新提交)
- **开源许可证**：Apache License 2.0 (见 `LICENSE`)
- **技术栈**：Go 1.25.5 + SQLite + 本地向量/Qdrant + 浏览器看板前端
- **证据级别**：[FACT-SOURCE] 源码与架构规范

---

## 1. 核心架构与核心设计思想

### 1.1 单世界全角色推演与主视角投影 (World Simulation vs. POV Projection)
在 `internal/agents/project_all.go` 与 `README-TECHNICAL.md` 中，novel-studio 提出了革命性的小说生成架构：
- **拒绝单纯“续写上一段”**：传统 AI 写作通常是给上一段文字让模型续写，导致 NPC 行动完全围绕主角，世界缺乏真实动量；
- **两层世界观推演机制**：
  1. **模拟层 (World Simulation)**：每个角色（包括离屏角色）依据自身目标、压力、知识边界、资源和阵营独立做出决策，生成世界状态增量 (`world delta`)；
  2. **渲染层 (POV Projection)**：只将主角能够感知到的客观因果、对话、环境与事件，投影成给正文作家 Agent (`Drafter` / `Writer`) 的渲染上下文包 (`render_packet v11`)。

### 1.2 规划与渲染的两阶段严格隔离 (Sealed Two-Pass Pipeline)
- **阶段一：规划与承载力校验 (`preplan -> project-all -> seal`)**：
  - 以宏观“剧情弧 (Arc)”为生产单元；
  - `project-all` 在隔离沙盒中推演当前弧全部章节的大纲与因果闭环；
  - **因果义务链 (Causal Beats)**：上一章发布的后果 ID，下一章必须由具体的 `causal_beats[].cause` 消费，杜绝虚假衔接；
  - **承载力校验**：校验章节事件量是否能自然支撑目标字数（如 3000 字），禁止用同义复述或水景物凑字数；
  - `seal`：生成不可变的当前弧规划，锁定状态哈希 (`digest chain`)。
- **阶段二：单章提升与严格渲染 (`promote -> render -> exact-body review`)**：
  - `promote`：将当前指针章节机械提升为活动渲染上下文；
  - `render`：消费一次性 `prose permit` 调用作家模型，绑定正文 SHA256；
  - **有界重渲染防护**：同一 candidate 最多允许 3 次渲染名额（初稿 + 2 次重写），第 4 次前硬熔断，杜绝死循环消耗 Token；
  - `review`：由独立裸正文 Reviewer（建议 DeepSeek）与 Hard Consistency 规则联合验收。

### 1.3 长期记忆多通道路由 (Multi-Path Memory RAG)
在 `internal/rag/` 中：
- `base_canon_root`（正史根）：记录已经发生并验收的绝对事实；
- `foundation_snapshot_root`（设定根）：作者基础设定、人物基准与世界公理；
- `rag_snapshot_root`（检索工件）：支持 BM25 + 本地向量混合检索；
- 三者物理隔离，互不污染，保证百万字连续创作不崩塌。

---

## 2. 核心源码路径与关键证据

| 模块名称 | 关键文件路径 | 核心函数 / 结构体 | 架构价值 |
| :--- | :--- | :--- | :--- |
| **世界推演与投影** | `internal/agents/project_all.go` | `ProjectAll()`, `projectedStore`, `ProjectedDelta` | 实现离屏角色状态更新与主角视角因果投影 |
| **规划封存与收敛** | `internal/agents/sealed_convergence_planner.go` | `SealedConvergencePlanner`, `SealArc()` | 保证整弧规划不可变与因果链闭合 |
| **正文渲染合同** | `internal/agents/render_context_priming.go` | `AntiAIRenderContract`, `ProsePermit` | 首 Token 合同与防 AI 水文注入 |
| **有界熔断与恢复** | `internal/agents/render_execution_bounds.go` | `RenderExecutionBounds`, `CheckPermitQuota()` | 3 次重渲染硬上限，防止 Token 滥用 |
| **质量门禁与审稿** | `internal/reviewreport/` | `ReviewPipeline`, `ExactBodyVerification` | 独立裸正文质检与矛盾拦截 |

---

## 3. 优缺点评估与 NovelForge AI 借鉴分析

### 3.1 优势
1. 架构严谨度极高，具有工业级防崩溃、断点恢复、账本记录 (Timing Ledger) 与熔断机制；
2. 彻底消除了 AI 小说中的 NPC 降智与主角光环悬浮问题；
3. 因果义务链设计（前章后果强制被后章作为原因消费）极为精彩。

### 3.2 缺点 / 不适合桌面客户端之处
1. 整体架构偏重偏极客，基于 CLI 与大量后台文件系统快照，缺乏现代化拖拽交互；
2. 一次性 `project-all` 推演整弧全部章节的模型调用成本较高、耗时较长（12~18 分钟/章），对普通创作者心智要求过高。

### 3.3 对 NovelForge AI 的迁移设计
- 借鉴其**“因果义务链 (Causal Obligation)”**，将上一章事件结果作为下一章场景规划的强制前置依赖；
- 借鉴其**“有界重渲染保护机制 (Bound Quota)”**，在自动连载与单章生成时设置重试熔断阈值；
- 借鉴其**“记忆根物理隔离”**，保持 NovelForge AI 已有的 Canon 与 FTS5 事实绝对权威。
