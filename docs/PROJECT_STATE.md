# NovelForge AI — 项目持续开发状态 (PROJECT_STATE.md)

## 1. 当前阶段与基线
- **当前阶段**：V4.0.2 (客户端 V2.7.0) **推演主对白流全域防抖、精修悬浮条减负与全局抽屉硬件合成优化 (Main Dialogue Stream Anti-Stutter & Global Drawer Compositing Optimization)**
  - ① **推演主舞台对白流硬件合成与防抖消除 (ADR-083 & `CharacterSandboxPanel.tsx`)**：
    - 针对推演舞台消息流，彻底剥离残存的 `contentVisibility: 'auto'` 与固定 `containIntrinsicSize: '0 160px'`；消除因内心独白、潜台词、正文对白长短差异（80px~450px 波动）导致的滚动条跳跃与自动滚底（`scrollToBottom`）位移偏差；
    - 主滚动容器 `scrollRef` 全面注入 `transform-gpu` 与 `overscroll-contain`，实现真正的 60FPS 顺滑滚屏。
  - ② **精修工作室划选悬浮条防掉帧 (ADR-083 & `CharacterSandboxPanel.tsx`)**：
    - 移除粘性浮条 (`sticky top-0`) 上的 `backdrop-blur-xs`，替换为纯色稳固高对比茶金样式，精修主内容区补充 `transform-gpu overscroll-contain`，杜绝长文滚动时 GPU 逐帧模糊重采样。
  - ③ **剧本抽屉交互灵感增强与自适应布局 (ADR-083 & `CharacterSandboxPanel.tsx`)**：
    - 经典情境库升级为 `grid-cols-1 sm:grid-cols-2 gap-2.5` 响应式栅格，无论抽屉固定（Pinned 352px）还是浮动均有充裕版面；
    - 场景与目标输入区增加动态字数统计，并提供“深夜书房、荒郊破庙、逼出真正底线、暗藏杀机试探”等高频环境与冲突一键植入胶囊。
  - ④ **全局抽屉体系全量硬件合成加速与去 Blur 化 (ADR-083 & `VersionDrawer.tsx` / `ZenChapterDrawer.tsx`)**：
    - 历史版本抽屉 `VersionDrawer` 移除 `backdrop-blur-xs`，滑出抽屉与版本列表、预览框追加 `transform-gpu` 与 `overscroll-contain`；
    - 禅意码字章节抽屉 `ZenChapterDrawer` 侧滑抽屉与章节树列表注入 `transform-gpu` 与 `overscroll-contain`。
  - ⑤ **全套自动化测试 100% 满分通过**：
    - `test:sandbox:header`（18/18 PASS）、`test:skills`（62/62 PASS）、`test:header`（11/11 PASS）、`test:tri-modes`（9/9 PASS）、`test:sandbox`（12/12 PASS）、`test:bugfixes`（82/82 PASS）全部满分绿灯；
    - Rust 后端 `cargo check` 0.55s 零错误零警告，前端 Vite 生产构建 1.27s 零错误！
- **版本目标**：V2.7.0 (V4.0.2)
- **更新时间**：2026-10-22
- **代码库状态**：真实可运行、真实编译通过 (Rust 后端与 SQLite 零错误零警告，前端 Vite 打包 1.27s 零错误，无循环依赖，全部专项测试 100% 通过，Rust db_test 66/66 全部通过)。
- **最近实装**：推演主对白流全域防抖、精修悬浮条减负与全局抽屉硬件合成优化 (ADR-083)、剧本设定抽屉下拉滚动流畅度治理与 GPU 合成层解耦 (ADR-082)、推演台原生确认框全面应用内主题化与全局模态防截断治理 (ADR-081)。

---

## 2. 基础设施与工具链状态
- [x] **Node.js**：v24.14.1
- [x] **包管理器**：pnpm 9.15.4 / npm 11.12.0
- [x] **Rust**：1.95.0 (`x86_64-pc-windows-gnu`)
- [x] **C/C++ 链接工具链**：WinLibs MinGW-w64 (MSVCRT runtime + GCC 16.2.0 + GNU Binutils)，部署于 `E:\tools\winlibs_msvcrt`，免管理员权限，节省 C 盘空间
- [x] **桌面运行时**：Tauri 2 + WebView2 原生后端，已在 `Cargo.toml` 中配置 `default-run = "novelforge-ai"`，支持双二进制（主程序与 `db_test` 独立运行）
- [x] **本地数据库**：SQLite 嵌入式存储，已开启 WAL 模式、外键级联检查与 FTS5 全文搜索支持（虚拟表 `canon_facts_fts`, `chapters_fts`）
- [x] **前端生态**：React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + Tiptap 编辑器 + Zustand + Lucide 图标库 + **@xyflow/react (React Flow 拓扑图谱)**
- [x] **开发启动方式**：
  ```powershell
  $env:PATH = "E:\tools\winlibs_msvcrt\mingw64\bin;" + $env:PATH
  pnpm tauri dev
  ```

---

## 3. 已完成核心功能矩阵

### 3.1 本地优先数据库与规范化数据模型 (Phase 0 ~ Phase 7)
- 完整建立规范化 SQLite 表结构：`novels`, `novel_settings`, `volumes`, `chapters`, `chapter_versions`, `characters`, `character_state_events`, `character_relationships`, `world_rules`, `canon_facts`, `plot_threads`, `story_phases`, `story_arcs`, `scenes`, `story_events`, `review_reports`, `review_findings`, `ai_providers`, `ai_models`, `usage_records`, `serialization_jobs` 以及虚拟表 `canon_facts_fts`, `chapters_fts`。
- 严密的外键级联约束与自动版本控制：正文每次修订或手动保存均生成不可逆的历史版本快照，严防用户创作内容丢失。
- 专有验证套件 `db_test` 真实执行 23 项核心测试，100% 验证了小说创建、分章、多版本保存、角色档案、世界观法则、模型网关、角色关系拓扑、大纲阶段、剧情弧、场景细纲拆解、逻辑审稿报告与发现入库、权威事实库建立、FTS5 全文检索、动态角色状态追踪、五层记忆上下文装配、自动连载任务流转、SQLite 在线热备份、数据库优化诊断、HTML5 电子书单文件生成以及全书工程 JSON 归档与复原。

### 3.2 现代长篇正文写作环境 (Phase 1)
- 基于 Tiptap 打造沉浸式中文正文编辑器，配备撤销重做、标题分级、引用、加粗斜体等格式工具条与全屏专注模式。
- 实现真正精准的中文字符计数（剔除空白字符）与 800ms 防抖自动保存机制。
- 支持快捷键 `Ctrl+S` 手动保存快照，并在保存状态指示器上实时反馈（已保存 / 保存中 / 未保存修改 / 失败）。
- 历史版本抽屉（VersionDrawer）：可视化浏览每章的所有历史版本，支持一键安全回退至任意历史草稿。
- 单章 TXT / 全本 Markdown 文件直接导出。

### 3.3 模型网关 (Model Gateway) 与流式接入 (Phase 1)
- 完整实现 OpenAI-compatible 协议适配器，默认支持本地 CPA 网关（`http://127.0.0.1:8317/v1`）及各类第三方兼容网关。
- 提供 API 连通性真实测试功能，即时测量端点延迟（毫秒级）并读取返回的模型列表。
- 支持 Server-Sent Events (SSE) 逐字流式传输，正文作家 Agent 写作时可实时展示生成过程。
- 允许用户对生成内容进行“追加到文末”、“替换正文”或“复制剪贴板”。

### 3.4 世界观与故事设定管理 (Story Bible) & 人物动态关系拓扑图 (Phase 2)
- **人物关系拓扑图 (React Flow)**：基于 `@xyflow/react` 打造沉浸式拓扑画布，展示角色节点与连线（生死战友、同门师徒、宿命仇敌、情投意合、利益结盟、主仆隶属），支持自由拖拽排列、拉线建立关联、点击删除连线并持久化于 SQLite。
- **大纲与剧情弧线规划 (Plot Arcs)**：按宏观故事阶段 (StoryPhase) 划分剧情弧线 (StoryArc)，支持主线/支线/角色弧/世界揭秘分类，支持剧情弧状态流转（规划中 -> 展开推进中 -> 已完结）。
- **世界观法则**：构建战力体系、地理法则与权威分级（`CANON`, `EXTENDED`, `HYPOTHESIS`）。
- **伏笔悬念追踪**：登记埋设的故事线索与预期回收节点。

### 3.5 多 Agent 协作创作与审稿系统 (Phase 3)
- **独立提示词中心 (`prompts/`)**：建立 `editor_in_chief.md`, `plot_architect.md`, `scene_planner.md`, `prose_writer.md`, `continuity_auditor.md`, `style_editor.md`, `memory_curator.md`，实现彻底的职责隔离与结构化 Schema 约束。
- **装载 Humanizer 叙事法则与工作区技能 (`.agents/skills/humanizer/SKILL.md`)**：
  - 彻底剔除 AI 说明文腔调与 50+ 种典型机械套话（封杀“嘴角勾起/扯出”、“眼中闪过/掠过”、“仿佛/宛如”泛滥、“空气凝固”、“深吸一口气”、“殊不知”、“不得不说”等）；
  - 践行“Show, Don't Tell”，以五感微动作、真实生理反应、特定环境物象交互代替抽象心理说明；
  - 严禁游戏策划/引擎术语外露，精修微表情与对话呼吸感；
  - 建立四大流派专属约束模板库（`prompts/genres/`：玄幻修仙、都市现实、悬疑惊悚、硬核科幻）；
  - 建立客户端实时 Humanizer 诊断引擎 (`HumanizerEngine.ts`)，支持一键实时套话浓度检测、人情味评分（0~100）与针对性重塑。
- **多 Agent 协同流水线 (Collaborative Pipeline)**：
  - 编剧 (Scene Planner)：将章节目标拆解为结构化场景 (Scenes) 节拍
  - 作家 (Prose Writer)：依据场景节拍生成长篇初稿草稿并保存为不可逆版本快照
  - 审稿 (Continuity Auditor)：自动执行逻辑一致性质检并生成审稿报告
- **逻辑审稿报告 (Continuity Auditor)**：审查正文与人物动机、世界观规则 (Canon)、时间线与因果的一致性，输出 0~100 健康度得分及结构化 Findings，标记严重等级（CRITICAL / MAJOR / MINOR / SUGGESTION），展示原文证据引用与整改建议。
- **文学编辑润色 (Style Editor)**：并排对比【原文段落】vs【精修润色】，展示优化理由，支持一键采纳替换或复制。

### 3.6 五层长期记忆引擎 (Memory Engine - Phase 4)
- **分层记忆架构 (L0 ~ L4)**：
  - **L0 工作记忆 (Working Memory)**：当前章节任务提示词、待续写上文、即时冲突目标
  - **L1 短期剧情记忆 (Short-term Recency)**：最近 3 章的故事大纲、关键进展与情境延续
  - **L2 剧情弧与阶段目标 (Arc Memory)**：当前所处宏观阶段核心矛盾、剧情弧与未闭合伏笔
  - **L3 权威规则与角色基准 (Canon & Profiles)**：不可动摇的世界观公理、出场核心人物状态与禁忌
  - **L4 检索式历史事实 (Retrieved Canon Facts)**：借助 SQLite FTS5 虚拟表，精准检索历史上已发生的因果事实与伏笔线索
- **上下文组装器 (`assemble_memory_context_pack`)**：按 Token 预算动态剪裁各层记忆，输出统一结构化系统提示词包，杜绝长篇设定前后矛盾。
- **动态角色状态追踪 (`character_state_events`)**：记录角色心理状态、生理伤病、阵营归属、随身秘宝的沿革演变。
- **章节记忆自动提取器 (`extract_chapter_memory`)**：Memory Curator Agent 自动提炼章节事实、状态变迁并落库为权威事实。
- **记忆管理控制台 (`MemoryEngineView.tsx`)**：提供权威事实检索、角色状态时间线、FTS5 全文记忆检索台与章节记忆自动沉淀功能。

### 3.7 多 Agent 自动连载引擎 (Serialization Engine - Phase 5)
- **连载任务状态机 (`SerializationJob`)**：支持 `PENDING` -> `RUNNING` -> `WAITING_REVIEW` -> `COMPLETED` 完整生命周期。
- **安全防破坏性机制 (Auto-Approve Guard)**：
  - 默认安全模式：单章生成与审稿后自动挂起为 `WAITING_REVIEW`，等待作者人工审阅后推进，严防不可逆覆盖；
  - 全自动模式：允许用户明确勾选后连续推进预定章节批次。
- **多 Agent 串联连载单步推进 (`advance_serialization_job_step`)**：
  1. 依据剧情弧与前文历史自动创建下一章节骨架；
  2. 场景编剧 Agent 生成 3~4 个细纲节拍；
  3. 正文作家 Agent 挂载五层记忆生成高质量正文并存入数据库不可逆快照；
  4. 逻辑审稿 Agent 自动产出一致性评分与体检项；
  5. 记忆管理员 Agent 沉淀本章事实与状态流转；
  6. 更新连载任务进度与已消耗 Token 计数。
- **自动连载控制台 (`SerializationModal.tsx`)**：
  - 提供目标章节数、单章字数、Token 预算及定稿模式设置；
  - 实时进度条与状态展示（单步推进、连续自动连载、暂停、取消）；
  - 历史连载记录追溯与一键跳转编辑器。

### 3.8 多格式发布与交付中心 (Publishing Center - Phase 6)
- **独立 HTML5 电子书单文件导出**：生成内嵌优雅响应式排版样式（深浅/羊皮纸主题切换、侧边栏悬浮目录导航、字数元数据），单文件免网络双击直接阅读。
- **标准网文连载 TXT 导出**：自动章名居中、段首双全角空格缩进、空行规范化，符合各大网文连载站点上传规范。
- **分级 Markdown 导出**：保持 H1/H2 结构与引言描述。
- **全书工程数据归档 JSON**：一键打包小说元数据、全部章节（含所有版本快照）、全部角色档案与关系图谱、世界观法则、长期记忆与大纲剧情弧。
- **工程快照还原与导入 (`import_novel_archive`)**：支持粘贴 JSON 备份无损复原为全新作品。

### 3.9 系统运维与数据库灾备 (System Diagnostics & Backup - Phase 7)
- **SQLite 在线热备份 (`backup_database`)**：采用 SQLite Backup API 在运行中创建完全一致的独立 `.db` 备份快照。
- **数据库诊断与优化 (`optimize_database`)**：执行 `PRAGMA integrity_check`、`PRAGMA wal_checkpoint(TRUNCATE)` 与 `PRAGMA optimize`，输出文件体积、健康度与全表行数统计。
- **发布与运维控制台 (`PublishingModal.tsx`)**：可视化管理导出、导入、热备份与碎片整理。

### 3.10 全站纸张质感与温润书卷美学系统 (Warm Parchment / Paper Studio)
- **纸张色调与材质**：彻底替换暗黑极客风，全面采用宣纸/米纸/羊皮纸质感背景（`#f4efe6` ~ `#fdfbf7`），正文区呈现一张米白象牙色物理稿纸（带柔和立体双层阴影与书页边框），正文中文大号衬线字体（“Source Han Serif SC”, “Noto Serif CJK SC” 等），首行缩进 2em，徽墨松烟字色 `#231f1a`。
- **印章与书卷点缀**：采用典雅朱砂红、沉香茶金（`#854d0e` / `#c2410c`）与竹青墨绿（`#047857`），形成统一的文人书房格调。
- **全站组件覆盖 (17 个模块)**：
  - 根视口与全局样式表：`src/App.css`, `src/App.tsx`
  - 布局体系：`Header.tsx`, `Sidebar.tsx`
  - 核心编辑与 AI 面板：`NovelEditor.tsx`, `AiAssistantPanel.tsx`
  - 视图模块：`DashboardView.tsx`, `StoryBibleView.tsx`, `CharacterFlowView.tsx`, `PlotArcsView.tsx`, `MemoryEngineView.tsx`
  - 弹窗与历史抽屉：`CreateNovelModal.tsx`, `CreateChapterModal.tsx`, `SettingsModal.tsx`, `SerializationModal.tsx`, `PublishingModal.tsx`, `VersionDrawer.tsx`
- **示范作品自动播种**：内置硬科幻小说《星穹之门：终极纪元》（含完整正文、人物拓扑关系、世界观真理与剧情弧），新用户打开立即可体验整套纸张文学写作环境。

### 3.11 极致创作体验优化与功能拓展 (Phase 8 - Fast & Rich Experience)
- **IPC 桥接双模自适应与 Web 兼容层**：`tauriBridge.ts` & `webMockStorage.ts`，浏览器端（`localhost:1420`）与桌面原生端无缝自适应，彻底消除 `reading 'invoke'` 浏览器未捕获异常；
- **模型网关 6 大主流服务商一键极速预设**：`SettingsModal.tsx` 预置 CPA 本地、DeepSeek 官方、OpenAI 官方、Ollama 本地、硅基流动、月之暗面 Kimi，点击一秒完成 Base URL 与 Model 填报；
- **全新全局命令面板 (`CommandPaletteModal.tsx`)**：全局快捷键 `Ctrl+K`，支持模糊检索、跨章节秒级穿梭、一键排版、保存快照与导航切换；
- **沉浸专注禅意模式 (Zen Mode)**：全局 `Ctrl+Shift+Z` 或顶栏切换，隐藏一切干扰侧栏，居中展示温润纸稿，按 `Esc` 键平滑退出；
- **AI 智囊团全能进化 (`AiAssistantPanel.tsx`)**：
  - 8 大高频剧情驱动快捷动作（顺势续写、五感场景、锋芒对话、内心微表情、情节反转、暗埋伏笔、动作交锋、章末钩子）；
  - 篇幅预期药丸（300/600/1200/2500字）、文风基调定制与发散度（0.2~1.0）滑块；
  - 候选灵感草稿暂存箱（Draft Stash）：支持多批草稿暂存、对比与选择性插入/替换；
  - 作家锦囊（起名大师、网文敏感违规词合规自查、黄金三章张力自测指南）；
- **正文编辑器与排版套件 (`NovelEditor.tsx`)**：
  - 4 大纸张主题切换：温润宣纸、澄心竹纸、复古牛皮、水墨夜读；
  - 字号弹性缩放（12px~32px，A-/A+ 快捷步进，预设浮窗与默认恢复）与动态行距自适应；
  - 一键文学规范排版（首行双全角缩进、中文标点规范化、连续多余空行压缩）；
  - 灵感与伏笔备忘随手记便签（Scratchpad）；
  - 单章字数目标进度环与读者阅读耗时预估；
- **章节列表与统计加强 (`Sidebar.tsx`)**：
  - 全书累计总字数与总章节数汇总看板；
  - 单章一键纯文本复制。

### 3.12 真实人类打字动力学流式写作引擎 (Human-like Typewriter Streaming Engine)
- **拒绝大块文字生硬突现与机械假打字**：彻底告别机械秒刷，基于人类打字动力学模型（Human Kinetics Model）打造专属调度器 `useTypewriterStream.ts`。
- **词组脉冲连击 (Word-Burst Rhythm)**：模拟真实输入法词组上屏特性，以 2~4 字为单位连击，词组间伴随 100~200ms 选词微停顿，节奏跌宕起伏。
- **标点与换行文学沉思深停顿**：逗号呼吸停顿 180~300ms，句末深思 380~580ms，段落换行构思 500~750ms，完全契合人类阅读与作家构思节拍。
- **3 档人性化创作速度**：
  - **沉思品味 (Slow)**：~7~8 字/秒（逐字推敲细品）；
  - **作家手速 (Normal - 默认)**：~13~15 字/秒（专业作者键盘心流）；
  - **文思泉涌 (Fast)**：~25~30 字/秒（快速成文）；
  - **直出模式**：瞬时全量输出。
- **纯原生 Web Audio 机械按键音 (`typewriterAudio.ts`)**：零外部依赖合成轻柔温润的客制化键盘麻将音与换行回车音，支持一键随时静音/开启。
- **全文本防御与零截断保障**：双重引用追踪 `fullText` 与 `displayedText`，动画执行期间点击“追加到文末”或“替换正文”直接装配完整全文本，并支持【⚡ 跳过】动画。

### 3.13 设定集解耦与信息架构彻底重构 (Characters & World View Decoupling)
- **问题根因定位**：原有实现将人物档案、关系拓扑、世界观法则、剧情弧线、伏笔悬念 5 个子模块全部混在单个 `StoryBibleView` 中，且组件内局部 Tab 状态未响应全局 Store 路由，导致顶部点击【世界观设定】时下方依然显示默认的人物卡片，造成“世界观和人物档案怎么都是同一个界面”的交互困扰。
- **独立解耦与专属视图重构**：
  - **`CharactersView.tsx`（人物档案中心）**：专属管理角色档案列表（卡片网格、姓名/别名/性格特质/核心动机/生平背景、已激活标签）与基于 React Flow 的人物动态关系拓扑图，右侧提供【+ 新建人物档案】。
  - **`WorldSettingsView.tsx`（世界观中心）**：专属管理世界观法则（Canon 权威分级、战力体系、地理超凡规则）、大纲阶段与剧情弧（StoryPhase & StoryArc）、伏笔与悬念追踪，右侧提供【+ 新增世界观规则】与【+ 埋设新伏笔】。
  - **`App.tsx` 精准分流**：将顶栏 `CHARACTERS`、`WORLD`、`PLOTS` 路由精准分流至两个专属视图。存量 `StoryBibleView` 同步加入对全局 `store.activeTab` 的双向监听，保障 100% 向下兼容。

### 3.14 正文字号调节失效修复与弹性排版系统 (Editor Typography Engine Fix)
- **问题根因定位**：`.ProseMirror` 在 `App.css` 中直接硬编码了 `font-size: 1.18rem`，导致外层容器的 `text-base` / `text-lg` / `text-xl` 样式类完全被 CSS 优先级覆盖，编辑器正文字体大小永远无法发生物理变化；同时旧版 A-/A+ 按钮逻辑在达到边界时无法步进且缺乏禁用状态与直观交互。
- **彻底修复方案**：
  1. **CSS 变量动态注入**：在 `App.css` 中将 `.ProseMirror` 绑定至 `--editor-font-size` 与 `--editor-line-height`，并定义 `.editor-surface .ProseMirror` 强制优先级保障；标题使用 `em` 相对比例实现等比缩放。
  2. **12px~32px 弹性平滑步进**：A- 与 A+ 按钮支持以 2px 为步长丝滑调节，达到边界（≤12px 或 ≥32px）时自动禁用并具备视觉反馈。
  3. **书卷风快速预设浮层**：点击 `{fontSize}px` 标签可呼出精致的书卷风预设菜单（14px 小号、16px 紧凑、18px 默认、20px 舒逸、22px 大号、26px 特大）及一键恢复 18px 默认字号，支持点击外部自动关闭。
  4. **全链路字号同步**：AI 作家流式写作预览框与持久化存储实时联动，存量 LocalStorage 配置向下兼容。

### 3.15 真实物理纸张材质与原稿信笺系统 (Tactile Literary Paper System)
- **问题根因定位**：原纸张切换仅修改了容器简单纯色背景与边框，缺乏真实物理纸张的纤维质感、帘纹肌理与光影叠纸厚度，被用户反馈“只是换了个颜色，没有很好效果”。
- **全面升级方案**：
  1. **纯 CSS/SVG 零依赖过程化纸张纹理**：
     - **温润宣纸**：手工熟宣细密棉麻纸筋与徽墨松烟（`#231d17`），柔和多层叠纸边缘阴影；
     - **澄心竹纸**：江南清幽竹浆素帘纹（细帘纵向帘纹），清润竹墨深青（`#17241a`），清澈护眼；
     - **复古牛皮**：斑驳原浆纤维杂质与古典古籍做旧暗角渐变（Vignette），浓郁沉香焦褐墨（`#2a1b10`），暗调胡桃木案书桌；
     - **水墨夜读**：深宵歙砚水墨氤氲底纹，柔润月华冷白字色（`#dfdbd0`，绝不刺眼），沉水香金点缀，暗金墨印。
  2. **传统书卷实体水印印章**：每张稿纸右下角加盖专属篆刻印信（`【宣纸·澄品】`、`【竹笺·幽韵】`、`【秘卷·珍藏】`、`【夜墨·沉吟】`），营造典雅文人收藏级手稿仪式感。
  3. **可选“信笺稿纸横线”开关**：工具栏一键开启/关闭原稿纸信笺行线，横线精确对齐正文行距，还原真正作家信笺手写体验。
  4. **视觉主题色块胶囊与灵感便签联动**：工具栏纸张选择器配备触感预览色块圆标；灵感随手记便签抽屉色彩实时联动。

### 3.16 小说多层级结构系统与独立剧情关系系统 (V2.0 架构升级)
- **拒绝简单二级目录**：彻底告别“小说 → 章节”的简陋单一结构，建立完备可扩展的 8 层内容层级体系：
  `系列 / 宇宙 (Series)` → `作品 (Novel)` → `部 / 篇 (Part)` → `卷 (Volume)` → `章 (Chapter)` → `场景 (Scene)` → `情节节拍 (PlotBeat)` → `正文段落 (Paragraph)`。
- **弹性启用与省略**：
  - `部`、`卷`、`场景`、`节拍` 支持根据作品形态自由启用或省略；短篇小说可只使用“作品 → 章节”，百万字史诗巨作可使用全层级体系；
  - 章节是默认连载发布单位；场景是默认 AI 正文规划与生成单位；节拍是可选的细粒度规划单位。
- **独立剧情关系系统 (Independent Plot System)**：
  - 涵盖要素：主线 (Main Plot)、支线 (Subplot)、故事弧 (Story Arc)、人物成长弧 (Character Arc)、伏笔 (Foreshadowing)、时间线 (Timeline)、并行叙事线 (Parallel Thread)。
  - **跨层级 M:N 网状因果矩阵**：剧情关系跨章、跨卷、跨部多对多自由关联，绝不与章节目录强制绑定为单一死板树形结构。
- **结构与生命周期安全操作**：
  - **层级排序与节点移动 (`move_node`)**：支持章节或场景跨层级平滑移动归属，自动重排后继节点序号；
  - **章节拆分 (`split_chapter`)**：在字符偏移点无损截断正文，新生成章节，自动保留不可逆版本快照并重排后继章节；
  - **章节合并 (`merge_chapters`)**：两章正文无缝拼接，原场景重新归属，原剧情关联通过 `UPDATE OR IGNORE` 安全平滑转移并清理孤儿节点；
  - **场景拆分与合并 (`split_scene`, `merge_scenes`)**：细粒度节拍智能拆分与回收；
  - **层级重编号 (`renumber_hierarchy`)**：一键全局或分卷规范化连续序列号。
- **多 Agent 创作上下文组装 (`assemble_hierarchical_creation_context`)**：
  - 多 Agent 创作时，自动递归向上追溯装配当前作品、当前部/篇、当前卷、当前章节目标、当前场景细纲与节拍，一站式注入关联的主线因果、人物蜕变阶段、伏笔提示与并行线汇聚点。
- **端到端集成测试全面覆盖**：
  - 专属套件 `db_test` 扩充至 **40 项测试**，涵盖新增的 Series、Part、HierarchyConfig、PlotBeat、CharacterArc、ParallelThread、M:N Plot Matrix、Move Node、Split/Merge Chapter/Scene、Renumber Hierarchy、Content Tree 以及 Hierarchical Context Assembly，**100% 测试通过**。
- **UI 联动与可视化落地**：
  - 侧边栏支持“大纲树模式（部/卷/章/场景展开）”与平铺章节表双模切换，提供一键重编号、拆分章节与合并章节弹窗；
  - 剧情中心 (`PlotArcsView.tsx`) 升级为四大子面板：故事弧与阶段、人物成长弧、并行叙事线、跨层级关联矩阵；
  - AI 创作面板 (`AiAssistantPanel.tsx`) 新增可折叠的“创作层级定位与剧情连续性上下文”卡片，支持一键将当前场景目标与剧情因果注入写作提示词。

### 3.17 全局全站 UI 与文字大小弹性缩放系统 & 日夜水墨模式 (UI Scale & Dark Mode)
- **全局等比缩放控制 (UI Scale Engine)**：
  - 在顶栏显著位置配置 `[ - ] 100% [ + ]` 交互药丸，支持 80% ~ 140% 步进 5% 自由平滑微调全站大小；
  - 配备点击快捷预设浮层菜单（90% 紧凑视野、100% 默认标称、110% 适度放大、120% 舒适大字、130% 巨幅沉浸）及一键重置 100% 标称值；
  - 采用原生 `document.documentElement.style.zoom` 引擎，实现顶栏、侧栏、主工作区、大纲看板、角色拓扑图、AI 面板、弹窗及表单的整树等比无损缩放，规避了单纯修改根 `font-size` 导致的布局破损问题；
  - 缩放比例持久化至本地存储 (`novelforge_ui_scale`)，应用冷启动与页面刷新时自动水合复原。
- **全局白天 / 黑夜水墨护眼模式与响应式文字防挤压加固 (Light & Dark System & Responsive UI)**：
  - 顶栏右侧配备一键日夜切换按钮（白天呈现月亮图标，黑夜呈现微光太阳图标），附带平滑悬停与点击反馈；
  - **正文纸张与全局暗色双向无缝联动**：进入黑夜模式自动将编辑器切换为水墨夜读 (`midnight`) 纸张；编辑器选择“夜读”亦双向同步开启暗色模式；`App.css` 注入案头暗色背景强制覆盖，杜绝四周出现刺眼浅色色块；
  - **全链路 Flex 防挤压契约**：顶栏中央 5 大核心导航按钮与编辑器工具条所有操作按钮统一附加 `shrink-0 whitespace-nowrap`，编辑器工具条增加 `overflow-x-auto scrollbar-none`，彻底终结了窄屏与非标准缩放下中文字符垂直折行成单字竖列的恶性 Bug；
  - **高对比度茶金色调 (WCAG AAA)**：暗色模式下将原本低对比度的棕褐色文字与高亮线全面升级为明亮温暖的水墨沉香金（`#f59e0b` / `#fbbf24`），补全了工作台与章节树全部 12 种浅色底色的暗色映射；
  - 暗色状态持久化至 `localStorage` (`novelforge_theme_mode`)，并在应用根节点挂载 `.dark` 类名；
  - 命令面板 (`Ctrl+K`) 全面联动：输入“黑夜”、“白天”、“放大”、“缩小”即可快速调用外观与缩放指令。

### 3.18 全局自由拖拽与可缩放工作台 (V2.1 Docking Workspace Engine)
- **专业级树形布局模型 (Docking Tree Architecture)**：
  - 数据模型基于纯 JSON 可序列化标准二叉/多叉分裂树 (`SplitNode` + `TabGroupNode`) 与应用内悬浮窗 (`FloatingPanel`)；
  - 核心树操作（`splitTabGroup`, `addTabToGroup`, `removePanelFromTree`, `swapPanels`, `reorderTabs`, `updateSplitSizes`）实现纯函数式自平衡剪枝与归一化，杜绝空节点残留与非法状态；
  - 配备 Schema 校验与自愈保护机制（`validateAndSanitizeLayout`），遇到异常或损坏配置时瞬间安全回退至默认推荐布局，正文与业务数据 100% 毫发无损。
- **5-Zone 停靠十字指示器与幽灵预览**：
  - 拖拽面板标题栏或标签页时自动展示全局幽灵跟随胶囊；
  - 进入任何 Tab 组自动激活 5 分区吸附十字（左侧拆分、右侧拆分、顶部拆分、底部拆分、中央合并为标签页）；
  - 动态渲染温润茶金半透明预览高亮框（Drop Preview Rect），松手瞬间精准执行原子化树变换。
- **双向无损分割线缩放 (Splitter Resizer)**：
  - 支持水平（左右分栏）与垂直（上下分栏）毫秒级流式拖拽微调，配置最小宽度/高度保护（120px/100px）；
  - 拖拽期间挂载全局全屏指针遮罩，彻底杜绝 React Flow 画布与 ProseMirror 编辑器吞噬指针事件；
  - 支持双击分割线一键等分尺寸。
- **全系统 20 大功能模块 100% 接入与面板注册中心 (Panel Registry)**：
  1. 小说章节目录 (`chapters`)
  2. 小说正文编辑器 (`editor` - 支持多实例)
  3. AI 写作助手 (`ai_assistant`)
  4. AI 主编控制台 (`editor_in_chief`)
  5. 多 Agent 状态面板 (`agent_status`)
  6. 角色档案 (`character_profiles` - 支持多实例)
  7. 人物关系图谱 (`character_flow` - React Flow)
  8. 世界观设定 (`world_settings`)
  9. 剧情大纲 (`plot_outline`)
  10. 故事弧管理 (`story_arcs`)
  11. 伏笔管理 (`plot_threads`)
  12. 小说时间线 (`timeline`)
  13. 长期记忆检索 (`memory_engine`)
  14. AI 审稿报告 (`review_report`)
  15. 章节版本对比 (`version_history`)
  16. 模型调用日志 (`model_logs`)
  17. Token 消耗统计 (`token_usage`)
  18. 自动连载任务队列 (`serialization_queue`)
  19. 章节目标与创作提示 (`chapter_goals`)
  20. 作品信息面板 (`novel_info`)
- **五套内置工作区预设与用户自定义管理**：
  - **专注写作布局**：正文编辑器居中占据大屏，左侧章节目录，右侧 AI 助手；
  - **多 Agent 协作布局**：正文、主编控制台、自动连载队列、审稿报告协同展示；
  - **世界观设计布局**：世界法则、人物关系拓扑图谱、角色档案与时间线深度联动；
  - **剧情策划布局**：大纲阶段、故事弧、伏笔暗线与章节目标规划深度联动；
  - **自由布局**：用户全自定义组合排布，支持另存新预设、重命名、删除及 JSON 导出/导入。
- **应用内全功能悬浮窗模式 (Floating Panel Mode)**：
  - 任意面板一键从主布局分离为悬浮窗，支持自由拖动与 8 方向边缘/四角尺寸拉伸；
  - 具备 Z-Index 焦点置顶管理、最小化折叠与一键重新停靠（Dock Back）回主工作台；
  - 支持快捷键 `Ctrl+M` 一键最大化独占当前面板与平滑恢复。
- **布局与正文数据彻底解耦**：
  - 拖拽或调整布局绝不触发正文重载，未保存草稿与光标 100% 稳定保留；
  - 隐藏或关闭面板视图绝不影响后台多 Agent 自动连载任务；
  - 端到端专项测试 `tests/test-docking-workspace.ts` 10 项严苛验证 **100% 通过**。

### 3.19 应用内自动更新与版本发布系统 (V2.2 Auto-Updater & Release System)
- **原生应用内更新引擎集成**：
  - 深度引入 `@tauri-apps/plugin-updater` 与 `@tauri-apps/plugin-process`，基于 Tauri 2 官方插件架构与 GitHub Releases 稳定通道实现版本探测；
  - 采用 Minisign 原生非对称签名验证，公钥内置于客户端配置，私钥由 GitHub Actions 严格保管，拒绝不可信更新包与篡改风险；
  - 精准区分错误状态：捕获网络超时、HTTP 403 频控、404 与签名校验失败，严禁将网络异常误报为“已是最新版本”。
- **升级前数据安全守卫 (DataSafetyGuard)**：
  - **正文未保存草稿保护**：更新前审查正文编辑器状态，若有未保存修改立即阻断，提供一键保存再更新；
  - **多 Agent 连载任务安全挂起**：自动识别并安全暂停处于 `RUNNING` 状态的长篇连载任务，保存断点检查点；
  - **SQLite 灾备与完整性诊断**：更新前自动调用 SQLite Backup API 创建独立 `.db` 一致性热备份，并运行 `PRAGMA integrity_check` 完整性核验。
- **现代化更新中心 UI (`UpdateCenter.tsx`)**：
  - 在设置中心新增“软件更新”页面，双 Tab 架构切换无缝（模型网关 / 软件更新）；
  - 全状态看板：已是最新、正在检查、发现新版本、正在下载、等待安装、正在安装、需要重新启动、检查失败、下载失败、安装失败；
  - 真实流式下载进度条：计算已下载字节、总大小、传输速率与精准百分比，严禁假进度；
  - 结构化更新日志浏览：分类呈现新增功能、功能优化、Bug 修复、兼容性变更与已知问题，支持按 SemVer 语义化降序浏览历史版本；
  - 更新偏好配置：支持启动时检查、自动检查周期（每 24h / 3天 / 7天 / 仅手动）、新版本通知提示、自动预下载与跳过指定版本。
- **GitHub Actions 自动化发布流水线 (`.github/workflows/release.yml`)**：
  - 配置基于标签推送触发的 CI/CD 流水线，自动化执行 TypeScript 类型检查、自动化测试、数据库 40 项全量验证；
  - 自动编译 Windows x64 NSIS 安装包、执行更新签名并生成 `latest.json` 清单，自动上传并创建草稿 Release (Draft Release)。
- **端到端专项验证全面通过**：
  - 自动更新专项测试套件扩充至 36 项断言，覆盖版本对比、签名配置、SemVer 排序、数据守卫、连载挂起与灾备。
- **更新按钮交互体验与防闪烁专项加固 (2026-10-21)**：
  - **问题根因定位**：旧版更新按钮及状态徽章硬编码了 Tailwind `animate-pulse` 动效；且在用户点击触发 `startSafeUpdateFlow` 时遗漏将状态置为 `PRECHECKING`，导致后台已正常启动数据库检查和热备份，但前台按钮依然滞留在可点击态并以 2 秒周期持续呼吸闪烁，给用户造成“点击后卡住一直闪烁”的交互错觉；
  - **全链路优化与修复方案**：
    1. 彻底移除更新按钮、状态徽章与进度条上的 `animate-pulse` 呼吸动效，换为稳定、确定性的专业按钮样式与进度条；
    2. 完善 `useUpdateStore.ts` 状态机流转：点击更新瞬间立即切入 `PRECHECKING`，消除旧按钮残留，并在取消时平滑回退至 `UPDATE_AVAILABLE`；
    3. 在 `UpdateCenter.tsx` 顶部操作区补齐全生命周期状态按钮（安全检查与灾备中、正在下载更新包、正在启动安装程序、立即重启、重试更新），并在更新期间安全禁用检查按钮；
    4. 为升级前安全检查弹窗 `PreUpdateSafetyModal.tsx` 增加 `isSubmitting` 加载态与旋转 Spinner，杜绝用户连击；
    5. 将 `Header.tsx` 与 `SettingsModal.tsx` 上的剧烈 `animate-ping` 闪烁红点升级为精致静态高光红点。
### 3.16 可停靠工作台全模块自适应容器与响应式排版修复 (Docking Workspace Responsive Container Fix)
- **问题根因定位**：
  - 用户在 Docking 工作台中把“AI 写作助手”面板拉宽或最大化后，内容区仍被强制局限在左侧 384px 宽度，右侧留出大片空白；
  - 经排查定位，旧版 `AiAssistantPanel.tsx` 根节点硬编码了 `w-96`（固定 384px）、`shrink-0`、`border-l` 与 `h-[calc(100vh-3.5rem)]`，违背了 Docking 面板容器的弹性伸缩契约；
  - 同时正文编辑器 `NovelEditor.tsx` 也存在残留的 `h-[calc(100vh-3.5rem)]` 视口高度写死问题。
- **全链路彻底修复与响应式增强**：
  1. **面板根节点容器弹性化**：将 `AiAssistantPanel.tsx` 根容器升级为 `w-full h-full flex-1 min-w-0 bg-[#f3ede1]/95 backdrop-blur-xl flex flex-col select-none overflow-hidden`，彻底解除 `w-96` 与视口高度锁定；
  2. **高频创作预设动作响应式流**：由固定 4 列改造为 `grid-cols-4 sm:grid-cols-4 md:grid-cols-8`，拉宽时 8 项动作单行优雅排布，窄屏时自适应折叠为 2 行 4 键；
  3. **正文实时流式草稿区全幅利用**：草稿展示框、打字机速度控制条、字数指示器与装载动作全面铺满横向空间，提供极佳的长文本创作视野；
  4. **正文编辑器与角色卡片网格响应式适配**：`NovelEditor.tsx` 改为容器 100% 自适应 `w-full h-full`；`CharacterProfilesPanel.tsx` 升级为 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` 响应式网格。

### 3.17 桌面端顶栏溢出修复与面板右上角最大化放大按钮集成 (Header Overflow Fix & Panel Maximize Suite)
- **问题根因定位**：
  - 用户反馈“桌面端 UI 显示不全，右上角的放大都不见了”；
  - 核心原因一：顶栏 `Header.tsx` 元素过多（包含长文本作品名、5 个宽导航按钮、全局搜索快捷键、模型名称、自动连载、交付备份、字数、导出），在非超宽屏（如 1080p 开启 125% 缩放或窗口未全屏时）总宽度超过视口宽度，导致最右侧的关键工具栏（全站界面缩放 `ZoomIn`/`ZoomOut` 放大缩小、日夜模式、全屏专注、设置）被横向挤出屏幕外截断；
  - 核心原因二：每个 Docking 面板标签组 `TabGroup.tsx` 顶栏原本仅有 `+` 按钮，缺失面板级别的“最大化/放大”快捷控制；
  - 核心原因三：正文编辑器内部工具栏在分屏较窄时，由于排版按钮过多导致右侧的“全屏/放大”按钮被滚动条盲区隐藏。
- **全链路解决落地**：
  1. **顶栏响应式自适应改造 (`Header.tsx`)**：
     - 最右侧核心工具栏（界面缩放放大/缩小、白天/黑夜、全屏专注、系统设置）使用 `shrink-0 ml-auto z-20` 强行锚定在右上角，绝不发生溢出截断；
     - 中间导航按钮、全局搜索与次要操作按钮在视口较窄时自适应折叠文字标签保留精致图标，并在 `>=1280px` / `>=1536px` 展开文字；
  2. **Tab 标签栏右上角全功能控制集成 (`TabGroup.tsx`)**：
     - 在每个面板标签栏右上角加入 **最大化/还原当前面板按钮 (`Maximize2` / `Minimize2`)**，支持一键将当前选中的正文编辑器或 AI 助手等任意面板放大独占，再次点击即刻无损恢复；
     - 同步集成 **悬浮独立显示快捷按钮 (`ExternalLink`)** 与 **4 方向拆分布局菜单 (`MoreVertical`)**；
  3. **编辑器工具栏右侧操作区锚定 (`NovelEditor.tsx`)**：
     - 右侧【保存快照】与【全屏专注/放大】按钮增加 `ml-auto shrink-0 z-10` 保护，防止被长排版工具挤出视野。

### 3.20 桌面端无边框沉浸式顶栏与一体化窗口控制 (Frameless Desktop Window & Window Controls)
- **需求定位**：
  - Windows 原生深色模式下，Tauri 窗口顶部附带黑色宽条系统标题栏，不仅割裂文人宣纸与水墨创作美学，且浪费了约 32px 的垂直屏幕空间。
- **全链路沉浸式改造**：
  1. **Tauri 窗口无边框与阴影配置**：
     - 在 `src-tauri/tauri.conf.json` 中配置 `"decorations": false`，彻底消除操作系统黑色标题栏；
     - 配置 `"shadow": true`，保持 Windows 原生窗口边缘柔和立体投影。
  2. **Tauri 2 窗口控制权限授权**：
     - 在 `src-tauri/capabilities/default.json` 授权全部必要窗口控制指令（`minimize`, `maximize`, `unmaximize`, `toggle_maximize`, `is_maximized`, `close`, `start_dragging`）。
  3. **一体化沉浸式顶栏与原生交互继承**：
     - 在全局 `<Header>` 根节点注入 `data-tauri-drag-region` 并绑定双击最大化/还原交互，完美保留按住顶栏任意空白处移动窗口、双击顶栏最大化/缩小的桌面端直觉体验；
     - 研发专属组件 `src/components/layout/WindowControls.tsx`，在顶栏最右侧集成「最小化（—）」、「最大化/还原（🗖）」与「关闭（✕）」；
     - 自适应状态感知：监听 `onResized` 事件，动态在单方块与层叠方块间切换；关闭按钮遵循 Windows 规范微红变色防误触（`hover:bg-rose-600`），白天与夜间主题无缝兼容。

### 3.21 顶栏高缩放溢出防御与全屏放大关闭键持久化 (Header Zoom Overflow Guard & Fullscreen Controls)
- **问题根因定位**：
  - 用户反馈“放大后，关闭键不见了”；
  - 核心根因一：`Header.tsx` 右侧将次要功能（全局搜索、模型名称、自动连载、交付备份、字数统计、导出）与常驻核心控制（缩放、日夜、Zen专注、设置、侧栏、窗口控制）混在同一个 `shrink-0` 容器中。在界面放大（UI Scale 110%~140%）或非超宽屏下，整行总宽度严重超出视口，导致位于最右侧末尾的 `WindowControls`（含关闭键 ✕）被 Flex 排版直接推到屏幕视口之外截断；
  - 核心根因二：`WindowControls.tsx` 初始 state 默认为 `false`，且缺少严格的 `shrink-0` 防挤压与清晰的高对比度关闭反馈；
  - 核心根因三：正文编辑器 `NovelEditor.tsx` 在点击右侧全屏专注模式后，以 `fixed inset-0 z-50` 盖住整个视口包括 Header，内部缺少显著的退出/关闭全屏按钮，且未监听 `Esc` 键退出，导致用户在全屏放大后找不到任何关闭或退出入口。
- **全链路彻底修复与加固方案**：
  1. **顶栏层级结构拆解与绝对锚定**：
     - 将顶栏右侧拆为“次要功能操作区”与“核心常驻与窗口控制区”；
     - 核心常驻与窗口控制区采用 `shrink-0 ml-auto z-20` 强行锚定在顶栏最右侧，赋予绝对最高显示优先级；
     - 次要功能操作区（自动连载、交付备份、全局指令等）在空间不足或高缩放时自适应折叠文字保留图标；中间导航栏在宽屏不足时自适应隐藏文字保留精致印章图标；
     - 彻底保障无论界面如何缩放放大（80% ~ 140%）、无论窗口多窄，右上角的最小化、最大化、关闭键永远稳如泰山、100% 完整可见。
  2. **正文编辑器全屏与关闭体系打通**：
     - 在 `NovelEditor.tsx` 全屏专注模式下，工具栏右侧动态呈现高对比度醒目的【退出全屏 (Esc)】关闭按钮（红底悬停 + X 图标）；
     - 全屏状态下同步在最右侧挂载 `<WindowControls />`，确保全屏下依然可一键最小化或关闭软件；
     - 全局监听键盘 `Escape` 键，按下瞬间优雅退出全屏专注模式。
  3. **Docking 工作台与 Tab 关闭可见度提升**：
     - Docking 工作台最大化独占模式状态条新增 `Esc` 键退出快捷支持与优化文案；
     - TabGroup 标签页关闭按钮默认可见度从 60% 提升至 80%，图标微调更清晰。

### 3.22 V2.3 REA 逆向研究驱动的小说专项工具箱与剧情工作流执行引擎
- **背景与调研成果归档**：
  - 基于 REA (reverse-engineer-anything) 工具链与公开逆向分析方法，全面调研了闭源商业产品「星月写作」与三大知名开源小说工程（`novel-studio`, `novel-engine`, `sheengoa/novelforge`），沉淀了 `docs/research/` 目录下 19 篇深度调研报告与五方 30 维功能对比矩阵；
  - 严格落实合规隔离红线（遵循 Clean-Room 原则，绝不复制代码或侵犯 AGPL 许可证），将星月写作最具竞争力的“小说专项生成器”与“设定集显式关联选择器”，以及开源项目优秀的“卡片内原地修改”和“多 Agent 上下游流水线”进行了系统化自研重构。
- **核心功能落地与工程实现**：
  1. **SQLite 数据底座与流水线状态流转 (3张新表 + 索引)**：
     - `workflow_templates`：持久化开箱即用与用户自定义的剧情推演流水线模板（内置播种「网文黄金三章开篇推演」与「高潮单章精细爆破」）；
     - `workflow_runs`：记录推演实例生命周期（`PENDING` -> `RUNNING` -> `WAITING_STEP` -> `COMPLETED`），记录上下文绑定与 Token 累计；
     - `workflow_step_records`：记录每一步的提示词渲染模板、输入参数、模型原始内容与人工原地打磨后的内容（`edited_output`）。
  2. **8 大网文小说创作专项工具箱 (`NovelistToolboxModal.tsx` & `ToolboxPanel.tsx`)**：
     - 提供起名灵感 (name)、爆款简介 (intro)、颠覆脑洞 (premise)、外挂金手指 (cheat)、力量体系 (world_law)、黄金开篇 (gold_opening)、单章细纲 (chapter_outline)、对白精修 (dialogue_polish)；
     - 集成专用提示词装配器 `assemble_toolbox_prompt`，动态融合作品背景、文风调性与设定资料；
     - 直连真实模型网关（`execute_llm_chat`）；
     - 提供多通道一键落地能力：追加至当前章节正文、存为新角色档案、存为世界法则、创建为新章节、复制到剪贴板。
  3. **设定集上下文关联选择器 (`ContextPicker.tsx`)**：
     - 支持在任何推演任务中显式勾选人物档案、核心世界法则（Canon），并支持一键关联前一章正文片段；
     - 具备实时搜索过滤、已选计数徽章与折叠展开，既满足深度约束又保持界面轻盈。
  4. **卡片式流水线执行与原地打磨引擎 (`WorkflowRunnerModal.tsx` & `WorkflowPanel.tsx`)**：
     - 分步执行卡片视图，已完成步骤绿标，当前步骤高亮，待命步骤渐变；
     - 上游产出自动作为动态变量（`{{step_1_output}}` 等）注入下游步骤；
     - 输出框支持用户直接键盘修改打磨（原地保存），下游步骤严格消费人工修订后的高质量设定；
     - 支持历史实例切换与断点继续。
  5. **顶栏快捷入口与全局快捷指令**：
     - 在全局 `<Header>` 顶栏新增专项工具箱与工作流引擎入口；
     - 接入全局命令面板 `CommandPaletteModal`（`Ctrl+K` 一键唤起）。
  6. **双模 IPC 桥接与端到端验证**：
     - `tauriBridge.ts` 与 `webMockStorage.ts` 同步支持 8 个工作流命令与通用 LLM 对话；
     - `cargo run --bin db_test` 44 项全量测试 100% 验证通过；
     - 前端 `npm run build` 945ms 极速构建零错误！

### 3.23 V2.3.1 作者文风档案建模 (Voice Profiles)、审稿仲裁一键修复闭环与停靠工作台全新预设
- **核心成果与业务落地**：
  1. **SQLite 文风底座与内置播种 (`voice_profiles` 表与索引)**：
     - 新建 `voice_profiles` 数据表，建模了包括句式节奏 (`sentence_rhythm`)、词汇语调 (`vocabulary_tone`)、叙事视角偏好 (`pov_preference`)、感官描写比重 (`sensory_ratio`)、样例文本 (`sample_text`) 与自定义法则 (`custom_rules_json`) 在内的多维文风参数体系；
     - 自动播种 3 套主流专业文风：「仙侠修真·沉雄雅致风」、「都市异能·爽利快节奏」、「硬核科幻·冷峻考据风」；
     - 实现多小说文风隔离与激活互斥切换机制：小说专属文风优先于全局文风，切换时自动将同属范围内的其他文风置为非激活。
  2. **作者文风工作室 (`VoiceProfilePanel.tsx` & `VoiceProfileModal.tsx`)**：
     - 左右分栏视图：左侧快速浏览预设与小说定制档案，右侧进行各维度参数调优与法则增删；
     - 内置“现场试读推演体验”：一键将当前文风的多维提示词与当前小说背景装配，呼叫大模型现场生成 200 字试读正文；
     - 支持作为停靠面板吸附于工作台，亦可通过顶栏快捷按钮或 `Ctrl+K` 全局指令直接唤起。
  3. **审稿仲裁闭环与一键无损差异替换正文 (`ReviewReportPanel.tsx`)**：
     - 在每条质检发现卡片上增加【✨ 一键生成修复草案 (对齐文风)】按钮，后端 `generate_finding_repair` 自动提取发现详情、匹配当前小说的激活文风，生成结构化 JSON 修订文本与差异说明；
     - 前端展示修订草案比对面板，允许作者原地直接打字微调；
     - 提供【✅ 采纳并替换入正文 (留存快照)】：执行精准文本替换，并在当前章节自动保存带 `AUDIT_REPAIR` 标记的新版本快照，无损安全不破坏用户创作；
     - 支持【🚫 忽略/误报】与【❌ 放弃草案】。
  4. **停靠工作台专项创作预设拓展 (C10)**：
     - 在 `workspacePresets.ts` 中新增「小说构思工坊 (`concept_workshop`)」与「工作流流水线 (`workflow_pipeline`)」两套专业级停靠布局预设，全面贯通目录、正文、工具箱、文风、大纲与审稿；
     - 面板总数扩展至 23 个原生可拖拽组件。
  5. **端到端 48 项业务测试与极速构建**：
     - `cargo run --bin db_test` 48 项测试 100% 全部通过；
     - 前端 `npm run build` 1.12s 极速构建零错误。

### 3.24 第一梯队优化：正文划词悬浮智能胶囊与审稿行内原地 Diff 局部采纳 (Floating Capsule & Inline Visual Diff)
- **划词悬浮智能胶囊 (`FloatingSelectionMenu.tsx`)**：
  - 在 Tiptap 正文编辑器内实现智能划词悬停感知：选中 2 字符以上文学文本即优雅浮现微型水墨胶囊；
  - 提供 5 大高频定向微操作：
    1. **去AI味重写 (`humanize`)**：调用 Humanizer 诊断引擎与专职润色提示词，彻底剔除套话与说明文腔调；
    2. **动作化白描 (`actionize`)**：践行“Show, Don't Tell”，以微动作与物象交互代替抽象心理说明；
    3. **五感具象化 (`sensory`)**：补充听觉、触觉、温感、气味与光影具象细节；
    4. **对白脱俗化 (`dialogue`)**：剔除书面腔与现代说明语，强化潜台词、说话风格与呼吸顿挫；
    5. **存为设定法则 (`save_rule`)**：一键将选中文本提炼为世界观法则并即刻落库至 SQLite。
  - **原地交互与版本安全**：
    - 展开操作时不因微小鼠标晃动关闭；
    - 支持直接在浮窗内编辑修改生成结果；
    - 采纳时调用 Tiptap 原子替换并将原选区平滑覆盖，触发自动保存并生成 `INLINE_AI_APPLY` 不可逆安全历史版本快照；
    - 浮窗自带一键复制与快捷关闭。
- **纯算法差异比对引擎与水墨可视化 Diff (`textDiff.ts` & `InlineDiffViewer.tsx`)**：
  - **高精度 Myers/LCS 双模差异算法**：`src/utils/textDiff.ts`，自动按字符级或中文词边界分词比对，识别 `EQUAL`、`ADDED`、`REMOVED` 变更块；
  - **水墨风可视化 Diff 组件 (`InlineDiffViewer.tsx`)**：
    - 红色划线背景高亮被删原文，墨绿圆角微底色高亮新增精修词句；
    - 提供【对比模式】与【最终效果】一键切换药丸；
    - 针对完全新增或无原证据的情形提供单栏无缝呈现。
- **审稿仲裁全面接入 Visual Diff (`ReviewReportPanel.tsx`)**：
  - 审稿发现一键生成修复草案后，原纯文本展示全面升级为 `<InlineDiffViewer />` 红绿高亮差异比对；
  - 支持直接编辑草案微调，微调输入即时联动 Diff 刷新，大幅降低作者审查改动成本。
- **专项测试 100% 验证**：
  - `tests/test-text-diff.ts`（5 项差异算法测试全过）；
  - `tests/test-humanizer-engine.ts`（17 项套话拦截与评分测试全过）；
  - 前端 `pnpm build` 999ms 极速构建零错误。

### 3.25 第二梯队演进：多模型同台比稿竞技场 (Multi-Model Arena & Duel Platform)
- **核心定位与动机**：
  - 在大模型网文创作中，不同大模型（如 DeepSeek、OpenAI、Claude、Qwen、GLM）或不同 Temperature 参数在叙事节奏、文学修辞、动作描写与对白张力上各有千秋；
  - 创作者无需在不同面板间来回复制粘贴比对，提供一站式同台并发竞技平台，支持盲测模式消除品牌光环偏见，并支持智能提炼二者精华生成“融合版”。
- **全链路核心特性与交付成果**：
  1. **SQLite 数据底座与战报持久化**：
     - 新建 `model_arena_runs` 表与 `idx_model_arena_runs_novel` 索引，规范记录 `session_id`, `prompt`, `model_a/b_provider`, `model_a/b_name`, `model_a/b_output`, 耗时、Token 数、`winner_slot`、盲测状态与融合版本 `merged_output`；
     - `DbManager` 新增比稿保存、列表查询与删除等方法，严密关联当前小说工程。
  2. **Rust 原生并发双流式请求架构**：
     - 原生命令 `execute_arena_duel`：使用 Tokio 异步运行时，通过 `tokio::join!` 并发请求两个不同的模型服务商与端点；
     - 细粒度多通道流式广播：通过 Tauri 事件 `arena-stream-chunk` 派发 `{ session_id, slot: "A" | "B", chunk, is_done }`，实现双栏左右并排独立逐字渲染且绝对无串流；
     - 融合命令 `merge_arena_outputs`：专用文学融合 Agent，提炼 A/B 双方最佳描写与金句，输出结构化高质量融合草案。
  3. **专业级双入口前端交互 (`ModelArenaPanel.tsx` & `ModelArenaModal.tsx`)**：
     - **停靠工作台第 24 个原生面板**：在 `PanelRegistry.tsx` 注册 `model_arena` 面板，支持自由吸附至主界面任意区域；
     - **全屏沉浸式模态弹窗**：顶栏【比稿竞技】按钮与全局 `Ctrl+K` 快捷指令均可瞬间呼出；
     - **盲测模式 (Blind Test)**：一键开启“选手甲 vs 选手乙”，隐藏模型名称与服务商，生成完毕后作者凭纯文学表现投票裁决，投票后自动揭晓真实底牌；
     - **实时 Humanizer 诊断对比**：左右双栏分别实时运行 `HumanizerEngine.auditText`，给出人情味得分（0~100）、套话命中数与诊断等级，用科学量化指标辅助裁决；
     - **Visual Diff 差异透视**：一键切换 `<InlineDiffViewer />`，以水墨红绿高亮清晰对比两套方案的用词差异；
     - **一键采纳与版本安全**：支持【采纳 A 方案】、【采纳 B 方案】、【智能融合】；采纳时调用 Tiptap 原子操作写入正文（支持“替换正文”或“追加到文末”），并自动创建历史版本快照，无损安全；
     - **历史战报抽屉**：随时回溯以往比稿记录与融合版本。
  4. **全套自动化测试 100% 验证**：
     - 后端 `cargo run --bin db_test` 50 项测试 100% 绿灯（测试 49 盲测与持久化，测试 50 智能融合更新）；
     - 前端 `pnpm test:arena` 17 项全链路专项测试 100% 绿灯；
     - 前端 `pnpm build` 1.03s 生产打包零错误。

### 3.26 第三梯队演进：全渠道交付升级 (EPUB 3 国际标准导出 & 主流网文平台一键排版清洗机与发布合规预检)
- **核心定位与动机**：
  - 小说完成创作与打磨后，最终交付与分发体验是决定作者生产效率的关键一环；
  - 传统模式下，作者要将正文发布到起点中文网、番茄小说、晋江文学城等平台，需要手动繁琐地修改段首缩进、消灭杂乱空行、统一半角标点，且极易因误用敏感词而遭到平台秒封或锁章；
  - 同时，作者迫切需要将全书一键导出为可以直接导入微信读书、Kindle、Apple Books 和各类墨水屏阅读器的国际标准 EPUB 电子书，随时随地进行手机端沉浸试读与读者分享。
- **全链路核心特性与交付成果**：
  1. **纯 Rust 原生 EPUB 3 国际标准打包引擎 (`src-tauri/src/export/epub.rs`)**：
     - 自研零新增外部依赖的轻量级 ZIP 打包器，精准遵守 IDPF EPUB 3 规范；
     - 第一项保证为未经压缩的 `mimetype` (`application/epub+zip`)；
     - 自动组装 `container.xml`、`content.opf` (UUID、元数据、manifest、spine、guide)；
     - 双模目录支持：EPUB 3 Navigation Document (`nav.xhtml`) 与 EPUB 2/3 向后兼容层次目录 (`toc.ncx`)；
     - 附带针对电子墨水屏与高分辨率屏深度优化的“典雅宣纸水墨”排版样式表 (`style.css`，支持暗黑模式) 与精美 SVG 矢量水墨封面 (`cover.xhtml`)；
     - 原生命令 `export_novel_epub`，支持自动保存至文档目录或指定路径，并返回大小与章节统计。
  2. **主流网文平台一键排版清洗机 (`TypesetterEngine.ts`)**：
     - **四大主流网文平台专属预设**：
       * **起点中文网**：标准全角两空格缩进 `\u3000\u3000`，段与段紧凑无多余空行（适配起点后台内置行距机制）；
       * **番茄小说**：标准全角缩进，段与段之间保留单空行呼吸感（深度贴合番茄读者滑动手机阅读习惯）；
       * **晋江文学城**：标准缩进与非法特殊符号过滤；
       * **通用全角纯净版**：消灭各种制表符与乱码。
     - **标点符号智能转置**：半角逗号、句号、感叹号、问号、冒号、分号、括号自动转全角（保护浮点数如 `3.14` 不被误伤）；连字符 `--` 转标准破折号 `——`；英文省略号 `...` 转标准中文六点省略号 `……`；英文直引号根据语境转为成对中文双引号 `“”`。
  3. **发布合规预检系统 (Censor Guard)**：
     - 内置分类敏感词与平台限流违规词库（涉政、涉暴力血腥、涉低俗擦边、平台常见封禁屏蔽词）；
     - 动态扫描标出行号、列号、风险等级（HIGH/MEDIUM/LOW），并提供网络文学化建议替换词（如“肢解”建议替换为“重创/撕碎”），支持在界面上一键直接替换。
  4. **全端交互与双入口集成**：
     - **工作台第 25 个原生停靠面板**：在 `PanelRegistry.tsx` 中注册 `typesetter_cleaner` 面板，支持在多栏停靠布局中常驻使用；
     - **全屏沉浸弹窗 (`TypesetterCleanerModal.tsx`)**：顶栏【排版清洗】按钮与 `Ctrl+K` 全局快捷指令随时一键唤起；
     - **全本交付中心扩充 (`PublishingModal.tsx`)**：在 HTML5、TXT、Markdown 卡片基础上，新增【标准 EPUB 3 电子书 (.epub)】一键导出卡片；
     - 提供【一键复制 (直贴后台)】、【采纳并覆盖当前章节 (留存快照)】与【导出 TXT/EPUB】。
  5. **全套自动化测试 100% 验证**：
     - `cargo run --bin db_test` 扩展至 52 项核心测试全部绿灯（测试 51 真实生成 EPUB 并校验 PK\x03\x04 与 mimetype，测试 52 校验 IEEE 802.3 CRC-32 测试向量）；
     - `pnpm test:typesetter` 19 项排版算法与合规测试全部绿灯；
     - 前端 `pnpm build` 1.50s 零错误构建完成。

### 3.27 第四梯队演进：长篇存稿极速解析与 Word (.docx) 智能分章导入系统 (Word Docx Parser & Smart Importer)
- **核心定位与动机**：
  - 广大网络小说创作者与传统作家在向 NovelForge AI 迁移时，电脑本地普遍积累了大量以 Microsoft Word (.docx) 格式保存的历史存稿、全书大纲或完结旧作；
  - 传统手动“复制 -> 新建章节 -> 粘贴”方式极度繁琐，若有几十万字长篇存稿需要几天时间手动搬运；
  - 亟需一套真正纯本地离线运行、轻量级、支持大体量长篇、能够精准识别中文章节标题并支持批量入库的 Word 解析系统。
- **全链路核心特性与交付成果**：
  1. **纯本地轻量 Word (.docx) 解析引擎 (`WordImportService.ts`)**：
     - 深度集成纯客户端运行的 `mammoth` 引擎，直接在内存中解析 DOCX 压缩包与 `word/document.xml` 文本流；
     - 零数据上云、零网络请求，彻底消除作家原稿与未公开创意泄露风险；
     - 解析速度毫秒级，即使 50~100 万字大体量稿件也能在 1 秒内完成文本与段落抽取。
  2. **中文网文智能分章算法 (Smart Chapter Splitter)**：
     - 覆盖全网各大主流章节排版规范：
       * 经典中文序数模式：`第X章`、`第X卷`、`第X回`、`第X节`、`第X篇`、`第X部`；
       * 英文与混排：`Chapter \d+`、`Section \d+`、特殊符号 `【第.+章】`；
       * 序章与特殊节点：`引子`、`序章`、`序言`、`楔子`、`前言`、`尾声`、`后记`、`番外`、`上架感言`；
     - 智能前言提取：若第一章前存在创作背景或说明，自动分离为独立的“序章/前言”；
     - 智能单章降级：对短篇或无明显章节标记的稿件，自动降级为单章整体导入；
     - 自定义正则支持：高级作者可自定义切分规则并实时刷新预览。
  3. **网文段落排版规范化清洗**：
     - 自动剔除连续冗余空行、Office 杂乱换行符与两端空白；
     - 严格遵循标准网文全角双空格缩进 `\u3000\u3000`，使导入正文即刻达到可读可写标准。
  4. **全功能可视化导入工作台 (`WordImportModal.tsx`)**：
     - 拖拽与点击选择上传；
     - 实时展示文件名、体积、总字数、段落数、识别章节数；
     - 章节列表支持全选/全不选、就地实时编辑章节标题、字数统计徽标与展开正文首段摘要试读；
     - 两种入库模式：【新建小说整本导入（自动创建书名与流派）】与【追加到现有作品末尾】；
     - 进度条与实时章节标题流式入库反馈，完成后自动刷新目录树并切换至第一章。
  5. **全端 4 大直观入口全覆盖**：
     - **顶栏【创作工坊】下拉菜单**：高亮常驻【Word 文档 (.docx) 导入】；
     - **大屏幕顶栏快捷工具条**：集成 `Word导入` 独立按钮；
     - **侧边栏作品管理与目录树**：作品选择器右上角提供【导入Word】快捷键；空章节状态下提供【导入Word】一键建章；
     - **全局指令速查面板 (`Ctrl+K`)**：搜索“word”、“导入”即刻呼出。
  6. **单元测试与全套构建 100% 验证**：
     - `tests/test-word-import.ts` 16 项正则分章、前言提取、段落缩进、字数计算测试 100% 全部通过；
     - `pnpm build` 982ms 零错误编译通过。

### 3.28 模型网关配置与模型 ID 状态持久化与多端协同修复
- **根因彻底查明与修复**：
  1. `SettingsModal.tsx` 初始化时硬编码 `useState('gpt-4o-mini')`，且在 `useEffect` 中仅同步了服务商的 `name`、`base_url`、`api_key`，彻底遗漏了向 SQLite 查询真实绑定模型的调用（`api.listModels(activeProvider.id)`），导致每次打开设置弹窗模型 ID 均强制回退为 `gpt-4o-mini`；
  2. 修复初始 SQLite 种子数据：修改本地 CPA 预设与初始种子的模型名称为一致的 `gemini-3.8-flash-high`，杜绝预设卡片与初始输入框分裂；
  3. 引入多服务商隔离与切换：弹窗支持在多个已配置服务商（如本地 CPA、DeepSeek、硅基流动等）之间一键切换并加载各自专属的 API Key 与 Model ID，避免单 ID 盲目覆盖；
  4. 强化 API 测试交互：连通性测试返回的可用模型列表升级为可点击胶囊芯片，用户一键点击即可将扫描到的真实模型名填入输入框；在输入框下方增加常用模型快速候选；
  5. 全局状态响应式打通：在 `useNovelStore` 中新增 `activeModel`，顶栏 Header 与侧边写作面板实时呈现当前活跃的【服务商 · 模型名称】（例如：`本地 CPA / 代理 · gemini-3.8-flash-high`）；
  6. 专项测试保驾护航：新增 `tests/test-provider-model.ts`，8 项持久化与多服务商隔离测试 100% 全部通过。

### 3.29 全屏与最大化状态下顶栏右侧溢出根除与窗口控制区绝对锁定
- **问题根因定位**：
  1. 窗口最大化时触发 Tailwind `2xl` 断点（>= 1536px），顶栏原先平铺了 7 个工坊按钮（Word导入、百宝箱、工作流、文风、竞技、排版、交付备份），总计占据超过 520px；
  2. 叠加 Logo、导航 Tabs、全局指令与模型徽标后，顶栏所需物理宽度超过 2000px，导致顶栏在 `[交付备份]` 处直接撞到屏幕右侧边缘；
  3. `<header>` 的 `overflow-hidden` 导致其右侧的字数统计、全站缩放、日夜主题、专注模式、设置齿轮以及**无边框窗口控制区（最小化、最大化/还原、关闭 X）全部被挤出屏幕外并被截断**。
- **加固与重构措施**：
  1. **顶栏快捷工坊优雅收敛**：移除 7 个按钮平铺，保留高频刚需的专属 `[Word导入]` 蓝色快捷胶囊，其余专项统一收纳于常驻的【创作工坊 ▾】下拉菜单，释放 >380px 空间；
  2. **Far-Right 系统控制区物理锁定**：分离出 `shrink-0 ml-auto h-full z-40 bg-[#efe9dc]` 系统控制容器，将全站缩放、主题切换、专注写作、设置齿轮、AI助手面板开关及 WindowControls 牢牢锁定在屏幕右上角，绝对不可被中间元素挤压；
  3. **WindowControls 桌面与全屏双模深度加固**：
     - Tauri 模式：同时监听 `isMaximized()` 与 `isFullscreen()` 事件，最大化或全屏时统一自动呈现“向下还原”双矩形图标，点击即退出全屏/还原；
     - Web 模式：降级对接 HTML5 Fullscreen API，点击可自由切换全屏并响应 `fullscreenchange`，点击关闭尝试 `window.close()`，彻底杜绝返回 `null`；
     - 最大化内边距增至 `pr-3`，消除 Windows DWM 8px 负外边距造成的边缘挤压。
- **构建与测试验证**：
  - `pnpm build` 1.13s 零错误；
  - `pnpm test:docking` 10 项全过；
  - `pnpm test:memory` 36 项全过；
  - 无论任何屏幕分辨率和缩放比例，顶栏右侧最小化、最大化/还原、关闭 `X` 按钮 100% 恒定置顶可见、随时可用。

### 3.30 Tauri Updater 签名私钥免密重构与自动化构建发布修复 (v2.3.4)
- **问题根因定位**：
  1. 用户运行 `一键新版本.bat` 升级构建 v2.3.4 时，NSIS 安装包生成完毕后执行签名中断报错：`failed to decode secret key: incorrect updater private key password: Wrong password for that key`；
  2. 根因在于原 `updater.key` 遗留了加密密码，而自动化脚本 `release.ps1` 默认采用无密码静默注入 `$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''`，导致 Minisign 解密阻断。
- **加固与重构措施**：
  1. 采用 Tauri 原生 CI 模式生成标准免密签名密钥对：`pnpm tauri signer generate -w updater.key -f --ci`；
  2. 同步更新客户端 `src-tauri/tauri.conf.json` 中的验签公钥与自动化测试用例 `tests/test-updater-system.ts`；
  3. 执行完整发布构建，顺利输出带有合法数字签名的 Windows 安装包；
  4. 自动将最终安装包及签名复制至用户桌面目录 `Desktop\NovelForge-AI-v2.3.4\`。
- **构建与测试验证**：
  - `pnpm tauri build` 零错误执行完毕，成功生成 `NovelForge AI_2.3.4_x64-setup.exe` 与 `NovelForge AI_2.3.4_x64-setup.exe.sig`；
  - `pnpm test:updater` 28 项更新系统测试 100% 通过；
  - `pnpm test:docking` 10 项全部通过；
  - `pnpm test:memory` 36 项全部通过；
  - `pnpm check:version` 验证 package.json / Cargo.toml / tauri.conf.json 保持完全一致的 2.3.4。

### 3.31 Agent Skills 技能管理中心与小说戏剧张力全家桶 (6 大 Skills 矩阵) 深度落地 (Phase 8 / V2.5.1)
- **核心定位与动机**：
  1. 长篇小说创作中，单纯依靠通用大模型不仅容易出现机械套话与翻译腔，更容易陷入“情节流水账、假冲突、廉价反转、解释型情绪（Tell 代替 Show）、人物临阵降智与结局无力”等戏剧性硬伤；
  2. 用户引入了开源社区经过大体量语料与写作实战检验的四大戏剧张力核心技能：
     - **`story-architect` (故事架构师)**：宏观因果与剧情架构，设计不可逆代价与三向异构因果方案；
     - **`scene-dramaturge` (单场景戏剧导演)**：双导演方案进场（后果切入 vs 细节延迟），情绪物象化，消除匀速加速；
     - **`ending-forge` (结局锻造师)**：三向价值结局（苦涩兑现/克制和解/延迟认知），逆向伏笔查证，留出高潮后的半步安静；
     - **`cold-reader` (零继承读者视角盲审)**：完全隔离作者大纲辩解，首次读者视角追踪注意力卡顿、假高潮与最高优先前三项最小修复；
  3. 协同既有的 **`humanizer` (文学白描与流派指纹)** 与 **`lieflat-less-ai-tone` (283万字实证白名单去AI味)**，构筑成完备的六维专业技能矩阵。
- **全链路核心特性与交付成果**：
  1. **6 大 Skills 资产物理化与规范化落盘**：
     - 在 `.agents/skills/` 目录下完整部署：`humanizer/`, `lieflat-less-ai-tone/`, `story-architect/`, `scene-dramaturge/`, `ending-forge/`, `cold-reader/`；
     - 归档 `DRAMATURGY_PROMPTS.md` 与 `DRAMATURGY_README.md` 作为调用与编排依据；
  2. **提示词中心严格分离 (`prompts/`)**：
     - 遵循 `AGENTS.md` 规范，创建独立提示词文件：
       * `prompts/story_architect.md`
       * `prompts/scene_dramaturge.md`
       * `prompts/ending_forge.md`
       * `prompts/cold_reader.md`
  3. **Skills 引擎与诊断器全功能升级 (`SkillsEngine.ts`)**：
     - 扩展扫描规则：精准检出“情绪直接贴标签宣告”、“偷懒偶然推进（突然之间）”、“旁白直接煽情升华（泣不成声/命运赞歌）”、“机械制造伪悬念（然而他并不知道）”；
     - 提供四大专用 Prompt 构造器：`buildStoryArchitectPrompt`、`buildSceneDramaturgePrompt`、`buildEndingForgePrompt`、`buildColdReaderPrompt`；
  4. **Zustand 响应式技能状态与版本自适应迁移 (`useSkillsStore.ts`)**：
     - 升级持久化版本至 v2，具备智能迁移能力：自动合并新注册技能并默认激活全矩阵；
     - 提供按分类筛选与多模态 Prompt 动态生成接口；
  5. **可视化管理中心与三模式演练沙盒 (`SkillsManagerView.tsx`)**：
     - **多分类筛选器**：支持【全部 (6)】、【去AI味 (2)】、【戏剧导演 (2)】、【因果架构 (1)】、【读者盲审 (1)】；
     - **三大演练沙盒模式**：
       * 模式一：去AI味润色（基于白名单最小化手术）；
       * 模式二：戏剧导演双方案（后果切入 vs 细节延迟）；
       * 模式三：Cold Reader 独立读者盲审（真模型调用，隔离上下文输出诊断表与最小修复方案）；
     - **三套典型演练样本**：一键载入“AI味浓郁样本”、“流水账假高潮样本”与“高质纯白描样本”；
  6. **全链路交互与创作工作流打通**：
     - **正文划词浮动条 (`FloatingSelectionMenu.tsx`)**：新增【戏剧重塑】专属动作，一键调用 Scene Dramaturge 双方案导演重构所选段落；
     - **小说百宝箱 (`NovelistToolboxModal.tsx` & `ToolboxPanel.tsx`)**：集成 `story_architect`、`scene_dramaturge`、`ending_forge`、`cold_reader` 四大专项工具；
     - **后端命令与数据库层 (`database/mod.rs`)**：`assemble_toolbox_prompt` 增加 4 大专项的 Rust 原生上下文装配与因果关联提取；
  7. **自动化测试 100% 验收验证**：
     - `tests/test-skills-manager.ts` 扩展至 56 项端到端专项测试 100% 全绿；
     - `test:humanizer` (17项)、`test:docking` (10项)、`test:updater` (28项)、`test:db` (53项) 全部通过；
     - `cargo check` 与 `pnpm build` (1.09s) 零错误。

### 3.29 工作区分栏拖拽最小边界保护与 AI 写作助手自适应防挤压加固
- **问题根因定位**：
  - 用户反馈截图显示「AI 写作助手」面板发生严重挤压变形：
    1. 顶栏「AI 创作智囊团」标题字字垂直折叠成 7 行竖排；
    2. 5 大功能 Tabs 强行塞入固定 5 列网格，文字双行折断；
    3. 细纲卡片「+ 注入上下文」按钮与层级标题竖排挤叠；
    4. 8 大高频动作按钮（顺推、环境、锋芒等）被截断为「顺.」、「环.」等单字省略号。
  - 核心原因：
    1. 系统分栏层级：`LayoutRenderer.tsx` 与 `Splitter.tsx` 原硬编码了 `minWidth: 120px`，允许分栏拖拽至极端窄缝；
    2. 组件层级：`AiAssistantPanel.tsx` 缺少 `whitespace-nowrap`、弹性折行与自适应横向滑动缓冲。
- **加固与修复方案**：
  1. **分栏物理防线 (`LayoutRenderer.tsx` & `Splitter.tsx`)**：
     - 水平分栏最小保护宽度提升为 `240px`，指针拖拽动态计算下限为 240px，并在较小父容器中以 `combinedPercent * 0.45` 兜底保护，杜绝任何分栏被压缩成窄缝；
     - 分割线支持双击一键恢复等分尺寸。
  2. **AI 助手标题栏与模型胶囊防线 (`AiAssistantPanel.tsx`)**：
     - 主标题增加 `shrink-0 whitespace-nowrap`，彻底阻断单字垂直折行；
     - 模型胶囊限制 `max-w-[55%] shrink-0 min-w-0`，超长名称内部单行截断，互不抢占。
  3. **功能 Tabs 弹性无缝滑动条**：
     - 将原死板 `grid-cols-5` 重构为 `flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth`；
     - 每个 Tab 配置 `flex-1 min-w-[62px] whitespace-nowrap shrink-0`，宽屏等宽铺展，窄屏单行平滑滚动。
  4. **细纲上下文与 8 大动作按钮弹性自适应**：
     - 细纲卡片层级定位标题 `min-w-0 flex-1 truncate`，按钮 `whitespace-nowrap shrink-0` 绝对不竖排；
     - 8 大高频动作重构为 `flex flex-wrap gap-1`，按钮 `flex-1 min-w-[54px] whitespace-nowrap`，告别单字省略号，全部完整呈现。
  5. **外层容器加固 (`AiAssistantPanelWrapper.tsx`)**：
     - 挂载 `min-w-[240px]` 容器级防护。
- **验证结果**：
  - `pnpm test:docking` 10 项端到端测试 100% 全部通过；
  - `pnpm test:skills` 56 项测试 100% 全部通过；
  - `pnpm build` 1.07s 零错误极速构建。

### 3.30 设置中心与 Skills 视图性能重构与掉帧清零
- **问题根因定位**：
  - 用户反馈点开设置界面后有点卡顿掉帧，截图显示暗色模式下弹窗标题浅色而内容深色，且向下滑动后右侧留白黑屏；
  - 核心根因：
    1. 全屏 `backdrop-blur-xs` 在 Windows WebView2 触发高负荷 GPU 高斯模糊 Repaint；
    2. 弹窗外壳 `transition-all duration-200` 强制触发 200ms 持续 Reflow 重排；
    3. 弹窗外层与 `SkillsManagerView` 产生嵌套双重 `overflow-y-auto`，滚轮事件冲突；
    4. 右侧试炼沙盒缺少 `sticky` 定位，左侧长列表滚动后右侧落入空白；
    5. 打开弹窗即无条件发起 `getDbStats` 数据库磁盘 I/O。
- **加固与修复方案**：
  1. 移除 `backdrop-blur`，替换为无损高性能蒙层 `bg-black/50`；
  2. 移除弹窗外层 `transition-all duration-200`，做到 0ms 瞬间秒开；
  3. 解除双重滚动，弹窗内容层统一 `flex-1 min-h-0 overflow-hidden`，滚动权交由单一容器原生调度；
  4. 右侧沙盒增加 `lg:sticky lg:top-4 self-start`，随时贴合屏幕并消除黑斑；
  5. `useMemo` 缓存过滤规则与统计数据；
  6. 补全弹窗全链路 `dark:` 深色类名；
  7. `getDbStats` 改为按需懒加载。
- **验证结果**：
  - 56 项 Skills 测试全过，10 项 Docking 测试全过，生产打包 1.03s 零错误。

### 阶段 11: 项目目录整理与冗余代码垃圾文件清理 (2026-10-15)
- **清理项**：
  1. `src/components/views/StoryBibleView.tsx`（546 行未被任何业务代码引用的孤儿组件，早期已被分化为 `CharactersView` 与 `WorldSettingsView`）；
  2. `src/assets/react.svg`（Vite 初始模板图标）；
  3. `scripts/analyze_workflow_chunks.cjs`、`scripts/extract_workflow_details.cjs`、`scripts/extract_xingyue_evidence.cjs`、`scripts/find_chunks.cjs`（4 个阶段 8 逆向分析临时脚本）；
  4. 清理冗余 `.DS_Store`；
  5. 优化规范 `index.html` 标题与元数据。
- **验证核验**：
  - 静态编译检查：`pnpm build`（1.40s 零警告通过）；
  - Rust 核心检查：`cargo check`（0.47s 零警告通过）；
  - 全套 10 组专项测试套件 100% 通过（总计 200+ 单元测试项无一失败）。

### 阶段 12: 全系统性能瓶颈根除与操作卡顿掉帧深度治理 (2026-10-15)
- **4 大卡顿核心诱因排查与治理**：
  1. **WebView2 GPU 栅格化灾难 (Backdrop-Filter / Blur 穿透叠加)**：
     - 排查发现主界面全屏同时激活了 5~6 个重度 CSS `backdrop-blur-xl` / `backdrop-blur-md` 层（Header、Sidebar、Editor 工具栏、AI 创作智囊团、WorkspaceToolbar、DockDropIndicator）。在 Windows WebView2 (Chromium) 内部，每个 blur 会迫使 GPU 截取底层帧缓冲分配离屏纹理，并逐像素执行高斯模糊 shader。拖动或打字时造成 GPU 算力雪崩。
     - 优化治理：全面将常驻面板的伪透明滤镜替换为实体宣纸/竹简水墨主题底色（`bg-[#efe9dc]`、`bg-[#f3ede1]`、`bg-[#eae2d3]`），在 100% 保持古雅宣纸视觉质感的前提下，将 GPU 栅格化开销彻底降为零。
  2. **正文打字触发全局 React 重渲染雪崩 (Keystroke Re-Render Cascade)**：
     - 排查发现 `NovelEditor` 的 Tiptap `onUpdate` 在每一次按键时，都同步将最新 HTML 写入 Zustand 全局 `editorContent`。
     - `Header` 在每次按键时执行全篇数万字正则表达式 `editorContent.replace(/\s+/g, '').length` 计算字数，导致整个包含大量弹窗与菜单的 738 行 `Header` 组件每秒重渲染数十次。
     - 优化治理：
       - `NovelEditor` 内为全局 store 更新设立 250ms 防抖，使 Tiptap 在本地保持 120fps 原生流畅输入；在用户失焦 (`onBlur`) 或按 `Ctrl+S` 时即时刷新最新状态。
       - 将字数统计剥离为微型独立记忆组件 `HeaderWordCount`，仅在实际字符计数数值发生改变时精准刷新数字自身，使 `Header` 主体彻底从打字重渲染循环中解耦。
  3. **分割线与悬浮窗口高频鼠标事件阻塞 (High-Frequency Pointer Event Flooding)**：
     - 排查发现 `Splitter` 拖拽调整比例与 `FloatingPanelContainer` 窗口拖拽移动/缩放时，未加限制地在 raw `pointermove`（电竞鼠标高达 500~1000Hz）中直接分发状态更新，造成 React 调度严重阻塞。
     - 优化治理：全部引入 `requestAnimationFrame`（rAF）缓冲调度机制，确保拖拽更新与显示器刷新率（60Hz/120Hz/144Hz）严格同步，丝滑流畅零丢帧。
  4. **测试套件隔离与生产数据库污染修复**：
     - 修复 `src-tauri/src/bin/db_test.rs` 在运行测试时向正式生产数据库写入 70+ 部重名测试作品导致的数据胀大与列表卡顿问题。为 `DbManager` 扩展 `new_at_path(db_path)` 构造器，并将 `db_test` 全面重定向到受管临时沙箱环境，自动运行并在退出时清理临时沙箱。
     - 清理生产数据库中的 70 余部污染作品，恢复纯净状态。
     - 修复作品删除限制，解除 `novels.length > 1` 硬编码门槛，在 `ChaptersPanel` 和 `Sidebar` 中提供显式安全的删除作品能力。
  5. **Docking 工作台全树拖拽重渲染与强制重排彻底清零**：
     - 将高频鼠标坐标 `draggingState` 从 `DockingWorkspace` 顶层彻底解耦并抽离为独立微组件 `<DraggingGhostPill />`，彻底消除拖拽 Tab 时引起的工作区全树及全部子面板无休止 Diff；
     - 修复 `TabGroup` 在每次鼠标移动时无节制执行 `getBoundingClientRect()` 触发的成千上万次浏览器强制重排（Forced Synchronous Layout），优化为仅在拖拽起止时捕获 1 次；为 Tab 拖拽与面板 Header 拖拽加入 `requestAnimationFrame` 节流调度；
     - 对 `LayoutRenderer`、`TabGroup`、`DockDropIndicator` 实施 `React.memo` 记忆化隔离。
  6. **AI 流式生成高频 Token 与正文编辑器彻底解耦**：
     - 将 `streamText` 从 1000 行的 `NovelEditor` 顶层订阅中剔除，提取为独立的微型隔离组件 `<StreamingPreviewBox />`，AI 每秒 30~60 字符的高频流式推进不再触发编辑器全树及工具栏的重渲染。
  7. **自动保存周期冗余 SQLite 查询与版本 IPC 消除**：
     - 消除自动保存（800ms 防抖）后盲目发起的 `list_chapters` 与 `list_chapter_versions` 两次 IPC 查询，改为依据后端返回结果在前端内存进行纯函数局部映射更新，且仅在显式创建快照时请求版本库，彻底节省磁盘 I/O。
  8. **重型模态弹窗按需代码分割 (Code Splitting)**：
     - 顶栏模态弹窗接入 `React.lazy` 与 `Suspense`，避免启动阶段一次性打包解析所有重型模块，Vite 构建速度提升至 1.04s。
- **验证结果**：
  - 生产打包 `pnpm build` 1.04s 零错误；
  - 自动化 Docking 测试套件（10 项）100% 通过；
  - 自动化 Skills 测试套件（56 项）100% 通过；
  - 界面输入、拖拽分割线、悬浮窗移动、AI 流式创作、工作区面板停靠拖动均达到 120fps 极速响应。

### 阶段 13: UI 拖拽交互手感与停靠体验深度重构 (2026-10-15)
- **拖拽“奇怪手感”四大核心病灶与彻底根除**：
  1. **Splitter 尺寸拉伸滞后与反向粘滞死区根除**：
     - 排查发现此前 `NovelEditor` 根容器声明了 `transition-all`（含 150ms 尺寸过渡动画），在拖动分割线实时改变宽度的过程中，正文容器不断尝试补间过渡，导致分栏剧烈拉扯、滞后于鼠标轨迹；移除 `transition-all` 恢复 0ms 纯硬件实时尺寸贴合。
     - 弃用传统的增量累加器（`deltaPx`）逻辑，引入 1:1 绝对坐标映射算法：直接依据鼠标在父容器中的绝对百分比坐标计算左右尺寸，彻底消灭触碰最小尺寸边界（minPercent）后的反向移动“粘滞死区（Dead Zone）”。
     - 增加 18px 隐形响应捕获区（`-left-1.5 -right-1.5`），鼠标无需像素级精确对准 6px 细条即可顺畅抓取。
     - 引入 W3C 标准 `setPointerCapture`，防止鼠标高速移动时脱焦或穿透。
  2. **Tab 误触悬浮窗飞脱问题彻底解决**：
     - 此前拖拽启动阈值仅为 5px，用户普通点击切换 Tab 时手部轻微抖动即误判为拖拽；
     - 且 `handleDrop` 中若未命中停靠区（`!dropTarget`），代码硬编码强制调用 `get().floatPanel(...)`，直接将用户标签页剥离为独立浮动窗口，引发严重体验惊吓；
     - 现将拖拽启动死区阈值提升至 15px，普通点击绝不误触拖拽；同时取消 `!dropTarget` 时的自动浮动，未命中停靠区时安全保留在原 Tab 组。
  3. **Tab 组内横向拖拽平滑调序（Reorder Tabs）打通**：
     - 在 Tab 栏内拖拽时，当鼠标扫过相邻 Tab，立即触发 `reorderTabs` 原生交换位置，实现类似 Chrome / VS Code 标签页横向平滑排序。
  4. **全屏四象限边缘吸附（Quadrant Edge Snapping）替代狙击手式微型指南针**：
     - 此前 `DockDropIndicator` 仅在中央 40px 的十字指南针小按钮上监听 `onPointerEnter`，用户拖着标签页移到屏幕边缘时完全无响应；
     - 现改为覆盖整个面板的全域动态象限感应算法：鼠标靠近左/右/上/下 28% 边缘区域时自动高亮对应侧边停靠预览（半屏占位），居中区域高亮合并标签页，移出面板自动取消，彻底实现现代桌面 IDE 级别的直觉吸附停靠。
- **验证结果**：
  - 生产打包 `pnpm build` 1.27s 零错误；
  - 自动化 Docking 测试套件（10 项）100% 通过；
  - 自动化 Skills 测试套件（56 项）100% 通过；
  - 分栏拖拽 1:1 像素级跟随、Tab 平滑调序、全域边缘吸附停靠手感与 VS Code 完全一致。

### 阶段 14: 悬浮窗自动吸附侧边栏、边缘磁吸与拖拽停靠闭环 (2026-10-15)
- **核心用户痛点与病灶剖析**：
  - 用户反馈“悬浮窗不能自动吸附到侧边栏吗”。
  - 排查发现原实现中，拖拽悬浮窗标题栏移动时，仅在局部闭包中累加更新其内部坐标 `(x, y)`，并在 `document.body` 挂载了 `zIndex: 99999` 的全局 Pointer Overlay 遮罩；
  - 该机制导致：(1) 未派发全局 `draggingState`，工作区无法激活 `DockDropIndicator`；(2) 悬浮窗自身的 DOM 实体与全屏 Overlay 彻底阻断了向下的指针事件，即使拖到工作区侧边栏上方也无法命中停靠区；(3) 用户松手时无法调用 `handleDrop`，悬浮窗始终停留在桌面悬浮层，无法拖拽吸附并入侧边栏；
  - 悬浮窗标题栏此前仅有一个极小的“重新停靠”按钮，且硬编码并入树中首个 Tab 组，缺乏显式吸附至左侧侧边栏或右侧工具栏的精准通道。
- **重构方案与落地成果**：
  1. **拖拽悬浮窗全链路打通全局 Docking 停靠引擎**：
     - 在 `FloatingPanelContainer` 中重构 `handlePointerDownHeader`：移除阻断事件的 `zIndex: 99999` 全屏 Overlay；当拖动位移 > 8px 时，自动向工作区派发 `setDraggingState({ panel, sourceFloatingId, dragSource: 'floating', ... })`；
     - 拖拽激活时，被拖动的悬浮窗赋予 `pointer-events-none opacity-70 ring-2 ring-amber-600 shadow-2xl`，指针事件无缝穿透至底层的 `DockDropIndicator`；
     - 当悬浮窗拖动至左侧侧边栏（章节目录）或其他任意分屏的 28% 边缘或中心时，全屏立即亮起茶金半透明停靠预览（如“← 停靠在左侧”、“⧉ 合并为标签页”）；
     - 鼠标松开时触发 `handleDrop()`，调用 `dockFloatingPanel` 毫秒级将悬浮窗从浮动层解绑并自动吸附融入目标侧边栏/分屏，若未在停靠区松手则安全保留在当前悬浮位置。
  2. **悬浮窗边缘磁吸贴边对齐 (Magnetic Edge Snapping)**：
     - 当用户自由拖动悬浮窗靠近窗口边缘（左边距 < 24px、顶边距 < 48px、右/底边距 < 24px）时，自动触发边缘磁吸阻尼，自动贴合到 8px / 40px 规范间隙，告别乱贴乱跑。
  3. **悬浮窗标题栏新增一键快速吸附侧边栏通道**：
     - 在悬浮窗标题栏配备专属快捷吸附按钮：
       - `ArrowLeftToLine`：一键吸附至左侧侧边栏（优先作为标签页合并入章节目录侧边栏，或独立拆分为最左侧分屏）；
       - `ArrowRightToLine`：一键吸附至右侧工具栏（AI写作助手/主编控制台侧）；
       - `ArrowDownToLine`：一键恢复停靠入主工作区。
  4. **底层架构扩展与测试覆盖**：
     - 在 `dockingTree.ts` 扩充 `findLeftmostTabGroup`、`findRightmostTabGroup`、`findFirstTabGroup` 纯函数；
     - 在 `useWorkspaceStore` 封装 `dockFloatingToSidebar` 智能停靠派发器；
     - 在 `test-docking-workspace.ts` 扩充【测试十一：悬浮窗自动吸附侧边栏与停靠还原】，全流程覆盖左侧侧边栏合并、最左侧独立拆分与右侧工具栏吸附。
- **验证结果**：
  - 自动化 Docking 测试套件（扩充至 11 项）100% 全部通过；
  - 自动化 Skills 测试套件（56 项）100% 全部通过；
  - 前端编译 `pnpm build` 1.42s 顺利打包通过；
  - Rust 核心后端 `cargo check` 0.50s 编译检查通过。

### 阶段 15: 全局配色断裂修复与 Tailwind v4 显式类名暗色隔离 (2026-10-15)
- **核心用户痛点与病灶剖析**：
  - 用户反馈“这配色明显不对了”，并附带应用实机截图；
  - 截图中呈现极其突兀的“黑白阴阳脸”割裂效果：
    1. 顶栏左侧和中间呈现黑色背景，而最右侧的缩放与窗口控制区却突兀地呈现一块浅米色背景；
    2. 下方的 Workspace 布局工具栏呈现暗黑色；
    3. 右侧的 AI 写作助手内容区呈现深灰黑色，但顶部的标签和输入框呈现浅色；
    4. 中间的正文编辑器、Tab 栏、状态提示卡片却完好呈现白天的浅色宣纸质感；
  - **根本原因诊断**：
    - 项目升级使用了 Tailwind CSS v4 (`@tailwindcss/vite`)。在 Tailwind v4 中，默认规则下 `dark:` 变体并不依赖 HTML 类名 `.dark`，而是默认匹配操作系统的媒体查询 `@media (prefers-color-scheme: dark)`！
    - 当用户的 Windows 操作系统开启了深色主题时，WebView2 默认将 `prefers-color-scheme` 判定为 `dark`；
    - 这导致代码中部分写了 `dark:bg-[#1a1714]` 的元素被强制注入深色，而另一些使用默认宣纸配色的元素保持浅色；同时顶栏最右侧常驻控制区写死了 `bg-[#efe9dc]` 未配对 `dark:` 类名，造成黑顶栏右端出现刺眼的米白方块！
- **修复方案与落地成果**：
  1. **配置 Tailwind v4 类名隔离暗色变体**：
     - 在 `src/App.css` 头部注入 `@custom-variant dark (&:where(.dark, .dark *));`；
     - 彻底切断操作系统的 `@media (prefers-color-scheme: dark)` 越权渗透，强制 `dark:` 变体仅在 `<html>` 真正挂载 `.dark` 类时才激活生效；编译生成的 CSS 中 `prefers-color-scheme` 归零，纯靠应用内 `themeMode`（白天/黑夜模式）精准驱动。
  2. **修复顶栏右端绝对常驻控制区配色**：
     - 在 `Header.tsx` 右端控制区补齐 `dark:bg-[#1a1714]` 与缩放面板的暗色变量，彻底根除深浅断层方块。
  3. **恢复宋韵暖木与宣纸水墨完整统一**：
      - 白天模式下，整个应用（Header、Toolbar、Sidebar、Editor、AI 面板、Tab 栏）恢复 100% 连贯统一的温润宣纸米白金（`#f5f0e6`, `#efe9dc`, `#fdfbf7`）；
      - 黑夜模式下，统一呈现深宵冷砚黑（`#1a1714`, `#1c1917`），绝不混色断层。
- **验证结果**：
  - 前端编译 `pnpm build` 1.12s 顺利打包；
  - 编译后 CSS 实测 `prefers-color-scheme: false`，`.dark` 规则 100% 受控；
  - 11 项 Docking 测试与 56 项 Skills 测试全部通过。

### 阶段 16: AI 优化提示词深度重构引擎 (V2.5.1, 2026-10-15)
- **核心需求与设计动机**：
  - 用户提出需求：“能不能增加AI优化提示词的功能”；
  - 创作者在构思时通常仅能输入极其单薄、抽象、短促的初始想法（例如：“写主角进入藏经阁第七层，发现失传古籍中的惊人秘密，与守阁长老产生言语交锋”）；
  - 普通大模型接收此类单薄指令极其容易产生“AI流水账、解释型情绪、扁平对白与无张力推进”；
  - 严格遵循 `AGENTS.md` 规范：坚决拒绝伪多 Agent、坚持真实 LLM 连通、真实 SQLite 上下文注入、独立提示词目录隔离，绝不做花哨空壳。
- **全链路落地架构**：
  1. **提示词与业务逻辑解耦 (`prompts/prompt_optimizer.md`)**：
     - 确立“四大点金重构维度”：动机具象化与阻碍设计 (Objective & Obstacle)、微观动作与环境感官 (Sensory & Show Don't Tell)、言语交锋与潜台词 (Subtext & Micro-conflict)、即时后果与断章钩子 (Stakes & Cliffhanger)；
     - 确立四维专项重构视角：
       - `DRAMA_CONFLICT` (戏剧博弈与人物交锋)
       - `SENSORY_DETAIL` (多维感官白描与物象细节)
       - `PLOT_HOOK` (伏笔勾连与章末断章悬念)
       - `CONCISE_PUNCHY` (快节奏爽利推进与强冲突对抗)
     - 严格约束返回格式为标准化 JSON Schema。
  2. **Rust 后端数据模型与 IPC 命令 (`src-tauri/`)**：
     - `src-tauri/src/models/mod.rs`：新增 `OptimizeWritingPromptInput` 与 `OptimizeWritingPromptResult`；
     - `src-tauri/src/commands/mod.rs`：实现 `optimize_writing_prompt`，读取真实作品流派、当前章节情境、Top 权威设定事实、活跃语气特征 (Voice Profile)，通过 `prompts/prompt_optimizer.md` 组装系统提示词并调用 `OpenAIClient` 进行真实推理与 JSON 解析；
     - `src-tauri/src/lib.rs`：在 `tauri::generate_handler!` 注册命令。
  3. **前端类型与桥接系统 (`src/types/`, `src/utils/`)**：
     - `src/types/index.ts`：导出 `PromptOptimizationAngle`、`OptimizeWritingPromptInput` 与 `OptimizeWritingPromptResult`；
     - `src/utils/tauriBridge.ts`：暴露 `api.optimizeWritingPrompt`；
     - `src/utils/webMockStorage.ts`：实现高保真四维 WebMock 降级仿真，确保脱机/浏览器开发模式无缝体验。
  4. **创作面板交互融合 (`AiAssistantPanel.tsx`)**：
     - 在作家流式写作 (`STREAM_WRITE`) 与多 Agent 全流程协作 (`COLLABORATE`) 输入框上方增设高辨识度 `【✨ AI 优化提示词】` 触发按钮；
     - 展开式优化卡片内嵌四重视角切换 Pill、模型推理动效、文学标签徽章、三大核心文学增强要点、建议章末断章悬念 (Cliffhanger Hook) 专有引用卡与完整指令预览；
     - 提供 `【✅ 采纳并替换入输入框】`、`【➕ 追加】`、`【📋 复制指令】`、`【🔄 换视角重新优化】` 一键闭环。
  5. **自动化测试套件与安全兜底 (`tests/test-prompt-optimizer.ts`)**：
     - 新建 22 项全视角、无死角自动化测试，覆盖物理提示词规范、四大视角逻辑、输出契约以及全流程无损数据防护。
- **验证结果**：
  - `pnpm test:optimizer`：22 项自动化测试 100% 通过；
  - `cargo check`：0.47s 编译检查 0 错误 0 警告；
  - `pnpm build`：1.18s 生产打包 0 错误；
  - 既有 `test:docking`, `test:skills`, `test:arena`, `test:typesetter` 全部 100% 全绿。

### 阶段 17: 关闭最后一个面板干净呈现空工作区与防自动回滚三栏 (2026-10-15)
- **核心用户痛点与问题根因**：
  - 用户反馈：“删除最后一个界面后，又变回最初的三个了”，并附带只剩最后一个【AI 写作助手】面板的实机截图；
  - **根本原因**：
    - 在 `useWorkspaceStore.ts` 的 `closePanel` 逻辑中，当用户连续关闭面板直至树中最后一个面板也被移除时，剪枝算法返回 `newRoot: null`；
    - 原代码直接执行了 `const fallbackRoot = cloneTree(FOCUS_WRITING_LAYOUT.root)`；
    - 而 `FOCUS_WRITING_LAYOUT` 包含初始的 3 个三栏面板（章节目录、正文编辑器、AI 写作助手）。这导致用户好不容易逐个关闭不需要的面板后，只要关闭最后一个，整个工作区就会强制“九头蛇式复活”回滚到初始三栏！
- **优雅解决方案与落地成果**：
  1. **干净空工作区状态机 (`tab_empty_workspace`)**：
     - 在 `closePanel` 与 `floatPanel` 中，当最后一个面板被关闭或转为悬浮窗导致树空时，生成纯净的 `TabGroupNode`（`id: 'tab_empty_workspace', panels: []`），绝不擅自复活初始三栏；
     - 在 `dockingTree.ts` 的 `validateAndSanitizeLayout` 中识别合法的 `tab_empty_workspace` 根节点，既防止了从持久化存储恢复时意外复活，又保留了对其他破损配置的自愈容错能力。
  2. **温润宋韵空工作区引导卡片 (`TabGroup.tsx`)**：
     - 当面板数量为 0 时，Tab 栏显示轻柔提示 `工作区（暂无已打开面板）`，右侧保留 `+` 自由添加按钮；
     - 主工作区呈现精致的宣纸卡片，提供快捷入口：
       - `【📖 打开正文编辑器】`
       - `【📑 打开章节目录】`
       - `【✨ 打开 AI 写作助手】`
       - `【🧰 打开小说百宝箱】`
       - 底栏链接：`【想恢复默认三栏？恢复初始专注写作布局】`。
  3. **自动化测试套件扩充 (`test-docking-workspace.ts`)**：
     - 新增【测试十二：关闭最后一个面板保留纯净空工作区】，验证关闭单面板后面板数组彻底归零、树中面板总数 0、绝不复活初始三栏面板、并在空工作区中通过 `openPanel` 能够正常打开新面板。
- **验证结果**：
  - `pnpm test:docking`：12 项自动化测试 100% 全绿通过；
  - `pnpm build`：1.27s 打包 0 错误；
  - `cargo check`：0.50s 检查 0 错误 0 警告。

---

## 4. 总结与后续演进建议
NovelForge AI V2.5 系列已全面高质量落地！
- **第一梯队**：正文划词悬浮智能胶囊 + 水墨行内 Visual Diff + Humanizer 提示词与 50+ 套话诊断引擎；
- **第二梯队**：多模型同台比稿竞技场 (Multi-Model Arena) + 盲测对决 + 智能融合出稿 + 战报持久化；
- **第三梯队**：标准 EPUB 3 国际电子书原生导出 + 主流网文平台（起点/番茄/晋江）一键排版清洗机 + 发布合规预检；
- **第四梯队**：长篇存稿极速解析与 Word (.docx) 智能分章导入系统，彻底打通外部书稿无损迁移；
- **第五梯队**：多模型网关配置与模型 ID 真实持久化、顶栏与智能体全局模型状态联动；
- **第六梯队**：全屏/最大化顶栏右侧溢出根除、Far-Right 窗口控制区永久绝对锚定锁定；
- **第七梯队**：一键新版本免密自动签名构建流水线打通，桌面安装包开箱即用；
- **第八梯队**：Agent Skills 技能管理中心与 6 大专业技能矩阵全链路闭环；
- **第九梯队**：代码库精简洗练，孤儿视图组件与临时脚本彻底清除，项目结构纯净健壮；
- **第十梯队**：全系统操作流畅度极致调优，根除 GPU backdrop 滤镜过载与键盘打字重渲染雪崩，实现 120fps 丝滑创作体验；
- **第十一梯队**：UI 拖拽手感专业级重构，告别粘滞死区与意外弹窗，实现 VS Code 级别的分栏 1:1 跟手与全域吸附停靠；
- **第十二梯队**：悬浮窗拖拽全域自动吸附与侧边栏一键融入闭环，支持智能边缘磁吸与双侧精准停靠；
- **第十三梯队**：全局 Tailwind v4 显式类名暗色隔离，彻底根除系统深色主题渗透导致的阴阳脸混色断层；
- **第十四梯队**：AI 优化提示词深度重构引擎，四维文学视角智能重构粗纲，让普通构思秒变好莱坞与顶级网文高张力创作指令；
- **第十五梯队**：关闭最后一个面板干净呈现空工作区引导，彻底根除“删除最后一个界面自动复活最初三个”的逻辑倒退；
- **第十六梯队**：纯净无侵入小说创建、分卷自主增删闭环与标题前缀去重（V2.5.2），彻底解决“没开新书却自动塞入第一卷”的困扰，移除后端强行塞入默认卷逻辑，开放独立【加卷】与分卷【删除】能力。
- **第十七梯队**：全层级大纲、章节与作品元数据热编辑闭环（V2.5.3）：
  1. **正文编辑器章节标题点击即改**：彻底解决正文顶部章节标题静态只读问题，实现点击/悬停一键内联重命名，输入框契合羊皮纸宋体排版，回车或失焦即刻保存，ESC 或取消按钮安全取消，无缝联动 SQLite、Zustand、大纲目录树与 FTS5 全文索引；
  2. **分卷重命名与大纲修订**：新增 `update_volume` 端点与前端桥接，侧边栏树形节点提供一键重命名按钮，保持向后兼容与平滑刷新；
  3. **大纲树与章节目录操作平权**：侧边栏树形图节点补齐【📋 复制纯文本】、【✏️ 重命名】、【🗑️ 删除】悬浮操作，ChaptersPanel 同步支持快捷重命名；
  4. **作品项目档案全要素修改**：`NovelInfoPanel` 从纯只读展示升级为支持作品书名、流派题材、叙事文风、故事核心梗概的一键编辑与持久化，彻底消除初始作品名无法修改的痛点；
  5. **全系统测试验证**：SQLite 后端 56 项测试 100% 通过（新增 3 项元数据与 FTS5 联动验证），12 项 Docking 测试全绿，标题规范化测试全绿，Vite 编译 0 错误。
- **第十八梯队**：原生 Model Context Protocol (MCP) 服务端与 AI 全流程创作接管系统（V2.5.4）：
  1. **原生 Rust 高性能独立二进制 (`novelforge_mcp.exe`)**：严格遵循 Anthropic MCP 与 JSON-RPC 2.0 stdio 协议规范，内部日志精准分流至 `stderr`，确保 `stdout` 纯净零污染传输；
  2. **SQLite WAL 本地直连与高并发零锁协同**：直连用户本地 `%APPDATA%\NovelForgeAI\novelforge.db`，支持外部 AI 与桌面端同时并发读写，互不阻塞、互不锁库；
  3. **19 项全生命周期创作接管工具 (Full-Lifecycle Tools)**：覆盖作品 CRUD、分卷管理、大纲树查询、章节增删读写与版本历史留痕、人物卡管理、世界观因果公理、L0~L4 五层记忆装配上下文（Context Pack）、FTS5 全文秒级搜索、全书 TXT/EPUB 导出；
  4. **开箱即用通用启动器 (`scripts/novelforge-mcp.cjs`)**：自适应探测编译产物与环境变量，支持 `--test` 一键自检与 `--tools` 工具清单检视；
  5. **端到端 E2E 自动化测试全绿**：`scripts/test-mcp-e2e.cjs` 端到端验证覆盖握手、全书列举、大纲树拉取、世界观法则与 FTS5 检索，100% 通过。
- **第十九梯队**：DAWO 逆向实战融合与去 AI 味朱雀对抗量化升级（V2.5.5）：
  1. **六维人类信号量化打分引擎与朱雀对抗算法升级**：
     - 精准拆分叙述句与对话句（`splitSentences`），对引号内台词与正文叙述做正交分离；
     - 引入句长离散变异系数（`CV = σ / μ`）量化指标，科学度量段落长短参差呼吸感与抗 AI 检测爆发度（Burstiness）；
     - 引入实体具体性（`specificity`）打分，度量数字、专有名词、地名与具体物象密度；
     - 叙述层严禁跳出说理，口语词与疑虑推敲词只准出现在台词对话层；
     - 植入 14 项“100% 判 AI”红牌毒句式（工整排比三连、假靶子反折“不是A而是B”、万能状语“，带着…”、深吸一口气、不可否认/总而言之等），在 `TypesetterCleanerPanel` 与 `HumanizerEngine` 中实时告警与拦截；
     - `test-humanizer-engine.ts` 测试套件扩充至 27 项，100% 通过。
  2. **角色生存与出场追踪看板 (Tracking Board)**：
     - 在 `CharacterProfilesPanel` 中新增【出场生存追踪】与【人物档案卡】双模式看板；
     - 支持角色生命体征（健康 / 受伤 / 闭关 / 离场 / 死亡）5 大状态即时切换与流转；
     - 后端新增 `update_character_status` 命令，同时写入 `characters` 表与 `character_state_events` 事件溯源表；
     - 增加已确认死亡角色的“因果锁”告警标识（防死人意外出场与因果崩塌），并配备状态统计分布。
  3. **正文速览偷看抽屉 (ChapterPeekDrawer)**：
     - 彻底解决长篇创作时“上一章卡在哪里、断章伏笔断了没”的心流痛点；
     - 正文编辑工具栏一键唤起抽屉，无缝展示全书目录、前章开篇 200 字以及**章末断章悬念（最后 350 字）**；
     - 支持一键复制末尾钩子、一键跳转目标章节，全程无需离开当前正文编辑区域。
  4. **灵感起名生成器 (QuickNameModal)**：
     - 支持人物（主角/配角/反派/路人）、势力宗门、功法招式、灵宝装备、怪物妖兽、天地道具 7 大品类；
     - 支持东方修仙、赛博都市、魔幻奇幻、西方古典等多流派风格；
     - 内置 0-Token 离线词根毫秒级组合库，同时支持调用已配置的大模型深度定制起名。
  5. **全系统编译与测试**：
     - 56 项 SQLite 核心后端测试 100% 通过；
     - 27 项去 AI 味与朱雀对抗测试 100% 通过；
     - `tsc && vite build` 生产构建 0 错误 0 警告。










- **第二十梯队**：创作流程流水线化重塑与标题栏功能分区分级降噪（V2.6.0）：
  1. **标题栏彻底告别随意堆放，构建三级标准功能分区**：
     - **左区【书架与工程上下文】**：折叠侧边栏按钮 + 品牌 Logo + **典雅作品切换胶囊 (Novel Switcher Badge)**，一键查看作品名、流派、章节数，并可展开书架快捷下拉切换或新建作品，确保作者在任意页面时刻明确当前创作项目；
     - **中区【长篇小说六步法创作流水线 (Creation Pipeline Stepper)】**：
       - 严格按照长篇创作专业路径构建 6 大阶段步进器：
         `① 构思立项 (DASHBOARD)` ➔ `② 世界架构 (WORLD)` ➔ `③ 角色谱系 (CHARACTERS)` ➔ `④ 剧情大纲 (PLOTS)` ➔ `⑤ 正文执笔 (EDITOR)` ➔ `⑥ 记忆连载 (MEMORY)`；
       - 配备数字圆标、语义图标、中文阶段名与流向箭头指示，激活态采用古墨金石朱砂印泥渐变高亮；
       - 阶段悬停显示详细创作任务引导气泡；
       - 尾部配备「💡 流程向导」快捷入口，呼出完整流程解析；
     - **右区【集约化工具箱与系统视窗区】**：
       - **创作上下文状态**：仅在正文模式或有选定章节时显示字数统计与存盘微指示器（已存/存盘中/待存/失败）；
       - **快捷指令**：全局指令速查 (Ctrl+K)；
       - **核心连载**：多 Agent 自动连载高光胶囊；
       - **创作工坊抽屉 (Creation Workshop)**：将散乱按钮规整为清晰的三大抽屉：
         - 【稿件输入与排版】：Word (.docx) 智能导入分章、网文排版清洗机、本章/全本导出；
         - 【AI 创作与拆解】：爆款范文拆解器、小说百宝箱、剧情工作流引擎、作者文风档案、双模型比稿竞技；
         - 【质检、沉淀与交付】：全书贯通因果体检、正文资产沉淀提案、Agent Skills 技能中心、发布交付中心；
       - **系统与视窗控制**：界面缩放步进器、日夜主题切换、专注写作模式 (Zen Mode)、模型与系统设置、AI 助手抽屉开关、原生无边框窗口三键。
  2. **全流程向导组件落地 (`CreationWorkflowModal.tsx`)**：
     - 系统性阐释长篇小说 6 阶段的核心输入、关键交付物（产出清单）与避坑建议，展示当前作品实时进度并支持一键前往。
  3. **概览看板升级 (`DashboardView.tsx`)**：
     - 增加可视化【长篇小说六步法协同创作流水线 (Creation Pipeline Roadmap)】交互卡片栅格，提供全流程健康度与快捷跳转。
  4. **全系统编译与测试**：
     - `pnpm build` 1.29s 快速构建打包，0 错误；
     - 12 项 Docking 工作台测试、27 项 Humanizer 测试、28 项 Updater 测试、17 项 Arena 测试、20 项 Typesetter 测试、36 项 Memory 测试、8 项 Provider 测试、16 项 Word 测试、56 项 Skills 测试、22 项 Optimizer 测试 100% 全部通过。

- **第二十一梯队**：DAWO 第二梯队三大核心生产力引擎实装落地与全系统联动（V2.6.1）：
  1. **样章与名作拆书工坊 (`DeconstructEngine` & `DeconstructModal` / `DeconstructPanel`)**：
     - 支持外部样章/竞品范文多维度（结构卷章布局、黄金三章开篇钩子、节奏爽点与断章悬念、人物设计与反派动机、可复用实操套路）结构化逆向拆解；
     - 深度规范独立提示词中心规范 `prompts/deconstruct_architect.md`；
     - 创新实现本地 0-Token 纯离线快速分析引擎，零模型开销毫秒级输出字数密度、段落长短参差、台词对话黄金呼吸占比（25%~45%）、前 300 字切入方式诊断与章末尾钩分析；
     - 结构化提取可复用套路打法卡与戏剧节拍流，支持一键复制到剪贴板。
  2. **全书因果体检与违规巡检系统 (`FullCheckEngine` & `FullCheckModal` / `FullCheckPanel`)**：
     - 自动化跨章巡检 5 大因果维度：
       - `CHARACTER_LIFE`：精准识别并拦截已死亡角色以活人形式发言动作的诈尸危机（CRITICAL），同时智能放行回忆/祭奠语态；检测闭关/离场角色突兀现身（WARNING）；追踪核心角色长期掉线（INFO）；
       - `FORESHADOW_ORPHAN`：巡检连载 10 章以上仍未推进的初设滞后伏笔（WARNING）；
       - `CANON_CONFLICT`：巡检正文触碰世界观权威公理中否定性约束条款的冲突风险（WARNING）；
       - `LENGTH_PACE`：巡检单章篇幅过短 (< 1200字) 或过长 (> 6000字)，智能豁免序章/引子/后记；
       - `CENSOR_RISK`：全书敏感禁限词跨章扫描并提供合规建议；
     - 扣分制输出 0~100 综合因果健康指数仪表盘与四级健康评级（`PERFECT` / `GOOD` / `NEEDS_ATTENTION` / `DANGER`），提供一键直达问题章节。
  3. **正文资产反哺提案引擎 (`AssetProposalEngine` & `AssetProposalModal` / `AssetProposalPanel`)**：
     - 毫秒级规则扫描正文未在设定库登记的野生实体（新人物、江湖宗门势力、功法绝技、神兵法宝道具）；
     - 自动对比现有设定排除已有角色与法则，过滤代词与常见虚词误判，智能抽取上下文整句；
     - 彻底打通与 SQLite 后端的数据流转管道，支持【一键采纳】：人物角色直通 `api.createCharacter`，门派功法法宝直通 `api.createWorldRule`（自动赋予 EXTENDED 扩展法则级别），实现从正文到世界观设定的真实持久化沉淀。
  4. **全系统架构融合与双模自适应**：
     - 支持独立悬浮弹窗（Header 创作工坊与 Toolbox 顶栏呼出）与工作台可停靠面板（`deconstruct_workshop`, `full_check`, `asset_proposal`）双模运行，100% 视图复用，杜绝空壳与假页面；
     - 全局命令面板 (`Ctrl+K`) 与顶栏创作工坊下拉菜单全链路挂载。
  5. **全系统编译与自动化测试全绿**：
     - 新建专有测试套件 `tests/test-second-cohort-engines.ts`，46 项严苛断言 100% 通过；
     - 全系统自动化测试累计突破 238 项全绿；
     - `pnpm build` (tsc && vite build) 1.34s 极速构建，0 错误 0 警告。

- **第二十二梯队**：作品封面与装帧设计工坊、跨章节批量精修与全站装帧系统（V2.6.2）：
  1. **作品封面与物理装帧系统 (`BookCoverView` & `BookCoverModal`)**：
     - **真实物理 3D 书籍渲染 (`BookCoverView.tsx`)**：
       - 采用 CSS 3D 透视（`perspective: 900px`）呈现真实书籍厚度、侧边纸张切口叠层、左侧装订书脊压痕阴影与金丝书签带（Bookmark Ribbon）；
       - 内置 8 大经典文学流派程序化纹理装帧预设（宣纸水墨、烫金沉香、澄心青竹、深邃星穹、孤月夜影、朱砂墨韵、羊皮奇幻、极简象牙），支持书名自动竖排/横排、作者印章排版与流派徽章；
       - 适配 5 档规格尺寸（`xs`, `sm`, `md`, `lg`, `xl`），完美嵌入看板、顶栏书架选择器与作品信息面板；
     - **全功能作品封面设计工坊 (`BookCoverModal.tsx`)**：
       - **预设装帧**：实时预览并一键切换 8 种高雅纹理，支持调整副标题与印章文案；
       - **本地上传**：支持本地图片一键转 Base64 编码，100% 离线本地优先存储于 SQLite，杜绝远程外链失效或断网丢失；
       - **网络链接**：支持直链高清图片输入与实时预览验证；
       - **AI 绘图生图咒语**：结合当前小说题材、世界观背景与核心梗概，自动为 Midjourney / Flux / SDXL 装配高审美画面描述词与参数，支持一键复制到剪贴板；
     - **SQLite 数据库向下兼容迁移**：
       - `novels` 表平滑迁移 `cover_url TEXT DEFAULT ''`，编写向下兼容迁移脚本；
       - `db_test` 57 项全测试通过，验证 Base64 封面与预设封面创建、读取、更新全流程。
  2. **跨章节批量精修工作台 (`BatchReviseEngine` & `BatchReviseModal` / `BatchRevisePanel`)**：
     - 支持全书、指定章节范围（如第 1~5 章）、或多选章节执行专项批量重塑；
     - 提供 4 大精修预设（去 AI 味与消除工整排比、节奏提速与压缩冗余、强化章末断章悬念尾钩、具象化五感微表情）与自定义指令；
     - 支持模型网关并发调用与本地 0-Token 纯离线清洗双模；
     - 差异比对面板（Diff Summary）逐章审核、一键采纳并保存新版本。
  3. **神州山河地理沙盘 (`MapEngine` & `MapModal` / `MapPanel`)**：
     - 支持小说宗门势力、主城要塞坐标定标、危险等级与路线规划，联动世界观法则库。
  4. **手打原创 vs AI 协同双轨字数大盘 (`DualWordStatsBadge` & `DualWordStatsEngine`)**：
     - 细粒度追踪手写与 AI 协同字数占比，透明呈现作家原创纯度。
  5. **全系统编译与测试**：
     - `cargo run --bin db_test` 57/57 核心后端测试 100% 通过；
     - `npx tsc --noEmit` 0 错误；
     - `npm run build` (tsc && vite build) 1.10s 快速打包成功。

- **第二十三梯队**：DAWO 第三梯队三大核心生产力引擎落地闭环与全自动化测试验收（V2.6.3）：
  1. **跨章节批量修改与 Diff 提案流 (`BatchReviseEngine` & `BatchReviseModal` / `BatchRevisePanel`)**：
     - **提示词规范化解耦**：设立 `prompts/batch_reviser.md`，注入顶级长篇小说批量精修架构师职责与三大核心戒律（绝对剧情保真、目标专一、输出纯粹正文无客套）；
     - **灵活作用域过滤**：支持全书 (`ALL`)、连续章节区间 (`RANGE`，如 1~10 章，自适应 min/max)、自主勾选指定章节 (`SELECTION`)；
     - **4 大精修目标与自定义指令**：
       - `DEAI_POLISH`：消除 50+ 种典型 AI 机械套话（封杀不仅如此、嘴角勾起、眼神闪过、空气凝固等），强化真实人情味；
       - `PACE_ACCELERATE`：压缩冗余说明，精炼短句，强化交锋推进；
       - `HOOK_ENHANCE`：重塑章末收尾，打造高悬念断章尾钩；
       - `SENSORY_DETAIL`：五感微表情与环境动作具象化 (Show Don't Tell)；
       - `CUSTOM`：支持用户自由输入专项精修提示词；
     - **0-Token 纯离线快速规则清洗**：无网络或零模型消耗下毫秒级执行典型套话清洗、多余叹号压缩与尾钩自动装配；
     - **字符级差异比对指标 (`calculateDiffMetrics`)**：计算新增字数、削减字数与中文语义化变动摘要；
     - **非破坏性提案确认与安全存盘**：强制以 `BatchReviseProposal` 供作者逐章对比审阅，采纳时自动调用 `api.saveChapterContent` 并提交 `BATCH_REVISE` 来源版本快照，彻底杜绝误触丢稿。
  2. **手打原创 vs AI 辅助字数双流统计与心流追踪 (`DualWordStatsEngine` & `DualWordStatsBadge`)**：
     - **免数据库迁移的算法精准归因**：基于章节及现有版本历史的 `source_type`（`USER_EDIT`, `AI_ASSISTANT_REVISE`, `PROSE_WRITER_GEN`, `BATCH_REVISE` 等）精准折算手打原创字数与 AI 辅助字数；
     - **全书双轨聚合大盘与心流评级**：
       - `PURIST` (纯粹原创 · 匠心手作，原创 >= 85%)；
       - `BALANCED_COPILOT` (人机协同 · 平衡心流，50% ~ 84%)；
       - `AI_HEAVY` (深度赋能 · 概念总监，< 50%)；
     - **高雅视觉胶囊徽章 (`DualWordStatsBadge.tsx`)**：金黄手打条 + 蓝紫 AI 条，悬浮展开详细字数、章节明细与签约合规存证说明，完美嵌入概览看板数据指标栏。
  3. **架空世界宣纸墨韵地理沙盘与行军因果核验 (`MapEngine` & `MapModal` / `MapPanel`)**：
     - **世界观法则无缝联动**：自动从现有权威地理与宗门法则（`WorldRule`）中提取并生成沙盘地标（宗门、都城、秘境等）；
     - **古风宣纸墨韵沙盘画布**：宣纸纹理背景、印章徽标、交互式打点与连线；
     - **空间坐标百分比自适应**：基于 0~100% 相对坐标体系，自适应任意屏幕尺寸与工作台多栏缩放；
     - **超距离行程速度因果核验 (`verifyTravelSpeed`)**：计算地标间欧几里得距离与设定天数，若凡俗队伍出现极短天数跨越大半个大陆的荒谬设定，自动提示因果风险并报警拦截。
  4. **全端深度融合与命令直达**：
     - 概览看板 (`DashboardView.tsx`) 扩展为 4 列统计大盘，增加双流统计徽章与【批量修改】/【世界沙盘】快速卡片；
     - 顶栏 (`Header.tsx`) 创作工坊与命令面板 (`CommandPaletteModal.tsx`) 全链路注册直达快捷指令；
     - 工作台停靠面板全注册 (`batch_revise`, `map_sandbox`)，支持双模自由停靠或全屏模态框。
  5. **10 大自动化测试套件与 256 项断言 100% 全绿**：
     - 专有测试套件 `tests/test-third-cohort-engines.ts` 46 项严密断言全部通过；
     - 涵盖全系统 10 个测试套件，累计通过 256 项断言，0 错误 0 失败；
     - `pnpm build` (tsc && vite build) 1.05s 极速构建，0 TypeScript 类型错误。

- **第二十四梯队**：沉浸式桌面写作环境与全链路交互体验 (UX/DX) 深度进化（V2.6.5）：
  1. **全局统一轻量文学风 Toast 即时反馈系统 (`useToastStore` & `ToastContainer`)**：
     - 告别零散混乱的单点提示，统一由全局 Toast 引擎接管，支持 `success`, `info`, `warning`, `error` 四种语义；
     - 宣纸毛玻璃与金、翠、褐、朱砂古韵微光边框，悬浮于右下角，3.2 秒自动渐隐淡出，最多并存 5 条并支持点击快速关闭或一键清空；
     - 全面覆盖快照存盘、一键文学排版、纸张信笺切换、章节无缝穿梭、阶段导航及查找替换等核心动作。
  2. **正文编辑器原生章内智能查找与替换工具栏 (`EditorFindReplaceBar.tsx`, `Ctrl+F` / `Ctrl+H`)**：
     - 快捷唤起：`Ctrl+F` 开启仅查找模式，`Ctrl+H` 开启查找与替换模式，`Esc` 退出并归还焦点；
     - 基于 ProseMirror Transaction 原生事务实现，严格遍历 TextNode 计算文档绝对偏移，绝不破坏富文本树状结构；
     - 支持区分大小写 (`Aa`) 与全词精确匹配 (`\b`)，实时计算匹配总数与当前光标最接近匹配索引 (`X / Y`)；
     - 键盘流极速操作：在查找框按 `Enter` 跳至下一个、`Shift+Enter` 跳至上一个；
     - 原子安全替换：单处替换自动推进选区；全部替换按逆序降序执行，彻底防止文档偏移错位漂移，且完美接入 Tiptap 原生撤销栈 (`Ctrl+Z`) 与快照历史。
  3. **章节快速穿梭导航栏 (Chapter Paging Bar, `Alt+[` / `Alt+]`)**：
     - 原稿信笺底栏印章下方集成典雅双向翻页穿梭条，展示上一章与下一章的章号与标题；
     - 极速键盘流：支持 `Alt+[` 翻回上一章、`Alt+]` 翻入下一章；
     - 零丢字安全守护：切章前同步触发已注册的 `flushEditorSync()`，排空防抖定时器并原子保存当前章节正文后再执行跳转；
     - 尾章贴心引导：当已位于全书最新一章时，右侧自动转换为【续写下一章】引导按钮，灵感无缝衔接。
  4. **段落聚焦模式 (Paragraph Focus, `Ctrl+Alt+F`) 与打字机居中滚动 (Typewriter Scroll, `Ctrl+Alt+T`)**：
     - **段落聚焦 (Paragraph Focus)**：开启后通过轻量 DOM 标记与 CSS 过滤，仅高亮当前光标所在的活动段落，其余段落平滑淡化至 35% 半透明（支持鼠标悬停临时预览），帮助作者隔绝视线杂音、沉浸单段心流；
     - **打字机居中滚动 (Typewriter Scroll)**：开启后根据光标在视口内的垂直坐标动态平滑回滚，始终将当前输入行锁定在屏幕垂直 45% 的黄金舒适视野线，消除长文写作持续低头引发的颈椎劳损；
     - 状态本地化记忆 (`novelforge_focus_mode`, `novelforge_typewriter_mode`)，下次打开自动还原。
  5. **全局快捷键速查中心 (`ShortcutHelpModal.tsx`, `F1` / `?`) 与全链路阶段导航**：
     - 快捷唤起：全局按 `F1` 或非输入状态下按 `Shift+?`，或点击顶栏右侧键盘图标；
     - 模块化分类：四组精细卡片（写作与排版、沉浸与视野、阶段导航、界面与系统），配备拟物化立体 Kbd 徽章；
     - 实时关键词搜索过滤：秒级筛选定位任意功能与按键；
     - 全局阶段快捷直达：`Ctrl+1` 构思立项、`Ctrl+2` 人物档案、`Ctrl+3` 世界观、`Ctrl+4` 剧情伏笔、`Ctrl+5` 五层记忆、`Ctrl+6` 正文工作台、`Ctrl+B` 侧栏折叠；
  6. **双端构建与全系统 14 大自动化测试套件 100% 全绿**：
     - 前端 `pnpm build` (tsc && vite build) 1.38s 极速成功；
     - Rust 后端 `cargo check` 1.95s 零警告零错误，`db_test` 57 项核心业务全绿通过；
     - 14 大自动化测试套件全部通过，0 错误 0 失败。


### 3.12 全局应用内对话框体系 (In-App Dialog System)
- **根治 Tauri v2 原生对话框失效缺陷**：Tauri v2 WebView 默认不实现 JS 原生 `alert/confirm/prompt`，此前 69 处原生调用（24 个组件文件）在桌面端静默失效，导致删除章节、重命名、合并、版本回退等关键确认交互不可用；
- **自研 Promise 式对话框三件套**：
  - `src/stores/useDialogStore.ts`（Zustand 队列存储）+ `src/utils/dialog.ts`（`confirmDialog` / `alertDialog` / `promptDialog`，任意模块可直接 import，`promptDialog` 取消返回 `null`）；
  - `src/components/common/DialogHost.tsx`：App 根节点全局渲染器，完整继承「暖纸书卷」美学（象牙纸页 / 琥珀主按钮 / 玫红危险按钮 / 衬线字体），Enter 确认、Esc 取消、点击遮罩取消，prompt 输入框自动聚焦并全选预填值；
  - 破坏性关键词（删除/回退/恢复/清除/不可撤销）自动升级为 danger 红色语气；`App.css` 新增入场动画并遵循 `prefers-reduced-motion`；
- **全量迁移与验证**：69 处调用点机械替换 + 11 处同步箭头函数升级 async + 3 处 `window.prompt` 重命名流程改造；`tsc --noEmit` 零错误，浏览器实测三种对话框明暗渲染、Esc/Enter 交互与「删除确认」「重命名落库」业务闭环（详见 DECISIONS.md ADR-038）。

- **第二十五梯队**：全系统深度漏洞巡检与因果鲁棒性加固（V2.6.6 Bugfix & Robustness Evolution）：
  1. **Word 导入章节标题字符渗漏修复 (`WordImportService.ts`)**：
     - 彻底根除 Word (.docx) 智能分章时因 `fullMatch` 裁剪前导空白换行导致字符长度计算偏小、使得标题尾部字词（如“出山”）泄漏进正文首段的严重数据缺陷；
     - 记录正则匹配未 trim 的真实物理长度 `rawMatchLength`，确保切章光标准确跨过标题行，正文提取绝对纯净。
  2. **自动连载推进流闭包陷阱修复 (`SerializationModal.tsx`)**：
     - 引入 `isAutoRunningRef` 接管循环状态，根治 React 函数闭包导致 `isAutoRunning` 在异步执行流中不可变、从而在完成第一章后被误判跳出的缺陷；
     - 支持运行中即时安全暂停并补全组件卸载时的自动停止清理。
  3. **编辑器活动输入竞态保护与排版标签保护 (`NovelEditor.tsx`)**：
     - 严格隔离“章节切换”与“同章节外部变更”：同章节内仅当编辑器未聚焦（`!editor.isFocused`）时才同步外部数据（如版本回滚、一键排版、批量采纳），彻底消除 800ms 防抖存盘返回后新打入字符被旧快照冲掉与光标跳跃的竞态隐患；
     - 一键文学排版改用 DOM `TEXT_NODE` 递归遍历替换全角标点，杜绝直接赋值 `p.innerText` 破坏加粗 (`strong`)、斜体 (`em`) 等富文本结构。
  4. **升级前数据安全守卫硬阻断与醒目警示 (`DataSafetyGuard.ts` & `PreUpdateSafetyModal.tsx`)**：
     - 恪守数据安全与本地优先红线：当 SQLite 在线热备份失败时，强制将 `result.canProceed` 置为 `false`，绝对阻断升级；
     - 升级检查弹窗卡片在备份失败时展示醒目红框与详尽错误原因，绝不伪装为正常通过。
  5. **工程与作品导出文件名 Windows 非法字符安全转义 (`PublishingModal.tsx`)**：
     - 集中清洗书名中包含的 Windows 文件名保留字符（`:` `?` `*` `" < > | / \`），防止类似《我的道侣：从剑宗开始？》的书名在导出 HTML/TXT/MD/JSON 时触发文件系统错误或下载中断。
  6. **工作流推演动态变量美元符号防吞字 (`WorkflowRunnerModal.tsx`)**：
     - 变量替换改用安全函数式返回值 `replace(regex, () => val)`，杜绝正文中包含 `$1000`、`$主角` 等符号时被 JavaScript 原生 `replace` 误解析为正则捕获组导致关键文字被抹除。
  7. **拆书工坊爆款套路真实持久化 (`DeconstructModal.tsx`)**：
     - 告别“仅弹提示未入库”假实现：真正将逆向拆解出的爆款套路、适用场景、推进节拍与核验清单格式化写入小说本地灵感便签，并触发 `novelforge:notes-updated` 广播事件。
  8. **长期记忆台数据流转与依赖优化 (`MemoryEngineView.tsx`)**：
     - 从 `loadData` 依赖数组中解耦 `selectedCharId` 与 `selectedCuratorChapterId`，改用函数式初始化，杜绝侧栏切换角色时反复触发全书事实与章节全量请求。
  9. **状态管理与中文输入法体验修复**：
     - `useNovelStore`: 修复 `deleteChapter` 与 `deleteNovel` 导致的状态不同步，重构全书各维度数据加载闭环；
     - 中文输入法 IME Composition Enter 键防早提提交（`DialogHost`, `NovelEditor`, `EditorFindReplaceBar`）；
     - `EditorFindReplaceBar`: 中文全词匹配基于 Unicode `Script=Han` 前后瞻断言实现。
  10. **全系统 14 大自动化测试套件与 31 项专项漏洞验证 100% 全绿**：
     - 新建专有测试套件 `tests/test-bugfixes-verification.ts`（31 项断言 100% 通过）；
- **第二十六梯队**：全系统深度漏洞巡检与工程复原完整性加固 (V2.6.8 Deep Bugfix & Archive Fidelity Evolution)：
  1. **全书工程快照归档与跨端复原完整性 (P0 Data Fidelity)**：
     - Rust 后端 `import_novel_archive` 补齐角色关系 (`character_relationships`)、故事阶段 (`story_phases`)、剧情弧 (`story_arcs`)、伏笔线索 (`plot_threads`)、角色状态事件 (`character_states`) 的全量复原与新建实体 ID 映射重定向，杜绝备份还原后一半设定集丢失；
     - `webMockStorage.ts` 补齐 `import_novel_archive` 的实际解析与 Novel 对象返回，根治导入后 `selectNovel` 报错。
  2. **剧情大纲未归类与孤儿剧情弧独立分组可见性 (P1 Data Visibility)**：
     - 彻底修复 `PlotArcsView.tsx` 仅循环已知阶段导致未指定阶段或所属阶段被删除的剧情弧完全隐形不可见的问题；
     - 提取 `unassignedArcs` 并在界面专属“独立 / 未归类剧情弧”卡片中呈现；
     - 补齐 Rust、TauriBridge、WebMock 与前端界面的剧情弧物理删除 API `delete_story_arc`；
     - 解耦 `PlotArcsView` `loadData` 对 `arcPhaseId` 的依赖，杜绝下拉框切换触发全量请求。
  3. **人物拓扑图谱按键误删与状态脱节防御 (P1 Data Desync)**：
     - `CharacterFlowView.tsx` 实现 `onEdgesDelete`，按下 Delete/Backspace 时同步调用 `api.deleteCharacterRelationship(edge.id)` 从 SQLite 中持久化删除，消除“界面已删但数据库未删”的幽灵连线；
     - 在 `onNodesChange` 中安全过滤 `'remove'` 变更，杜绝在拓扑图上按键误删核心角色节点；
     - 增加 `onPaneClick` 空白处点击自动清除选中连线高亮。
  4. **批量修订与排版清洗采纳即时通知编辑器 (P1 Content Overwrite Guard)**：
     - `BatchReviseModal.tsx` 与 `TypesetterCleanerPanel.tsx` 在采纳保存当前活动章节新正文后，主动广播 `novelforge:force-editor-reload` 自定义事件，使已挂载的 TipTap 编辑器无感无损即刻刷新为新正文，彻底消除旧正文二次自动保存冲掉采纳成果的竞态风险。
  5. **正文反哺提案跨分类同名去重防御 (P2 Data Integrity)**：
     - `AssetProposalModal.tsx` 去重依据从纯 `p.name` 升级为 `${p.category}:${p.name}` 组合复合键，杜绝同名但不同分类的实体（例如既是角色又是法宝的「七星剑」）被静默吞噬。
  6. **Web Audio 节点释放与防内存泄漏 (P2 Resource Guard)**：
     - `typewriterAudio.ts` 在按键音播放完毕后绑定 `whiteNoise.onended` 显式断开 `whiteNoise`, `filter`, `gainNode` 与目标管线的连接，防止高频敲击与长篇流式输出时累积音频节点。
  7. **自动化测试与构建 100% 全绿**：
     - `tests/test-bugfixes-verification.ts` 扩展至 42 项断言 100% 通过；
     - `src-tauri/src/bin/db_test.rs` 增加剧情弧删除与工程归档关系/阶段/剧情弧全量复原断言，57 项验证 100% 通过；
     - `tsc --noEmit` 0 错误，Vite 构建 1.84s 极速成功。

- **第二十七梯队**：故事设定集（角色/世界观/伏笔）全生命周期闭环与数据级联加固 (V2.6.9 Story Bible Lifecycle & Data Integrity Evolution)：
  1. **角色档案全生命周期与多表级联清理 (P0 Data Lifecycle)**：
     - 彻底修复角色档案此前只能创建和修改状态、无法修改名称/别名/生平/动机等笔误且无法删除的问题；
     - Rust 后端实现 `get_character`, `update_character`, `delete_character`，并实现完备的级联清理（自动将 `scenes.pov_character_id` 和 `parallel_threads.pov_character_id` 安全置为 NULL，级联清理 `plot_associations`, `character_arcs`, `character_relationships`, `character_state_events`）；
     - WebMock 与桥接层同步实现，UI 双入口（独立视图 `CharactersView.tsx` 与停靠面板 `CharacterProfilesPanel.tsx`）全面集成编辑与删除弹窗与按钮，接入 `confirmDialog` 确认与 `novelforge:reload-story-bible` 广播。
  2. **世界观铁律全生命周期管理 (P0 Data Lifecycle)**：
     - 彻底修复世界观法则创建后无法再行编辑与删除的单向缺陷；
     - Rust 后端与前端完整实现 `get_world_rule`, `update_world_rule`, `delete_world_rule`，级联清理 `plot_associations`；
     - UI 双入口（`WorldSettingsView.tsx` 与 `WorldSettingsPanel.tsx`）全面集成编辑法则、删除法则与即时持久化。
  3. **剧情伏笔线索状态推进与闭合清理 (P0 Plot Threads Lifecycle)**：
     - 彻底修复剧情伏笔被永久锁定在 `PLANTED` 初始状态无法推进的缺陷；
     - 支持从 `PLANTED` 依次推进至 `DEVELOPING`（发酵推进中）、`READY_TO_RESOLVE`（临界回收）、`RESOLVED`（已揭秘闭合）、`ABANDONED`（已废弃/遗忘）；
     - 并在各卡片上支持内联状态选择器、直接编辑与删除清理；
     - 级联清理 `plot_associations`。
  4. **故事阶段与剧情弧解绑与关联级联 (P1 Cascade Integrity)**：
     - `delete_story_arc` 级联清理 `plot_associations WHERE entity_id = ?1`；
     - `delete_story_phase` 显式执行 `UPDATE story_arcs SET phase_id = NULL WHERE phase_id = ?1`，杜绝悬挂外键。
  5. **TipTap 版本历史还原即时同步 (P1 UI Synchronization)**：
     - `useNovelStore.ts` 中 `restoreVersion` 派发 `window.dispatchEvent(new CustomEvent('novelforge:force-editor-reload'))`，确保编辑器在任何状态下都能即刻刷新为所恢复的历史版本。
  6. **双流字数统计引擎全谱系 AI 来源识别 (P1 Stats Accuracy)**：
     - `DualWordStatsEngine.ts` 扩充 `aiSources` 集合，覆盖 `AI_GENERATED`、`AI_REVISED`、`AI_APPEND`、`AI_REPLACE`、`AI_MCP_PROSE`，消除初始范文章节与 MCP 生成正文被漏计为纯手打的统计失真。
  7. **删除后的选中实体 Fallback 防空指针 (P2 UI Defensive Guard)**：
     - `MemoryEngineView.tsx` 与 `PlotArcsView.tsx` 增加实体是否存在性校验，防止删除实体后界面保留已失效的 `selectedId`。
  8. **100% 自动化测试通过**：
     - `tests/test-bugfixes-verification.ts` 扩充至 13 大类 61 项端到端断言，100% 全绿；
     - `src-tauri/src/bin/db_test.rs` 扩充至 61 项 SQLite 真实集成测试，100% 全绿；
     - 前端 Vite 构建 1.56s 零错误，TypeScript 检查 0 错误。


- **第二十八梯队**：世界地理沙盘彻底解耦“去神州化”、流派专属沙盘主题渲染、地标拖拽重排与世界观正典双向互通 (V2.7.0 World Map Sandbox Decoupling & Multi-Genre Customization Suite)：
  1. **彻底解除“神州”硬编码与跨流派自适应命名**：
     - 排查并消除了早期原型遗留在 `MapEngine`、`MapModal`、`PanelRegistry`、`Header` 与 `CommandPaletteModal` 中的“神州山河总略图”硬编码；
     - 研发流派自适应命名引擎（科幻：`《作品名》星图势力沙盘`、废土：`《作品名》废土生存沙盘`、都市：`《作品名》都市格局沙盘`、奇幻：`《作品名》大陆地理沙盘`、修真：`《作品名》天地山河沙盘`）；
     - 顶栏与属性抽屉提供即时内联重命名，作者可随心输入任何沙盘名称并一键存盘；
     - 菜单与注册表统一正名为【世界地理与势力沙盘】。
  2. **5 大流派专属视觉背景主题自适应与切换 (`MapBgTheme`)**：
     - 实装羊皮古卷（`PARCHMENT`）、深空星轨（`COSMIC_DEEP`）、仙道青玉（`ANCIENT_JADE`）、废土沙盘（`DESERT_BROWN`）、水墨暗夜（`INK_DARK`）五种不同题材的背景网格与动态水印；
     - 控制条配备流派主题快速切换下拉菜单，画布毫秒级实时重绘。
  3. **地标指针拖拽平移移动 (Drag & Move)**：
     - 地标节点接入现代指针捕获（`onPointerDown` + `setPointerCapture`），支持直接按住地标自由平移拖拽更新百分比坐标；
     - 拖拽期间 SVG 路线端点实时跟随平滑拉伸，松手安全持久化；原地轻点与连线绘制完全无冲突。
  4. **地标品类扩充与世界观法则 (Canon) 双向反哺打通**：
     - 扩充 `LANDMARK` 自然奇观/星门要冲/奇观界碑品类；
     - 地标属性检视面板增设【✨ 存为权威法则】反哺按钮，一键将地标名称与地理风貌录入世界观设定库（CANON）；
     - 未选中项的全局抽屉增设【✨ 依据当前世界法则重塑沙盘】按钮，一键扫描世界观法则重新智能提炼沙盘地标与探索路线。
  5. **历史数据平滑升级与行军因果核验泛化**：
     - `loadMapFromStorage` 自动平滑升级历史缓存中的旧“神州山河总略图”为当前作品定制名称；
     - `verifyTravelSpeed` 行军超速核验泛化兼容科幻空间跃迁、修真传送阵、神行遁术或特殊极速载具。
  6. **100% 测试验证**：
     - `tests/test-third-cohort-engines.ts` 扩充至 53 项核心断言，100% 全部通过；
     - `pnpm exec tsc --noEmit` 0 错误，生产构建 `pnpm run build` 3.28s 零错误极速完成。

- **第二十九梯队**：移植参考功能全面除偏、多题材反哺落库与生产力闭环深化 (V2.8.0 Cross-Genre Generalization & Reference Feature Remediation)：
  1. **起名灵感生成器深度重构与双向落库闭环 (`QuickNameModal.tsx`)**：
     - 排查出离线词库早期硬编码古风玄幻的问题；
     - 全面扩充并实装 4 大题材专有离线词根库（古典仙侠、硬核科幻、现代都市、末日废土）；
     - 细分 5 大起名分类标签（人物姓名、势力阵营、招式战技、装备神兵、特产物资）；
     - 彻底改变以往“生成后只能复制到剪贴板”的断头体验，增设【存为角色档案】与【存为世界法则】一键入库闭环，直接打通 SQLite。
  2. **章节目标与主线推进面板去偏科与智能推荐 (`ChapterGoalsPanel.tsx`)**：
     - 排查并移除了硬编码初始值 `'遭遇伏击，破局脱身，暴露功法秘密'` 的修仙假设；
     - 研发根据当前小说题材流派（科幻星际、都市商战、悬疑惊悚、末日废土、传统玄幻）动态切换目标建议与 placeholder；
     - 增设“✨ 填入流派推荐目标”一键智能填充按钮，支持快速自定义与清空。
  3. **正文资产反哺引擎跨流派泛化与连词精准隔离 (`AssetProposalEngine.ts`)**：
     - 泛化 FACTION（门派势力/阵营组织/企业财阀/避难所）、TECHNIQUE（功法绝技/异能战技/超频协议/法阵序列）、ARTIFACT（法宝神兵/高科装备/机甲外骨骼/生化药剂）等品类提炼规则；
     - 修复贪婪匹配吞咽紧邻连词的边界缺陷，采用前缀连词排除断言，保障如“青云门与七星阁”等多实体紧邻并列句式能够精准切分为独立提案；
     - 实体分类标签根据流派动态自适应（如“阵营组织”、“异能战技”、“装备器物”）。
  4. **剧情工作流执行器生产消费闭环 (`WorkflowRunnerModal.tsx`)**：
     - 排查出多步骤工作流（如三幕起承转合、黄金三章设计、冲突升级等）跑完后仅有只读卡片展示、缺乏落地利用途径的断环问题；
     - 在每个步骤卡片下方新增一键行动工具栏：【追加至本章末尾】、【采纳为章节正文】以及【复制成果】；
     - 结合 Tauri Bridge / SQLite 事务与当前活跃章节无缝打通。
  5. **主编控制台示例与预设通用化 (`EditorInChiefPanel.tsx`)**：
     - 将原本写死修仙套路的静态规则示例泛化为通用超凡物理限制、社会公理与世界基础法则。
  6. **100% 自动化测试全绿**：
     - `test:cohort3` (53 断言)、`test:cohort2` (46 断言)、`test:bugfixes` (82 断言) 总计 181 项核心自动化测试断言 100% 全部通过；
     - `pnpm exec tsc --noEmit` 0 错误，生产构建极速完成。

- **第三十梯队**：剧作拆解内循环、角色生命状态跨流派规约与故事阶段结构模板库 (V2.9.0 Craft & Structure Ingestion Suite)：
  1. **拆书工坊打破只读孤岛，打通开局自检与双向落库 (`DeconstructModal.tsx`)**：
     - 新增【📖 载入当前本章正文】与【📚 载入本书前三章正文（黄金三章自检）】工具栏，自动清洗富文本为纯文本并一键注入待拆解区；
     - 内置玄幻破局、硬核科幻、谍战悬疑 3 大经典开篇试炼样章片段；
     - 提炼出的套路卡除存入便签本外，新增【存为世界观设定库法则】与【存为大纲故事阶段】一键双向落库闭环。
  2. **角色生命体征跨流派状态规约与自适应显示 (`CharacterProfilesPanel.tsx` & `FullCheckEngine.ts`)**：
     - 彻底修复将休眠、冷冻、潜伏、隔离、失联等非修仙离场状态降级为“健康”的缺陷；
     - `getNormalizedStatus` 建立全题材状态规约映射表；
     - 状态卡片、筛选药丸与下拉菜单根据小说流派自适应呈现（科幻：休眠/冷冻；末日：隔离/失联；都市：潜伏/隐匿；仙侠：闭关/潜修）；
     - `FullCheckEngine.ts` 同步纳入全题材离场与牺牲状态核验，杜绝漏判。
  3. **故事阶段与大纲规划 CRUD 闭环与戏剧模型库 (`PlotOutlinePanel.tsx`)**：
     - 补齐大纲故事阶段的编辑（`update_story_phase`）与删除（带级联解绑与 `confirmDialog`）功能；
     - Rust 后端新增 `UpdateStoryPhaseInput`、`update_story_phase` command 并注册在 Tauri 路由中，WebMock 同步实现；
     - 新增“起承转合四卷流”、“好莱坞经典三幕六部曲”、“商业升级三步飞升流”三大经典大师级大纲结构模板库，支持一键批量注入。
  4. **世界观法则面板流派推荐模板 (`WorldSettingsPanel.tsx`)**：
     - 移除单一修仙的输入占位符，依据小说题材提供超空间跃迁、金融做空熔断、基因衰变与仙道誓约公理等 8 大流派法则模板，支持一键填入表单。
  5. **全量端到端验证通过**：
     - Rust 后端 `db_test` 61 项数据库与生命周期测试 100% 通过；
     - 前端自动化测试 181 项全部绿灯；
     - `pnpm exec tsc --noEmit` 0 错误，生产构建极速完成。

- **第三十五梯队**：角色对戏演武场与战争迷雾认知沙盒系统 (V3.4.0 Character Sandbox & Cognitive Enactment Suite)：
  1. **多角色独立子代理与战争迷雾沙盒 (Cognitive Sandbox & Private CoT)**：
     - 彻底终结单大模型“人格坍缩、同质化客服腔、全知泄密剧透与反派轻易妥协”四大顽疾；
     - 角色子代理开口前必须先在 `<inner_thought>` 标签中推演内心小算盘、防线得失与防御策略；
     - 严格过滤内部思考，公开对话账本仅包含台词与肢体微动作，实现彻底的“零心理同质化与战争迷雾隔离”；
     - 提供【上帝视角/观众视角】一键切换，作者可随时偷看全员的私密心机。
  2. **异构多模型支持与角色跨平台分配**：
     - 允许在同一场戏中为主角分配擅长隐喻与文学质感的 Claude 3.5 Sonnet，为对手分配擅长严密博弈逻辑的 DeepSeek-V3 或 GPT-4o。
  3. **6 大经典高冲突情境模板一键套用 (Scene Presets)**：
     - 内置：密室试探与解药虚实、鸿门夜宴笑里藏刀、当面掉马身份戳穿、绝壁残阳生死决裂、枭雄分羹利益拉扯、长街偶遇旧情反目；
     - 一键秒级填入物理环境、冲突目标与双方专属的攻防私密动机与隐藏秘密。
  4. **动态戏剧张力指数计 (Tension Arc Meter 1~10)**：
     - 依据交锋动作、反问语气、对抗杀伐关键词与节拍轮次，实时动态测算全场张力；
     - 呈现 5 档情绪刻度（试水寒暄、暗流涌动、步步紧逼、剑拔弩张、刺刀见红），并在顶栏与对戏气泡打上动态徽章。
  5. **作者即兴导演与全能微调**：
     - **原地改词**：气泡卡片就地进入编辑态，微动作与台词随心修改，下一轮推演自动继承因果；
     - **天意/旁白变故注入**：随时输入不可抗力环境事件（打雷、窗纸吹破、脚步声）；
     - **一键互换攻守位置**：支持角色先手与攻守立场一键对调。
  6. **三向非破坏性成果采纳与反哺长期记忆**：
     - **正文转译 (Prose Synthesis)**：作家 Agent 一键合成高文学质感的小说正文段落，支持追加正文或存为章节候选提案；
     - **长期记忆反哺**：一键将全员对手戏心境演变写入 SQLite `character_state_events`，实现长篇因果记忆闭环；
     - **多格式导出**：支持导出标准戏剧脚本 (.txt) 与上帝视角排练纪要 (.md)。
  7. **全量端到端与无头测试 100% 通过**：
     - Rust 端新增 `safe_extract_between` 安全字符边界截取算法，彻底根除切片越界 Panic；
     - 前端引入 `isRunningRef` 信号量，保障暂停推演即刻刹车与卸载安全；
     - 原生数据库测试 `db_test` 扩充至 **66 项断言 100% 全部通过**；
     - 专属端到端自动化测试 `test:sandbox` **12 项深度断言 100% 全量通过**；
     - 前端 Vite 打包 1.41s 零错误 0 警告。

- **第三十六梯队**：互联网 WebRTC P2P 房间码直连协同创作架构 (V3.5.0 Serverless P2P Collaboration Suite)：
  1. **零服务器成本与真正本地隐私直连 (Serverless P2P via WebRTC DataChannel)**：
     - 采用 PeerJS + WebRTC 双向加密通道直连两端设备，实现 0 元服务器租赁运维成本；
     - 集成 Google 与 Cloudflare 公共免费 STUN 穿透网关，成功击穿主流电信、联通、移动复杂 NAT 拓扑；
     - 所有章节文本、角色小算盘与推演记录仅在作者与协作者本地内存及 SQLite 存储，不经任何第三方中心服务器。
  2. **6 位数字房间码 (Room Code) 极简配对体验**：
     - 将复杂的 Peer ID 映射为易读易记的 6 位数字房间码（如 `839-204`）；
     - 房主一键建房并支持快速复制邀请指令，远端协作者粘贴房间码 1 秒握手入房。
  3. **演武场角色异地人机共演与实时对白广播 (`SANDBOX_ROUND_SUBMIT`)**：
     - 角色卡支持自由指定【👤 作者亲演】与【🌐 远端协作者】；
     - 远端协作者在即兴发射坞敲入微表情与台词并回车，毫秒级跨互联网广播至房主案头，时间线实时推进；
     - 会话切换自动下发 `SANDBOX_SYNC_INIT` 全量同步场景物理环境、公开台词账本与张力刻度。
  4. **章节候选提案跨端远程空投与非破坏性防御 (`PROPOSAL_DELIVERY`)**：
     - 远端写作者起草正文修改或高潮段落，一键“投递至房主案头”；
     - 房主端自动接收并存入本地 SQLite `chapter_proposals` 库，作为修订候选呈现，坚守底线绝不擅自覆盖房主正文。
  5. **毫秒级 RTT 实时心跳测算与随堂密语信使**：
     - 4 秒心跳探测实时测算端到端往返延迟（RTT），浮窗右上角常驻显示（如 `🟢 28ms`）；
     - 协作面板内置随堂实时密语通道，方便协作者间快速沟通剧情设想与伏笔设计。
  6. **100% 自动化测试全绿**：
     - 专用自动化测试 `test:p2p` **5 项核心深度断言 100% 满分通过**；
     - `test:sandbox` **12 项断言 100% 满分通过**；
     - `pnpm build` 生产构建 **1.28s 零错误完成**。

- **第三十七梯队**：演武场树状分支推演与 OOC 智能审计系统 (V3.6.0 What-If Branching, Subtext & Persona Sentinel Suite)：
  1. **树状分支推演 (Narrative "What-If" Branching Tree)**：
     - 终结单线推演遗忘与重置痛点：创作者可在任意历史节拍点击【🌿 开辟分支】，探索“坦白解药”、“拔剑先手”或“虚与委蛇”等截然不同的因果结局；
     - 顶置横向分支导航栏：优雅呈现各分支轮次胶囊，支持 1 键无损瞬切与独立分支删除；
     - 记忆与因果严格隔离：各分支拥有独立的对白历史与上下文，正文转译合成直接消费当前活跃分支。
  2. **人设崩坏与 OOC 智能审计哨兵 (`src/utils/personaAuditor.ts`)**：
     - 实时启发式与规则审计四大维度：
       ① 现代商业与 AI 互联网黑话违和（Critical 级）；
       ② 对峙戒备角色的客服腔与过度客套（Warning 级）；
       ③ 惜字如金角色的超长发言（Warning 级）；
       ④ 绝密底牌交锋初期早泄（Warning 级，n-gram 滑窗精准匹配）；
     - 气泡卡片就地浮现告警徽标与【按人设纠偏重掷 ↺】按钮，一键注入针对性人设强化提示词完成自愈。
  3. **潜台词微观透视与弦外之音解码 (Subtext & Psychological Decoding)**：
     - 角色子代理 XML 输出规范扩充 `<subtext>`，支持显式输出与智能提炼；
     - 顶栏增设【💬 潜台词透视】一键高亮开关，揭示台词背后真实的利益算盘与威慑意图。
  4. **全套自动化测试 100% 绿灯**：
     - 专属测试套件 `test:branches` **5/5 项深度断言 100% 满分通过**；
     - 原生数据库测试 `db_test` **66/66 项断言全绿通过**；
     - `test:sandbox` 12 项、`test:p2p` 5 项全绿；
     - 前端生产构建 `pnpm build` **1.47s 零错误完成**。

- **第三十八梯队**：演武场角色行动抉择探针、灵感火花提炼与高光文段精修系统 (V3.6.6 Character Action Probing & Inspiration Distillation Suite)：
  1. **角色行动抉择探针 (What Would They Do? - Action Probing Engine)**：
     - 彻底改变“只能看角色自说自话”的单调体验，为当前主要角色动态生成 3 条鲜活且极具戏剧反差的下一步行动策略（如：`虚与委蛇 · 佯装退让` / `针锋相对 · 触碰逆鳞` / `出人意料 · 借势破局`）；
     - 作者不仅可直观预览各路线的“微动作动机”与“预期后果”，更可一键【采纳此路线步进】，精准主导戏剧张力走向。
  2. **全场灵感火花自动提炼 (Inspiration Spark Distiller)**：
     - 创作者对戏完毕后，一键提炼整场对戏中的高价值文学素材：
       - `💬 高光金句与双关台词`（字字珠玑、富有哲理或冷酷锋芒）；
       - `🎭 传神微动作与神态细节`（打破套路、充满五感张力）；
       - `🧠 潜台词与深层博弈暗流`（揭示各角色隐秘利益与防线计算）；
       - `⚡ 意外转折与剧情伏笔线索`（出人意料的冲突破局点）；
     - 提炼内容结构化持久化于 SQLite 演武场沙盒会话，支持一键存入便签本。
  3. **高光文段精修打磨工坊 (Prose Polishing Workshop)**：
     - 将原本生硬的“正文转译”升级为专业文学精修实验室，提供 3 套针对性风格：
       - `🎬 电影感镜头白描`：视听语言、声响光影、冷白描；
       - `🧠 心理暗流深描`：潜台词剖析、内心拉扯、微表情；
       - `⚡ 硬派冷冽网文`：短句突进、节奏明快、压迫感拉满；
     - 支持指定范围切片精修与作者自定义打磨意图。
  4. **全套测试矩阵全绿通过**：
     - `test:sandbox:inspiration` (6/6)、`test:sandbox:api` (4/4)、`test:header` (9/9) 全部满分通过。

- **第三十九梯队**：角色贴图立绘全链路支持与多模态 AI 视觉人设解析系统 (V3.6.7 Character Avatar & Multimodal AI Visual Understanding Suite)：
  1. **SQLite 数据库与持久化模型无损演进**：
     - `characters` 表平滑迁移增加 `avatar_url TEXT DEFAULT ''` 与 `visual_summary TEXT DEFAULT ''`，向下兼容既有数据；
     - Rust 数据结构（`Character`, `CreateCharacterInput`, `UpdateCharacterInput`）与 SQLite CRUD 全面打通，MCP 服务端端点同步升级。
  2. **多模态 AI 视觉人设解析引擎 (`analyze_character_appearance`)**：
     - 扩展 `OpenAIClient::vision_chat_completion` 接口，支持图片直链与 Base64 Data URL 视界输入；
     - 注入文学级人设提炼 Prompt，自动解析角色的发型发色、五官神态、体态身形、服饰质感与武器佩饰；
     - 提取生成 150~250 字文学小说级肖像描摹段落，并输出 4~8 个结构化视觉标签（如：银发高马尾、玄黑金纹劲装、腰悬古剑）；
     - 内置跨题材（仙侠/科幻/都市/通用）、跨性别（男/女/未知）智能兜底拟合算法，网络波动或纯文本大模型下 100% 高可用。
  3. **演武场推演台认知联动与微动作自洽注入**：
     - `execute_character_sandbox_step` 与 `probe_character_next_actions` 系统提示词深度注入角色立绘外貌特征；
     - 引导 AI 在推演对手戏、微动作与潜台词时严格遵循立绘特征（如拂动衣袖、抚弄腰间古剑、垂眸沉思），彻底终结“立绘是白衣飘飘，AI 描写却是西装革履”的割裂；
     - 演武场出场阵容卡片、对戏发言气泡头像直观渲染立绘贴图，视觉沉浸感全面飞跃。
  4. **全景 UI 交互与立绘选择器 (`CharactersView.tsx` & `CharacterProfilesPanel.tsx`)**：
     - 支持本地文件一键选择（FileReader 自动转 Data URL）、拖拽上传与网络直链；
     - 实时立绘预览、头像圆角卡片渲染，配备【👁️ AI 识图理解外貌】操作按钮；
     - 识别结果即时填入表单，支持创作者自由微调，严格贯彻用户掌控原则。
  5. **全套自动化测试 100% 满分通过**：
     - 专用自动化测试 `test:character:visual` **5/5 项深度断言 100% 满分通过**；
     - `cargo run --bin db_test` **66/66 项原生全功能断言全部通过**；
     - 前端生产构建 `pnpm build` **1.39s 零错误 0 警告完成**。



