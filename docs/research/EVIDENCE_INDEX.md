# 研究证据全量索引表 (EVIDENCE_INDEX.md)

- **编制日期**：2026-10-14
- **索引体系**：全量登记分析过程中采集到的第一手客观证据，确保结论可追溯、可复查。

---

## 1. 证据清单与索引

| 证据编号 | 证据分类 | 来源与物理路径 / URL | 哈希 / 标识 | 核心内容 / 证明结论 |
| :--- | :--- | :--- | :--- | :--- |
| **EV-001** | [FACT-OBSERVED] | `https://xingyuexiezuo.com/` | HTTP 200 Live Page | 证实星月写作为 Vue 3 + Capacitor 单页应用，使用 LocalStorage 存储配置 |
| **EV-002** | [FACT-SOURCE] | `docs/research/evidence/xingyue_index.js` | SHA256: `adde14bd80be5854...` | REA 提取 30 个核心路由，证实其具备完整的工作流路由族群 (`/workflow/*`) |
| **EV-003** | [FACT-SOURCE] | `docs/research/evidence/xingyue_workflow_create.js` | Chunk: `create-cff03331.js` | 证实其支持“关联角色”、“关联词条”、“关联章节”、“关联备忘录”与“引用前面步骤变量” |
| **EV-004** | [FACT-SOURCE] | `docs/research/evidence/xingyue_workflow_execute.js` | Chunk: `execute-new-801489c5.js` | 证实其支持“一键执行”、“分步执行”、“编辑输出结果”、“从失败处继续执行”与中断保护 |
| **EV-005** | [FACT-SOURCE] | `docs/research/github/repos/novel-studio/` | Go 1.25.5 仓库源码 (Apache 2.0) | 证实其“单世界全角色推演 -> 主角主视角投影”与“因果义务链 (Causal Beats)”机制 |
| **EV-006** | [FACT-SOURCE] | `docs/research/github/repos/novel-studio/internal/agents/render_execution_bounds.go` | 源代码行 `CheckPermitQuota()` | 证实其 3 次重渲染硬上限熔断设计，防范死循环与 Token 浪费 |
| **EV-007** | [FACT-SOURCE] | `docs/research/github/repos/novel-engine/` | Electron + React 仓库源码 (AGPL v3) | 证实其 7 位 AI 编辑室角色分工、15 步出版管道与作者文风档案 (Voice Profile) 采访提取 |
| **EV-008** | [FACT-SOURCE] | `docs/research/github/repos/novel-engine/LICENSE` | 35,184 字节 AGPL v3 | 证实其强传染性许可证，严禁直接复制任何代码片段，必须 100% 独立 Clean-Room 编写 |
| **EV-009** | [FACT-SOURCE] | `docs/research/github/repos/novelforge-reference/` | Rust + React 仓库源码 (Apache 2.0) | 证实其 Director 对话编排、Auditor 审稿仲裁（标记误报/确认采纳）与快照归档机制 |
| **EV-010** | [FACT-SOURCE] | 本地工程 `e:\小说\` | V2.2 生产代码与 40 项 DB 测试 | 证实当前系统已具备 8 层内容层级、M:N 独立剧情矩阵、五层长期记忆与 V2.1 Docking 工作台 |
