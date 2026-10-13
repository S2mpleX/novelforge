# NovelForge AI — 项目持续开发状态 (PROJECT_STATE.md)

## 1. 当前阶段与基线
- **当前阶段**：V2.2 **自动更新与版本发布系统 (Auto-Updater & Release System) 全面达成！** (工程基础、长篇编辑器与纵向 MVP、设定集与关系拓扑图、多 Agent 协作编排体系、五层长期记忆引擎 Memory Engine、多 Agent 自动连载引擎 Serialization Engine、多格式发布中心 Publishing Center、数据库系统运维与灾备备份、多层级小说结构体系、专业级可停靠工作台 Docking Engine、自动更新与版本发布系统 Auto-Updater & Release System)
- **版本目标**：V2.2
- **更新时间**：2026-10-13
- **代码库状态**：真实可运行、真实编译通过 (Rust 零错误零警告，前端 Vite 480ms 打包零错误)、更新系统 28 项专项测试、可停靠工作台 10 项端到端测试与 SQLite 40 项核心业务测试 100% 全部通过。

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
- **装载 Humanizer 叙事法则**：彻底剔除 AI 说明文腔调与空洞概括，严禁游戏策划/引擎术语外露，精修微表情与对话呼吸感。
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

---

## 4. 总结与后续演进建议
NovelForge AI V2.2 正式发布！自动更新与版本发布系统已全链路打通并完成严格测试验证。创作者能够在客户端便捷直观地浏览新版本发布说明、查看真实下载进度并安全平滑升级，同时小说正文、人物设定、长期记忆、多 Agent 协作状态与模型配置受到 DataSafetyGuard 全程严密保护。后续规划将进一步扩展 Windows ARM64、macOS 与 Linux 多平台交叉编译矩阵与增量差分更新支持。



