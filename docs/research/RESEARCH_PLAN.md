# NovelForge AI V2.3 竞品逆向研究与智能升级工程规划 (RESEARCH_PLAN.md)

- **编制日期**：2026-10-14
- **当前版本基线**：NovelForge AI V2.2 (已完成本地优先 SQLite、Tiptap 纸张编辑器、多 Agent 协作、五层长期记忆、多 Agent 自动连载、多格式发布、可拖拽停靠工作台、应用内自动更新)
- **目标版本**：NovelForge AI V2.3 (专业小说专项工具箱、可视化多 Agent 生产工作流、长篇权威记忆强化、多模型协同)

---

## 1. 研究目标与研究对象

### 1.1 核心目标
1. **工作流全景剖析**：理解业内顶尖 AI 辅助小说创作系统（星月写作）与主流开源多 Agent 创作架构（novel-studio、novel-engine、novelforge）的端到端创作流程。
2. **交互范式与工程解耦**：提炼适合本地优先桌面架构的提示词组织、上下文剪裁、人机协同（审阅/定稿）、任务恢复与数据沉淀方案。
3. **查漏补缺与精准升级**：对照 NovelForge AI 当前已有功能，找出在“小说专项生成器闭环”、“工作流编排（Workflow）”、“知识库关联”、“提示词产品化”方面的核心差距。
4. **渐进式演进**：绝不全盘推翻现有经过严密测试的 Tauri 2 + Rust + React + SQLite 架构，而是设计高内聚低耦合的增强模块，以最小可运行切片分批落地并测试验证。

### 1.2 研究对象清单 (`TARGET_INVENTORY.md`)

| 目标分类 | 目标名称 | 来源/地址 | 主要研究焦点 |
| :--- | :--- | :--- | :--- |
| **商业闭源** | 星月写作 | `https://xingyuexiezuo.com/` | 专项创作工具箱、提示词模板体系、多级大纲到正文的工作流交互、知识库上下文关联体验 |
| **开源架构 A** | novel-studio | `https://github.com/Xiaoyangy/novel-studio` | 多 Agent 角色自治、世界状态推演、故事弧规划、长期记忆 RAG、章节任务流水线、检查点机制 |
| **开源架构 B** | novel-engine | `https://github.com/john-paul-ruf/novel-engine` | AI 编辑团队流水线、作者文风档案建模、正文审校润色流水线、模块化设计 |
| **开源架构 C** | novelforge | `https://github.com/sheengoa/novelforge` | Director 对话编排、人物世界观实体关联、版本仲裁机制、人工闭环审核模式 |
| **自身基线** | NovelForge AI (本项目) | 本地工作区 `e:\小说` | 现有 8 层小说体系、M:N 剧情矩阵、Docking 工作台、SQLite FTS5 记忆库、连载状态机 |

---

## 2. 研究方法与证据管理规范

研究过程坚决恪守“证据化研究”标准：
1. **事实、推断与猜测严格分离**：
   - `[FACT-OBSERVED]`：公开 Web 页面、官方说明或实际软件界面中直接观察到的客观行为。
   - `[FACT-SOURCE]`：开源代码库中明确的文件、函数、类型与逻辑实现（标注 Commit 与行号）。
   - `[INFERENCE]`：基于技术接口、参数格式、响应模式等推导出的合理设计。
   - `[HYPOTHESIS]`：内部算法、服务端调度等尚未得到直接证据支持的推测，需标注待验证。
2. **索引与可追溯性**：
   - 所有原始资料归档至 `docs/research/evidence/`，并在 `EVIDENCE_INDEX.md` 中进行唯一编号登记。
3. **安全与合规底线**：
   - 商业软件仅限于公开合法信息与用户明确授权的分析，严禁破解与抓取非授权私有数据；
   - 开源软件明确区分 GPL/MIT/Apache 等许可证约束，对不兼容的代码只借鉴设计思想，自主独立编写实现。

---

## 3. 十大执行阶段路线图

- [x] **Step 1：项目基线与已有功能盘点**（已核验现有代码库与 V2.2 状态，整理基线报告）
- [x] **Step 2：检查 REA 工具与 MCP 环境**（确认 170 项 REA 工具与 MCP 就绪，输出 `REA_ENVIRONMENT.md`）
- [ ] **Step 3：确认星月写作的可访问研究范围**（网络公开信息、官方站点、功能架构梳理，输出 `docs/research/xingyue/` 系列）
- [ ] **Step 4：深入分析星月写作公开功能与关键工作流程**（创作专项工具箱、提示词中心、上下文关联）
- [ ] **Step 5：分析三大 GitHub 开源小说项目源码**（深入阅读 novel-studio, novel-engine, novelforge，输出 `docs/research/github/`）
- [ ] **Step 6：构建跨产品功能与技术对照矩阵**（输出 `FEATURE_COMPARISON.md` 与 `ARCHITECTURE_FINDINGS.md`）
- [ ] **Step 7：梳理当前项目最值得改进的十大能力**（输出 `NOVELFORGE_GAP_ANALYSIS.md`）
- [ ] **Step 8：多维度评估、评分与优先级排序**（输出 `IMPROVEMENT_ROADMAP.md`，确立 P0/P1/P2）
- [ ] **Step 9：设计首个 P0 功能的高质量技术实现方案**（架构设计、数据库变更、接口契约与测试计划）
- [ ] **Step 10：向用户汇报完整研究成果，获得确认后开启首个切片编码**
