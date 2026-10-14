# 星月写作研究证据链记录 (evidence.md)

- **编制日期**：2026-10-14
- **证据文件索引与哈希**：

---

## 1. 证据条目清单

| 证据编号 | 证据分类 | 目标载体 | 核心特征 / 内容摘录 | 结论与映射 |
| :--- | :--- | :--- | :--- | :--- |
| **EV-XY-001** | [FACT-OBSERVED] | `https://xingyuexiezuo.com/` 网页入口 | `<script src="/assets/js/index-4d14a7b1.js">`, Vue3, Capacitor | 确认星月写作为 Vue 3 + Capacitor 架构 |
| **EV-XY-002** | [FACT-SOURCE] | `docs/research/evidence/xingyue_index.js` (SHA256: `adde14bd80be5854...`) | REA `analyze_javascript_application` 提取到 30 个路由，含 `/workflow/create`, `/workflow/run/:id`, `/workflow/execute/:runId`, `/workflow/execute-group/:groupId` | 证实星月写作以可配置工作流（单步/批量）为核心技术主干 |
| **EV-XY-003** | [FACT-SOURCE] | `docs/research/evidence/xingyue_workflow_create.js` (Chunk: `create-cff03331.js`) | 提取到“关联章节”、“关联备忘录”、“关联知识卡”、“关联角色”、“关联词条”、“引用前面步骤的变量”、“输出结果” | 证实其工作流具备对小说设定集（角色、词条、章节、备忘录）与前置步骤变量的双向动态绑定 |
| **EV-XY-004** | [FACT-SOURCE] | `docs/research/evidence/xingyue_workflow_execute.js` (Chunk: `execute-new-801489c5.js`) | 提取到“一键执行”、“分步执行”、“编辑输出结果”、“从失败处继续执行”、“已有输出均已保留”、“停止运行” | 证实其支持分步人机协同、断点容错重试以及用户中间编辑输出的执行引擎机制 |
| **EV-XY-005** | [FACT-OBSERVED] | 公开教程与评测视频 (B站/微信/知乎) | 演示从“题材输入 -> 生成大纲 -> 提取角色卡 -> 分章细纲 -> 正文续写”的实际流程 | 验证其功能真实性，具备工业化流水线写作体验 |

---

## 2. 证据保存路径
- 原始打包文件：`docs/research/evidence/xingyue_index.js`
- 提取分析脚本：`scripts/extract_xingyue_evidence.cjs`, `scripts/analyze_workflow_chunks.cjs`
- 结构化提取成果：`docs/research/evidence/xingyue_extracted.json`, `docs/research/evidence/xingyue_workflow_details.json`
- REA 静态分析证据：`docs/research/evidence/ev_80abfa700fda9a912c55c71ee011b3c6c3c2a1014633ffcad2e59e0e2f17e63d`
