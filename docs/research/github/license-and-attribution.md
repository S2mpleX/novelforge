# 开源项目许可证与版权归属合规审查 (license-and-attribution.md)

- **审查日期**：2026-10-14
- **审查人**：架构师兼合规工程师

---

## 1. 开源项目许可证清单与合规矩阵

| 项目名称 | 声明许可证 | 许可证性质 | 传染性风险 | 商业发布兼容性 | NovelForge AI 复用策略 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **novel-studio** | Apache License 2.0 | 宽松开源 (Permissive) | 无代码传染性 | 兼容 (需保留原始版权声明与 NOTICE) | 允许借鉴数据模型、算法逻辑与测试设计；如复用代码需明确标注原作者归属 |
| **Novel Engine** | GNU AGPL v3 | 强传染性 (Strong Copyleft) | **极高 (触发网络与二进制分发传染)** | **不兼容闭源或商业分发** | **绝对禁止直接复制任何代码片段！只允许借鉴其抽象产品设计模式（如文风档案采访、编辑团队角色分工），所有代码必须 100% 独立 Clean-Room 编写！** |
| **novelforge (参考)** | Apache License 2.0 | 宽松开源 (Permissive) | 无代码传染性 | 兼容 | 允许借鉴其数据结构定义与审稿仲裁设计；严禁整体覆盖现有项目 |

---

## 2. 隔离与 Clean-Room 开发准则

1. **零代码污染**：
   - 严禁将 `novel-engine`（AGPL v3）仓库中的任何 `.ts`, `.tsx`, `.js`, `.css` 或提示词文件直接复制粘贴进 NovelForge AI 工程；
   - 所有在 NovelForge AI 中实现的功能（例如文风档案建模、专项生成器），均基于自主设计的 Rust + TypeScript 数据结构和提示词体系从零编码；
2. **版权归属声明**：
   - 如在后续阶段参考了 `novel-studio` 或 `sheengoa/novelforge` 的特定通用算法思路，将在相关实现文档与注释中增加 Attribution 注解，遵循 Apache 2.0 第 4 条款关于分发与修改的规范。
