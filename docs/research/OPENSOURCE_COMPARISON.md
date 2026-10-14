# 三大 GitHub 开源小说项目综合对比与架构分析 (OPENSOURCE_COMPARISON.md)

- **评估日期**：2026-10-14
- **详细子报告**：详见 `docs/research/github/`

---

## 1. 核心技术洞察摘要

1. **`novel-studio` (Go)**：
   - **核心贡献**：提出了“单世界全角色推演 -> 主角视角投影”与“因果义务链 (Causal Beats)”机制，用工业级工程锁与 Phase Receipt 杜绝了长篇连载崩塌与 NPC 降智；
   - **可借鉴模式**：前章后果强制作为后章原因、有界重渲染熔断机制（3 次上限）。
2. **`novel-engine` (Electron + TS)**：
   - **核心贡献**：打造了完整的“AI 编辑室角色 (Editorial Team)”与“作者文风档案 (Voice Profile)”采访建模，支持 15 步全流程管道与 Pandoc 出版；
   - **合规红线**：该项目采用 AGPL v3 强传染性开源协议，**严禁直接复制任何代码**，只借鉴其产品交互理念并自主 Clean-Room 编写。
3. **`sheengoa/novelforge` (Rust + React)**：
   - **核心贡献**：提供了清晰的 Rust Crates 分层解耦、Director 统一调度、Auditor 审稿仲裁（标记误报/确认采纳）与 `novel-workbench/v1` 全书快照归档；
   - **定位隔离**：系同名独立参考项目，当前 NovelForge AI 的 Tauri 2 + 8层层级 + M:N 剧情矩阵架构更加完整强大，可吸收其审稿仲裁闭环体验。
