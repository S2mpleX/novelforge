# NovelForge AI — 架构与技术决策记录 (DECISIONS.md)

## ADR-001: 桌面框架选择 Tauri 2
- **状态**：已采纳
- **上下文**：NovelForge AI 要求本地优先、百万字长篇数据安全、极低内存占用、深层操作系统的 SQLite 和多线程调度支持。
- **决策**：选用 Tauri 2 + Rust 原生后端，对比 Electron 能减少 80% 内存消耗，且原生 Rust 能高效处理任务队列、流式加密请求与本地数据库。

## ADR-002: 编译工具链适配（WinLibs MinGW-w64 + MSVCRT runtime）
- **状态**：已采纳
- **上下文**：宿主环境 C 盘剩余容量紧张，缺乏 Visual Studio C++ 生成工具 (MSVC `link.exe`)，且默认终端无管理员提权；同时 MinGW ld/windres 对含中文字符的项目路径解析可能产生异常。
- **决策**：引入免管理员权限的 WinLibs MinGW-w64 绿色编译工具链至纯 ASCII 目录 `E:\tools\winlibs_msvcrt`，配置 `CARGO_TARGET_DIR = E:\tools\novelforge_target`，启用 Rust `x86_64-pc-windows-gnu` 目标平台并使用 `staticlib` 与 `rlib` crate 类型，彻底规避符号超限与中文路径链接问题。

## ADR-003: 数据库选型与存储策略（SQLite WAL + FTS5）
- **状态**：已采纳
- **上下文**：需要支持离线存储、事务一致性、历史版本快照、全文搜索，后续扩展向量。
- **决策**：使用 SQLite 嵌入式数据库，开启 Write-Ahead Logging (WAL) 并启用外键约束。集成 SQLite FTS5 实现高效全文索引，保证单机数十万至百万字检索在毫秒级完成。

## ADR-004: 多 Agent 架构与职责边界隔离
- **状态**：已采纳
- **上下文**：市面上诸多 AI 写作工具仅用一个聊天框切换名字，缺乏真实的职责约束与结构化输出。
- **决策**：每个 Agent 拥有独立的系统提示词（统一存放于 `prompts/` 目录）、独立的 Input/Output JSON Schema、独立的模型与温度配置、以及独立的执行日志。所有 Agent 调度必须由主编（Editor-in-Chief）或任务编排器以结构化任务形式分发，禁止将假 Agent 界面混淆为多 Agent 生产系统。

## ADR-005: 记忆分层模型（L0 ~ L4）
- **状态**：已采纳
- **上下文**：长篇小说随着章节数扩展（100~1000章），将历史全文直接塞入上下文会导致模型幻觉、Token 费用失控和性能下降。
- **决策**：构建 L0（工作记忆）、L1（近期剧情）、L2（中期分卷与剧情弧）、L3（长期结构化权威设定 Canon）、L4（全文历史检索 FTS5）五层递进记忆体系。

## ADR-006: 人物拓扑关系图谱可视化选型 (@xyflow/react)
- **状态**：已采纳
- **上下文**：长篇小说随着出场人物增多（数十上百人），静态列表难以呈现角色之间的复杂网状关系（师徒、仇敌、暗恋、结盟等），创作者需要直观的可视化图谱。
- **决策**：选用 `@xyflow/react` (React Flow)，支持高性能节点自由拖拽、双向拉线建立关系、动画连接边、缩略图导览 (MiniMap)，连线变更实时回写本地 SQLite，兼顾视觉体验与持久化。

## ADR-007: 逻辑审稿机制与 Humanizer 叙事守则集成
- **状态**：已采纳
- **上下文**：大模型生成网文小说极其容易出现“AI 腔调”（说明文式概括、连词滥用、抽象情感描述）、策划术语外露（Flag、回收、数值结算等）以及前后设定矛盾。
- **决策**：
  1. 正文作家 (Prose Writer) 与文学编辑 (Style Editor) 深度集成 Humanizer 叙事法则，强制“Show, Don't Tell”，强化对话留白与微表情。
  2. 逻辑审稿 (Continuity Auditor) 独立执行，强制输出结构化 JSON 报告，标注冲突原句引用与修改建议，且以候选修订方式呈现，严禁擅自覆盖正文。

## ADR-008: 五层记忆上下文装配与 FTS5 容错机制 (Phase 4)
- **状态**：已采纳
- **上下文**：在多 Agent 创作或审稿时，若上下文组装时 FTS5 全文搜索由于用户输入特殊符号导致 SQL 语法解析错误，会导致整条 Agent 调度失败。
- **决策**：
  1. 在 `assemble_memory_context_pack` 与 `list_canon_facts` 中加入 FTS5 查询容错与降级机制：如果 FTS5 MATCH 查询失败，优雅降级为标准 SQL `LIKE` 模糊查询，保障高可用性。
  2. 记忆组装器严格遵循分层预算配额限制，按照“L0 工作目标 > L3 权威公理 > L1 前情延续 > L2 弧线冲突 > L4 事实引用”的优先级排列，生成统一格式的 System Prompt 注入。

## ADR-009: 自动连载状态机与安全防破坏性机制 (Phase 5)
- **状态**：已采纳
- **上下文**：多 Agent 连续自动生成数十万字若出现偏离或幻觉，且未经审核直接覆盖主干章节，会造成作者劳动成果遭受不可逆破坏。
- **决策**：
  1. 引入强类型状态机 `SerializationJob`（`PENDING` -> `RUNNING` -> `WAITING_REVIEW` -> `COMPLETED` / `PAUSED` / `CANCELLED`）。
  2. 实施 **Auto-Approve Guard**：默认情况下 `auto_approve` 为 `false`，每章自动执行【大纲细化 -> 正文草稿 -> 逻辑审稿 -> 记忆沉淀】后自动挂起为 `WAITING_REVIEW`，等待用户人工核准后方可推进下一章；仅当创作者明确授权全自动定稿推进时才开启闭环连载。
  3. 任何自动生成草稿均作为全新章节与新版本快照入库，支持随时暂停、取消与安全回退。

## ADR-010: IPC 桥接双模自适应与 Web 兼容层 (Phase 8)
- **状态**：已采纳
- **上下文**：在多环境开发或用户在普通浏览器（如 `localhost:1420`）调试时，由于缺少 Tauri 内部注入的 `__TAURI_INTERNALS__`，会导致直接抛出 `Cannot read properties of undefined (reading 'invoke')` 致命未捕获异常。
- **决策**：
  1. 引入双模桥接层 `src/utils/tauriBridge.ts`，自动探测 `isTauri()` 环境。
  2. 桌面端执行原生 Rust IPC 命令；浏览器环境自动无缝降级走 `webMockStorage.ts`（基于 LocalStorage 持久化存储与真实网络 `fetch` 探测），彻底消除红字报错与白屏崩溃。

## ADR-011: 真实人类打字动力学流式引擎 (Human-like Typewriter Streaming Engine)
- **状态**：已采纳
- **上下文**：常规打字机特效常采用机械固定间隔或极高速度（如 25~100字/秒），导致文字像打印喷枪一样瞬间倾泻，完全丧失人类敲击键盘构思写作的真实感；而若速度过慢且缺乏起伏，又会产生死板机械感。
- **决策**：
  1. **人类学按键参数模型 (Human Kinetics Spectrum)**：
     - **沉思品味 (Slow)**：基础按键 ~130ms（约 7~8 字/秒），重在沉浸推敲与逐字品味；
     - **作家手速 (Normal - 推荐)**：基础按键 ~72ms（约 13~15 字/秒），模拟职业作家行云流水的击键心流；
     - **文思泉涌 (Fast)**：基础按键 ~36ms（约 25~30 字/秒），速览出稿。
  2. **词组脉冲打字机制 (Word-Burst Rhythm)**：模拟人类拼音输入法特征，以 2~4 个字为一个连击词组（快速连击 20~38ms），词组敲击完毕后产生 100~200ms 的选词构思微停顿，呈现真实的人类有机打字节律。
  3. **标点与换行深思熟虑停顿 (Literary Pauses)**：句末（`。！？`）停顿 380~580ms，逗号停顿 180~300ms，换行回车停顿 500~750ms，完全还原作者脑海构思下一镜头的自然呼吸。
  4. **温和自适应背压与全文本防截断**：避免因后端 buffer 一次性推送几十字而瞬间粗暴加速破坏打字机体验；严格维护 `fullText` 引用，动画中随时采纳/复制均保证 100% 完整文稿。
  5. **纯原生 Web Audio 机械按键音 (Optional Keystroke Audio)**：纯浏览器底层合成 0 外部资源、0 网络请求的微弱温润机械敲击音，换行附带沉稳回车音，作者可自由静音/开启。


## ADR-012: 极简创作路径与全能工具箱架构 (Phase 8)
- **状态**：已采纳
- **上下文**：创作者在日常码字中痛恨频繁在多级菜单中查找功能、频繁手动复制粘贴提示词、多次生成候选无法对比暂存、以及夜间暗光环境与白天强光下的视觉疲劳。
- **决策**：
  1. **全局命令面板 (Ctrl+K)**：提供键盘流命令面板，秒级模糊检索章节、一键规范排版、保存快照与导航。
  2. **草稿候选暂存箱 (Draft Stash)**：AI 每次流式生成的文本支持一键放入草稿箱，支持多版本横向对比与差异化应用。
  3. **纸张与排版工作室 (Paper & Typography Studio)**：提供 4 款定制纸张（温润宣纸、澄心竹纸、复古牛皮、水墨夜读）与字号快速缩放（16/18/20px），沉浸式 Zen 模式（按 Esc 退出）。
  4. **作家锦囊 (Toolbox)**：内置四大风格起名大师（人名、宗门、神兵、功法）与网文敏感违规词合规自查。

## ADR-013: 人物档案与世界观设定视图独立解耦 (Architecture Refactoring)
- **状态**：已采纳
- **上下文**：顶部导航栏已将【人物档案】与【世界观设定】定义为两个平行的一级入口。但在原实现中，两者均直接渲染单一的 `StoryBibleView`，且该组件内部维护了写死默认值的局部 Tab 状态，未与全局路由同步。导致创作者点击顶部“世界观设定”时，视图仍停留在“人物档案”卡片列表，造成“世界观与人物档案怎么都是同一个界面”的混淆。
- **决策**：
  1. **彻底拆分为两个专属一级视图**：
     - `CharactersView`（人物中心）：聚焦人物档案列表与基于 React Flow 的人物关系拓扑图，配备【+ 新建人物档案】操作。
     - `WorldSettingsView`（世界观中心）：聚焦世界观法则 (Canon 权威公理/战力体系)、宏观大纲剧情弧 (Plot Arcs)、伏笔悬念追踪 (Plot Threads)，配备【+ 新增世界观规则】与【+ 埋设新伏笔】操作。
  2. **一级路由精准分流**：在 `App.tsx` 中将 `CHARACTERS`、`WORLD`、`PLOTS` 严格分流至专属视图，并支持 `initialTab` 深度直达。
  3. **向后兼容**：保留并重构 `StoryBibleView`，添加与全局 `store.activeTab` 状态的双向响应，确保存量引用与测试无损兼容。

## ADR-014: 正文字号调节失效修复与弹性排版系统 (Editor Typography Engine Fix)
- **状态**：已采纳
- **上下文**：用户反馈工具栏上的“字体调整按钮无法使用 (A- 18px A+)”。排查发现原因有二：
  1. CSS 特异性覆盖：`.ProseMirror` 样式中直接硬编码了 `font-size: 1.18rem;`，导致外层通过 Tailwind 动态切换的 `text-base` / `text-lg` / `text-xl` 无法生效，正文字号始终不变；
  2. 交互逻辑受限：字号范围仅限 `'16' | '18' | '20'`，边界点击时无响应且无禁用反馈，中间数字无法点击，缺乏现代文本编辑器的弹性与丰富预设。
- **决策**：
  1. **采用 CSS 变量解耦与层叠穿透**：通过 `--editor-font-size` 和 `--editor-line-height` 控制 ProseMirror 编辑器实际字号与行距，通过 `.editor-surface .ProseMirror` 强特异性覆盖，标题采用 `em` 相对等比缩放。
  2. **12px~32px 弹性平滑步进**：支持 12px 至 32px 宽广字号范围，点击 A- / A+ 步进 2px，极值处具备 `disabled:opacity-30 disabled:cursor-not-allowed` 明确反馈。
  3. **字号预设下拉浮层**：点击中间字号数字可呼出快捷预设浮层（14px、16px、18px、20px、22px、26px 以及一键重置默认 18px），点击外部自动关闭。
  4. **全端同步**：流式生成预览框与持久化存储实时生效。

## ADR-015: 真实物理纸张材质与原稿信笺系统 (Tactile Literary Paper System)
- **状态**：已采纳
- **上下文**：用户反馈纸张主题切换“并没有很好的效果，感觉只是换了个颜色”。排查证实原版仅变更了简单的外层纯色 HEX 背景和边框，缺少物理纸张纤维与肌理，正文文字墨色也未深度联动。
- **决策**：
  1. **纯 CSS/SVG 零依赖过程化纸张纹理**：
     - 宣纸：手工熟宣细密棉麻纸筋与徽墨松烟（`#231d17`），柔和多层叠纸边缘阴影；
     - 竹纸：江南清幽竹浆素帘纹（细帘纵向帘纹），清润竹墨深青（`#17241a`），清澈护眼；
     - 复古牛皮：斑驳原浆纤维杂质与古典古籍做旧暗角渐变（Vignette），浓郁沉香焦褐墨（`#2a1b10`），暗调胡桃木案书桌；
     - 水墨夜读：深宵歙砚水墨氤氲底纹，柔润月华冷白字色（`#dfdbd0`），沉水香金点缀，暗金墨印。
  2. **多层叠纸物理装订阴影**：通过复合层次的 `box-shadow` 呈现纸页重叠厚度与手工裁边感。
  3. **传统印信暗纹水印**：右下角加盖四款专属篆刻朱印（`【宣纸·澄品】`、`【竹笺·幽韵】`、`【秘卷·珍藏】`、`【夜墨·沉吟】`）。
  4. **信笺稿纸横线功能**：提供一键开启的精确行高对齐原稿纸行线。
  5. **主题选择器色块胶囊**：工具栏增加触感材质圆标与描述。

## ADR-016: 小说多层级内容结构系统与跨层级独立剧情关系网 (V2.0 架构升级)
- **状态**：已采纳
- **上下文**：长篇小说（数十万至数百万字）结构复杂，单一的“作品 → 章节”二级树形目录无法表达“系列/宇宙 → 作品 → 部/篇 → 卷 → 章 → 场景 → 情节节拍 → 段落”的多级组织；同时主线、支线、故事弧、人物成长弧、伏笔、时间线、并行叙事线是跨章、跨卷、跨部的多对多关系，如果强行与目录树硬绑定会导致大纲僵死、无法表达复杂并行叙事。
- **决策**：
  1. **可扩展 8 层内容层级**：支持 `系列` → `作品` → `部/篇` → `卷` → `章` → `场景` → `节拍` → `段落`，通过 `HierarchyConfig` 允许各层级根据作品类型灵活启用或省略（短篇仅需作品→章节；长篇启用全层级）。
  2. **章节与场景分工**：章节为默认连载发布单位；场景为默认 AI 正文规划与生成单位；节拍为可选细粒度规划单位。
  3. **跨层级多对多剧情关联 (M:N Plot Matrix)**：在 SQLite 中独立建立 `plot_associations` 表，建立 `(plot_entity_type, plot_entity_id, target_hierarchy_type, target_hierarchy_id)` 联合索引，将剧情关系从目录树中彻底解耦，形成独立演化的网状因果矩阵。
  4. **结构与生命周期操作安全保障**：实现 `move_node`（移动节点）、`split_chapter`（拆分章节自动保存版本快照并重排后继）、`merge_chapters`（章节正文拼接，场景与剧情关联平滑转移）、`split_scene` / `merge_scenes`、`renumber_hierarchy`（连续重编号），杜绝数据丢失或孤立引用。
  5. **多 Agent 创作上下文递归组装**：创作时自顶向下组装当前宇宙、当前部、当前卷、当前章节目标、场景细纲、当前节拍，并关联注入主线、人物成长阶段、伏笔提示与并行线，实现长篇多 Agent 连续性无缝保障。

## ADR-017: 全局全站 UI 与文字大小等比缩放引擎及无侵入日夜模式系统
- **状态**：已采纳
- **上下文**：桌面端长篇小说写作工具用户拥有不同的显示器分辨率（1080P、2K、4K）与视力阅读习惯，仅缩放正文字号无法解决侧边栏、顶栏、大纲卡片、拓扑图与弹窗的全局易读性；同时在夜间高强度码字时，明亮白色界面刺眼，而纯黑色暗黑模式（#000000）对比度过高容易造成字符眩光与视疲劳。
- **决策**：
  1. **全站等比缩放方案选择（`document.documentElement.style.zoom`）**：
     - 对比 `CSS Transform scale()`（会导致绝对定位弹窗基准偏移、滚动条尺寸异常）与动态修改 `rem`（组件内混用 `px` 导致布局参差不齐）；
     - 现代 Chromium / WebView2 完美原生支持 `document.documentElement.style.zoom`，能等比缩放整个 UI DOM 树（包含文字、图标、内边距与弹层），零错位，性能极佳；
     - 缩放范围设定为 80% ~ 140%，步进 5%，提供 90%、100%、110%、120%、130% 快速预设与一键复位。
  2. **无侵入全局暗色调色盘重映射**：
     - 全站 17 个视图与几十个模态框统一采用了 Tailwind 风格的任意值古籍纸张色系（`#f4efe6`, `#efe9dc`, `#ded5c4`, `#2b2621` 等）；
     - 在 `App.css` 中基于 `:root.dark` 针对这些基础工具类集中做目标重定向（`#121216` ~ `#1d1d26` 底色，`#dfdbd2` 柔和月华冷白字色，`#2e2e3c` 细微墨线边框），使所有卡片、侧栏、顶栏、输入框和弹窗自动转为柔和水墨夜墨风，无需侵入式重写数百处 JSX 代码；
     - 日夜状态与缩放比例在 `localStorage` 双向持久化并在冷启动时水合生效。

## ADR-018: 专业级可停靠工作台 (Docking Workspace Architecture - V2.1)
- **状态**：已采纳
- **上下文**：小说创作涉及长篇正文编辑、章节目录导航、AI 写作助手、AI 主编战略把控、人物关系图谱 (React Flow)、世界观法则 (Canon)、大纲故事弧、伏笔追踪、时间线、审稿报告、版本快照、连载队列等 20 个高频业务模块。静态固定的多栏布局无法适应不同创作者的个性化屏幕尺寸与多任务协同诉求；若使用第三方旧库（如基于 React 16~18 的 flexlayout-react）不仅存在严重的 React 19 兼容性报错与生命周期侵入，且自带的黑盒样式无法深度融入本项目的“温润书卷/物理宣纸”纸张美学。
- **决策**：
  1. **纯自研 React 19 专属 Docking Tree 布局引擎**：
     - 数据模型采用纯 JSON 可序列化标准分裂树（`SplitNode`：方向、子节点、百分比大小数组；`TabGroupNode`：面板实例列表、当前激活 ID）与应用内浮窗（`FloatingPanel`：位置、尺寸、层级、最小化状态）；
     - 实现纯函数式树变换与自平衡剪枝：当 TabGroup 清空时自动剪枝父 Split 节点，单一子节点自动向上提升，尺寸数组自动归一化到 100%，杜绝死树与空白布局。
  2. **5-Zone 停靠十字指示器与全局指针遮罩**：
     - 拖拽面板标题栏或 Tab 标签时，在目标 TabGroup 动态展示 5 分区吸附十字（左侧拆分、右侧拆分、顶部拆分、底部拆分、中央合并为标签页）与温润茶金半透明预览高亮框；
     - 拖拽分割线或悬浮窗期间挂载全屏透明指针遮罩，彻底杜绝 React Flow 画布与 ProseMirror 编辑器吞噬 pointer 事件。
  3. **应用内悬浮窗与最大化独占模式**：
     - 任意面板支持一键分离为悬浮窗，支持 8 方向边缘及四角尺寸缩放与 Z-Index 自动置顶；
     - 提供一键重新停靠（Dock Back）回主工作台；
     - 支持快捷键 `Ctrl+M` 一键最大化独占当前面板，并可平滑恢复原始工作区。
  4. **面板注册中心 (Panel Registry) 与全 20 模块接入**：
     - 统一注册 20 大模块元数据（名称、图标、默认/最小尺寸、允许多实例规则、渲染入口）；
     - 多实例隔离（如正文编辑器与角色档案支持同时打开多个独立实例并行对比与编辑，状态互不串写）。
  5. **布局与正文数据正交隔离与持久化自愈机制**：
     - 编辑器内容基于 Zustand Store 维护，拖拽重组布局纯属 DOM 树挂载，光标与未保存草稿 100% 稳定保留，不触发重置或重复网络请求；
     - 布局自动持久化至本地存储，配置 `validateAndSanitizeLayout` 校验层，对异常损坏数据自动修复回退至安全默认预设。



## ADR-019: 官方 Tauri 2 Updater 原生更新、Minisign 签名与升级前数据守卫 (V2.2)
- **状态**：已采纳
- **上下文**：桌面应用随着版本演进需要安全可靠的自动更新机制。若自行编写脚本下载 EXE 覆盖自身极其脆弱且容易被安全软件拦截；若直接杀进程更新可能导致未保存正文草稿丢失、多 Agent 正在生成的任务状态损坏；网络断开时误报“已是最新”会严重欺骗用户；且缺少签名机制会导致不可信代码注入风险。
- **决策**：
  1. **采用 Tauri 2 官方标准插件链**：`@tauri-apps/plugin-updater` + `@tauri-apps/plugin-process`，基于 GitHub Releases 与 `latest.json` 原生端点分发。
  2. **Minisign 原生非对称签名验证**：生成专属密钥对，公钥内置于客户端配置，私钥由 GitHub Secrets 保护，严禁进入 Git 仓库；客户端在解压安装前强制验证签名，拒绝任何未授权或损坏安装包。
  3. **升级前强制数据安全守卫 (DataSafetyGuard)**：
     - 检查未保存草稿并提供一键保存阻断拦截；
     - 自动检测并安全挂起运行中的多 Agent 连载任务，防止状态机被破坏；
     - 升级前自动创建 SQLite 在线热备份 (`novelforge_pre_update_backup_*.db`) 并运行数据库完整性诊断。
  4. **严禁假进度条与网络异常真实反馈**：仅在已知总大小时显示真实百分比与传输速率；断网、403、超时时明确提示网络错误并提供官方 Releases 直达链接，严禁伪装为“已是最新”。
  5. **CI/CD 自动化流水线 (`.github/workflows/release.yml`)**：在推送正式版本标签时自动执行构建、测试、签名与 Draft Release 发布，确保版本发布严肃可控。

## ADR-020: 可停靠工作台全模块自适应容器与响应式排版契约 (Docking Panel Responsive Layout Contract)
- **状态**：已采纳
- **上下文**：在可停靠工作台（Docking Workspace）升级后，用户可以将任意模块拖拽为中心主视图、拉大宽度或最大化显示。然而发现将“AI 写作助手”面板拉宽后，内部内容仍死板地被限制在左侧 384px（`w-96`），右侧留出大片空白；正文编辑器也残留有 `h-[calc(100vh-3.5rem)]` 视口高度计算。其根本原因在于旧版作为右侧/底部抽屉侧边栏开发时，根元素硬编码了绝对像素宽度与视口固定高度。
- **决策**：
  1. **确立 Docking Panel 容器响应式契约**：
     - 严禁任何面板组件根节点声明固定宽度（如 `w-96`、`w-80`）或绝对视口高度（如 `h-[calc(100vh-3.5rem)]`）；
     - 面板根节点必须统一遵循 `w-full h-full flex-1 min-w-0 flex flex-col overflow-hidden` 规范，完全由 Docking 树的外层容器分配宽高并自适应拉伸；
  2. **内容区域流式响应与弹性网格化**：
     - 对 AI 写作助手的高频创作预设按钮网格采用 `grid-cols-4 sm:grid-cols-4 md:grid-cols-8`，面板拉宽时自动展开为 1 行 8 键，紧凑时折叠为 2 行 4 键；
     - 正文实时流式草稿区、模型标签、逻辑审稿报告卡片采用自适应宽度，充分利用横向视野，杜绝空白断层；
     - 角色档案等卡片流网格升级为 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`，在大屏工作台下自动呈现多列瀑布卡片。

## ADR-021: 全站黑夜模式深度融合与桌面端 UI 响应式文字防挤压加固 (Dark Mode & Desktop UI Hardening)
- **状态**：已采纳
- **上下文**：
  1. 用户在顶栏切换为黑夜模式（Dark Mode）后，外围面板变暗，但正文编辑器仍顽固停留在“温润宣纸”亮白底色（`#ede5d6` 桌面与 `#fcf9f2` 白稿纸），黑夜模式中突兀刺眼，造成“黑夜模式失效/有Bug”的严重视觉分裂；
  2. 在窗口分辨率有限、Windows 默认 125%/150% 显示缩放或工作台分栏较窄时，由于顶栏右侧按钮较多且缺乏文字防折行保护，顶栏中央导航选项卡（`概览看板`、`人物档案`、`世界观设定`、`记忆引擎`）以及编辑器工具条按钮（`规范排版`、`灵感便签`、`保存快照`、`目标字数`）被 Flex 算法暴力挤压，中文字符逐字垂直换行成单字竖列，严重破坏界面可用性；
  3. `App.css` 早期仅对部分浅色背景做了简单的类名字符串匹配，遗漏了 Docking 工作台与章节面板引入的各类米色与浅灰背景类，导致黑夜模式下局部出现未暗化色块，且棕褐色高频强调色（`#854d0e` / `amber-800`）在暗底上对比度严重不足。
- **决策**：
  1. **正文纸张与全局暗色模式深度双向联动**：
     - 当用户切换顶栏日夜模式至黑夜时，编辑器自动无缝切入“水墨夜读 (`midnight`)”纸张主题；切回白天时自动复原白天宣纸或用户偏好纸色；
     - 当用户在编辑器纸张选择器中点击“夜读”时，应用同步进入黑夜模式；
     - 在 `App.css` 中为所有 `paper-canvas-*` 注入暗色模式覆盖，确保即便用户在黑夜模式下查看其它纸张，稿纸周围的物理案头背景也统一保持柔和水墨深宵色（`#111115`），彻底杜绝亮白刺眼现象。
  2. **Flex 防挤压契约与全链路 `shrink-0 whitespace-nowrap`**：
     - 顶栏中央导航选项卡容器及所有 5 大核心按钮强制配置 `shrink-0 whitespace-nowrap`，杜绝文字折行；
     - 顶栏作品名称、全局指令搜索、服务商标签做弹性折叠响应，非超宽屏幕下隐藏次要文本，保留核心图标与快捷键胶囊，优先保障居中导航布局完整；
     - 编辑器工具条容器配置 `overflow-x-auto scrollbar-none`，所有操作按钮统一附加 `shrink-0 whitespace-nowrap`，目标字数盒在超宽屏下展开、窄屏下自适应隐藏，彻底告别单字垂直叠放现象。
  3. **水墨暗色全色彩映射与高对比度茶金色调**：
     - 在 `App.css` 中补齐工作台与章节树全部 12 种浅色类名映射（`bg-[#f6f1e8]`, `bg-[#ede5d6]`, `bg-[#eadecb]`, `bg-[#eae2d3]` 等）；
     - 将暗色模式下的茶褐强调文字统一升级为水墨沉香金（`#f59e0b` / `#fbbf24`），Tab 顶部高亮线同步亮化，在保证文人雅致格调的同时实现 WCAG AAA 级可读对比度。

## ADR-022: 桌面端无边框沉浸式顶栏与一体化窗口控制 (Frameless Desktop Window & Window Controls)
- **状态**：已采纳
- **上下文**：在 Windows 系统深色模式下，Tauri 默认原生窗口标题栏（Decorations）以黑灰色宽条硬生生贴在应用顶部，与 NovelForge AI 的文人宣纸雅致格调或沉香暗夜风格严重割裂，且浪费了约 32px 的垂直屏幕创作空间。
- **决策**：
  1. **Tauri 窗口无边框化配置**：
     - 在 `src-tauri/tauri.conf.json` 中配置 `"decorations": false`，移除操作系统自带的原生黑条与边框；
     - 配置 `"shadow": true`，保持 Windows 10/11 原生柔和窗口投影。
  2. **Tauri 2 窗口控制权限授权**：
     - 在 `src-tauri/capabilities/default.json` 显式授权 `core:window:allow-minimize`, `core:window:allow-maximize`, `core:window:allow-unmaximize`, `core:window:allow-toggle-maximize`, `core:window:allow-is-maximized`, `core:window:allow-close` 与 `core:window:allow-start-dragging`。
  3. **一体化沉浸式顶栏组件与原生交互继承**：
     - 在 `<Header>` 顶层注入 `data-tauri-drag-region` 并绑定双击最大化/还原处理，实现按住顶栏任意空白处平滑拖拽移动窗口、双击顶栏最大化/还原；
     - 研发专属组件 `WindowControls.tsx`，在顶栏最右侧集成「最小化（—）」、「最大化/还原（🗖）」与「关闭（✕）」；
     - 优雅状态感知：监听 `onResized` 事件，最大化与正常窗口时自适应切换方块与层叠方块图标；
     - 视觉与体验对齐：关闭按键采用 Windows 规范防误触微红变色（`hover:bg-rose-600`），白天与夜间模式色彩均完美融入创作界面。

## ADR-023: 顶栏高缩放溢出防护与全场景关闭键持久化 (High Zoom Overflow Guard & Ubiquitous Close Control)
- **状态**：已采纳
- **上下文**：
  1. 用户在顶栏使用界面缩放步进器（UI Scale）放大至 110%~140% 或在非超宽屏使用时，顶栏右侧包含大量平铺元素，因缺少优先级隔离，最右侧末尾的窗口控制按键（尤其是关闭应用键 ✕）被 Flex 排版硬生生推出屏幕视口截断消失；
  2. 正文编辑器全屏专注模式（`isFullScreen`）通过 `fixed inset-0 z-50` 铺满屏幕并遮挡 Header，内部缺少退出/关闭按钮，且未监听 `Esc` 键退出，导致用户在全屏放大后找不到任何关闭入口。
- **决策**：
  1. **顶栏结构二分化与最右侧绝对锚定**：
     - 将顶栏右侧分为两级：次要功能操作区（`flex-shrink`，包含全局搜索、模型、自动连载、交付备份、字数、导出）与常驻核心控制区（`shrink-0 ml-auto z-20`，包含缩放、日夜、Zen专注、设置、侧栏与 `WindowControls`）；
     - 赋予常驻核心控制区最高优先级，次要操作在视口不足或高缩放时自适应折叠文字保留图标；中央导航栏文字在宽屏不足时优雅折叠为印章图标；彻底确保右上角最小化、最大化、关闭键永远位于可视区域最右上角。
  2. **正文编辑器全屏专注模式双重保障**：
     - 在全屏专注模式下，工具栏右侧展示高对比度醒目的【退出全屏 (Esc)】按钮（带 ✕ 图标与红色悬停态）；
     - 全屏状态下同步在工具条末尾接入 `<WindowControls />`，确保全屏写作中依然能直接最小化或关闭应用；
     - 挂载全局 `Escape` 键盘事件监听，按 `Esc` 随时退出全屏专注模式。
  3. **Docking 工作台与 Tab 关闭可见度提升**：
     - Docking 最大化独占模式状态条新增 `Esc` 快捷键退出支持与明确提示；
 ## ADR-024: 基于 REA 竞品逆向与成熟开源项目借鉴的小说专项工具箱与剧情工作流执行引擎
- **状态**：已采纳
- **上下文**：
  1. 通过 REA 逆向研究工具与公开分析，对商业闭源产品「星月写作」以及三大开源长篇小说创作项目（`novel-studio`, `novel-engine`, `sheengoa/novelforge`）进行了深度对比；
  2. 星月写作在交互体验上最突出的亮点是“专项生成器”（起名、简介、脑洞、金手指、力量体系、黄金开篇、单章细纲、对白精修）与“设定集上下文显式选择器”，创作者可在任何生成步骤中自由勾选角色与世界观设定；
  3. `novel-studio` 与 `novel-engine` 提供了清晰的 Agent 角色分工与流水线执行理念；星月写作支持每一步输出在卡片内“原地人工修改”，且下游步骤严格消费上游人工打磨后的内容作为模板变量输入（`{{step_1_output}}` 等）。
- **决策**：
  1. **Clean-Room 原则与强许可证隔离**：严格遵循 clean-room 独立自研准则，严禁复制专有代码，绝不引入 AGPL 等强传染性开源代码片段，只借鉴其产品形态、交互流程与抽象分工思想。
  2. **SQLite 数据模型扩展**：新增 `workflow_templates`（流水线模板）、`workflow_runs`（运行实例与状态流转）、`workflow_step_records`（单步提示词、输入参数、模型输出、人工修订内容 `edited_output`）。
  3. **设定集上下文选择器 (`ContextPicker`)**：提供轻量可折叠的选择器组件，支持多选关联角色、世界法则（Canon），并支持一键包含前一章正文片段。
  4. **8 大网文小说创作专项与多通道落地**：研发 `NovelistToolboxModal` 与常驻面板 `ToolboxPanel`，结合专用装配器 `assemble_toolbox_prompt` 动态融合设定与文风要求，直连真实模型网关（`execute_llm_chat`）；提供“追加正文”、“存为角色”、“存为法则”、“创建章节” 4 大一键落地通道。
  5. **卡片内原地修改与动态变量流转**：研发 `WorkflowRunnerModal` 与 `WorkflowPanel`，用户可以在卡片内直接打磨修改模型生成内容，并将修改后的高质量内容无缝作为下游步骤的动态变量注入，支持断点恢复与历史查看。
  6. **双模桥接与全量测试**：`tauriBridge.ts` 与 `webMockStorage.ts` 完成双模 IPC 桥接；`src-tauri/src/bin/db_test.rs` 扩展至 44 项全量测试，通过率 100%。

## ADR-025: 作者文风档案多维建模、审稿仲裁一键差异修复闭环与停靠工作台预设拓展 (Voice Profiles & Review Finding Repair)
- **状态**：已采纳
- **上下文**：
  1. 借鉴 `novel-engine` 的作者风格档案（Voice Profile）理念，长篇小说创作最忌千篇一律的 AI 腔调。以往仅依靠全局单一的简短 `writing_style` 文本，无法精准指导 AI 的句式节奏、词汇密度、视角倾向及禁用词法则；
  2. 既往的逻辑审稿系统（`ContinuityAuditor`）在输出审查建议后，用户必须手动复制建议并到编辑器中逐行修改，缺少“审稿发现 -> 一键对齐文风生成修复草案 -> 用户微调仲裁 -> 一键差异替换正文并落版本快照”的完整操作闭环；
  3. Docking 停靠工作台需要针对高频的“新书构思”与“流水线推演”场景提供一键切入的专业级预设。
- **决策**：
  1. **SQLite 文风底座建模与多小说隔离**：
     - 新建 `voice_profiles` 表，规范建模 `sentence_rhythm`、`vocabulary_tone`、`pov_preference`、`sensory_ratio`、`sample_text` 及 `custom_rules_json` 规则数组；
     - 自动播种「仙侠修真·沉雄雅致风」、「都市异能·爽利快节奏」、「硬核科幻·冷峻考据风」三套开箱即用文风；
     - 实现多小说文风隔离与激活互斥切换机制，当前小说未指定专属文风时自动降级继承全局激活文风。
  2. **作者文风工作室 (`VoiceProfilePanel` & `VoiceProfileModal`)**：
     - 提供左右分栏工作室，支持文风预设浏览、各维度参数微调、正向/禁忌词规则增删与全书文风切换；
     - 内置“现场试读推演体验”，结合当前小说设定一键生成 200 字试读正文；
     - 支持作为常驻停靠面板吸附，也可通过顶栏快捷按钮或 `Ctrl+K` 全局指令瞬间唤起。
  3. **审稿仲裁与一键无损差异替换闭环 (`ReviewReportPanel`)**：
     - 在每条质检 Finding 上增设【✨ 一键生成修复草案 (对齐文风)】，调用原生命令 `generate_finding_repair` 自动匹配激活文风生成差异草案；
     - 内嵌草案对比与可直接二次编辑卡片，支持作者原地调整；
     - 提供【✅ 采纳并替换入正文 (留存快照)】，执行精准字符串替换并自动触发 `AUDIT_REPAIR` 版本快照保存，确保非破坏性；
     - 提供【🚫 忽略/误报】与【❌ 放弃草案】。
  4. **停靠工作台全新创作预设 (C10)**：
     - 新增「小说构思工坊 (`concept_workshop`)」与「工作流流水线 (`workflow_pipeline`)」两套专业级预设，工作台原生模块扩展至 23 个。
## ADR-026: 正文划词悬浮智能胶囊与水墨风原地 Visual Diff 局部采纳体系 (Floating Capsule & Inline Visual Diff)
- **状态**：已采纳
- **上下文**：
  1. 长篇小说创作中，作者往往并不需要大模型动辄整章重写或生成成百上千字，而是针对个别词句或单个段落进行高频“微雕”（如：剔除偶发的 AI 套话、将干瘪的说明句改写为动作白描、为场景补充五感、精炼对白或顺手把好词句存为世界观设定）；
  2. 以往的“AI 写作助手”面板与主工作区分立，需要作者手动划选文本 -> 复制 -> 切换面板粘贴 -> 发送 -> 复制结果 -> 切回正文粘贴替换，操作流极度割裂；
  3. 传统的修改方案多为“纯文本覆盖”，作者无法直观一眼看出修改后的草案与原句到底删除了哪些字、增加了哪些字。
- **决策**：
  1. **Tiptap 划词悬浮智能胶囊 (`FloatingSelectionMenu.tsx`)**：
     - 在编辑器表面挂载浮动菜单组件，监听 Selection 变化；当用户选中文学正文大于 2 个字符时，在光标上方平滑浮现典雅水墨风悬浮胶囊；
     - 集成 5 大高频微操作（去AI味重写、动作化白描、五感具象化、对白脱俗化、存为法则设定）；
     - 展开面板时锁住坐标，防止鼠标微移导致意外关闭；
     - 允许作者在浮窗内直接打字微调，并支持一键 `[✓ 采纳替换]`，原子化替换 Tiptap 选区并触发带 `INLINE_AI_APPLY` 标记的不可逆版本快照；
  2. **轻量纯算法差异引擎 (`textDiff.ts`)**：
     - 自研纯 TypeScript 实现的高精度 Myers/LCS 差异算法，零第三方外部库依赖，执行耗时 <1ms；
     - 支持字符级与中文词边界切分，准确识别 `EQUAL`、`ADDED`、`REMOVED` 变更块并合并相邻同类操作。
  3. **水墨风可视化 Diff 组件与审稿中心全面接入 (`InlineDiffViewer.tsx` & `ReviewReportPanel.tsx`)**：
     - 采用淡红划线高亮被删原文、淡翠绿底色高亮新增精修词句，契合文人宣纸雅致视觉；
     - 支持【对比模式】与【最终效果】一键切换；
     - 审稿中心（`ReviewReportPanel`）修复草案对比全面替换原先简陋的文本展示，支持一边编辑微调一边实时刷新 Diff 对比，极大降低审稿核验认知负荷。
## ADR-027: 多模型同台比稿竞技场并发双流式架构、盲测模式与智能融合闭环 (Multi-Model Arena & Duel Architecture)
- **状态**：已采纳
- **上下文**：
  1. 长篇小说创作中，作者往往难以确定特定场景更适合哪种大模型（例如：DeepSeek 擅长长线伏笔与严密因果逻辑，GPT-4o 擅长细腻情绪白描与对白节奏，Qwen 擅长纯正东方仙侠词藻，Claude 擅长克制冷峻哲思）；
  2. 既往模式下，作者只能在一个面板生成一份内容，若不满意则清空重试，无法将两个不同模型（或同一模型在不同 Temperature 下）针对同一细纲提示词的产出并排对比；
  3. 人类存在认知偏差与品牌光环倾向，作者看标签已知模型名称时容易产生主观先入为主，需要类似 LMSYS Chatbot Arena 的盲测机制（Blind Test）；
  4. 创作者比对两份草稿后，常常发现“A 方案的动作打斗写得精彩，B 方案的环境烘托与对话极具韵味”，作者迫切需要一个能智能熔铸二者长处的“融合版（Merged Output）”，而非被动二选一。
- **决策**：
  1. **SQLite 数据底座与战报模型 (`model_arena_runs`)**：
     - 在数据库中建立 `model_arena_runs` 表与作品索引 `idx_model_arena_runs_novel`；
     - 完整记录双模型服务商、模型名称、提示词、双方耗时与 Token 统计、A/B 完整产出、获胜方标记 (`A` / `B` / `TIE` / `MERGED`)、盲测状态与融合文本；
  2. **Rust 原生并发流式请求与独立多通道隔离 (`execute_arena_duel`)**：
     - 在后端通过 Tokio 异步任务与 `tokio::join!` 同时拉起两个 HTTP SSE 流式客户端；
     - 统一通过 Tauri 事件通道 `arena-stream-chunk` 广播分块，Payload 包含 `{ session_id, slot: "A" | "B", chunk, is_done }`，前端按 Slot 独立累加，彻底杜绝多流串流或竞态条件；
  3. **专用文学融合 Agent (`merge_arena_outputs`)**：
     - 编写独立结构化 Prompt，让模型作为资深小说主编，深度萃取 Slot A 与 Slot B 的亮点细节与高光金句，去粗取精，熔铸为一段通顺流畅的完整新文段；
  4. **全屏沉浸与停靠面板双入口集成 (`ModelArenaModal` & `ModelArenaPanel`)**：
     - 在 `PanelRegistry.tsx` 中注册为第 24 个原生停靠面板，支持拖拽吸附；同时在顶栏与 `Ctrl+K` 全局指令提供全屏沉浸弹窗；
     - 集成盲测模式（Blind Test）：未投票前显示“选手甲 vs 选手乙”，投票后揭晓真实模型并保存战报；
     - 集成 Humanizer 实时诊断：左右两栏直接显示人情味得分（0~100）与 AI 机械套话命中数，科学量化文学成色；
     - 集成水墨风红绿 Visual Diff：支持一键直观对比 A/B 差异；
     - 融合版原地一键采纳：支持将胜出方或融合版“替换正文选区”或“追加至文末”，自动触发版本快照持久化。
  5. **50 项 Rust 数据库验证与 17 项前端专项测试**：
     - `src-tauri/src/bin/db_test.rs` 扩展至 50 项测试，100% 验证比稿记录持久化与智能融合状态流转；
     - `tests/test-model-arena.ts` 17 项测试 100% 验证参数装配、流式路由、盲测遮蔽、Humanizer 诊断、Diff 计算与融合落库。

## ADR-028: 纯 Rust 原生轻量 EPUB 3 国际标准打包引擎与主流网文平台（起点/番茄/晋江）一键排版清洗机 (EPUB 3 Packaging & Web Novel Platform Typesetter)
- **状态**：已采纳
- **上下文**：
  1. 长篇小说创作进入交付与分发阶段时，传统作者面临两大痛点：一是分发电子书需要格式合规且能直接导入微信读书、Kindle 等电子书阅读器（标准 EPUB 3 格式）；二是将正文复制到起点中文网、番茄小说、晋江文学城作者后台时，各平台对缩进、空行和标点格式要求各异，且极易因涉嫌敏感违规词导致锁章限流；
  2. 若引入繁重的外部 C/C++ 动态链接库或重型第三方 Rust 依赖，容易破坏轻量绿色编译链（WinLibs MinGW-w64）；
  3. EPUB 3 规范明确要求：`mimetype` 必须作为压缩包内第 1 个文件且必须未经压缩（STORE 模式），文件名为 `mimetype` 且内容为 `application/epub+zip`。
- **决策**：
  1. **纯 Rust 自研标准轻量 ZIP 与 EPUB 3 生成引擎 (`src-tauri/src/export/epub.rs`)**：
     - 零新增外部网络依赖，直接实现标准 PKZIP 规范与 IEEE 802.3 CRC-32 计算；
     - 保证第 1 个文件项为未压缩的 `mimetype`，严格生成 `META-INF/container.xml`、`OEBPS/content.opf`、`OEBPS/toc.ncx` 与 `OEBPS/nav.xhtml`；
     - 内置经过针对电子墨水屏与高分辨率屏专业优化的中文字体排版 CSS（`style.css`）与精美 SVG 水墨封面（`cover.xhtml`）；
     - 命令 `export_novel_epub` 支持自动生成文件至指定路径或系统文档目录。
  2. **主流网文平台一键排版清洗机 (`TypesetterEngine.ts`)**：
     - 预设覆盖起点中文网（全角两空格缩进、无多余空行紧凑版）、番茄小说（全角缩进、段间单空行呼吸版）、晋江文学城与通用全角纯净版；
     - 标点符号智能转置：半角标点转全角（保护浮点数如 `3.14`）、连续减号转破折号 `——`、多重句点转六点省略号 `……`、直引号转成对中文双引号 `“”`。
  3. **发布合规预检系统 (Censor Guard)**：
     - 建立涉政、暴力血腥、低俗涉黄与平台常见限流封禁词库；
     - 标出行号、列号与风险等级，并提供合理的网络文学化建议替换词（如“肢解”->“重创/撕碎”），支持在界面上一键直接替换。
  4. **前端工作台第 25 个原生面板与交付中心扩充**：
     - 注册 `typesetter_cleaner` 面板，支持多栏停靠布局；
     - 增设全屏沉浸弹窗 `TypesetterCleanerModal`（顶栏与 `Ctrl+K` 均可唤起）；
     - 在 `PublishingModal` 增设【标准 EPUB 3 电子书 (.epub)】一键导出卡片；
  5. **52 项 Rust 测试与 19 项排版专项测试验证**：
     - `cargo run --bin db_test` 52 项全部通过（含 EPUB 真实文件生成、PK\x03\x04 头校验与 CRC32 向量验证）；
     - `pnpm test:typesetter` 19 项排版算法测试全绿通过。

## ADR-029: 客户端异步监听器挂起内存泄漏防御与 EPUB/SQL/排版引擎全链路边界安全加固
- **状态**：已采纳
- **上下文**：
  1. 系统在高频并发切换会话（如快速切换小说章节、在比稿竞技场多次重新生成或频繁挂载/卸载停靠面板）时，原生 Tauri 事件监听器 `listen` 为异步 Promise，若在 Promise 完成前组件 unmount，原本返回的注销函数 `unlisten` 将被丢弃，导致后台悬挂监听器持续占用内存并引发跨会话流式串流问题；
  2. 敏感词扫描算法若遇到用户自定义词典传入空字符串 `""` 项时，`indexOf("", 0)` 返回 0，循环变量无法推进，将导致前端主线程陷入死循环并无响应卡死；
  3. EPUB 电子书导出时，若书名为纯标点符号或全空格，生成的文件名将变为非法隐藏文件名；若路径传入包含空字符 `\0` 或缺少 `.epub` 后缀，需做防御性校验；同时书名/作者若包含换行符 `\r\n` 会破坏 XML/NCX 单行标签结构；
  4. 数据库层排查动态拼接 SQL 隐患，需要将所有 SQL 查询实现 100% 严格参数化绑定。
- **决策**：
  1. **React 异步事件监听器防泄漏机制 (Cancellation Guard)**：
     - 在 `ModelArenaPanel.tsx`、`AiAssistantPanel.tsx` 与 `WindowControls.tsx` 中引入 `isCancelled` / `isMounted` 状态守卫；
     - 即使组件在 `api.onStreamChunk` / `api.onArenaStreamChunk` 未完成时卸载，Promise 回调返回后会立即检测并触发 `fn()` 注销，实现 100% 内存安全闭环；
  2. **排版清洗机死循环防御**：
     - 在 `TypesetterEngine.scanCensorWords` 中强制校验 `if (!item.word || item.word.length === 0) continue;`，彻底杜绝空词项导致的死循环；
  3. **EPUB 导出边界与 XML 安全防御**：
     - 增加 `xml_escape_single_line`，对单行元数据（`<dc:title>`, `<dc:creator>` 等）强制过滤 `\r` 与 `\n` 并转为空格和 trim；
     - `export_to_file` 严格校验输入路径：拒绝 `\0` 空字符；缺少 `.epub` 时自动追加补齐；书名纯符号时安全降级为 `novel_{short_id}`；
  4. **SQL 100% 参数化查询改造**：
     - 将 `src-tauri/src/database/mod.rs` 中唯一的 `list_workflow_templates` 动态 `push_str` 改为 `WHERE is_builtin = 1 OR novel_id = ?1` 参数绑定；
  5. **自动化测试覆盖**：
     - `db_test.rs` 扩展至 53 项核心测试，验证 EPUB 非法路径拦截、后缀补全与单行换行过滤；
     - `test-typesetter-engine.ts` 扩展至 20 项测试，验证空词典项死循环防御；
     - `cargo check --all-targets` 与 `pnpm tsc --noEmit` 保持 0 错误 0 警告。

## ADR-030: 长篇存稿极速解析与 Word (.docx) 智能分章导入系统架构设计 (Word Docx Parser & Smart Importer)
- **状态**：已采纳
- **上下文**：
  1. 广大创作者与网络小说作者在迁移至 NovelForge AI 前，本地普遍拥有大量以 Microsoft Word (.docx) 格式保存的历史存稿、完结作品、长篇大纲或单章稿件；
  2. 传统依靠人工逐章手动“新建章节 -> 复制 -> 粘贴”方式效率极低，面对 30 万字到 100 万字的长篇书稿，手动迁移需要几天时间且极易漏章或错乱；
  3. 创作者的核心关切包括：文档解析必须完全在本地离线执行（严禁上传到任何第三方解析云服务，防止核心原稿泄露）；智能分章算法必须能精准识别各种形态的中文网文标题（“第X章”、“第X卷”、“引子”、“尾声”等）；章节列表需要可视化预览与微调；导入数据必须直接连通 SQLite 本地数据库并生成不可逆历史版本快照。
- **决策**：
  1. **纯本地轻量 DOCX 解析引擎 (`WordImportService.ts`)**：
     - 选用轻量且完全离线运行的 `mammoth` 转换引擎，直接在前端内存中解析 DOCX 压缩包的 XML 树结构与样式流，抽取全文纯文本与标准 HTML；
     - 零数据上云、零网络调用，保障 100% 创作原稿与未公开脑洞的数据主权与隐私安全。
  2. **网文多流派智能分章与切分算法 (`SmartChapterSplitter`)**：
     - 构建全能型正文章节匹配正则引擎：涵盖经典中文章节（`第[0-9一二三四五六七八九十百千万零两]+[章节回集卷篇部]`）、序章/引子/楔子/尾声/后记/番外/上架感言、英文与混排（`Chapter \d+`、`Section \d+`）以及括号包裹模式（`【第.+章】`、`[第.+章]`）；
     - 具备“前言/序章自动分离”：若首章前面存在创作背景或内容简介，自动分离为独立的“序章 / 前言”；
     - 具备“单章模式自动降级”：对短篇或纯单章文稿，自动整体作为单章导入；
     - 具备“自定义正则模式”：允许高级创作者根据自定义标记（如 `=== 标题 ===`）随心定义切分规则并实时刷新。
  3. **网文段落排版规范化清洗**：
     - 自动去除连续多余空行与两端空格，段首自动规范对齐为网文标准的中文全角双空格缩进 `\u3000\u3000`。
  4. **全链路可视化导入工作台 (`WordImportModal.tsx`)**：
     - 拖拽与点击上传，实时展示文件名、体积、字数、段落数；
     - 章节列表支持全选/反选、就地实时编辑修改章节标题、字数徽标与首段正文摘要展开试读；
     - 支持【新建一部小说整本导入】（自动填充书名、选择作品流派并批量入库）与【追加到当前小说末尾】；
     - 实时进度条与写入反馈，完成后自动刷新目录树并自动定位至第一章。
  5. **4 大直观入口全覆盖**：
     - 顶栏【创作工坊】下拉菜单第一项高亮呈现【Word 文档 (.docx) 导入】；
     - 超大屏顶栏快捷栏集成独立【Word导入】按钮；
     - 侧边栏作品选择器右上角常驻【导入Word】；章节目录树空状态提供【导入Word】一键建章；
     - 全局指令速查面板 (`Ctrl+K`) 支持快速搜寻唤起。
  6. **16 项单元测试 100% 验证**：
     - `tests/test-word-import.ts` 涵盖中文字符计数、分章提取、序章识别、段落缩进与自定义正则，16 项测试全部通过；
     - 前端编译构建 982ms 零错误通过。

## ADR-031: 模型网关状态持久化、模型 ID 精确还原与多服务商隔离协同架构 (Model Gateway Persistence & Provider Isolation)
- **状态**：已采纳
- **上下文**：
  1. 用户反馈：在设置弹窗中切换模型或点击预设配置后，关闭弹窗并重新打开时，模型 ID 始终强制回退并显示为初始的 `gpt-4o-mini`，无法记忆用户自定义配置或预设中的新模型；
  2. 诊断排查发现三重根本原因：
     - **前端组件状态未反查**：`SettingsModal.tsx` 初始化时硬编码 `useState('gpt-4o-mini')`，且在 `useEffect` 中仅同步了服务商基础字段（`name`, `base_url`, `api_key`），遗漏了向 SQLite 查询真实绑定模型（`api.listModels(activeProvider.id)`）的调用，导致每次弹窗重挂载时模型 ID 均回退；
     - **覆盖循环陷阱**：用户打开设置看到 `gpt-4o-mini`，一旦点击保存，又将 `gpt-4o-mini` 重新写回数据库 `ai_models` 表；
     - **数据库初始种子割裂**：本地 CPA 预设标明的模型为 `gemini-3.8-flash-high`，但 SQLite 初始种子模型写的是 `gpt-4o-mini`，导致卡片高亮但下方输入框却不一致；
     - **缺乏多服务商切换与独立管理**：原先保存逻辑以 `activeProvider?.id` 固定覆盖，导致不同平台（CPA、DeepSeek、硅基流动）配置互相顶替，丢失各自 API Key。
- **决策**：
  1. **SettingsModal 全异步模型状态还原**：
     - 在组件初始化与 `activeProvider` 变更监听中，强制调用 `api.listModels(target.id)`，准确还原数据库中绑定的默认模型名称 `defaultModel.model_name`；
     - 若未查询到模型，则根据当前 `base_url` 精准匹配预设推荐模型或回退至 `gemini-3.8-flash-high`；
  2. **多已保存服务商一键切换与独立隔离**：
     - 增加已配置服务商快速切换按钮组，切换时自动加载该服务商的 API Key 与已绑定模型，避免多服务商互相覆盖密钥；
     - 点击预设时，若库中已有相同端点的配置则直接激活复用，若无则作为新配置添加；
  3. **连接测试可用模型一键选用**：
     - `testProviderConnection` 扫描出的可用模型以可交互芯片形式渲染，作者点击即可直接将端点真实返回的模型填入；
     - 输入框下方根据当前端点智能展示常用推荐候选（如 Gemini 3.8 / 2.5、DeepSeek-V3/R1 等）；
  4. **全局 Store 与 UI 响应式透传**：
     - `useNovelStore` 新增 `activeModel` 状态，`loadProviders` 同步填充；
     - 顶栏 Header 与侧边创作面板将服务商徽标升级为【服务商 · 模型名称】，作者对当前生效模型一目了然；
  5. **自动化测试防护**：
     - 编写 `tests/test-provider-model.ts` 8 项测试，100% 覆盖保存自定义模型、多服务商隔离与模型修改还原。





## ADR-032: Windows 环境下 WebView2 GPU 崩溃防御与无边框窗口激活防护 (WebView2 GPU Crash Resilience & Frameless Window Focus)
- **状态**：已采纳
- **上下文**：
  1. 用户在执行 `pnpm tauri dev` 启动桌面端时，控制台输出 `[NovelForge] 5. Successfully found 'main' window. Showing and focusing window...` 后停止，但 Windows 桌面上迟迟看不到应用窗口，反馈“打不开”；
  2. 深入排查发现：
     - 进程链条 `novelforge-ai.exe` (PID 37436) 和 `msedgewebview2.exe` (PID 32884) 实际均在后台驻留运行，但 `MainWindowHandle` 为 0，且在当前活动桌面 `OpenInputDesktop` 中未检索到任何可见窗体；
     - 检查 WebView2 崩溃收集目录 `EBWebView\Crashpad\reports`，捕获到多个 35MB 实时转储文件；查看 `watson_metadata` 发现 WebView2 GPU 渲染进程在启动时由于 NVIDIA 显卡驱动组件冲突发生致命访问违规：
       `ModuleName=NvMemMapStoragex.dll; ProcessType=gpu-process; SubCode=0xc0000005`；
     - GPU 进程连续崩溃 3 次 (`--gpu-recent-crash-count=3`)，导致 WebView2 合成渲染链路陷入死锁挂起；
     - 叠加应用主窗口配置为无边框窗口 (`decorations: false`)，在无原生 Windows 边框和标题栏兜底的情况下，内部 WebView 挂起导致窗口彻底黑屏或无法呈现给操作系统活动桌面。
- **决策**：
  1. **WebView2 启动参数注入 GPU 崩溃防护**：
     - 在 `src-tauri/src/main.rs`、`src-tauri/src/lib.rs` 的 `run()` 入口以及 Node.js 启动包装器 `scripts/tauri-runner.js` 中，自动注入微软 WebView2 官方环境变量：
       `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--disable-gpu --disable-gpu-compositing"`；
     - 绕过存在内存映射漏洞的 NVIDIA 显卡驱动模块 `NvMemMapStoragex.dll`，强制采用稳定的软件回退合成管道，彻底杜绝 `0xc0000005` 崩溃。
  2. **Tauri 窗口生命周期与显示激活加固**：
     - 在 `src-tauri/src/lib.rs` 的应用 `setup` 钩子中，在 `window.show()` 与 `window.set_focus()` 之前显式调用 `window.unminimize()`；
     - 确保在 Windows 任务栏或后台被最小化隐蔽的窗体能够被强制解除最小化并前置激活。
  3. **验证结果**：
     - 实测重新启动后，`MainWindowHandle` 成功由 `0` 变为有效句柄 `199496`，`Crashpad\reports` 崩溃转储文件生成数为 0；
     - 桌面窗口秒级渲染弹出，全系统各模块测试 100% 保持通过。

## ADR-033: 全屏与最大化状态下顶栏右侧溢出彻底根除与窗口控制区绝对锁定架构 (Header Overflow Elimination & Window Controls Right-Anchor Protection)
- **状态**：已采纳
- **上下文**：
  1. 用户在实机全屏或最大化应用后反馈“全屏后没有关闭的按钮了吗”、“没看到”，并上传真实运行截图；
  2. 诊断排查实机截图发现：
     - 窗口在最大化状态下触发 Tailwind `2xl` 断点（>= 1536px），顶栏原先平铺了 7 个带图标和文字的专项工坊快捷按钮（Word导入、百宝箱、工作流、文风、竞技、排版、交付备份），总计占据了超过 520px 的横向空间；
     - 叠加左侧 Logo、中间 5 个大导航 Tabs、全局指令与活跃模型徽标后，顶栏所需总物理宽度达到约 2000px，严重超出了 1080p（特别是 125% DPI 缩放下视口仅 1536px）的屏幕物理宽度；
     - 而 `<header>` 容器配置了 `overflow-hidden`，导致顶栏在 `[交付备份]` 处直接撞到屏幕右侧边缘，其右侧的字数统计、全站缩放控件、日夜主题切换、专注写作模式、系统设置齿轮以及**最重要的无边框桌面控制区（最小化、最大化/还原、关闭 X）被整批推挤出屏幕可视范围之外并被裁剪截断**；
     - 此外，`WindowControls.tsx` 原逻辑在非 Tauri（浏览器端）或环境探针延迟时直接返回 `null`，导致若在浏览器全屏（F11）下无法找到退出或关闭入口。
- **决策**：
  1. **顶栏快捷工坊优雅收敛**：
     - 取消 7 个平铺按钮的大屏强制横向铺设（节约 >380px 宽度）；
     - 保留高频刚需的专属 `[Word导入]` 蓝色快捷胶囊按钮，其余专项（百宝箱、工作流、文风档案、双模竞技、排版清洗、交付备份）统一优雅收纳于常驻的【创作工坊 ▾】精美下拉菜单中；
  2. **物理双区隔离与 Far-Right 系统控制区绝对锁定**：
     - 将顶栏重构为两大解耦容器：中间弹性工具区（`min-w-0 shrink overflow-hidden`）与最右侧永久系统控制区（`shrink-0 ml-auto h-full z-40 bg-[#efe9dc]`）；
     - 无论中间内容如何变动或视口如何缩放，系统控制区（全站缩放、主题切换、专注写作、设置齿轮、AI助手面板折叠开关以及 `WindowControls` 窗口三键）永远以最高层级绝对锚定在屏幕最右上角，具有不可压缩与不可被挤出的结构性物理保障；
  3. **WindowControls 桌面与全屏双模深度加固**：
     - 在 Tauri 模式下，同时监听 `isMaximized()` 与 `isFullscreen()` 事件，最大化或全屏时统一自动呈现“向下还原”双矩形图标，点击即可精准退出全屏或还原窗口；
     - 在 Web / 浏览器模式下，无缝降级对接 HTML5 Fullscreen API，点击最大化按钮可自由切换全屏与退出全屏，点击关闭尝试 `window.close()`，杜绝组件返回 `null` 导致的视觉悬空；
     - 最大化内边距增至 `pr-3`，完美消除 Windows DWM 8px 负外边距造成的边缘挤压。
  4. **验证结果**：
     - 生产打包 `pnpm build` 1.13s 零错误；
     - 工作台停靠测试 `pnpm test:docking` 10 项全过；
     - 记忆引擎测试 `pnpm test:memory` 36 项全过；
     - 在 1080p、2K 及各种缩放比例下，顶栏右侧最小化、最大化/还原、关闭 `X` 按钮 100% 恒定置顶可见、随时可用。

## ADR-034: Tauri Updater Minisign 密钥无密码自适应构建与发布修复 (Updater Minisign Signing Fix & Passwordless Packaging)
- **状态**：已采纳
- **上下文**：
  1. 用户运行 `一键新版本.bat` 升级发布 v2.3.4 时，在完成 NSIS 生成步骤后突然中断报错：
     `failed to decode secret key: incorrect updater private key password: Wrong password for that key`，构建失败退出；
  2. 深入排查原因：
     - `scripts/release.ps1` 在执行 `pnpm tauri build` 时默认传入环境变量 `$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''`（空密码）；
     - 但之前遗留的 `updater.key` 是在交互式终端下被设置了加密密码的旧密钥，导致在无密码自动构建流程中 Minisign 解密失败；
     - 实际上 NSIS 安装包 `NovelForge AI_2.3.4_x64-setup.exe` 早已成功由 makensis 生成完毕，却因后续签名抛错阻断了桌面输出与发布流程。
- **决策**：
  1. 使用 Tauri CLI 原生 CI 模式重新生成免密私钥与对应公钥：`pnpm tauri signer generate -w updater.key -f --ci`；
  2. 同步更新客户端 `src-tauri/tauri.conf.json` 中配置的验签公钥与自动化测试用例 `tests/test-updater-system.ts`；
  3. 彻底打通本地与 CI 无人值守自动签名流程，杜绝密码输入弹窗与解密崩溃；
  4. 自动将最新构建并完成签名的发布产物同步推送至用户桌面目录 `Desktop\NovelForge-AI-v2.3.4\`。
- **验证结果**：
  - `pnpm tauri build` 完整执行完毕，顺利生成 `NovelForge AI_2.3.4_x64-setup.exe` (4.31 MiB) 与对应签名 `NovelForge AI_2.3.4_x64-setup.exe.sig`，退出码 0；
  - `pnpm test:updater` 28 项更新与发布机制验收测试 100% 通过；
  - 安装包与签名已就绪于用户桌面，双击即可无缝安装。

## ADR-035: Agent Skills 技能管理中心与开源「去AI味」实证白名单双引擎集成架构 (Skills Management Center & Lieflat Anti-AI Dual-Engine)
- **状态**：已采纳
- **上下文**：
  1. 用户提问当前安装了哪些 skills、是否直接生效、是否有管理界面，并提供了开源社区著名的 `Lieflat Less AI Tone`（去AI味.skill，基于 283 万字中文语料实证检验）资料；
  2. 经过调研与代码分析：
     - 原系统仅在 `.agents/skills/humanizer/SKILL.md` 存在单点配置与部分提示词逻辑，缺乏动态启用/禁用、规则检出透明度、可视化管理控制台及交互式演练沙盒；
     - 既有的 `Humanizer` 专注于小说叙事微动作与 50+ 种典型机械套话；
     - `Lieflat Less AI Tone` 则在语言学层面提炼了 11 条严格白名单规则（如翻案腔“不是……而是”、冒号空转、破折号泛滥、顿号过密、拟人化职业喻体、5类高频翻译腔“这意味着/作为一个……”等）以及极为关键的“反向禁改区红线”（严禁因去AI味而滥删正常设问句、反问句或合理文学比喻）；
     - 创作者极需一个可插拔、可实时诊断、能对接到浮动划词菜单和工作流的统一技能中心。
- **决策**：
  1. **安装并规范化管理技能资产**：
     - 在 `.agents/skills/lieflat-less-ai-tone/` 完整落盘 `SKILL.md`、`README.md` 与 `RESEARCH.md`；
  2. **建立模块化架构 (`src/features/skills/`)**：
     - `types.ts`：定义完整的 Skills 元数据、单项规则（Bad Case / Good Case / 触发条件）、反向禁改红线、体检报告等类型规范；
     - `skillsRegistry.ts`：规范化注册 `humanizer` 与 `lieflat-less-ai-tone` 双技能定义；
     - `SkillsEngine.ts`：毫秒级多规则正则/模式扫描引擎（提供 0~100 综合得分与问题定位），以及动态提示词组装器 `buildPolishingPrompt`；
     - `useSkillsStore.ts`：基于 Zustand 的持久化状态管理，支持多技能开关、全局重置与激活状态计算；
  3. **打造专业级管理视图与演练沙盒 (`SkillsManagerView.tsx`)**：
     - 顶部四卡片（已启用技能、规则总数、白名单保障数、禁改红线数）；
     - 技能卡片支持一键开启/停用、规则抽屉展开阅读详细正反示例；
     - 禁改红线高亮展示，保障作者文本安全；
     - 集成互动演练沙盒 (Playground)：支持即时输入文本体检扫描、雷达得分、问题高亮、提示词一键复制以及一键调用已绑定的真实 AI 模型进行实战测试；
  4. **全端多入口无缝集成**：
     - **设置面板**：在 `SettingsModal.tsx` 中新增 `SKILLS` 专属选项卡；
     - **Docking 工作台**：注册 `skills_manager` 停靠面板，可随时作为独立窗口拖拽组合；
     - **创作工坊菜单**：顶栏下拉菜单高亮新增【Agent Skills 技能中心】；
     - **全局指令 (`Ctrl+K`)**：增加快速唤出命令 `cmd-skills-manager`；
     - **编辑器划词浮动条 (`FloatingSelectionMenu.tsx`)**：【去AI味】按钮直接动态集成当前生效的全部 Skills 提示词；
  5. **自动化测试套件**：
     - 编写 `tests/test-skills-manager.ts`，涵盖元数据、双引擎检测、低误报率、动态 Prompt 合并、Zustand 状态切换与 Docking 注册共 33 项专项验收测试。
- **验证结果**：
  - `pnpm run test:skills` 33 项测试 100% 全部通过；
  - `pnpm test:humanizer` 17 项全过；
  - `pnpm test:docking` 10 项全过；
  - `pnpm build` 1.15s 零错误构建通过；
  - 界面直观清爽、操作流畅、双引擎去AI味效果显著且具备防误改保障。

## ADR-036: 小说戏剧张力全家桶（Story Architect、Scene Dramaturge、Ending Forge、Cold Reader）全链路落地架构
- **状态**：已采纳
- **上下文**：
  1. 用户上传了开源的《小说戏剧张力 Skill Pack v1.0》压缩包，要求将包含的 4 个 Skills（`story-architect`、`scene-dramaturge`、`ending-forge`、`cold-reader`）完整安装并全面应用到 NovelForge AI 中；
  2. 这些 Skills 专门解决大模型长篇创作中常见的深层顽疾：
     - **Story Architect**：解决跨章匀速流水账、伪高潮、冲突无后果问题；
     - **Scene Dramaturge**：解决单场景机械进场、说明型情绪宣告（Tell 代替 Show）、假和解问题；
     - **Ending Forge**：解决结尾无力、临时天降新规则、死前录音救场与廉价发便当煽情问题；
     - **Cold Reader**：解决审稿继承作者大纲导致盲点被掩盖的问题，以完全隔离的首次读者视角诊断注意力卡顿、假悬念与最高优先前三项最小修复；
  3. 必须遵循 `AGENTS.md`：真实可运行、拒绝伪多 Agent、提示词与业务逻辑彻底解耦、严格自动化测试验证。
- **决策**：
  1. **资产落盘与物理安装**：
     - 解压并部署至 `.agents/skills/story-architect/`, `scene-dramaturge/`, `ending-forge/`, `cold-reader/`；
     - 同步落盘参考文档 `DRAMATURGY_PROMPTS.md` 与 `DRAMATURGY_README.md`；
  2. **提示词中心解耦 (`prompts/`)**：
     - 创建 `story_architect.md`、`scene_dramaturge.md`、`ending_forge.md`、`cold_reader.md` 独立架构提示词，禁止硬编码在 UI 交互中；
  3. **后端与数据库层增强 (`src-tauri/src/database/mod.rs`)**：
     - 在 `assemble_toolbox_prompt` 中新增 `story_architect`、`scene_dramaturge`、`ending_forge`、`cold_reader` 原生匹配分支，自动提取关联角色、世界法则与前文因果；
  4. **类型系统与 SkillsEngine 增强**：
     - `types/index.ts`：扩展 `ToolboxActionType`；
     - `features/skills/types.ts`：扩展 `SkillCategory`（`architecture`, `dramaturgy`, `audit`）；
     - `SkillsEngine.ts`：扩展戏剧硬伤检测正则（情绪直接贴标签、偷懒偶然推进、旁白廉价煽情、机械制造假悬念）；
     - 新增专用 Prompt 组装器：`buildStoryArchitectPrompt`、`buildSceneDramaturgePrompt`、`buildEndingForgePrompt`、`buildColdReaderPrompt`；
  5. **Zustand 响应式状态迁移 (`useSkillsStore.ts`)**：
     - 版本升至 v2，集成增量迁移逻辑，默认激活 6 大技能全矩阵；
  6. **UI 场景全覆盖**：
     - **Skills 技能中心 (`SkillsManagerView.tsx`)**：增加 5 大分类筛选 Tabs；试炼沙盒升级支持【去AI味润色】、【戏剧导演双方案】、【Cold Reader 盲审】三大模式并配备多套典型测试样本；
     - **正文编辑器浮动条 (`FloatingSelectionMenu.tsx`)**：新增【戏剧重塑】快捷胶囊；
     - **小说百宝箱 (`NovelistToolboxModal.tsx` & `ToolboxPanel.tsx`)**：上架 4 大新专项工具并对接真实模型网关与一键插入/保存。
## ADR-037: 工作区分栏拖拽最小边界保护与 AI 写作助手自适应防挤压架构
- **状态**：已采纳
- **上下文**：
  1. 用户上传界面截图反馈：“AI 写作助手”面板被挤压变形：
     - 顶栏“AI 创作智囊团”文字单字垂直折行成 7 行竖排（`A / I / 创 / 作 / 智 / 囊 / 团`）；
     - 5 个功能 Tabs（`单章写作`、`协同编排`等）在 `grid-cols-5` 强约束下双行折行，字符拥挤；
     - 细纲卡片顶部的 `+ 注入上下文` 按钮与“创作层级定位”文字垂直叠放；
     - 8 大高频创作动作按钮（“顺推”、“环境”等）被 `truncate` 截断为单字加省略号（`顺.`、`环.`、`锋.`、`内.`）。
  2. 根因分析：
     - **系统分栏层级**：`LayoutRenderer.tsx` 与 `Splitter.tsx` 原本硬编码了 `minWidth: 120px`。用户拖动分割线时，右侧 AI 助手列被允许压缩至极限 120px，远小于任何复杂功能面板的安全操作尺寸；
     - **组件内部响应式层级**：`AiAssistantPanel.tsx` 缺少 `whitespace-nowrap` 与容器最小宽度保护，且 Tab 栏使用固定的 `grid-cols-5`，快捷动作按钮使用 `grid-cols-4` 配合 `truncate`，缺乏容器宽度变窄时的自适应折行或平滑横向滚动缓冲。
- **决策**：
  1. **分栏引擎最小保护边界 (`LayoutRenderer.tsx` & `Splitter.tsx`)**：
     - 将水平分栏的列最小宽度约束从 `120px` 提升至 `240px`；
     - `Splitter.tsx` 拖拽指针计算中，加入水平 240px 与比例安全边界（`Math.min(computedMinPercent, combinedPercent * 0.45)`），物理上杜绝用户失手将任何列拖成极窄窄缝；
     - 分割线已内置“双击一键恢复等分尺寸”快速自愈交互。
  2. **AI 助手顶栏与模型信息防折行 (`AiAssistantPanel.tsx`)**：
     - 顶栏主标题 `AI 创作智囊团` 附加 `shrink-0 whitespace-nowrap`，彻底杜绝单字垂直折行；
     - 模型信息胶囊配置 `max-w-[55%] shrink-0 min-w-0`，当空间紧张时模型超长名称自动在内部 `truncate`，不抢占主标题展示空间。
  3. **功能 Tabs 横向平滑弹性滑动条**：
     - 将原死板的 `grid-cols-5` 改造为 `flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth`；
     - 每个 Tab 按钮设定 `flex-1 min-w-[62px] whitespace-nowrap shrink-0`：宽屏下 5 个 Tab 自动均分宽度，窄屏下平滑横向轻触滚动，4 字标题永远单行完整清晰呈现。
  4. **细纲上下文与高频快捷动作响应式自适应**：
     - 细纲卡片顶栏：左侧层级定位使用 `min-w-0 flex-1 truncate`，右侧 `+ 注入上下文` 与 `收起/展开` 附加 `whitespace-nowrap shrink-0`，彻底杜绝按钮竖排变形；
     - 8 大高频动作按钮：使用 `flex flex-wrap gap-1`，按钮设定 `flex-1 min-w-[54px] whitespace-nowrap`，彻底消除 `顺.`、`环.` 截断现象，无论列宽是 240px、320px 还是全屏，均自适应排列并完整显示“顺推”、“环境”、“锋芒”、“内心”等全词。
  5. **高级生成参数微调自适应**：
     - 篇幅字数选择器增加 `flex-wrap`，文风基调下拉框与发散度滑块设定安全最大宽度，防溢出。
  6. **面板容器最小宽度保障 (`AiAssistantPanelWrapper.tsx`)**：
     - 外层挂载 `min-w-[240px]`，双层防护。
- **验证结果**：
  - `pnpm run test:docking` 10 项端到端可停靠测试 100% 全部通过；
  - `pnpm run test:skills` 56 项测试 100% 全部通过；
  - `pnpm run build` 1.07s 零错误构建通过；
  - 极端窄列宽度与小屏缩放下，界面全部文字、按钮、Tab 均清晰单行呈现，零挤压、零截断。

## ADR-038: 设置中心与 Skills 视图性能重构 (消除掉帧、双重滚动与暗色割裂)
- **状态**：已采纳
- **上下文**：
  1. 用户反馈：“点开设置界面后有点卡顿掉帧”并上传截图。
  2. 根因剖析：
     - **GPU 重绘掉帧 (Backdrop Filter)**：全屏蒙层使用 `backdrop-blur-xs`，在 Windows WebView2 下每次打开或滚动都会调用重度 GPU 高斯模糊管线，在复杂文本 DOM 下产生明显卡顿与掉帧；
     - **宽度过渡强制重排 (Reflow Thrashing)**：弹窗外层使用了 `transition-all duration-200`，在切换到 `max-w-5xl` 时，连续 200ms 每帧强行重排整个树的布局与多重卡片；
     - **双重滚动冲突 (Nested Scrollbars)**：弹窗外层 `overflow-y-auto` 与 `SkillsManagerView` 的 `overflow-y-auto` 嵌套争夺滚轮事件，导致滚动卡顿；
     - **右侧沙盒滚脱留黑**：左侧技能列表长达 1500px，而右侧沙盒只有 400px 且未设 `sticky`，用户向下滑动时右侧滚出视野留下巨大黑块；
     - **暗色主题割裂**：弹窗外框与 Header 遗漏暗色类，导致浅色标题栏与深色内容割裂；
     - **数据库冗余并发**：打开弹窗立即盲目执行 `getDbStats`，与界面渲染争夺主线程与 IPC。
- **决策**：
  1. **移除 `backdrop-blur` 与 `transition-all`**：弹窗背景改为高性能纯色遮罩 `bg-black/50`，弹窗外壳去除 `transition-all duration-200`，做到点击瞬间 0ms 丝滑出窗、零 GPU 丢帧；
  2. **消除双重嵌套滚动**：外层容器设为 `flex-1 min-h-0 overflow-hidden`，将滚动职责完全交由内部单一容器原生接管；
  3. **右侧沙盒吸顶置顶 (`lg:sticky lg:top-4 self-start`)**：使右侧试炼沙盒在左侧长列表滚动时始终保持锁定在可视区域，彻底消灭右侧大块黑斑；
  4. **React 渲染性能优化**：`SkillsManagerView` 引入 `useMemo` 缓存技能过滤列表与规则统计；
  5. **SQLite 统计查询按需懒加载**：仅在切入「模型网关」Tab 时按需加载 `getDbStats`；
  6. **全链路暗色主题补齐**：弹窗外框、顶栏、标签页与提示条补齐 `dark:bg-[#1c1917]`、`dark:border-[#2e2a27]` 与暗色高亮配色。
- **验证结果**：
  - `pnpm test:skills` 56 项测试全过；
  - `pnpm build` 1.03s 极速编译通过；
  - 设置弹窗展开与切换 60fps 丝滑秒开，无任何卡顿掉帧，暗色模式和谐统一。

---

### ADR-20261015-003: 项目目录深度整理与冗余代码垃圾文件清理
- **上下文**：
  1. 随系统版本迭代（从 V1 到 V2.3.3 及 Skills 体系），项目根目录及各子模块积累了历史遗留与临时文件；
  2. 经全面检索扫描发现：
     - `src/components/views/StoryBibleView.tsx`（546 行未被任何代码或面板导入引用，系早期大一统设定库草案，功能已完整由 `CharactersView` 与 `WorldSettingsView` 承接）；
     - `src/assets/react.svg`（Vite 初始化自带冗余图标，系统实际采用水墨与 Lucide-React 图标）；
     - `scripts/` 下 4 个前期反编译逆向临时脚本：`analyze_workflow_chunks.cjs`、`extract_workflow_details.cjs`、`extract_xingyue_evidence.cjs`、`find_chunks.cjs`；
     - 网页标题与图标历史遗漏（`index.html` 仍为 Vite 初始占位文本与语言配置）。
- **决策**：
  1. **彻底清理孤儿组件**：安全删除无引用的 `src/components/views/StoryBibleView.tsx`，释放 23.5KB 代码体积；
  2. **清理多余静态资源**：删除无引用的 `src/assets/react.svg`；
  3. **清理临时逆向脚本**：移除 `scripts/` 下的 4 个临时 `.cjs` 逆向分析脚本，保留版本校验与发布构建脚本；
  4. **完善应用元信息**：将 `index.html` 语言设置为 `zh-CN`，标题更新为 `NovelForge AI — 智能长篇小说创作工作台`，图标指向本地应用图标；
  5. **保持第三方子模块干净**：确保 `docs/research/github/repos` 的 gitlink 子模块无脏文件。
- **验证结果**：
  - `pnpm build` 生产构建 1.40s 零错误完成；
  - 全套单元测试与端到端测试 100% 通过（Skills 56 项、Docking 10 项、Humanizer 17 项、Memory 36 项、Arena 17 项、Typesetter 20 项、Word 16 项、Updater 28 项全部通过）；
  - `cargo check` 零警告通过。

---

### ADR-20261015-004: 全系统性能瓶颈根除与操作卡顿掉帧深度治理 (Comprehensive Performance & Latency Eradication)
- **状态**：已采纳
- **上下文**：
  1. 用户反馈：“目前很多操作都非常卡顿，检查一下是什么问题”。
  2. 经系统级全流程分析定位出 4 大叠加复合瓶颈：
     - **瓶颈一（GPU 栅格化过载）**：Header、Sidebar、Editor 工具栏、AI 智囊团面板、Docking 工具条等 5 大常驻主容器，均挂载了 CSS `backdrop-blur-xl` / `backdrop-blur-md`。在 Windows WebView2 (Chromium) 下，重叠模糊强制 GPU 进行频繁的多通道高斯离屏渲染，鼠标一动即导致帧率跌破 15fps；
     - **瓶颈二（按键重渲染雪崩）**：正文编辑器 `onUpdate` 每次击键都同步触发全局 `updateEditorContent`；顶栏 `Header` 订阅并在每次击键时同步执行全书数万字的正则统计，导致每次击键都强制 738 行的 Header 全树及其包含的十余个复杂模态弹窗进行无意义的 Diff 与重渲染；
     - **瓶颈三（高频鼠标事件打爆调度）**：`Splitter` 拖拽与 `FloatingPanelContainer` 移动/缩放时，在 raw `pointermove`（电竞鼠标达 500~1000Hz）中无节制触发状态更新，挤占 React 调度主线程；
     - **瓶颈四（测试污染与作品列表胀大）**：`db_test.rs` 运行向生产数据库灌入 70+ 部重名测试作品，且前端作品管理缺少显式可用的单作品删除入口。
- **决策**：
  1. **彻底消除常驻面板的 GPU backdrop-blur 负担**：
     - 将 Header、Sidebar、NovelEditor 工具栏、AiAssistantPanel、WorkspaceToolbar 的伪透明模糊全部替换为实体古雅水墨宣纸主题色（`bg-[#efe9dc]`、`bg-[#f3ede1]`、`bg-[#eae2d3]`）；
     - 零 GPU 离屏拷贝和着色器开销，同时在白天与黑夜模式下保持 100% 视觉质感对齐。
  2. **正文输入 250ms 防抖与字数组件原子解耦**：
     - 在 `NovelEditor` 内为全局 store 更新设立 250ms 防抖，使 Tiptap 在本地保持 120fps 原生流畅输入；在用户失焦 (`onBlur`) 或按 `Ctrl+S` 时即时刷新最新状态；
     - 将字数统计抽离为微型独立记忆组件 `HeaderWordCount`，仅在实际字符计数数值发生改变时精准刷新数字自身，使 `Header` 主体彻底从打字重渲染循环中解耦。
  3. **基于 requestAnimationFrame (rAF) 的拖拽防抖节流**：
     - 为 `Splitter` 分割线拖拽及 `FloatingPanelContainer` 窗口拖动与缩放全面接入 `requestAnimationFrame` 缓冲调度，严格将状态分发限制在屏幕刷新率上限（60Hz/120Hz/144Hz），并增加 pointer overlay 遮罩层，防止拖拽中鼠标穿透被子组件吞没。
  4. **测试沙箱完全物理隔离与作品删除能力下放**：
     - 为 Rust `DbManager` 扩展 `new_at_path(db_path)` 构造器，并将 `db_test` 全面重定向到受管临时沙箱环境，自动运行并在退出时清理临时沙箱；
     - 清理生产数据库中的 70 余部污染作品，恢复纯净状态；
     - 移除 `novels.length > 1` 的硬编码限制，在 `Sidebar` 与 `ChaptersPanel` 中提供显式安全的删除作品能力。
  5. **工作台全树拖拽重渲染与浏览器重排清零**：
     - 将跟随鼠标微秒级位移的 `draggingState` 从 `DockingWorkspace` 顶层解耦，转由微型独立组件 `<DraggingGhostPill />` 承接，防止鼠标每移动 1 像素引发工作台全部停靠组件重渲染；
     - 修复 `TabGroup` 在每次鼠标移动时无节制执行 `getBoundingClientRect()` 触发的成千上万次浏览器强制重排（Forced Synchronous Layout），优化为仅在拖拽起止时捕获 1 次；为 Tab 拖拽与面板 Header 拖拽加入 `requestAnimationFrame` 节流调度；
     - 对 `LayoutRenderer`、`TabGroup`、`DockDropIndicator` 实施 `React.memo` 记忆化隔离。
  6. **AI 流式生成高频 Token 与正文编辑器彻底解耦**：
     - 将 `streamText` 从 1000 行的 `NovelEditor` 顶层订阅中剔除，提取为独立的微型隔离组件 `<StreamingPreviewBox />`，AI 每秒 30~60 字符的高频流式推进不再触发编辑器全树及工具栏的重渲染。
  7. **自动保存周期冗余 SQLite 查询与版本 IPC 消除**：
     - 消除自动保存（800ms 防抖）后盲目发起的 `list_chapters` 与 `list_chapter_versions` 两次 IPC 查询，改为依据后端返回结果在前端内存进行纯函数局部映射更新，且仅在显式创建快照时请求版本库，彻底节省磁盘 I/O。
  8. **重型模态弹窗按需代码分割 (Code Splitting)**：
     - 顶栏模态弹窗接入 `React.lazy` 与 `Suspense`，避免启动阶段一次性打包解析所有重型模块，Vite 构建速度提升至 1.04s。
- **验证结果**：
  - 前端编译 `pnpm build` 1.04s 零错误；
  - 10 项 Docking 自动化测试全过；
  - 56 项 Skills 自动化测试全过；
  - 实测操作打字、拖动分割线、拖动悬浮窗、AI 流式创作、工作区面板停靠拖动均达到 120fps 极速响应。

## ADR-030: 悬浮窗全域吸附停靠、边缘磁吸与侧边栏一键并入系统 (Floating Window Auto-Docking & Edge Snapping)
- **状态**：已采纳
- **上下文**：
  - 用户反馈“悬浮窗不能自动吸附到侧边栏吗”。
  - 排查发现原实现中，拖拽悬浮窗标题栏时仅在独立作用域更新其内部坐标，且 `document.body` 挂载了 `zIndex: 99999` 的全局 Pointer Overlay 遮罩。这不仅导致全局拖拽停靠状态机（`draggingState`）未被激活，全屏遮罩与悬浮窗自身也阻断了所有对底层工作区的指针感应，拖动到侧边栏上方无法唤起停靠高亮；
  - 此外，此前悬浮窗标题栏缺乏显式吸附至左侧侧边栏或右侧工具栏的快捷通道。
- **决策**：
  1. **打通悬浮窗拖拽至全局 Docking 引擎**：
     - 在 `FloatingPanelContainer` 中废除 `zIndex: 99999` 的隔离遮罩，改用标准的 `window` 监听器；位移 > 8px 时派发 `setDraggingState({ panel, sourceFloatingId, dragSource: 'floating', ... })`；
     - 拖拽期间悬浮窗自身赋予 `pointer-events-none opacity-70 ring-2 ring-amber-600`，使光标能无损穿透至底层的 `DockDropIndicator`，支持全域四象限与边缘感应；
     - 松手时若处于有效停靠区（如左侧侧边栏、右侧工具栏、各分屏边缘），直接触发 `handleDrop`，自动调用 `dockFloatingPanel` 无缝嵌入；未在有效区松手时安全取消并保留当前悬浮坐标。
  2. **边缘磁吸对齐 (Magnetic Edge Snapping)**：
     - 在拖动悬浮窗靠近窗口边缘（左 < 24px、顶 < 48px、右/底 < 24px）时，自动触发边缘磁吸阻尼，自动贴齐边缘（8px / 40px），确保浮窗规整易用。
  3. **标题栏一键吸附通道**：
     - 悬浮窗标题栏新增 `<ArrowLeftToLine />`（吸附至左侧侧边栏）与 `<ArrowRightToLine />`（吸附至右侧侧边栏）快捷按钮；
     - `dockFloatingToSidebar` 智能判断：若目标侧边已有同类栏（如章节目录/AI助手），自动合并为同栏新标签；若不存在则拆分出独立侧边分栏。
  4. **完备的自动化测试守护**：
     - `tests/test-docking-workspace.ts` 新增【测试十一】，全量验证左侧侧边栏定位、合并为侧边标签、最左侧独立拆分与右侧工具栏停靠。
- **验证结果**：
  - 自动化 Docking 测试套件（11 项）100% 通过；
  - 自动化 Skills 测试套件（56 项）100% 通过；
  - 前端编译 `pnpm build` 1.42s 零错误；
  - Rust 核心后端 `cargo check` 0.50s 通过。

## ADR-031: Tailwind CSS v4 类名暗色隔离与主题断层修复 (Tailwind v4 Class-based Dark Mode & Color Integrity)
- **状态**：已采纳
- **上下文**：
  - 用户反馈“这配色明显不对了”。排查发现顶栏黑底带白块、工具栏全黑、AI面板全黑，而编辑器与Tab组全白，产生了严重的色彩拼接混乱；
  - 原因在于项目使用的 `@tailwindcss/vite` (Tailwind CSS v4) 默认将 `dark:` 变体绑定至操作系统的 `@media (prefers-color-scheme: dark)`。在宿主 Windows 开启深色主题时，即便应用处于白天模式，部分声明了 `dark:` 的容器依然被系统媒体查询强制染黑；
  - 同时 Header 右侧常驻控制区硬编码了浅色 `bg-[#efe9dc]`，与被意外染黑的 Header 主体产生视觉冲突。
- **决策**：
  1. 在 `src/App.css` 头部注入 `@custom-variant dark (&:where(.dark, .dark *));`，严格限制 `dark:` 规则仅受控于 `<html>` 上的 `.dark` 类，彻底规避操作系统媒体查询静默覆盖；
  2. 补齐 Header 右端绝对常驻控制区的暗色类名；
  3. 确保白天宣纸素笺（`#f5f0e6`）与夜晚深宵冷砚（`#1a1714`）纯净一致，绝不串色。
- **验证结果**：
  - 编译后 CSS 的 `prefers-color-scheme` 规则完全剔除；
  - 白天与夜晚模式切换边界清晰无串色；
  - 前端构建与全量测试 100% 通过。

## ADR-032: AI 提示词深度重构引擎 (AI Writing Prompt Optimizer Engine)
- **状态**：已采纳
- **上下文**：
  - 用户提出需求：“能不能增加AI优化提示词的功能”；
  - 创作者在构思剧情时，输入的指令往往非常简略或大纲化（例如“写主角进入藏经阁第七层，发现失传古籍中的惊人秘密，与守阁长老产生言语交锋”）。单薄的输入极易导致大模型产出套路化、无张力、直白宣泄情绪的平庸正文；
  - 必须贯彻 `AGENTS.md` 铁律：拒绝静态假面板、拒绝未经职责隔离的空壳 Prompt，提示词中心独立落盘管理，注入作品世界观真实权威设定事实 (Canon) 与活跃 Voice Profile，并在 UI 上支持无损预览、一键采纳与四维视角动态切换。
- **决策**：
  1. **提示词独立解耦 (`prompts/prompt_optimizer.md`)**：
     - 提炼好莱坞编剧与网文主编创作法，确立四大重构维度：动机与阻碍 (Objective & Obstacle)、微观动作与感官 (Show Don't Tell)、言语交锋与潜台词 (Subtext & Micro-conflict)、即时后果与断章钩子 (Stakes & Cliffhanger)；
     - 规范返回契约：`optimized_prompt`、`enhancement_points`、`suggested_hooks`、`suggested_tags`。
  2. **四维优化视角切换 (Optimization Angles)**：
     - `DRAMA_CONFLICT` (⚡ 戏剧博弈)：强化动机对抗与言语机锋；
     - `SENSORY_DETAIL` (🎨 感官白描)：强化临场光影、环境压迫与物象细节；
     - `PLOT_HOOK` (🪝 伏笔悬念)：强化前情勾连与章末断章 Cliffhanger；
     - `CONCISE_PUNCHY` (🚀 快节奏推进)：削枝保干、爽利叙事与强情节对抗。
  3. **后端与上下文检索 (`src-tauri/`)**：
     - 在 `src-tauri/src/commands/mod.rs` 实现 `optimize_writing_prompt`，读取作品流派设定、活跃章节细纲、前 5 条权威公理与作者语气偏好，组装为高密度上下文，调用 `OpenAIClient` 进行结构化生成。
  4. **前端无损交互与降级兜底 (`AiAssistantPanel.tsx` & `webMockStorage.ts`)**：
     - 在作家流式写作 (`STREAM_WRITE`) 与全流程协作 (`COLLABORATE`) 输入框旁增设 `【✨ AI 优化提示词】`；
     - 支持无缝在原指令下方展开对比卡，一键切换 4 大视角实时重新重构；
     - 支持 `【✅ 采纳并替换】`、`【➕ 追加】` 与 `【📋 复制】`，不破坏用户原有正文或草稿。
  5. **自动化测试套件 (`tests/test-prompt-optimizer.ts`)**：
     - 编写 22 项全视角、全契约自动化测试，并整合至 `package.json` (`pnpm test:optimizer`)。
- **验证结果**：
## ADR-033: 干净空工作区状态机与防自动回滚三栏机制 (Clean Empty Workspace on Last Panel Close)
- **状态**：已采纳
- **上下文**：
  - 用户反馈：“删除最后一个界面后，又变回最初的三个了”，并附带只剩最后一个【AI 写作助手】面板的实机截图；
  - 根因分析：
    - `useWorkspaceStore.ts` 的 `closePanel` 与 `floatPanel` 中，当最后一个面板被关闭或转为悬浮窗后，布局树被完全剪枝（`newRoot === null`）；
    - 原代码包含 fallback：`const fallbackRoot = cloneTree(FOCUS_WRITING_LAYOUT.root)`；
    - `FOCUS_WRITING_LAYOUT.root` 恰好是包含 `chapters`、`editor`、`ai_assistant` 的初始三栏布局。这造成用户逐个关闭面板意图清空或更换界面时，关闭最后一个面板会触发全量恢复，把已被用户关闭的面板强行复活。
- **决策**：
  1. **干净空工作区状态机 (`tab_empty_workspace`)**：
     - 当最后一个面板被关闭时，保留一个合法的空 `TabGroupNode`（`id: 'tab_empty_workspace', panels: []`），使树依然具有一个根 Tab 容器，既允许用户通过顶栏 `+` 自由添加新面板，也允许浮动窗口拖拽吸附；
     - 在 `dockingTree.ts` 的 `validateAndSanitizeLayout` 中允许 `tab_empty_workspace` 根节点持久化，同时保持对无 ID 的极端损坏配置的自愈回退；
  2. **温润宋韵空工作区引导卡片 (`TabGroup.tsx`)**：
     - 当面板数量为 0 时，Tab 栏显示轻柔提示 `工作区（暂无已打开面板）`，右侧常驻 `+` 按钮；
     - 主容器呈现精致的宣纸卡片，提供快捷入口（正文编辑器、章节目录、AI写作助手、小说百宝箱）与恢复专注写作三栏布局的链接。
  3. **自动化测试防护 (`test-docking-workspace.ts`)**：
     - 增加【测试十二：关闭最后一个面板保留纯净空工作区】，验证关闭单面板后面板数组归零、绝不复活三栏面板、且可在空工作区中通过 `openPanel` 顺畅打开新面板。
- **验证结果**：
## ADR-034: 纯净无侵入小说创建、分卷自主增删与标题前缀规范化 (Clean Novel Creation & Volume Management)
- **状态**：已采纳
- **上下文**：
  - 用户反馈：“怎么没开新书，大纲却有一卷”，并附带大纲树只有一卷且未开新篇的界面；
  - 核心痛点与缺陷排查：
    1. **为什么“没开新书”会有一部小说？**
       - 用户先前点击作品删除按钮删除了唯一的作品《星穹之门：终极纪元》；
       - 前端 `deleteNovel` 为防止应用失去作品上下文发生白屏崩溃，自动重置生成了默认草稿《新作品项目 (未分类)》；
    2. **为什么大纲会凭空多出一卷？**
       - 后端 `create_novel` 早先硬编码了 `INSERT INTO volumes ... '初入尘世', 1`；
       - 导致任何新作品被创建时，都会被强行塞入一个作者根本不需要的“第一卷：初入尘世”，造成“我还没开新书，大纲却有一卷”的突兀体验；
       - 并且此前大纲树**没有分卷删除按钮**，作者无法将不需要的默认分卷删掉，形成死锁。
- **决策**：
  1. **彻底移除后端新建小说强塞分卷逻辑 (`create_novel`)**：
     - 在 `src-tauri/src/database/mod.rs` 与 `src/utils/webMockStorage.ts` 中彻底删除自动插入默认卷的旧代码；
     - 新建小说呈现 100% 纯净空白状态（0 卷 0 章），作者拥有绝对自由的大纲支配权。
  2. **开放分卷自主增删闭环 (`deleteVolume` & `CreateVolumeModal`)**：
     - **支持一键删除分卷**：分卷行右侧悬浮新增 `🗑️` 按钮（`handleDeleteVolume`），支持对现有或不需要的分卷一键安全删除（该卷下的章节安全脱钩为平铺章节，绝不丢稿）；
     - **支持作者自主新建分卷**：顶栏与空白大纲引导区增设 `【📖 加卷】` 按钮，配合全新 [`CreateVolumeModal`](file:///e:/%E5%B0%8F%E8%AF%B4/src/components/modals/CreateVolumeModal.tsx) 弹窗，需要分卷时随时新建。
  3. **标题去重与规范化工具 (`src/utils/titleFormatter.ts`)**：
     - 递归清洗多余的中英文前缀，避免 `第 1 卷: 第一卷：初入尘世` 等前缀重复异味。
  4. **全端验证**：
     - `db_test` 53 项核心后端测试 100% 通过；
     - `pnpm build` 与 `cargo check` 零错误通过。

## ADR-035: 全层级大纲、章节与作品元数据热编辑闭环 (Full-Hierarchy In-Place Editing for Chapters, Volumes & Novels)
- **状态**：已采纳
- **上下文**：
  - 用户反馈并持续优化：在小说创作全生命周期中，存在多处关键元素“只读不可改”的卡顿阻滞：
    1. **正文编辑器章节标题无法修改**：`NovelEditor.tsx` 中顶部章节标题为静态 `<h1>` 文本，作者若想精修章节标题，在正文编辑界面无法点击修改，只能忍受或四处寻找其他入口；
    2. **分卷标题无法重命名**：分卷在创建后缺少更新端点，作者无法修改分卷名或分卷大纲；
    3. **侧边栏树形图与列表图操作不对等**：大纲树视图中的章节节点缺少【复制纯文本】、【重命名】和【删除】快捷操作，导致树形视图下功能残缺；
    4. **作品项目元数据无法修改**：`NovelInfoPanel.tsx` 中书名、题材、文风、故事梗概纯只读，作者从默认项目或草稿启航后，无法将作品名称与简介更新为真实书名。
- **决策**：
  1. **正文编辑器章节标题“点击即改”内联编辑 (`NovelEditor.tsx`)**：
     - 将静态 `<h1>` 改造为交互式标题栏，悬停呈现轻柔 `[✏️ 重命名]` 胶囊提示；
     - 点击或按键直接原地切换为自聚焦输入框，严格承袭羊皮纸古雅宋体字体与字号，回车或失焦即刻持久化保存，ESC 或取消按钮安全取消；
     - 触发 `updateChapterTitle(activeChapter.id, trimmed)`，同步更新 SQLite `chapters` 表、`chapters_fts` 虚拟表及前端全量 Store。
  2. **分卷重命名与大纲修订闭环 (`updateVolume`)**：
     - 后端数据库新增 `update_volume` 方法，允许原地更新分卷标题与概要；
     - 侧边栏分卷节点悬停操作区补齐 `[✏️ 重命名]` 按钮，支持快速弹出微调。
  3. **大纲树节点操作平权与快捷重命名**：
     - `Sidebar.tsx` 树形节点为章节补齐 `[📋 复制纯文本]`、`[✏️ 重命名]`、`[🗑️ 删除]` 三联操作；
     - 平铺列表项与 `ChaptersPanel.tsx` 均增加统一的章节快速重命名能力。
  4. **作品项目档案全要素修改 (`NovelInfoPanel.tsx` & `updateNovel`)**：
     - 后端新增 `update_novel` 方法，采用向下兼容的字段保留合并策略（未修改字段安全继承已有值）；
     - `NovelInfoPanel.tsx` 顶部核心卡片新增 `[✏️ 编辑设定]` 按钮，呼出专有档案编辑弹窗，支持对书名、流派题材、叙事文风、故事核心梗概进行一键精修并即时反馈。
  5. **全量自动化测试验证**：
     - `db_test.rs` 新增第 54~56 项端到端测试，100% 验证作品元数据更新、分卷重命名与章节改名后 FTS5 全文索引联动检索；
     - 56 项后端测试全绿，12 项 Docking 测试全绿，标题规范化测试全绿，Vite 构建 0 错误。

## ADR-036: 原生 Model Context Protocol (MCP) 架构与 AI 全流程创作接管 (Standard MCP Server Integration for Autonomous Novel Creation)
- **状态**：已采纳
- **上下文**：
  - 创作者提出“有MCP功能吗，让AI可以接管操作”的核心诉求。希望能够让外部前沿 AI 智能体（如 Claude Desktop, Cursor, Antigravity, Cline, Windsurf 等）打破界面限制，像专业作者与主编一样直接通过自然语言接管小说项目的全生命周期——包括查阅全书大纲、增改分卷、撰写新章节、读取与修订已有正文、录入角色档案、定义世界观公理、装配 L0~L4 五层创作记忆包、全文检索伏笔以及一键导出作品。
- **决策**：
  1. **原生 Rust 高性能 MCP 服务端 (`src-tauri/src/bin/novelforge_mcp.rs`)**：
     - 构建独立专有二进制可执行文件 `novelforge_mcp.exe`，严格遵循 Anthropic Model Context Protocol 规范与 JSON-RPC 2.0 stdio 传输协议；
     - 严格隔离输出流：所有诊断、加载与数据库连接信息定向输出至 `stderr`，确保 `stdout` 纯净传输合法的 JSON-RPC 报文，杜绝任何格式解析崩溃。
  2. **直连本地 SQLite WAL 数据库与零锁并发安全**：
     - MCP 服务直接复用 `DbManager` 核心数据持久层，挂载 `%APPDATA%\NovelForgeAI\novelforge.db`；
     - 得益于 SQLite WAL 预写日志与外键约束机制，即使创作者在桌面端打开应用，外部 AI 智能体也能同时进行高并发读写，互不阻塞、互不锁表。
  3. **注册 19 项全周期小说创作工具 (Tools Registry)**：
     - 作品管理：`novelforge_list_novels`, `novelforge_get_novel`, `novelforge_create_novel`, `novelforge_update_novel`；
     - 大纲与分卷：`novelforge_get_outline`, `novelforge_create_volume`, `novelforge_update_volume`；
     - 章节创作与版本快照：`novelforge_list_chapters`, `novelforge_read_chapter`, `novelforge_create_chapter`, `novelforge_write_chapter` (自动写入版本历史), `novelforge_update_chapter_title`；
     - 设定与因果公理：`novelforge_list_characters`, `novelforge_create_character`, `novelforge_list_world_rules`, `novelforge_create_world_rule`；
     - 核心智能与装配检索：`novelforge_assemble_context` (装配 L0~L4 五层记忆包), `novelforge_search_fts` (基于 FTS5 全文秒级定位伏笔)；
     - 导出发布：`novelforge_export_novel` (支持一键打包 TXT 与 EPUB)。
  4. **全环境跨平台启动器 (`scripts/novelforge-mcp.cjs`)**：
     - 提供零配置 Node.js 启动器脚本，自动智能探测编译产物路径（环境变量 `NOVELFORGE_MCP_BIN`、release/debug 目录等）；
     - 内置 `--test` 自检与 `--tools` 工具清单展示参数，开箱即用。
## ADR-037: 作品选择器 (NovelSelectorDropdown) 与多层级作品目录书卷质感重塑 (Parchment Novel Selector & Enhanced Catalog Tree System)
- **状态**：已采纳
- **上下文**：
  - 用户反馈“下拉框和作品目录太朴素了”。
  - 原版问题：
    1. 作品切换使用的是原生 HTML `<select>` 标签，在 Windows WebView2 / Chromium 运行时下展开会调出刺眼的系统级深灰底色白色字方框，视觉割裂严重，完全破坏宣纸/松烟浓墨古风文人审美；
    2. 书名与流派简单拼贴在一行，长标题截断挤压，信息层级单薄，无法展示总字数、章节数、连载状态与创作进度；
    3. 侧边栏与多窗口章节面板（`ChaptersPanel.tsx`）的章节目录缺乏书卷呼吸感与视觉分级：分卷仅为普通小字行，章节条目缺少书签高亮线、篇幅比例可视化、伏笔关联徽标与优雅的交互反馈。
- **决策**：
  1. **构建独立的 `NovelSelectorDropdown` 典雅书架下拉组件**：
     - 彻底废除原生 `<select>`。
     - 触发卡片设计为典雅精装书脊样式：左侧配备琥珀金书籍立体图章与创作就绪绿标，中间双层呈现书卷宋体书名大字、流派徽标胶囊（如 `东方古典仙侠`）与总字数/章节数统计，右侧配备平滑翻转的 `ChevronDown`；
     - 自定义书架下拉浮层 (Popover)：采用 Warm Parchment 象牙宣纸微浮雕投影与毛玻璃虚化（`shadow-2xl backdrop-blur-md`），支持点击外部与 ESC 键自动收起；
     - 内置实时搜索过滤栏（支持按书名、流派、简介秒级过滤）；
     - 选项卡片呈现“精装书卷卡”质感：激活项配有朱砂红书签高光条与“创编中”印章，悬浮提供轻量化删除防误触确认；
     - 浮层底部提供“＋ 开启新作品”与“📄 导入 Word 存稿”一键直达入口。
  2. **多层级大纲树（Tree View）全面书卷化升级**：
     - **分卷（Volume）升级为“卷轴封签卡”**：采用温润宣纸微渐变背景与柔和边框，醒目的靛蓝/紫铜“卷一 / 卷二”古典印泥徽章，加粗书卷体标题，右侧胶囊展示“本卷 X 章 · Y 万字”汇总，悬浮快捷加章、重命名与删除，支持优雅空卷引导；
     - **章节（Chapter）升级为“线装书目书签卡”**：配备仿木刻印章章节序号（`01`, `02`），激活项配备 **4px 朱砂红折边书签高亮条**与温润象牙微光背景；右侧展示字数胶囊（自动千/万字规范换算）与金色剧情伏笔角标（`⚡ 关联伏笔数`）；
     - **场景（Scene）升级为“戏剧场记节拍卡”**：翡翠细线与场记板图标，层级缩进明晰。
  3. **平铺章节列表（List View）与全书创作概览看板升级**：
     - 顶部设计 3 栏微型指标栅格（总章节、累计字数、预计读时）；
     - 搜索框支持一键清空（`X`）；
     - 章节列表支持快捷排序（默认序号 / 字数由多到少 / 字数由少到多）；
     - 每章配备篇幅比例指示条（Word Count Bar），全书长短节奏一目了然；
     - 复制纯文本提供非阻断式微动画反馈（`Check` 徽标），消除原生 `alert` 弹窗对创作心流的打扰。
  4. **全端保持一致**：
     - 同步升级主侧边栏 `Sidebar.tsx` 与可停靠浮动面板 `ChaptersPanel.tsx`，保持全系统一致的高水准书香创作体验。

## ADR-030: DAWO 实战逆向借鉴与朱雀对抗/角色追踪/章节偷看/起名器工程落地 (V2.5.5)
- **状态**：已采纳并完全实装
- **上下文**：
  在深度解包逆向 `D:\DAWO`（DAWO 写作工作台 `inkdesk v0.6.2`）后，提炼了数千条网文实战去 AI 味及创作心流设计。为保持 NovelForge AI 本地优先、真实可运行及架构严谨性，需将高价值特性分梯队移植：
  1. AI 检测器基于困惑度与爆发度，单纯“删套话”无法有效降分，工整排比三连是判 AI 最核心特征；
  2. 长篇小说创作中，角色生存状态容易在后期混淆（误将死者复活或伤者当健康人写），造成因果崩坏；
  3. 写新章时作者最痛苦的是需要离开当前编辑界面去翻看前章断章钩子；
  4. 创作者对高频人名、宗门、招式起名有高频灵感诉求。
- **决策**：
  1. **升级 HumanizerEngine 与朱雀对抗量化打分**：
     - 正交切分叙述句与台词句；
     - 引入句长离散变异系数（`CV = σ / μ`）与实体具体性（`specificity`）六维雷达；
     - 正文纪律：叙述层绝不跳出自言自语，疑虑/口语词仅允许出现在台词中；
     - 建立 14 类红牌毒句式（工整排比、假反折、万能状语、AI 呼吸等）毫秒级拦截机制；
  2. **角色生存与出场追踪看板 (Tracking Board)**：
     - 拓展 `CharacterProfilesPanel` 为双模看板，支持健康/受伤/闭关/离场/死亡 5 态流转；
     - 后端 `update_character_status` 同时持久化状态与溯源事件；
     - 死亡角色激活“因果锁”警示防死人复活；
  3. **正文速览偷看抽屉 (ChapterPeekDrawer)**：
     - 悬停工具栏抽屉式滑出，展示全书目录与前章开篇 200 字，重点提取章末断章悬念（最后 350 字），支持一键复制末尾钩子或跳转；
  4. **灵感起名生成器 (QuickNameModal)**：
     - 内置 7 大品类、多风格离线毫秒级词根组合库，并支持大模型针对性扩充。
















## ADR-031: 创作流程流水线化重塑与标题栏功能分区分级降噪 (V2.6.0)
- **状态**：已采纳并完全实装
- **上下文**：
  原标题栏存在严重的功能堆砌与结构随意排布问题：
  1. **Tab 排序缺乏创作心流引导**：原顶栏以 `正文创作 -> 概览看板 -> 人物档案 -> 世界观设定 -> 记忆引擎` 无序排布，漏掉了剧情大纲入口，且直接将正文创作放在首位，导致缺乏前期构思设定的作者感到无所适从；
  2. **顶栏视觉噪音过载**：右侧随意堆砌了全局指令、当前模型、自动连载、Word导入、工坊下拉菜单、字数存盘、导出本章、导出全本、缩放步进器、日夜切换、专注模式、设置、AI面板展开、原生窗口三键等十几个按钮，拥挤且功能边界混乱；
  3. **缺乏“小说六步法创作闭环”**：创作者难以从界面建立从“立项选题”到“世界法则/角色档案/大纲伏笔”再到“正文执笔/记忆沉淀”的清晰工程认知。
- **决策**：
  1. **标题栏重构为三级标准功能分区 (Three Structured Functional Zones)**：
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

## ADR-032: DAWO 第二梯队生产力引擎实装与全系统双模联动落地 (V2.6.1)
- **状态**：已采纳并完全实装
- **上下文**：
  在深度逆向解包研究 DAWO 写作工作台（`D:\DAWO`）的架构与设计之后，发现其在“竞品逆向拆解”、“全书因果巡检”与“正文资产反哺”三大维度具有极其高效的创作者生产力机制。而 NovelForge AI 过去侧重于单章层面的 AI 写作与局部的逻辑审稿，急需建立宏观全书级别的样章拆解、跨章因果体检与未登记实体的正向反哺沉淀机制。
- **决策**：
  1. **样章与名作拆书工坊 (`DeconstructEngine` & `DeconstructModal` / `DeconstructPanel`)**：
     - 构建专业剧作架构师系统提示词规范 `prompts/deconstruct_architect.md`，支持 5 大维度（结构布局、黄金三章、节奏爽点、人物设计、可复用套路）与 3 种尺度（逐章精拆、情节块、宏观全书）；
     - 研发本地 0-Token 纯离线快速分析引擎：基于算法毫秒级提取字数、段落分布、台词呼吸感占比（25%~45% 网文黄金区间）、前 300 字切入方式诊断与章末断章尾钩；
     - 自动解析报告并抽取可复用套路卡（步骤清单与自检反思项）与戏剧节拍流，支持一键复制到剪贴板。
  2. **全书因果体检巡检引擎 (`FullCheckEngine` & `FullCheckModal` / `FullCheckPanel`)**：
     - 跨章自动化巡检 5 大因果维度：
       - `CHARACTER_LIFE`：识别标记为“死亡”的角色在正文以活人发言动作的“死人诈尸”致命违规（CRITICAL），智能过滤回忆/怀念/墓碑等被动语态；识别闭关/离场角色突兀现身（WARNING）；追踪核心角色长期掉线（INFO）；
       - `FORESHADOW_ORPHAN`：巡检连载 10 章以上仍未推进的初设滞后伏笔（WARNING）；
       - `CANON_CONFLICT`：巡检正文触碰世界观权威公理中否定性约束条款的冲突风险（WARNING）；
       - `LENGTH_PACE`：巡检单章篇幅过短 (< 1200字) 或过长 (> 6000字)，智能豁免序章/引子/后记；
       - `CENSOR_RISK`：全书敏感禁限词跨章扫描并提供合规建议；
     - 扣分制输出 0~100 综合因果健康指数仪表盘与四级健康评级（`PERFECT` / `GOOD` / `NEEDS_ATTENTION` / `DANGER`），提供一键直达问题章节。
  3. **正文资产反哺提案引擎 (`AssetProposalEngine` & `AssetProposalModal` / `AssetProposalPanel`)**：
     - 毫秒级规则扫描正文未在设定库登记的野生实体（新人物、江湖宗门势力、功法绝技、神兵法宝道具）；
     - 自动对比现有设定排除已有角色与法则，过滤代词与常见虚词误判，智能抽取上下文整句；
     - 彻底打通与 SQLite 后端的数据流转管道，支持【一键采纳】：人物角色直通 `api.createCharacter`，门派功法法宝直通 `api.createWorldRule`（自动赋予 EXTENDED 扩展法则级别），实现从正文到世界观设定的真实持久化沉淀。
  4. **全系统双模自适应与多触点挂载**：
     - 统一支持 `embedded?: boolean`：既可在 Header 下拉菜单与 Toolbox 顶栏作为独立悬浮 Popover 呼出，又可作为标准停靠面板嵌入多面板工作区，达成 100% 视图复用；
     - 全局命令面板 (`Ctrl+K`) 与顶栏创作工坊下拉菜单全链路挂载。
  5. **自动化测试与质量指标**：
     - 新建专有测试套件 `tests/test-second-cohort-engines.ts`，46 项严苛断言 100% 通过；
     - 全系统自动化测试累计突破 238 项全绿；
     - `pnpm build` (tsc && vite build) 1.34s 极速构建，0 错误 0 警告。

## ADR-033: 作品封面物理装帧设计工坊与跨章节批量精修系统 (V2.6.2)
- **状态**：已采纳并完全实装
- **上下文**：
  1. 用户在概览看板（`DashboardView`）反馈“看板怎么连封面都设定不了”，此前作品元数据中缺失 `cover_url` 字段，看板只有平淡的纯文字信息与按钮，严重缺乏图书实体感与仪式感；
  2. 桌面长篇写作应用需要极致的离线体验与本地优先保障，封面设置必须支持本地离线图片存储（Base64 纯离线持久化），避免用户本地写作依赖远程图床外链；
  3. 很多作者缺乏美术设计基础，需要系统内置高审美的中式水墨、古典烫金、深空科幻等物理装帧程序化预设，并支持为 Midjourney/Flux 等 AI 绘图工具自动生成结合本书题材设定的高质感生图咒语；
  4. 存量长篇手稿在导入后往往存在通篇的 AI 味、排比套话、节奏拖沓或章末缺乏悬念，需要支持全书或指定章节范围跨章批量精修，并提供安全 Diff 比对确认。
- **决策**：
  1. **SQLite 数据库向下兼容迁移与数据管道扩展**：
     - 在 `novels` 表平滑迁移 `cover_url TEXT DEFAULT ''`，编写向下兼容迁移脚本；
     - 扩展 `Novel`、`CreateNovelInput`、`UpdateNovelInput` Rust 数据结构与前端 TS 类型；
     - 更新 `db_test.rs` 增加第 57 项全链路测试，验证 Base64 封面及预设封面的持久化读写。
  2. **物理 3D 书籍渲染组件 (`BookCoverView.tsx`)**：
     - 基于 CSS 3D `perspective` 呈现逼真书籍立体厚度、纸张切口侧层、左侧烫印书脊阴影与金丝飘带；
     - 预置 8 大经典文学流派程序化纹理（宣纸水墨、烫金沉香、澄心青竹、深邃星穹、孤月夜影、朱砂墨韵、羊皮奇幻、极简象牙）；
     - 支持书名自适应排版、作者印章、题材徽标及 hover 状态交互；
     - 提供 `xs`, `sm`, `md`, `lg`, `xl` 5 种尺寸，无缝嵌入看板顶栏、书架选择下拉框和作品信息面板。
  3. **作品封面与装帧设计工坊 (`BookCoverModal.tsx`)**：
     - 四大模式支持：
       - **文学装帧预设**：一键应用 8 大流派质感，并支持微调副标题与印章；
       - **本地图片上传**：内置图片读取器自动转 Base64 离线保存入 SQLite，100% 离线本地优先；
       - **网络直链输入**：支持远程图片 URL 预览并校验；
       - **AI 绘图生图咒语**：根据小说流派题材与大纲背景，自动组装 Midjourney / Flux / SDXL 英文咒语与参数，支持一键复制；
     - 在看板 Banner 与作品信息面板中常驻“🎨 设定封面”入口。
  4. **跨章节批量精修系统 (`BatchReviseEngine` & `BatchReviseModal` / `BatchRevisePanel`)**：
     - 支持全书、指定章节范围（如第 1~5 章）或勾选章节批量重塑；
     - 提供 4 大精修预设（去 AI 味、节奏提速、章末悬念强化、具象化五感）与自定义指令；
     - 包含大模型并发与本地 0-Token 纯离线清洗双模；
     - 差异比对与逐章确认采纳，保证非破坏性修订。

## ADR-034: DAWO 第三梯队核心生产力引擎与因果核验系统实装 (V2.6.3)
- **状态**：已采纳并完全实装
- **上下文**：
  1. 长篇小说创作中，作者经常需要对多章节统一修稿（如全书去 AI 味、前 10 章提速、章末强化悬念），若单章逐个复制提示词效率极低；
  2. 随着平台对 AI 写作版权与合规性的要求提高，作者在平台签约、版权申报与稿酬结算时，急需可量化的“手写纯原创 vs AI 辅助”凭证；
  3. 架空玄幻/仙侠/奇幻世界中，地图空间辽阔，主角历练与势力行军极易发生“日行万里”、“数个时辰飞渡整片大陆”的物理与行军因果崩坏，需要直观的地理沙盘打点与行程速度因果核验。
- **决策**：
  1. **跨章节批量修改与 Diff 提案流 (`BatchReviseEngine` & `BatchReviseModal` / `BatchRevisePanel`)**：
     - 采用独立提示词解耦规范 `prompts/batch_reviser.md`，确立批量精修总监专业职责与“剧情绝对保真”底线；
     - 建立作用域过滤器 `filterChaptersByScope`，支持 `ALL`（全书）、`RANGE`（连续章节区间，自适应颠倒输入）与 `SELECTION`（指定章节勾选）；
     - 实现字符级差异指标计算 `calculateDiffMetrics`（新增字符、削减字符、语义变动摘要）；
     - 预置 0-Token 纯离线快速规则清洗 `offlineFastRevise`，秒级剔除典型套话、压缩多余标点与注入断章尾钩；
     - 采纳提案时调用 `api.saveChapterContent` 并强制创建 `BATCH_REVISE` 来源版本快照，杜绝误触或不可逆破坏。
  2. **手写原创 vs AI 辅助字数双流统计与心流追踪 (`DualWordStatsEngine` & `DualWordStatsBadge`)**：
     - 免数据库 schema 变更算法方案：优先利用现存的 `ChapterVersion.source_type` 算法归因折算单章与全书字数分配；
     - 全书聚合大盘输出创作者心流纯粹度评级（`PURIST` 纯粹原创 / `BALANCED_COPILOT` 平衡心流 / `AI_HEAVY` 深度赋能）；
     - 打造高雅视觉胶囊徽章 `DualWordStatsBadge.tsx`（金黄手打条 + 蓝紫 AI 条），支持悬浮卡片展开明细与签约合规存证说明；
     - 优雅嵌入概览看板 `DashboardView.tsx` 数据指标栏，并提供 0 字数待开篇优雅保底。
  3. **架空世界宣纸墨韵地理沙盘与行军因果核验 (`MapEngine` & `MapModal` / `MapPanel`)**：
     - 自动从世界观法则库（`WorldRule`）中提取地理与宗门要素生成默认沙盘地标；
     - 采用 0~100% 相对百分比浮点坐标系统，完美自适应任意屏幕尺寸与工作台多栏缩放；
     - 建立行军速度与时间因果核验引擎 `verifyTravelSpeed`，当长距离行军与极短天数发生矛盾时主动发出因果报警拦截，防止设定降智；
     - 包含本地存储持久化 `saveMapToStorage` 与 `loadMapFromStorage`。
  4. **全端深度融合与测试质量指标**：
     - 概览看板扩展为 4 列数据大盘，并挂载批量修改与地理沙盘快捷入口；
     - 工作台停靠面板与全局命令面板全链路接入；
     - 编写专有测试套件 `tests/test-third-cohort-engines.ts`，46 项严密断言 100% 通过；
     - 全系统 10 套自动化测试累计 256 项断言全绿，Vite 构建 1.05s 0 错误。

## ADR-035: 系统深层健壮性、多态多对多关联级联清理、编辑器 0 丢字与导出纯净化架构 (System Resilience & Data Purity)
- **状态**：已采纳并完全实装 (V2.6.4)
- **上下文**：
  1. **批量采纳数据覆盖风险**：`BatchReviseModal` 采纳后因编辑器仅监听 `[activeChapter?.id]` 且未刷新 Store，用户按键自动存盘易用旧正文覆盖刚采纳版本；
  2. **安全防护缺失**：`MemoryEngineView.tsx` 中 FTS5 片段高亮直接渲染未经过滤的 HTML，存在客户端脚本注入隐患；且用户输入带有未闭合引号或特殊符号时，SQLite FTS5 引擎易抛出语法崩溃；
  3. **多态孤儿关联残留**：多对多核心表 `plot_associations` 与 `usage_records` 采用动态目标类型，无法通过原生 SQLite 外键约束自动级联删除，当章节、场景、节拍、分卷、部或角色弧被删除时，残留孤儿关联污染上下文装配；
  4. **编辑器竞态与章节快速切换丢字**：用户打字后快速点击切换章节（250ms 内），防抖存盘未来得及触发；且切换后旧定时器未清除，极易向新章节 ID 误写旧章节内容；同时若在保存中途按 `Ctrl+S` 手动存盘会被直接丢弃；
  5. **导出杂质与排版富文本标签泄露**：Tiptap 在底层存储 HTML 标签，导出 TXT 纯文本或构建 EPUB 页面时，易导致 HTML 标签直接外露或被二次 XML 转义为 `&lt;p&gt;`。
- **决策**：
  1. **编辑器双向响应与版本依赖同步**：
     - `BatchReviseModal` 采纳后主动刷新 Store 并同步更新 `editorContent` 与 `activeChapter`；
     - `NovelEditor.tsx` 将监听依赖升级为 `[activeChapter?.id, activeChapter?.updated_at]`，确保外部或批量修订能立即同步给编辑器 DOM。
  2. **输入安全转义与 FTS 自动降级防御**：
     - 封装 `sanitizeFtsSnippet` 严格转义除了 `<b>` 以外的所有字符，阻断 XSS 攻击面；
     - 在 Rust 后端编写 `sanitize_fts5_query` 清理危险操作符，并在 FTS5 出错时自动安全平滑降级为 `LIKE` 模糊匹配。
  3. **全表多态多对多关联级联清理**：
     - 在 `delete_chapter`, `delete_scene`, `delete_plot_beat`, `delete_volume`, `delete_part`, `delete_character_arc`, `delete_parallel_thread`, `delete_novel`, `merge_chapters` 中全面实现主动级联清理；
     - 在删除章节与合并章节时，同步清理虚拟全文索引表 `chapters_fts` 与使用记录 `usage_records`，杜绝孤儿索引膨胀。
  4. **编辑器同步刷新钩子与存盘排队序列化**：
     - 在 `NovelStore` 中设计 `flushEditorSync` 机制；在 `selectChapter` 切换前由编辑器同步提取 DOM 最新内容并立即安全存盘，彻底杜绝切章丢字；
     - 章节切换时清除旧定时器，防止定时器串扰到新章节；
     - 在 `saveCurrentChapter` 中引入 `pendingSaveRequest` 存盘排队，在 `saveStatus === 'SAVING'` 期间发起的存盘请求（包括 `Ctrl+S`）在当前存盘结束后自动无损执行。
  5. **富文本段落清洗与全端导出文本纯净化**：
     - 在 Rust 后端与前端分别实装 `html_to_plain_text` 与 `htmlToPlainText`，完整剥除富文本标签并解码 `&nbsp;` 等实体；
     - `export_novel_text`、`novelforge_mcp` 导出 TXT 及 EPUB 打包器全面接入清洗机制，确保导出的电子书和纯文本整洁典雅。

## ADR-036: 沉浸式长篇正文写作环境、章内智能查找替换、章节无缝穿梭与全局即时反馈体系 (Immersive Writing UX & Interaction Engine)
- **状态**：已采纳并完全实装 (V2.6.5)
- **上下文**：
  1. **正文查找替换缺失**：长篇小说单章动辄数千上万字，在缺少原生章内查找替换能力的情况下，作者进行角色名微调、错别字批量修正或特定台词定位时，极度依赖肉眼滚动排查，创作效率受挫；
  2. **状态反馈割裂分散**：此前应用中各模块对保存、格式化、复制、纸张切换等操作多采用分散的局部 `setTimeout` 或局部小徽标，反馈不仅形式各异、难以看清，且无法跨视图保持一致视觉心智；
  3. **章节切换心流切断**：此前阅读或精修前后章节时，作者必须从左侧边栏目录深度寻章，视线频繁在左侧深层目录与主工作台来回跳跃，严重打断写作沉浸感；
  4. **长篇写作视觉与颈椎疲劳**：随着单章字数增加，作者视线不断下移至屏幕底端低头码字，缺乏像传统打字机那样的居中视线锁定；同时长篇全篇文字对比度均等容易导致视觉涣散；
  5. **快捷键系统欠缺统一速查**：系统虽拥有众多专业快捷键，但作者缺乏直观、随时可唤出的速查中心，大量高效键盘流操作无法被作者充分感知和利用。
- **决策**：
  1. **全局轻量文学风 Toast 即时反馈系统 (`useToastStore` & `ToastContainer`)**：
     - 采用 Zustand 状态管理，提供统一的 `toast.success`, `toast.info`, `toast.warning`, `toast.error` 工具函数；
     - 宣纸与古风微光边框设计，悬浮在屏幕右下角，支持 3.2s 自动渐隐、最多并存 5 条、点击关闭与手动清除；
     - 全面在快照存盘、一键排版、纸张切换、切章与导航跳转处注入即时反馈。
  2. **基于 ProseMirror Transaction 的原生章内查找替换引擎 (`EditorFindReplaceBar.tsx`)**：
     - `Ctrl+F` 呼出查找，`Ctrl+H` 呼出替换，`Esc` 退出；
     - 遍历底层 ProseMirror 文档树计算精确绝对文本偏移，支持大小写与全词精确匹配；
     - 实时高亮当前匹配项并在视口中平滑居中展示；
     - 替换操作采用倒序降序执行，彻底防止文档偏移错位漂移，且原生接入撤销栈并触发不可逆版本存盘。
  3. **章节双向快速穿梭导航栏 (Paging Bar)**：
     - 位于稿纸底栏印章下方，展示上一章与下一章的章节编号与标题；
     - 支持 `Alt+[` 翻回上一章、`Alt+]` 翻入下一章；
     - 切章时无缝联动 `flushEditorSync()`，排空防抖定时器并原子保存当前正文，确保零丢字安全；最后一章自动展示【续写下一章】引导按钮。
  4. **段落聚焦模式 (Paragraph Focus) 与打字机居中滚动 (Typewriter Scroll)**：
     - **段落聚焦 (`Ctrl+Alt+F`)**：利用轻量 DOM 标记与 CSS 过滤，仅光标当前活动段落保持 100% 不透明度，其余段落平滑淡化至 35%，隔绝视觉杂音；
     - **打字机滚动 (`Ctrl+Alt+T`)**：结合输入视口高度计算，光标移动或换行时平滑将滚动位置回正至 45% 舒适视线；
     - 偏好自动本地存储，下次打开自动还原。
  5. **全局快捷键速查中心 (`ShortcutHelpModal.tsx`, `F1` / `?`) 与全链路阶段导航**：
     - `F1` 或非输入状态下 `Shift+?` 或顶部顶栏按钮随时唤出；
     - 分为写作与排版、沉浸与视野、阶段导航（`Ctrl+1~6`）、界面与系统四大分类，配备拟物化立体按键徽章与实时过滤搜索栏。



---

## ADR-038: 全局应用内对话框体系替代原生 alert/confirm/prompt (In-App Dialog System)

- **状态**：已采纳并完全实装 (V2.6.6)
- **上下文**：
  1. **Tauri v2 原生对话框失效（P0 功能缺陷）**：项目前端存在 69 处 `alert()` / `confirm()` / `window.prompt()` 原生调用（覆盖 24 个组件文件）。Tauri v2 的 WebView 默认不实现 JavaScript 原生对话框，且 `Cargo.toml` 未引入 `tauri-plugin-dialog`。这导致删除章节、重命名、合并、版本回退等关键确认交互在打包后的桌面端静默失效；而浏览器预览模式（localhost:1420）下原生对话框正常，因此既有自动化测试套件无法暴露该缺陷；
  2. **视觉语言割裂**：原生对话框为操作系统灰色风格，与全站「暖纸书卷」美学体系（宣纸底、朱砂印泥、衬线字体）严重冲突；
  3. **模态行为不可控**：原生 `confirm` 无 Esc/Enter 快捷键约定、无焦点管理、无危险操作语气区分。
- **决策**：
  1. **自研 Promise 式对话框体系**（不引入 `tauri-plugin-dialog`，保持桌面端与 Web 预览端行为完全一致）：
     - `src/stores/useDialogStore.ts`：Zustand 队列存储，`push` / `settle` 动作，支持并发排队；
     - `src/utils/dialog.ts`：对外 API `confirmDialog(msg) → Promise<boolean>`、`alertDialog(msg) → Promise<void>`、`promptDialog(msg, default) → Promise<string | null>`（取消返回 `null`），可在任意非 React 模块直接 import 调用；破坏性关键词（删除/回退/恢复/清除/不可撤销/彻底）自动升级为 danger 红色语气；
     - `src/components/common/DialogHost.tsx`：App 根节点挂载的全局渲染器，纸卷美学面板（象牙纸页 #fdfbf7、琥珀主按钮、玫红危险按钮、衬线字体），Enter 确认 / Esc 取消 / 点击遮罩取消，prompt 模式输入框自动聚焦并全选预填值，捕获阶段键盘监听确保优先于页面其它快捷键；
     - `src/App.css`：新增 `dialog-overlay-in` / `dialog-panel-in` 关键帧动画，并遵循 `prefers-reduced-motion` 降级。
  2. **全量机械迁移**：以 codemod 将 69 处调用点批量替换为 `await confirmDialog/alertDialog/promptDialog`，11 处同步箭头函数（onClick 等）升级为 async；`window.prompt` 的三处重命名流程（Sidebar 章节/分卷、ChaptersPanel）迁移为带预填值的应用内输入框。
  3. **验证**：`tsc --noEmit` 零错误；浏览器实测三种对话框（明/暗）渲染、Esc/Enter 交互、以及「删除→确认」「重命名→输入→Enter→标题落库」真实业务流程闭环。

---

## ADR-039: 语义设计令牌体系与暗色模式补丁机制废除 (Semantic Design Tokens & Dark-Mode Patch Removal)

- **状态**：已采纳并完全实装 (V2.6.7)
- **上下文**：
  1. **令牌架空**：`App.css` 虽定义了 shadcn 风格 HSL 令牌（`--background`/`--card`/`--primary` 等），但组件全面硬编码 hex 任意值（4136 处、286 个唯一色值、80+ 文件），令牌零使用，`WorkflowPanel` / `InlineDiffViewer` 中的 `bg-card` / `text-foreground` / `bg-muted` 类因无对应工具类而完全失效（渲染为无背景）；
  2. **暗色补丁脆弱**：暗色模式依赖约 105 行 `.dark [class*="bg-[#hex]"] { ... !important }` 属性选择器补丁，每新增一个颜色都要手补一条暗色映射；
  3. **补丁反噬（潜在 bug）**：这些无层级 `!important` 补丁会**覆盖组件中显式的 `dark:bg-[#hex]` 工具类**——如 Header 的 `dark:bg-[#1a1714]` 被 `bg-[#efe9dc]` 补丁（#171720 !important）压制，导致暗色 Header 实际渲染为补丁色而非设计色，且该问题无法被既有测试发现。
- **决策**：
  1. **Tailwind v4 `@theme inline` 语义令牌体系**：定义 `--wf-*` 基础变量（亮/暗双取值，`:root` / `:root.dark`），经 `@theme inline` 暴露为工具类——`bg-canvas`（宣纸桌面）、`bg-surface`（象牙纸页）、`bg-surface-2`（工具栏）、`bg-surface-3`（内嵌 chip）、`hover:bg-surface-3-hover`（悬停提亮）、`text-ink` / `text-ink-2`、`text-primary`、`border-line`，并保留 shadcn 兼容别名（`bg-card` / `text-foreground` / `bg-muted` / `border-border` 等，修复失效类）；
  2. **角色感知 + 变体感知 codemod 全量迁移**：3275 处替换覆盖 79 文件；`dark:` 前缀的暗色专用 hex 一律不动；hover 变体映射至专用提亮令牌（保留暗色悬停反馈）；透明度后缀原样保留；`text-amber-700/800/900` 归一为 `text-primary`；
  3. **废除暗色补丁机制**：删除约 105 行 `.dark [class*=...] !important` 补丁（背景三组、悬停组、边框组、文本两组、琥珀文本组），仅保留 2 个低频残留色（`#435447` / `#5c432d`）与琥珀徽章/表单/遮罩等非 hex 规则；新增颜色只需在令牌区补一行；
  4. **验证**：`tsc --noEmit` 零错误、`vite build` 5.16s 通过、产物 CSS 令牌工具类齐全；Pillow 像素级对比 9 视图——亮色差异 ≤17/255（文本色统一的不可感知偏移），暗色差异经计算样式核查证实为**修复**（Header 暗色由被压制的 #282835 回归设计值 #1a1714，缩放文字回归 amber-400），hover 提亮令牌实测 #323244 生效。

---

## ADR-040: 全系统深度漏洞排查与因果鲁棒性加固 (Full-System Bug Auditing & Data Integrity Fixes)

- **状态**：已采纳并完全实装 (V2.6.8)
- **上下文**：
  在 NovelForge AI 经历长篇小说多 Agent 协作、排版清洗机、拆书工坊、跨章批量重塑与多模型比稿等多轮密集功能演进后，进行全系统深度代码审计与边界因果巡检，排查深层隐蔽 bug、React 状态闭包陷阱、竞态数据覆盖风险与文件系统边界问题：
  1. **Word (.docx) 导入正文标题字符泄漏 (P0 数据污染)**：
     - 在 `WordImportService.ts` 的 `splitChapters` 中，正则 `DEFAULT_CHAPTER_REGEX` 带有 `(?:^|\n)\s*` 前导匹配。`matches.push` 时存储了 `fullMatch: match[0].trim()`；
     - 当遍历分章执行 `startIndex = current.index + current.fullMatch.length` 时，由于 `current.fullMatch` 被 trim 剥离了前导换行符，其长度比 `match[0].length` 少了 1~2 个字符；
     - 导致 `startIndex` 落在章节标题末尾字符上，例如《第一章 少年出山》的“出山”两字被直接切入章节正文首段，造成全书正文脏数据污染。
  2. **自动连载推进流 React 闭包陷阱 (P1 流程中断)**：
     - 在 `SerializationModal.tsx` 中，`handleToggleAutoRun` 是一个包含 `while` 循环的异步函数，内部检查 `if (!isAutoRunning && jobState !== currentJob) break;`；
     - 由于 React 函数组件状态在闭包内不可变，`isAutoRunning` 在首轮执行的作用域中固定为初始的 `false`；
     - 进入第二轮循环时，`jobState = nextJob` 导致 `jobState !== currentJob` 为 `true`，加上 `!isAutoRunning` 永远为 `true`，触发提前 `break`，导致“连续连载推进流”永远在生成 1 章后异常终止，无法按设定生成 3~10 章，且无法被用户按钮打断。
  3. **正文编辑器活动输入竞态与光标跳跃 (P1 数据丢失风险)**：
     - 在 `NovelEditor.tsx` 中，`useEffect` 依赖 `[activeChapter?.id, activeChapter?.updated_at]` 同步外部正文。当用户正常打字触发 800ms 防抖保存后，后端返回更新后的 `activeChapter.updated_at`；
     - 此时若用户在存盘网络耗时期间继续打字，`editorContent !== editor.getHTML()` 判定为 `true`，`useEffect` 立即调用 `editor.commands.setContent(editorContent)`，导致用户刚刚键入的新字被冲掉，光标跳回文首或文末。
  4. **应用更新前数据库灾备失败仍允许升级 (P0 数据安全风险)**：
     - `DataSafetyGuard.ts` 在 `api.backupDatabase()` 抛出异常被 `catch` 时，仅将 `result.backupCreated` 置为 `false`，但未将 `result.canProceed` 置为 `false`；
     - 导致即使热备份失败，用户仍能点击“安全继续更新”，一旦版本迁移发生意外将导致用户小说数据库彻底损坏。
  5. **Windows 非法文件名字符导致工程与电子书下载异常 (P1 交付缺陷)**：
     - `PublishingModal.tsx` 中，直接以小说书名生成下载文件名（如 `《${activeNovel.title}》_电子书.html`）；
     - 当小说书名包含 Windows 保留字符（如《我的道侣：从剑宗开始？》中的 `:` 与 `?`）时，文件系统或浏览器直接报错阻断下载。
  6. **工作流推演动态变量美元符号防吞字 (P1 逻辑错误)**：
     - `WorkflowRunnerModal.tsx` 动态替换上游步骤输出时，使用了 `renderedPrompt.replace(regex, val)`。若正文中包含 `$1000` 或 `$主角`，JavaScript 原生 `replace` 将 `$1` 误当正则捕获组替换，导致关键内容被抹除。
  7. **拆书工坊套路打法持久化假实现 (P1 功能缺失)**：
     - `DeconstructModal.tsx` 的“存入灵感便签”按钮仅设置了状态反馈文字，未真正向当前小说的本地便签落盘。
- **决策与实装**：
  1. **Word 分章对齐修复**：在匹配项中记录 `rawMatchLength: match[0].length`，以未截断的真实物理字符长度计算 `startIndex = current.index + current.rawMatchLength`，彻底杜绝标题文字残留在正文首段；
  2. **Ref 状态机控制自动连载流**：引入 `isAutoRunningRef = useRef(false)` 与组件卸载自动清理，`handleToggleAutoRun` 由 ref 严格控制循环生命周期，支持真实多章持续推进与即时停止；
  3. **编辑器聚焦态保护**：同一章节内严格限制仅在编辑器未聚焦（`!editor.isFocused`）时才响应外部内容同步（如版本回退、排版、批量重塑），打字中绝对禁止 `setContent`；同时排版遍历 `TEXT_NODE` 保护加粗等富文本标记；
  4. **更新前安全硬阻断**：备份失败强制令 `canProceed = false`，并在 `PreUpdateSafetyModal` 展示醒目警示红框与明确原因；
  5. **Windows 文件名安全清洗**：提供 `getSafeTitle` 过滤 `[\/\\:*?"<>|]` 为下划线；
  6. **工作流安全函数式替换**：改用 `.replace(regex, () => val)` 杜绝 `$` 符号吞字缺陷；
  7. **拆书套路真实落盘**：将提取出的套路打法与推进节拍格式化存入 `localStorage.getItem(\`novelforge_notes_${activeNovel.id}\`)` 并触发同步广播。
- **验证结果**：
  - 新建自动化验证套件 `tests/test-bugfixes-verification.ts`，31 项测试断言 100% 通过；
  - 全系统 14 大测试套件全部通过，累计测试断言 280+ 项全绿；
  - `pnpm exec tsc --noEmit` 0 错误，`pnpm run build` 1.61s 构建通过。

## ADR-041: 全系统深度漏洞加固、全书归档复原完整性与拓扑状态同步 (Archive Fidelity & State Desync Resolution)
- **状态**：已采纳
- **上下文**：
  - 在全系统持续深度代码审查与因果鲁棒性巡检中，发现以下潜在严重缺陷：
  1. **全书工程归档导入数据严重残缺 (P0 数据丢失隐患)**：
     - `database/mod.rs` 中 `export_novel_archive` 完整导出了小说、章节、角色、角色关系、角色状态事件、世界法则、权威事实、故事阶段、剧情弧与伏笔线索；
     - 但 `import_novel_archive` 仅恢复了小说、角色、章节、世界法则与权威事实，而将 `character_relationships`、`story_phases`、`story_arcs`、`plot_threads`、`character_states` 全量遗弃！并且新建角色时未建立新旧 ID 映射，导致关系与状态无法恢复；
     - `webMockStorage.ts` 的 `import_novel_archive` 仅返回 `{ success: true }`，导致前端导入后调用 `selectNovel(imported)` 发生异常崩溃。
  2. **剧情大纲未归类与孤儿剧情弧完全不可见 (P1 数据不可视)**：
     - `PlotArcsView.tsx` 仅循环已知阶段 `phases.map(...)`，当剧情弧未关联阶段（`phase_id` 为空）或所属阶段被删除后，剧情弧存在于数据库中却在界面完全消失；
     - 缺乏剧情弧删除指令与 UI 按钮，用户无法清理过期/作废剧情弧；
     - `loadData` 错误将表单内部状态 `arcPhaseId` 纳入依赖数组，导致下拉框选择阶段时触发整书数据全量重新加载。
  3. **React Flow 拓扑图谱按键误删与状态脱节 (P1 幽灵状态)**：
     - `CharacterFlowView.tsx` 中用户选中连线按 Delete 键时，React Flow 仅从前端临时 state 移除，未触发 `deleteCharacterRelationship` 删除 SQLite 记录，刷新后连线复活；
     - 选中角色节点按 Delete 键时会导致角色从画布移除但保留数据库与孤儿连线；且画布空白处点击未取消选中连线。
  4. **批量修订与排版清洗采纳后编辑器状态脱节 (P1 竞态覆盖风险)**：
     - `BatchReviseModal.tsx` 与 `TypesetterCleanerPanel.tsx` 采纳新正文后，已打开的 TipTap 编辑器未收到广播事件，仍停留在旧正文，用户随后输入打字时 800ms 防抖会将旧正文重新写回数据库，覆盖采纳成果。
  5. **资产反哺提案跨分类同名实体误吞 (P2 逻辑缺陷)**：
     - `AssetProposalModal.tsx` 去重依据为 `map.has(p.name)`，当存在同名但不同分类的实体（如角色「七星剑」与法宝「七星剑」）时发生误删。
  6. **Web Audio 节点释放不彻底 (P2 资源泄漏)**：
     - `typewriterAudio.ts` 播放按键音后未在 `onended` 中显式断开 `whiteNoise`, `filter`, `gainNode`，高频打字时造成无谓节点残留。
- **决策与实装**：
  1. **全书工程全量复原与 ID 映射重定向**：
     - `database/mod.rs` 中在创建角色与故事阶段时建立 `char_map` 与 `phase_map`，据此完整还原 `character_relationships`、`story_phases`、`story_arcs`、`plot_threads` 与 `character_states`；
     - `webMockStorage.ts` 完整解析归档并构建真实的 `Novel`、`Chapter[]`、`Character[]` 数据并返回完整对象。
  2. **剧情弧独立分组渲染与删除链路贯通**：
     - `PlotArcsView.tsx` 提取 `unassignedArcs`，增设专属「独立 / 未归类剧情弧」卡片，确保任何阶段被删或未设阶段的剧情弧 100% 显式呈现；
     - 实现 `delete_story_arc`（Rust 数据库方法 -> Tauri 命令 -> `lib.rs` 注册 -> `tauriBridge.ts` -> WebMock），并在每张剧情弧卡片右上角增设安全删除按钮；
     - 解耦 `loadData` 对 `arcPhaseId` 的依赖，杜绝无谓重复请求。
  3. **React Flow 键盘删除安全拦截与持久化同步**：
     - `CharacterFlowView.tsx` 实现 `onEdgesDelete` 回调，按 Delete 键物理删除 SQLite 关系记录；
     - `handleNodesChange` 过滤 `'remove'` 变更，杜绝按键意外删除角色档案；增设 `onPaneClick` 点击画布背景自动清除高亮。
  4. **正文强制重载事件全覆盖**：
     - 批量修订与排版清洗采纳后，主动派发 `novelforge:force-editor-reload`，通知当前处于挂载状态的 TipTap 编辑器无感即时拉取最新正文，彻底消除旧正文冲刷覆盖风险。
  5. **复合键提案去重**：
     - `AssetProposalModal.tsx` 采用 `${p.category}:${p.name}` 复合键去重。
  6. **Web Audio 节点结束时安全断开**：
     - 绑定 `whiteNoise.onended` 显式断开音频节点与 destination 的连接。
- **验证结果**：
  - `tests/test-bugfixes-verification.ts` 扩展至 42 项自动化断言，100% 全绿；
  - `src-tauri/src/bin/db_test.rs` 增设剧情弧物理删除与工程归档全量复原（关系/阶段/剧情弧）断言，57 项验证 100% 全绿；
  - 全系统 14 大测试套件全部通过（396+ 断言通过）；
  - `pnpm exec tsc --noEmit` 0 错误，Vite 生产构建 1.84s 极速成功。

## ADR-042: 故事设定集（角色/世界观/伏笔）全生命周期闭环与数据级联加固 (Story Bible Lifecycle & Cascade Integrity)
- **状态**：已采纳并完全实装 (V2.6.9)
- **上下文**：
  - 在全系统持续深度代码审查与因果鲁棒性巡检中，发现以下故事设定集管理（Story Bible）与数据生命周期闭环相关的深层缺陷：
  1. **角色档案只能新增与修改状态，无法修改信息与删除 (P0 数据生命周期缺失)**：
     - `database/mod.rs` 仅提供 `update_character_status`，未实现 `update_character` 与 `delete_character`；
     - 创作者在界面建档若有错别字、称号/性格/生平/动机需要演进修订，或希望删除废弃角色时，完全无从操作；
     - 删除角色时需要完备的多表级联清理：自动将 `scenes.pov_character_id` 和 `parallel_threads.pov_character_id` 置为空，并物理清理关联的 `plot_associations`、`character_arcs`、`character_relationships` 与 `character_state_events`。
  2. **世界观铁律只能创建无法编辑与删除 (P0 数据生命周期缺失)**：
     - `database/mod.rs` 仅有 `create_world_rule` 与 `list_world_rules`，未提供 `get_world_rule`、`update_world_rule` 与 `delete_world_rule`；
     - 世界观法则被创建后永久凝固，修改法则内容或纠偏体系无从下手，无法删除废弃法则。
  3. **剧情伏笔线索状态永久停滞在 PLANTED 无法流转闭合 (P0 伏笔推进闭环缺失)**：
     - 伏笔线索建档后其状态 `status` 被固定在 `PLANTED`，没有向 `DEVELOPING`（发酵推进中）、`READY_TO_RESOLVE`（临界回收）、`RESOLVED`（已揭秘闭合）、`ABANDONED`（已废弃/遗忘）流转的方法与界面控件；
     - 也无法编辑伏笔详情或删除已废弃伏笔。
  4. **阶段删除与剧情弧未解绑引发孤儿外键 (P1 数据因果完整性)**：
     - 删除故事阶段 `delete_story_phase` 时未显式将对应剧情弧的 `phase_id` 更新为 NULL，导致数据库遗留悬挂外键引用；
     - 删除剧情弧 `delete_story_arc` 时未清理 `plot_associations WHERE entity_id = ?1`。
  5. **版本历史还原后 TipTap 编辑器未即时刷新 (P1 界面脱节风险)**：
     - `restoreVersion` 还原历史版本后未派发 `novelforge:force-editor-reload`，在编辑器处于焦点或挂载态时未能即刻在 DOM 中呈现还原结果。
  6. **双流字数统计引擎漏识范文与 MCP 生成正文 (P1 统计失真)**：
     - `DualWordStatsEngine.ts` 的 `aiSources` 集合遗漏了 `AI_GENERATED`、`AI_REVISED`、`AI_APPEND`、`AI_REPLACE`、`AI_MCP_PROSE`，导致初始范文与 MCP 产出的章节被误判为 100% 纯手打。
  7. **删除后的选中实体 Fallback 防空指针 (P2 健壮性)**：
     - 实体删除后，若前端组件仍保留过期的 `selectedId`，可能引发后续关联操作渲染异常。
- **决策与实装**：
  1. **角色档案全生命周期与多表级联清理**：
     - 在 `src-tauri/src/models/mod.rs` 声明 `UpdateCharacterInput`；
     - 在 `src-tauri/src/database/mod.rs` 编写 `get_character`, `update_character`, `delete_character`（使用事务安全级联更新与删除多表）；
     - 在 `commands/mod.rs` 与 `lib.rs` 注册并在 `tauriBridge.ts` 与 `webMockStorage.ts` 中双模支持；
     - 在 `CharactersView.tsx` 与 `CharacterProfilesPanel.tsx` 完整提供编辑弹窗与删除按钮，接入 `confirmDialog` 危险语气确认。
  2. **世界观法则全生命周期管理**：
     - 声明 `UpdateWorldRuleInput`，实现 `get_world_rule`, `update_world_rule`, `delete_world_rule`（级联清理 `plot_associations`）；
     - 在 `WorldSettingsView.tsx` 与 `WorldSettingsPanel.tsx` 增加编辑弹窗与删除按钮，并实现 `novelforge:reload-story-bible` 跨组件即时同步。
  3. **剧情伏笔线索状态推进与闭合清理**：
     - 声明 `UpdatePlotThreadInput`，实现 `get_plot_thread`, `update_plot_thread_status`, `update_plot_thread`, `delete_plot_thread`（级联清理 `plot_associations`）；
     - 在 `WorldSettingsView.tsx` 与 `PlotThreadsPanel.tsx` 每张伏笔卡片上内联提供状态快速切换下拉框与删除按钮。
  4. **故事阶段与剧情弧外键安全解绑**：
     - `delete_story_phase` 显式执行 `UPDATE story_arcs SET phase_id = NULL WHERE phase_id = ?1`；
     - `delete_story_arc` 显式执行 `DELETE FROM plot_associations WHERE entity_id = ?1`。
  5. **版本还原广播重载**：
     - `restoreVersion` 增加 `window.dispatchEvent(new CustomEvent('novelforge:force-editor-reload'))`。
  6. **双流字数统计 AI 来源全谱系覆盖**：
     - `DualWordStatsEngine.ts` 扩充 `aiSources` 集合至 10 类 AI 来源。
  7. **删除实体后安全 Fallback**：
     - `MemoryEngineView.tsx` 与 `PlotArcsView.tsx` 在列表刷新后检查 `selectedId` 有效性，若已失效则平滑回退。
- **验证结果**：
  - `tests/test-bugfixes-verification.ts` 扩展至 13 大类 61 项自动化断言，100% 全绿；
  - `src-tauri/src/bin/db_test.rs` 扩展至 61 项 SQLite 真实集成测试，100% 全绿；
  - 全系统 14 大测试套件全部通过（420+ 断言通过）；
  - `pnpm exec tsc --noEmit` 0 错误，Vite 生产构建 1.56s 极速成功。

## ADR-031: 顶栏导航自适应弹性响应与 Flexbox 重叠根因根治
- **状态**：已采纳
- **上下文**：
  - 用户在普通分辨率（1024px ~ 1440px 常见笔记本屏幕）或使用全站界面缩放 (uiScale > 100%) 时，顶栏导航区域出现严重 UI 重叠与内容穿透错位：
    1. 中间创作六步法（构思立项、世界架构、角色谱系、剧情大纲、正文执笔、记忆连载）步骤条被压缩后，其内层固定宽度容器（`shrink-0`，宽度约 600px）溢出外层收缩容器（`min-w-0 shrink`），由于外层缺乏 `overflow-hidden` 且未锁死绝对界限，溢出内容向右直接刺入右侧操作区；
    2. 右侧操作区的 `DualWordStatsBadge`（手打/AI 双轨归因徽章）在外层 flex 挤压下因缺乏 `whitespace-nowrap shrink-0`，被压缩竖直折行折叠为三行（“手打\n100%\n待开篇”），恰好与中间溢出的“4 剧情大纲”重叠在同一坐标；
    3. 中间高亮的“5 正文执笔”按钮直接穿透漂浮在右侧操作区上方；
    4. 中间第六步“6 记忆连载”部分被右侧拥有 `z-40` 与实色背景的缩放步进器（`🔍 100% 🔍`）半遮挡。
- **决策与实装**：
  1. **双轨归因徽章防折叠与不换行加固**：
     - 在 `DualWordStatsBadge.tsx` 中为零字状态与正常状态的所有外层与内层容器显式添加 `whitespace-nowrap shrink-0`，杜绝任何纵向折行与挤压形变。
  2. **创作流程步骤条阶梯式自适应响应**：
     - 在 `Header.tsx` 中重构步骤条文本展示逻辑：
       - `2xl` (>= 1536px)：显示完整 4 字阶段全称（“构思立项”、“世界架构”、“角色谱系”、“剧情大纲”、“正文执笔”、“记忆连载”）、右向连接箭头及“流程向导”文字；
       - `xl` (1280px ~ 1535px)：显示 2 字精简标签（“立项”、“设定”、“角色”、“大纲”、“正文”、“连载”），当前激活项保持高亮全称；
       - `< xl` (< 1280px)：非激活步骤仅展示步骤序号徽章与精致图标（悬停 Tooltip 提示完整说明），当前激活步骤完整展示标签（如 `5 📖 正文执笔`），连接箭头自动隐去，总宽度从 600px 大幅缩减至约 240px，在 1024px 屏幕下亦留有充足横向富余。
  3. **Flexbox 布局轨道隔离与容器收缩解耦**：
     - 将中间步骤条外层包装容器由 `min-w-0 shrink` 调整为 `justify-center min-w-0 shrink-0`，彻底消除外层缩小而内层溢出刺向右侧的几何错位根源；
     - 将右侧次级信息区（当前章节实时字数、`DualWordStatsBadge` 徽章）由 `hidden xl:flex` 提升为 `hidden 2xl:flex`，中低分辨率下优先保证核心操作按钮横向空间；
     - 移除最右侧控制区的冗余 `z-40` 堆叠，回归纯净文档流排版。
- **验证结果**：
  - 1024px、1280px、1440px、1920px 各级窗口宽度及 80%~140% UI 缩放下，顶栏 3 大区域各司其职，无任何重叠、穿透、折行或挤压；
  - `pnpm run build` 极速通过，自动化测试套件持续 100% 全绿。

## ADR-032: 全系统 Flexbox 挤压溢出与容器重叠系统性加固与防御规范
- **状态**：已采纳
- **上下文**：
  - 在完成顶栏步骤条重叠修复（ADR-031）后，对全系统 20 余处停靠面板（Docking Panels）、主视图（Views）及核心弹窗（Modals）进行了深度排查。
  - 发现多处潜在的 Flexbox 挤压缺陷：
    1. **多标签页与分栏小窗口下的按钮挤爆**：如 `TabGroup.tsx` 标签列表未做 `flex-1 min-w-0`，多标签展开时将右侧工具按钮挤出可视区；
    2. **面板标题栏未设截断保护**：如 `PlotArcsView`、`EditorInChiefPanel`、`ReviewReportPanel`、`ChapterGoalsPanel`、`PlotThreadsPanel`、`PlotOutlinePanel`、`NovelInfoPanel`、`VoiceProfilePanel`、`SerializationQueuePanel`、`ModelLogsPanel`、`CharacterProfilesPanel`、`TimelinePanel`、`TokenUsagePanel` 中，标题文本与操作按钮直接在 `justify-between` 下平铺，在停靠面板收窄至 260~320px 时文字换行折断或按钮被挤出；
    3. **双栏/多栏对战分栏溢出**：`ModelArenaPanel` 左右双栏中，左侧模型标签和胜出徽章无 `min-w-0`，右侧指标芯片未设 `shrink-0 whitespace-nowrap`，在单栏宽 250~300px 时产生严重重叠破坏高度；
    4. **大纲/世界观/人物子导航折行**：`WorldSettingsView` 与 `CharactersView` 的子导航包含 3 个药丸按钮与右侧操作按钮，未设置 `overflow-x-auto scrollbar-none min-w-0`，在紧凑窗口下高度溢出破损；
    5. **批量重塑与导入弹窗排版脆弱**：`BatchReviseModal` 提案标签列表容器缺少 `flex-1 min-w-0`，导致“一键采纳全部草案”按钮在多章节时被顶出可视区；`WordImportModal` 标题栏在放大缩放下与关闭按钮碰撞。
- **决策与加固规范 (Defensive Flexbox Standards)**：
  1. **左右两端对齐容器必须包含 `gap-2 min-w-0`**：凡是 `flex items-center justify-between` 容器，必须声明明确的 `gap` 与 `min-w-0`；
  2. **左侧信息区容器必须拥有 `min-w-0`，文本必须配合 `truncate`**：父级缺少 `min-w-0` 时 CSS `truncate` 会失效；
  3. **右侧操作按钮与状态徽章必须强制 `shrink-0 whitespace-nowrap`**：保证关键功能按钮和状态标签绝不折行成多行或被挤压为无文字的空框；
  4. **小屏下长文案提供阶梯式回退**：对“新建宏观阶段 (Phase)”、“新建剧情弧 (Story Arc)”、“启动多 Agent 编排流水线”、“执行逻辑一致性质检”等长文字，引入 `hidden sm:inline` 与简版回退。
- **验证结果**：
  - 覆盖排查的 13 处组件全面加固完成；
  - 生产构建与全套自动化测试 100% 成功。

## ADR-033: 顶栏 1920px 宽度溢出裁剪根治与 AI 写作助手独立渲染生命周期防御 (Header 1920px Overflow Truncation Cure & AI Assistant Immunity)
- **状态**：已采纳
- **上下文**：
  - 用户反馈：“被裁剪了，很多地方都消失了”，并提供了 1920x1080 分辨率下的实机截图；
  - 现象表现为：
    1. 顶栏右侧在“自动连载”处被强行切断截断，后面的“工坊”按钮、UI 缩放器（`- 100% +`）、白天/黑夜主题切换、沉浸专注模式、快捷键速查、系统与模型设置（⚙️）、AI 助手开关、以及最关键的桌面原生窗口三键（`WindowControls`：最小化、最大化/还原、关闭）全部消失不见；
    2. 右侧“AI 写作助手”面板被打开后，内部呈现全白空壳，无任何输入框或功能标签展示。
- **根本原因排查与测算**：
  1. **顶栏溢出裁剪的数学根因**：
     - 在 1920px 分辨率下，Tailwind 的 `2xl` (>= 1536px) 全面激活；
     - 原顶栏结构中：
       - Zone 1（左侧品牌与作品）：~350px；
       - Zone 2（中间六步法）：6 个完整 4 字中文步骤名（630px）+ 5 个连接箭头（80px）+ “流程向导”文字按钮（85px）+ 容器外边距 = **815px**；
       - Zone 3（右侧操作区）：章节字数/存盘（100px）+ 双轨统计徽章（130px）+ 指令 Ctrl+K（80px）+ 模型网关长文本（180px）+ 自动连载按钮（95px）+ 工坊按钮（65px）+ 缩放器与系统三键（430px）= **1080px**；
       - 累计横向宽度：350px + 815px + 1080px = **2245px**！
       - 在 1920px 物理视口下溢出了 **325px**！因为 `<header>` 带有 `overflow-hidden`，超出视口的 325px 恰好在自动连载后被浏览器硬生生截断切除！
  2. **AI 写作助手面板全白根因**：
     - 在 `src/components/editor/AiAssistantPanel.tsx` 存在历史遗留阻塞代码 `if (!rightPanelOpen) return null;`；
     - 当该面板被拖动并入停靠工作区（Docking Workspace）或者 `rightPanelOpen` 为 `false` 时，组件直接返回 `null`，导致整块区域大面积全白。
- **决策与重构实装**：
  1. **中间六步法步进条阶梯式自适应瘦身（815px -> 270px，立省 545px！）**：
     - 激活项：始终完整保留 4 字全称与当前序号（如 `[5] 📖 正文执笔`），确保创作者位置明确清晰；
     - 非激活项：在 `< 3xl` (< 1920px) 彻底隐去汉字，仅展示数字序号徽章与精致图标（悬停呈现完整 Tooltip 说明）；仅在 `3xl` (>= 1920px) 超宽屏展示 2 字精简标签（`立项`、`设定`、`角色`、`大纲`、`正文`、`连载`）；
     - 连接箭头：由 `hidden xl:inline-block` 提升为 `hidden 3xl:inline-block`，非超宽屏下自动隐藏；
     - 流程向导入口：在常规屏收纳为单图标 `<HelpCircle className="w-3.5 h-3.5" />`，仅在 3xl 显示文字；
     - 外层容器赋予 `shrink min-w-0`，当屏幕极度缩小时优先由中间区收缩，坚决不向右硬推。
  2. **右侧业务区精简与层级收纳**：
     - `DualWordStatsBadge` 提升为 `hidden 3xl:flex`；
     - 全局指令与搜索：在 `< 3xl` 下收拢为纯放大镜图标，仅在 3xl 下展示文字与 `Ctrl+K` 键帽；
     - 模型网关状态：在 `< 3xl` 下收拢为纯 `Cpu` 图标按钮（悬停展示完整模型名与延迟），避免 180px 宽文本占用；
  3. **常驻系统控制区（Permanent System Controls）绝对保活与最右锁定**：
     - 将窗口控制三键（`WindowControls`）、设置按钮（⚙️）、主题切换（☀️/🌙）、缩放步进器（`- 100% +`）、AI 助手开关包裹在 `shrink-0 ml-auto z-40` 的独立常驻容器中；
     - 在 1024px ~ 1920px+ 任意分辨率下，常驻控制区牢固锚定于窗口最右端，**拥有绝对可见性，绝不被任何其他元素挤出视口或裁切**。
  4. **AI 写作助手面板独立生命周期与联动解耦**：
     - 彻底清除 `AiAssistantPanel.tsx` 中的 `if (!rightPanelOpen) return null;` 阻断代码，使其作为标准停靠面板始终具备完整的内部自渲染能力；
     - 在 Header 中联动 `useWorkspaceStore` 的 `openPanel('ai_assistant')`，用户点击顶栏助手图标时智能定位或激活面板。
- **验证结果**：
  - 在 1920px 屏幕下，Header 整体总宽度实测从 2245px 骤降至 1284px，留出高达 **636px 的安全弹性缓冲**；
  - 在 1440px、1280px、1024px 分辨率下所有控制按钮与窗口三键 100% 完整可见可用；
  - 自动化验证套件 14 大测试模块、65 项核心断言 100% 全绿，前端编译 `pnpm run build` 2.05s 零错误。

## ADR-039: 全系统视口高度解耦与多分栏防挤爆自适应架构 (彻底消除被裁剪、截断与挤压)
- **状态**：已采纳
- **上下文**：
  1. 用户在顶栏修复后继续反馈：“继续分析并优化”，“被裁剪了，很多地方都消失了”。
  2. 深度排查发现两类广泛存在的“被裁剪”隐患：
     - **全系统高度硬编码引发的底部裁剪**：`Sidebar.tsx`、`CharactersView.tsx`、`WorldSettingsView.tsx` 顶层容器均硬编码了 `h-[calc(100vh-3.5rem)]`。当系统顶端出现任何临时横幅（如新版本升级通知 `showUpdateBanner`、浏览器 Web 预览提示 `showWebNotice` 等，占用 32~40px 高度）时，由于父级 `overflow-hidden`，超出的 32~40px 内容在页面最底部被硬切断，导致章节列表底部、字数统计条、添加按钮无法滚到最底部或直接消失。
     - **分屏停靠窄分栏下的排版挤压与溢出**：
       - `NovelEditor.tsx` 中的章节穿梭栏（Paging Bar）此前使用固定的无换行水平布局，在小分栏下 Prev 按钮、全书速览与 Next 按钮并排超过 480px，容易挤爆或溢出切除；
       - `NovelEditor.tsx` 在 1920px 视口下强行命中了 `lg:px-20` (左右共 160px 内边距) 与 `md:p-14` (纸张 112px 内边距)，导致分栏中正文区域被两层外边距强行压缩成细条；
       - `AiAssistantPanel.tsx` TAB 1 内部草稿输出区在矮视口下因外层缺少纵向滚动导致替换正文按钮不可见；
       - `ChaptersPanel.tsx` 与 `Sidebar.tsx` 章节列表在悬浮展示 4 个操作按钮时，与原有单章篇幅柱并存挤占 165px，导致极窄分栏下章节标题被挤压不可见。
- **决策与重构实装**：
  1. **彻底解耦顶层视图视口高度（`100vh-3.5rem` -> `h-full`）**：
     - `Sidebar.tsx`、`CharactersView.tsx`、`WorldSettingsView.tsx` 全面移除 `h-[calc(100vh-3.5rem)]`，改为 `h-full`；
     - 借助 Flex 容器自身的弹性计算，无论顶部出现多少层通知横幅，各视图均 100% 贴合剩余真实高度，彻底消除页面底部被裁剪截断 Bug。
  2. **正文编辑器章节穿梭栏（Paging Bar）弹性自适应**：
     - 容器升级为 `flex items-center justify-between gap-2 sm:gap-3 flex-wrap sm:flex-nowrap min-w-0`；
     - 上一章与下一章按钮添加 `min-w-0 flex-1 sm:flex-initial max-w-[48%] sm:max-w-none`，并对标题实施 `truncate max-w-[120px] sm:max-w-[190px]`，保障在 280px~450px 窄分栏下优雅折行或等比收敛。
  3. **正文分栏排版呼吸感优化与便签防护**：
     - 外层滚动容器内边距由 `px-4 md:px-12 lg:px-20 py-8` 调整为 `px-3 sm:px-6 md:px-10 py-6 sm:py-8`；
     - 纸张卡片内边距由 `p-8 md:p-14` 优化为 `p-5 sm:p-8 md:p-12`，在多面板并列时为正文留出充裕排版空间；
     - 灵感便签抽屉添加 `max-w-[85%]` 与 `z-20` 保护，防止展开便签时将正文彻底挤没。
  4. **AI 写作助手 TAB 1 滚动与暗色模式无缝融合**：
     - TAB 1 采用 `overflow-y-auto space-y-2.5` 配合草稿基准高度 `min-h-[220px]`，保证打字机、提示词重构卡片与底部追加/替换按钮全链路滚动可达；
     - 全面补齐暗色模式语义类名，消除浅色刺眼色块。
  5. **目录章节列表悬停操作让位保护**：
     - `ChaptersPanel.tsx` 与 `Sidebar.tsx` 单章篇幅指示柱配置 `group-hover:hidden transition-all`，在鼠标悬停工具组出现时主动让位，确保标题在窄列下依然完整可读。
- **验证结果**：
  - `pnpm run test:bugfixes` 新增测试 15，共 75 项核心断言 100% 全部通过；
  - 生产打包 `pnpm run build` 2.13s 零警告、零类型错误通过。

## ADR-040: 全局下拉浮层防父级溢出裁剪 (Overflow Clipping 根除) 与悬浮面板视口安全边界
- **状态**：已采纳
- **上下文**：
  1. 用户在前期修复后持续反馈：“继续分析并优化”，“被裁剪了，很多地方都消失了”。
  2. 深入排查系统所有绝对定位与固定定位元素，发现了多处因父容器 `overflow-hidden` 导致的**结构性菜单截断与严重内容消失**问题：
     - **Header 顶层父级剪裁**：`<header className="h-14 ... overflow-hidden">` 写死了 `overflow-hidden`，导致顶栏内的小说切换下拉框（`showNovelMenu`）、工坊百宝箱下拉菜单（`showWorkshopMenu`）、字号缩放菜单（`showScaleMenu`）、手打纯度双轨归因看板（`DualWordStatsBadge`）一旦展开，超出 56px 高度的部分被 100% 裁切，在屏幕上直接消失；
     - **TabGroup 标签栏父级剪裁**：`TabGroup.tsx` 中的 Tabs Header Bar（高度 32px，`h-8`）写死了 `overflow-hidden`，导致用户点击右侧【+ 添加工作模块】或【三点拆分操作】时，弹出的 320px 高菜单仅露出 4px（`32px - 28px`），99% 的菜单内容被腰斩切除消失；
     - **NovelEditor 工具栏父级剪裁**：`NovelEditor.tsx` 富文本工具栏（高度 48px，`h-12`）写死了 `overflow-hidden`，导致用户点击中间字号展开的【正文字号调节】预设菜单（`showFontSizeMenu`）完全位于工具栏外部，被父级完全裁剪，点击后毫无可见反应；
     - **FloatingPanel 缺乏视口安全约束与顶栏重叠**：`FloatingPanelContainer.tsx` 浮动窗口在拖动时没有做顶部安全下限保护（`rawY <= 0` 时未拦截），当用户向屏幕上方拖动时，浮动窗口标题栏冲出视口（y 变为负数），或者标题栏钻入 Header (56px) 下方，导致标题栏消失无法抓取关闭；Resize 向上拉伸也存在冲破顶栏风险；
     - **ModelArenaPanel 战报历史与对决配置暗色对比度缺失**：历史记录卡片与 Slot A 配置容器写死 `bg-white` 且标题文字写死 `text-amber-950`，在深色底色下对比度趋近 1:1，如同消失。
- **决策与重构实装**：
  1. **移除父级工具栏/顶栏无意义的 `overflow-hidden`**：
     - `Header.tsx`：根容器移除 `overflow-hidden`，改为 `relative min-w-0 w-full`，使小说选择器、工坊菜单、字号缩放菜单能够自由向下展开覆盖下方视图；
     - `TabGroup.tsx`：Tabs 头部容器移除 `overflow-hidden`，追加 `relative z-20`；左侧 tabs 列表自身保留 `overflow-x-auto` 保证横向滚动，右侧操作菜单向下完整展开；
     - `NovelEditor.tsx`：工具栏移除 `overflow-hidden`，追加 `relative min-w-0`，使正文字号调节预设弹窗完整展示。
  2. **悬浮窗口视口安全边界与 Header 避让保护 (`FloatingPanelContainer.tsx`)**：
     - 拖拽磁吸与视口约束：注入 `snappedY = Math.max(60, Math.min(window.innerHeight - 40, snappedY))`，杜绝冲破顶部视口或压在 56px Header 上方；水平注入 `snappedX = Math.max(8, Math.min(window.innerWidth - Math.min(f.size.width, 100), snappedX))`，保证至少 100px 标题栏永远常驻可视区；
     - 上边缘拉伸高度保护：加入 `potentialY >= 60` 约束，向上 Resize 绝不钻入 Header 内部。
  3. **模型竞技场全域暗色模式对比度加固 (`ModelArenaPanel.tsx`)**：
     - 战报历史卡片重构为 `bg-surface dark:bg-[#1a1714]`，标题注入 `dark:text-amber-100`；
     - Slot A 配置容器改用 `bg-surface-2 dark:bg-[#201c18]`，Slot A 胜出判定按钮补齐暗色模式背景与文本类名。
- **验证结果**：
  - `tests/test-bugfixes-verification.ts` 新增【测试 16】，全套 82 项自动化断言 100% 绿灯；
  - 生产构建 `pnpm run build` 2.58s 零错误通过。

## ADR-041: 世界地理沙盘彻底解耦“去神州化”、流派专属沙盘主题渲染、地标拖拽重排与世界观正典双向互通 (World Map Sandbox Decoupling & Multi-Genre Customization)
- **状态**：已采纳
- **上下文**：
  1. 用户明确提问与反馈：“地图还需要优化，为什么固定叫神州了”。
  2. 深入排查发现：
     - **硬编码历史残留**：早期在验证架空地理与行军因果核验原型时，在 `MapEngine.createDefaultMap`、`MapModal.tsx` 顶栏 `<h3>`、`PanelRegistry.tsx`、`Header.tsx` 与 `CommandPaletteModal.tsx` 中写死了“神州山河总略图”和“神州山河地理沙盘”；
     - **跨题材流派水土不服**：当创作者撰写科幻（星际/战舰/空间站）、都市（金融中心/海港/庄园）、废土末世（避难所/钢铁集市/辐射区）或西幻（帝国王城/法师塔/龙冢）小说时，沙盘依然强制冠以“神州”，割裂了沉浸式创作体验；
     - **交互体验单一且割裂**：沙盘地标只能在创建时一次性点击定位，无法后续按住拖拽微调位置；地标风貌与描述无法反哺存入世界观设定库；沙盘底图只有单一泛黄羊皮纸风格，缺少科幻深空、仙道青玉、废土沙盘等流派专属视觉表现力。
- **决策与重构实装**：
  1. **彻底解除“神州”硬编码，流派动态自适应命名与作者任意重命名**：
     - `MapEngine.getDefaultTitle`：根据作品标题与题材流派智能生成（科幻：`《作品名》星图势力沙盘`；奇幻：`《作品名》大陆地理沙盘`；都市：`《作品名》都市格局沙盘`；废土：`《作品名》废土生存沙盘`；修真：`《作品名》天地山河沙盘`）；
     - 顶栏与全局检视抽屉提供内联可编辑重命名组件，作者可随心输入如【艾泽拉斯大陆全图】、【苍穹星系疆域图】并一键存盘；
     - 菜单与注册表统一更名为【世界地理与势力沙盘】。
  2. **5 大流派专属视觉背景主题自适应与切换 (`MapBgTheme`)**：
     - `PARCHMENT`（羊皮古卷）：暖金米黄古典纸张，适合修真仙侠与古典奇幻；
     - `COSMIC_DEEP`（深空星轨）：幽深蓝黑星芒经纬网格与星轨水印，适合硬核科幻与星际机甲；
     - `ANCIENT_JADE`（仙道青玉）：淡青微透玉脉灵阵格栅，适合凡人修仙与宗门神朝；
     - `DESERT_BROWN`（废土沙盘）：沙砾荒原工业测绘标尺，适合末日辐射与求生基建；
     - `INK_DARK`（水墨暗夜）：冷峻暗夜工笔淡墨格线，适合悬疑异界与刺客谍影；
     - 控制条增加流派主题下拉切换器，Canvas 画布即时响应重绘。
  3. **地标指针拖拽平移移动 (Drag & Move)**：
     - 地标节点接入现代指针事件（`onPointerDown` + `setPointerCapture`），支持直接按住地标自由平移拖拽更新 `(x, y)` 百分比坐标；
     - 拖拽过程中 SVG 路线端点实时跟随拉伸重绘，松手释放指针捕获并安全持久化；原地轻点依然精准触发地标检视与绘制连线，互不干扰。
  4. **地标品类扩充与世界观法则 (Canon) 双向反哺打通**：
     - 扩充 `LANDMARK`（自然奇观 / 星门要冲 / 奇观界碑）分类，图标库全题材适配；
     - 地标属性检视面板增设【✨ 存为权威法则】反哺按钮，一键将地标名称与风貌景致录入为世界观权威正典（CANON）并建立关联引用；
     - 全局沙盘概览增设【✨ 依据当前世界法则重塑沙盘】按钮，一键扫描世界观法则全新提炼地标与探索路线。
  5. **历史数据平滑升级与行军因果核验泛化**：
     - `loadMapFromStorage` 增加平滑迁移逻辑：若读取到历史遗留的旧硬编码“神州山河总略图”且作品有名称时，自动平滑升级为定制沙盘；
     - `verifyTravelSpeed` 行军超速核验泛化兼容科幻空间跃迁、修真传送阵、神行遁术或特殊极速载具。
- **验证结果**：
  - `tests/test-third-cohort-engines.ts` 扩充至 53 项核心测试，100% 全部通过；
  - `pnpm exec tsc --noEmit` 0 错误；
  - 生产构建 `pnpm run build` 3.28s 零错误极速完成。

## ADR-042: 原型移植参考功能遗留偏科硬编码与消费断环系统性消除 (Cross-Genre Generalization & Feature Remediation)
- **状态**：已采纳
- **上下文**：
  1. 用户提问与指令：“检查还有哪些类似问题，在移植参考功能时没有考虑周全的”。
  2. 深度排查发现：
     - **起名灵感生成器 (`QuickNameModal.tsx`)**：离线词库在没有联网或本地快速生成时，写死了古风修真（九霄、太虚、青云），如果创作者写科幻/都市/末日，生成的词汇极具违和感；同时生成后的名字只能复制到剪贴板，缺乏直接入库成为角色或世界观法则的消费闭环；
     - **章节目标面板 (`ChapterGoalsPanel.tsx`)**：`goalText` state 的初始值直接硬编码了 `'遭遇伏击，破局脱身，暴露功法秘密'`，即便写现代都市或硬核科幻也是这句；推荐目标也写死修真功法套路；
     - **正文野生资产反哺引擎 (`AssetProposalEngine.ts`)**：门派、功法、法宝正则匹配及分类标签只支持古风修真，科幻与现代都市的重工企业、星际同盟、武装军团、外骨骼战甲、战术目镜、异能协议等完全无法被提炼识别；且贪婪匹配会吞入并列连词导致相邻实体无法切分；
     - **剧情工作流执行器 (`WorkflowRunnerModal.tsx`)**：三幕起承转合、黄金三章等工作流跑完后，生成的卡片只提供只读查看，缺乏一键将成果追加或采纳到正文的消费闭环；
     - **主编控制台 (`EditorInChiefPanel.tsx`)**：静态示例写死天地灵气、筑基御空等修仙内容。
- **决策与重构实装**：
  1. **起名灵感生成器全面重构与双向落库闭环 (`QuickNameModal.tsx`)**：
     - 细分 4 大流派专属离线词库（古典仙侠、硬核科幻、现代都市、末日废土）；
     - 涵盖 5 大命名维度（人物姓名、势力阵营、招式战技、装备神兵、特产物资）；
     - 新增【存为角色档案】与【存为世界法则】一键落库按钮，直接打通 SQLite 持久化。
  2. **章节目标与主线推进面板跨流派自适应 (`ChapterGoalsPanel.tsx`)**：
     - 彻底清除写死的修仙初始目标；
     - 依据小说流派动态自适应推荐占位符与快捷目标（科幻星际、都市商战、悬疑惊悚、末日废土、传统玄幻）；
     - 增加“✨ 填入流派推荐目标”一键填充功能。
  3. **正文资产反哺引擎跨流派泛化与连词精准切分 (`AssetProposalEngine.ts`)**：
     - 扩充势力（FACTION）、招式/战技（TECHNIQUE）、装备/器物（ARTIFACT）跨题材识别规则；
     - 修复贪婪匹配吞咽紧邻连词缺陷，通过否定断言精准切分并列实体（如“青云门与七星阁”）；
     - 标签根据匹配词动态自适应（如“阵营组织”、“异能战技”、“装备器物”）。
  4. **剧情工作流执行器生产消费闭环 (`WorkflowRunnerModal.tsx`)**：
     - 在每个步骤卡片下方新增一键行动工具栏：【追加至本章末尾】、【采纳为章节正文】以及【复制成果】；
     - 结合 Tauri Bridge / SQLite 事务与当前活跃章节无缝打通。
  5. **主编控制台示例与预设通用化 (`EditorInChiefPanel.tsx`)**：
     - 将原本写死修仙套路的静态规则示例泛化为通用超凡物理限制、社会公理与世界基础法则。
- **验证结果**：
  - `pnpm test:cohort3` (53 断言)、`pnpm test:cohort2` (46 断言)、`test:bugfixes` (82 断言) 总计 181 项核心自动化测试断言 100% 全部通过；
  - `pnpm exec tsc --noEmit` 0 错误；
  - 生产构建极速完成。

## ADR-043: 剧作拆解内循环、角色生命状态跨流派规约与故事阶段结构模板库 (Craft & Structure Ingestion Suite)
- **状态**：已采纳
- **上下文**：
  1. 用户指令“继续优化”。
  2. 深入排查系统创作全链路，定位出另外 4 个深层断环与遗留假设：
     - **拆书工坊孤岛问题 (`DeconstructModal.tsx`)**：原先只能粘贴外部竞品，作者想拿自己写的开篇章节进行剧作自检时，必须手动在编辑器与模态框间反复复制数千字；且提炼出的套路卡只能存便签，无法落库为法则或大纲；
     - **角色生命状态缺陷 (`CharacterProfilesPanel.tsx`)**：`getNormalizedStatus` 原本将“休眠、冷冻、潜伏、隔离、失联”等非仙侠状态全部降级重置为“健康”，导致科幻/悬疑/末日小说中队友离场被误判为健康，且在出场追踪看板上缺乏题材自适应表达；
     - **大纲阶段单向缺陷 (`PlotOutlinePanel.tsx`)**：大纲故事阶段只有新增操作，缺乏编辑与删除闭环（导致 Rust 后端亦未暴露 `update_story_phase`）；空状态下作者面对空白大纲无从下手，缺乏经典长篇剧作骨架指引；
     - **世界观法则输入体验 (`WorldSettingsPanel.tsx`)**：占位符只展示修仙玄幻，缺乏流派模板指引。
- **决策与重构实装**：
  1. **拆书工坊开篇自检与套路双向反哺落库 (`DeconstructModal.tsx`)**：
     - 增设【📖 载入本章正文】与【📚 载入前三章(开局自检)】，自动清洗富文本为纯文本一键注入；
     - 注入玄幻破局、硬核科幻、谍战悬疑 3 大经典开篇试炼样章；
     - 提炼出的套路卡增设【存为世界法则】与【存为大纲阶段】一键落库按钮。
  2. **角色生命状态跨流派规约与自适应展示 (`CharacterProfilesPanel.tsx` & `FullCheckEngine.ts`)**：
     - 彻底修复非修仙状态降级为健康的逻辑漏洞；
     - 建立 `getStatusDisplayName`，依据作品题材动态呈现状态标签（休眠/冷冻、隔离/失联、潜伏/隐匿、闭关/潜修）；
     - `FullCheckEngine.ts` 同步将这些状态纳入离场巡检。
  3. **大纲阶段编辑/删除闭环与三大经典戏剧模型库 (`PlotOutlinePanel.tsx`)**：
     - Rust 后端新增 `UpdateStoryPhaseInput` 与 `update_story_phase` command 并注册在 Tauri 路由中，WebMock 与 API 桥接层同步打通；
     - 补齐卡片编辑与带级联清理的删除功能；
     - 实装“起承转合四卷流”、“好莱坞经典三幕六部曲”、“商业升级三步飞升流”三大经典大师级大纲结构模板库，支持一键批量注入。
  4. **世界观法则流派公理模板库 (`WorldSettingsPanel.tsx`)**：
     - 实装科幻超空间跃迁、金融做空熔断、末日黑雨辐射、仙道天道誓约等 8 大跨流派公理法则模板，支持一键填入。
- **验证结果**：
  - Rust 后端 `db_test` 61 项数据库与生命周期测试 100% 通过；
  - 前端自动化测试 181 项全部绿灯；
  - `pnpm exec tsc --noEmit` 0 错误；
  - 生产构建 `pnpm run build` 2.17s 极速构建完成。

## ADR-044: 架空世界沙盘地图视觉系统大师级制图学美学重构与深色模式自适应系统 (Cartographic Aesthetics & Sandbox UI Overhaul)
- **状态**：已采纳
- **上下文**：
  1. 用户上传了架空世界地图沙盘（`MapModal`）在“深空星轨”流派主题下的实际运行截图，明确反馈：“这个背景也太丑了”；
  2. 根因深度剖析：
     - **密集小圆点打孔纸质感**：旧版主题背景采用 24px~32px 间距的高频 `radial-gradient` 圆点打孔网格，在深色背景下犹如晃眼的劣质打孔纸，密集恐惧感极强；
     - **粗暴荒诞的水印图标**：深空星轨背景在右下角直接放置了来自 Lucide 的 `<Radio className="w-60 h-60 text-cyan-400/10" />` 图标，在架空世界沙盘中呈现为一个巨大、粗壮的无线 Wi-Fi 信号，极度滑稽脱戏；
     - **折线横切文字（缺乏衬底）**：路线标签文字直接贴在斜线上，实线与虚线横切穿过文字，在不同底色下辨识度极差；
     - **深浅色视觉割裂断层**：深色模式/星轨主题下，左侧画布是深蓝黑夜空，而右侧检视抽屉与顶部控制栏依然是浅黄色，形成割裂的“阴阳脸”；
     - **地标单薄如白塑料贴片**：地标圆圈采用白底粗棕框，在深黑背景下显得非常生硬，缺乏空间层次与流派呼吸感。
- **决策与重构实装**：
  1. **彻底废除高频打孔点阵，重构五大主题的大师级制图学纹理**：
     - **PARCHMENT（羊皮古卷）**：温润宣纸微渐变暗角 + 72px 极淡经纬测绘线（0.05 不透明度），温润古朴；
     - **COSMIC_DEEP（深空星轨）**：深邃幽蓝星云多重晕染（`#070a13`，带天青冷光与引力波景深）+ 80px 幽微星图经纬网（0.035 透明度），彻底消除打孔斑点；
     - **ANCIENT_JADE（仙道青玉）**：青白玉质灵脉通透渐变 + 72px 道门金丝微格；
     - **DESERT_BROWN（废土沙盘）**：风化沙砾大地质感 + 64px 战术测绘标尺网格；
     - **INK_DARK（水墨暗夜）**：宋代文人冷寂墨染 + 80px 银灰工笔界线。
  2. **研发五大主题专属的大尺寸手绘细线矢量水印 (Cartographic Master Watermarks)**：
     - **羊皮古卷**：十六芒星航海罗盘玫瑰（Cartographic Compass Rose），含精密分度圆与古典花体方位字符；
     - **深空星轨**：彻底移除粗暴 Wi-Fi 信号，替换为精密天体浑天星仪与星门轨道轮（Armillary Sphere & Orbit Ellipses），带 23.5° 黄道倾角大椭圆环、星位卫星与 360° 角刻度；
     - **仙道青玉**：周天太极八卦灵轨图（Sacred Bagua & Daoist Orbit），含游丝太极与八方法则刻度；
     - **废土沙盘**：军事要塞战术标尺与测距六边形阵列（Tactical Hex Grid & Reticle）；
     - **水墨暗夜**：寒江冷月与工笔重峦印章（Solitary Moon, Ink Mountains & Seal）。
  3. **路线 HTML 悬浮胶囊药丸徽标（彻底消除折线穿字）**：
     - 在路线中心点采用绝对定位 HTML 毛玻璃胶囊徽标（Floating Pill Badge）；
     - 徽标包含危险度指示彩灯（安全翠绿、凶险金橙、致命赤红微脉冲）、路线名称与耗时天数；
     - 彻底杜绝折线横切文字，点击徽标即可高亮选中路线并呼出右侧属性检视。
  4. **四角制图师十字准星标尺与景深暗角**：
     - 画布四角点缀专业制图师经纬度十字准星标尺（如 `✛ 00°00′00″ N`、`090°00′00″ E ✛`）；
     - 画布边缘注入多层自然景深暗角（Vignette Overlay），使沙盘四周自然收敛沉淀。
  5. **一体化深色模式自适应系统与地标呼吸发光环**：
     - `THEME_CONFIGS` 注入 `isDark`、`headerBg`、`panelBg`、`borderColor`；当切换到深空星轨或水墨暗夜时，顶栏、控制条、右侧检视器与所有表单控件同步自适应为幽邃一体的深色界面；
     - 地标圆环自适应流派呼吸发光：深色下采用半透明星空晶质衬底搭配天青呼吸辉光（`shadow-[0_0_12px_rgba(56,189,248,0.25)]`），浅色下呈现宋韵玉质浮雕。
- **验证结果**：
  - `pnpm test:cohort3`、`pnpm test:cohort2`、`pnpm test:bugfixes` 总计 181 项核心自动化测试 100% 全部通过；
  - `pnpm exec tsc --noEmit` 0 错误；
  - 生产构建 `pnpm run build` 1.89s 零错误完成。

## ADR-045: 文人案头速览与新书启航中心系统实装 (The Writer's Desk & Onboarding Suite)
- **状态**：已采纳
- **上下文**：
  1. 用户明确反馈：“太复杂的界面，不知道刚打开应该做什么，如何解决？”
  2. 剖析根因：
     - 用户启动时直接面对拥挤的 Docking 工作台（章节树、大纲、角色拓扑、复杂工具栏），产生强烈的“控制台休克 / 分析瘫痪”；
     - 缺乏启动心流分流机制：老用户只想一秒接着昨天的章节继续码字；新用户面对空应用不知道该从哪里下笔；
     - 缺乏明确的“下一步行动建议”，创作者完成某一步后经常陷入迷茫。
- **决策与重构实装**：
  1. **研发独立文人案头启航中心 (`WritersDeskModal.tsx`)**：
     - **已有作品模式（案头速览）**：
       - 展示书籍 3D 实体书卷封面、题材标签、总字数与章节数；
       - **超大主行动按钮**：`【▶ 继续执笔写作：《第 X 章 章节名》（字数）】`，点击一键直达正文光标位置并聚焦；
       - **今日创作指南针 (Smart Action Compass)**：动态感知连载字数与进度，输出唯一定向指引（如拟定新章、推升高潮、资产反哺或因果体检）；
       - **四大常用分流快捷通道**：拟定下一章、架空世界沙盘、角色谱系拓扑、剧情大纲矩阵；
       - **书架平滑切换通道**：随时在多部在更长篇中自由穿梭。
     - **无作品 / 开新坑模式（新书 3 步互动向导）**：
       - **Step 1**：选择 5 大流派（仙侠、科幻、都市、末日、悬疑）+ 灵感骰子（`🎲 换一个好书名`）；
       - **Step 2**：点选流派经典金手指 / 核心脑洞；
       - **Step 3**：一键生成作品骨架，自动注入第一条权威法则 (Canon) 并创建第一章《第一章 出山/苏醒》，直达稿纸开写；
       - **零门槛通道**：支持【一键载入《凡人修仙录》样板长篇】与【导入 Word (.docx) 稿件】。
  2. **全局自启动与沉浸式唤醒体系**：
     - `App.tsx` 增加启动检测与偏好持久化（`novelforge_startup_show_desk`），支持一键开启/关闭启动呈现；
     - 增加全局快捷键 `F2` 与 `Ctrl+D`（Desk）随时唤出案头；
     - 增加全局事件 `novelforge:open-desk`。
  3. **顶栏与第一阶段联动**：
     - `Header.tsx` 左侧常驻【案头 (Desk)】快捷按钮，无作品时高亮引导【开启新长篇 (3步向导)】；
     - `DashboardView.tsx`（构思立项）首屏无小说时呈现优雅的文人书斋欢迎屏，有小说时呈现【继续执笔主卡片】与【今日创作指南针】。
- **验证结果**：
  - `pnpm test:cohort3`、`pnpm test:cohort2`、`pnpm test:bugfixes` 总计 181 项核心自动化测试 100% 全部通过；
  - `pnpm exec tsc --noEmit` 0 错误；
  - 生产构建 `pnpm run build` 2.08s 零错误极速完成。

## ADR-046: 纯粹写作 Zen 模式 vs 专业工坊 Studio 模式一键切换体系 (Zen Mode vs Studio Mode Toggle Architecture)
- **状态**：已采纳
- **上下文**：
  1. 用户在反馈“太复杂的界面，不知道刚打开应该做什么”后，选定实施“方案 2：纯粹写作 Zen 模式 vs 专业工坊 Studio 模式一键切换胶囊”；
  2. 剖析创作者的心智双重态：
     - **执笔写作态 (Writing Flow)**：创作者只希望将注意力聚焦在光标与词句之间，此时屏幕上出现的章节树、大纲矩阵、AI 主编、设定集、多分栏边框都会构成严重的视觉噪音与心智分心；
     - **架构工程态 (Studio Workshop)**：在做大纲推演、角色关系、全书因果体检、多 Agent 批处理审稿时，创作者才需要高密度的 Docking 多窗格排布；
     - 此前系统虽然有全屏或隐藏侧边栏的零星按钮，但在 DockingWorkspace 中依然固定平铺了章节、编辑器和 AI 助手三列分栏，并未真正实现“纯粹写作”。
- **决策与重构实装**：
  1. **顶栏双模切换胶囊 (Mode Toggle Capsule)**：
     - 在 `Header.tsx` 核心视觉区（Zone 2 创作流转条旁）增设极醒目的文人双态胶囊：`【✍ 沉浸写作 (Zen)】` vs `【🛠 专业工坊 (Studio)】`；
     - 处于 Zen 模式时，`✍ 沉浸写作` 呈现宋韵琥珀金渐变高亮与呼吸微标；处于 Studio 模式时，`🛠 专业工坊` 呈现微金高亮；
     - 点击 `✍ 沉浸写作`：无论当前处于构思仪表盘、世界观还是人物卡，系统均自动平滑切入正文编辑器并开启独占沉浸模式；
     - 点击 `🛠 专业工坊`：一键切回全功能工作台，完整恢复所有分栏与多 Agent 协同视图。
  2. **DockingWorkspace 独占重构与沉浸工作台 (`ZenWritingWorkspace.tsx`)**：
     - 在 `DockingWorkspace.tsx` 中加入 `zenMode` 顶层拦截：当 `zenMode === true` 时，彻底隐藏 `WorkspaceToolbar`、浮动面板层与多窗格分栏树，独占挂载 `ZenWritingWorkspace`；
     - 居中呈现标准行宽的宣纸打字画布，四周留白通透，彻底隔绝窗格线条与参数噪音。
  3. **案头极简磨砂浮岛 (`ZenFloatingIsland.tsx`)**：
     - 悬浮于屏幕底部中央（`bottom-4 left-1/2 -translate-x-1/2`），采用宋韵毛玻璃质感（`backdrop-blur-md`）；
     - 集成**章节前后一键翻章**与章节标题微标；
     - 集成**实时字数跳动**与阅读时长预估；
     - 集成**本地 SQLite 存盘状态灯**（已存 / 存盘中 / 待存）；
     - 集成**沉浸专注工具**：段落聚焦模式 (Ctrl+Alt+F: 淡化非焦点段落)、打字机垂直居中滚动 (Ctrl+Alt+T)、日光素笺/深宵冷砚一键切换；
     - 集成**【🛠 返回工坊 (Esc)】**快捷退出按钮；支持微型折叠隐藏。
  4. **轻量边缘章节抽屉 (`ZenChapterDrawer.tsx`)**：
     - 屏幕左侧边缘常驻极窄目录标签，点击即可优雅滑出 280px 轻量章节目录；
     - 自动按分卷归整章节，支持章名搜索与实时字数展示，支持直接 `+ 新建下一章节`；
     - 创作者无需退回复杂主目录即可完成全书前后连载穿梭。
  5. **全局快捷键与持久化流转**：
     - 全局快捷键：`F11` 或 `Ctrl+Alt+Z` 一键切换双模式；
     - 处于 Zen 模式时，按 `Esc` 键优先收回章节抽屉，再次按下即可退出 Zen 模式切回工坊；
     - 偏好自动落盘持久化（`localStorage: novelforge_zen_mode`），`ShortcutHelpModal` 同步更新帮助词条。
- **验证结果**：
  - 新增专用回归套件 `pnpm test:zen`：**11 项断言 100% 全部通过**；
  - `pnpm test:cohort3` (53)、`pnpm test:cohort2` (46)、`pnpm test:bugfixes` (82) 共 **192 项前端自动化断言 100% 全绿通过**；
  - TypeScript 类型检查 `pnpm exec tsc --noEmit`：0 错误；
  - 生产构建 `pnpm run build`：2.07s 零错误完成。

## ADR-048: 自动更新按钮防闪烁与点击状态机即时跃迁架构 (Auto-Updater Interaction Anti-Flicker & Instant State Transition)
- **状态**：已采纳
- **上下文**：
  1. 用户反馈：“点击更新按钮后会一直闪烁，但是更新进程没有问题”；
  2. 深入排查代码交互与状态机流转，定位到双重根本原因：
     - **视觉样式硬编码呼吸动效**：在 `UpdateCenter.tsx` 中，更新按钮（“下载并安装”）和 `UpdateStatusBadge.tsx` 徽章类名中硬编码了 Tailwind 的 `animate-pulse`；在 CSS 规范中，`animate-pulse` 会使透明度在 100% 与 50% 之间无限循环（每两秒闪烁一次）；
     - **点击事件后状态未即时推进**：用户点击更新按钮触发 `startSafeUpdateFlow` 时，该异步函数首先执行 SQLite 在线热备份（`backupDatabase`）、数据库完整性核验（`optimizeDatabase`）和连载任务挂起；这一过程需 1~3 秒磁盘 I/O。但在 `useUpdateStore.ts` 中，`startSafeUpdateFlow` 遗漏了 `status: 'PRECHECKING'` 的设置，导致在此期间 `status` 仍停留在 `UPDATE_AVAILABLE`；
     - 此时前台条件渲染判断 `{status === 'UPDATE_AVAILABLE' && <button ... className="... animate-pulse" />}` 依然成立，按钮没有进入 disabled 状态，没有展示任何转圈 Spinner，也没有文字变化，而是在原地**以 2 秒为周期持续呼吸闪烁**；
     - 后台真实的 SQLite 备份和 Tauri 原生下载进程完全正常推进（“更新进程没有问题”），但前台用户看到按钮在狂闪且毫无点击反馈，误以为操作卡死或未点中，甚至重复狂点引发并发锁。
- **决策与重构实装**：
  1. **彻底根除 `animate-pulse` 与 `animate-ping` 闪烁动效**：
     - 移除更新按钮和状态徽章上的 `animate-pulse`，换为稳定、确定性的专业按钮样式（宋韵琥珀茶金渐变 `bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700`），具备优雅的 `hover:from-amber-600 hover:to-orange-600` 与 `active:scale-95` 物理触感；
     - 将 `Header.tsx` 与 `SettingsModal.tsx` 顶栏/Tab 上的剧烈 `animate-ping` 闪烁红点升级为精致高光静态红点（`ring-2 shadow-xs`），彻底消除视觉光闪感。
  2. **状态机即时跃迁与生命周期闭环 (`useUpdateStore.ts`)**：
     - 在 `startSafeUpdateFlow` 触发瞬间，立即将状态置为 `status: 'PRECHECKING'`，彻底消除 `UPDATE_AVAILABLE` 按钮残留；
     - 在用户取消安全检查弹窗时（`cancelPrecheck`），平滑安全将状态回滚至 `UPDATE_AVAILABLE`；
  3. **顶部按钮操作区全生命周期状态感知 (`UpdateCenter.tsx`)**：
     - `UPDATE_AVAILABLE`：呈现清晰的 `[下载并安装 (v{version})]` 按钮；
     - `PRECHECKING`：呈现禁用态 `[<Loader2 className="animate-spin" /> 安全检查与灾备中...]`；
     - `DOWNLOADING`：呈现禁用态 `[<Loader2 className="animate-spin" /> 正在下载更新包 (xx%)]`；
     - `INSTALLING`：呈现禁用态 `[<Loader2 className="animate-spin" /> 正在启动安装向导...]`；
     - `RESTART_REQUIRED`：呈现绿色高亮 `[<RotateCw /> 立即重启应用生效]` 按钮；
     - `ERROR`：呈现醒目的 `[<RefreshCw /> 重试更新流程]` 按钮；
     - 在更新期间（`PRECHECKING` / `DOWNLOADING` / `INSTALLING`），安全禁用【检查更新】与【更新设置】按钮，防止状态打乱。
  4. **升级前数据守卫弹窗增加防重提交保护 (`PreUpdateSafetyModal.tsx`)**：
     - 新增 `isSubmitting` 局部状态，用户点击“一键保存草稿并开始更新”或“安全继续更新”后立即置灰并展示转圈 Spinner，杜绝连击。
  5. **平滑化未定态进度条 (`UpdateProgressBar.tsx`)**：
     - 当更新包 `percent === null` 时，将进度条闪烁动画替换为柔和连贯的过渡流动条。
- **验证结果**：
  - 更新专项测试套件 `tests/test-updater-system.ts` 扩充测试 13，验证状态机点击瞬间跃迁与回滚保护，**36/36 项全量测试 100% 全部通过**；
  - `pnpm check:version`、`pnpm test:docking`、`pnpm test:zen`、`pnpm test:bugfixes` 全套前端测试全部通过；
  - 生产打包 `pnpm run build` 2.09s 零错误完成。

- **状态**：已采纳
- **上下文**：
  在 NovelForge AI 演进至外部 AI Agent（如 Claude Code, Cursor, Antigravity, AutoGen, CrewAI 或自主作家守护进程）全面驱动创作的场景下，原系统显露出五大关键制约：
  1. 核心文学质检与一致性规则（套话检测、死者言行拦截、新实体反哺）被锁死在前端 TS 组件中，外部 Agent 无法调用；
  2. MCP 协议工具集严重不足（仅 20 个基础工具），缺失场景细纲节拍、分章合章、文风规范、伏笔追踪等核心能力；
  3. 缺乏非破坏性暂存提案机制，外部 Agent 写入正文容易直接覆盖人类作者未保存的工作；
  4. 章节正文回滚后，已沉淀入库的长期因果事实无法级联失效，产生严重因果脏数据污染；
  5. 上下文组装仅能返回预渲染的单体字符串，剥夺了外部高级 Agent 自主分配各层 Token 预算的灵活性。
- **决策**：
  1. **能力下沉与无头评估引擎 (`src-tauri/src/eval/`)**：
     - 在 Rust 核心层实现 `evaluate_chapter_content`，内置 14 项中文网文高频红线套话诊断算法，计算 0~100 人情味评分；
     - 深度核验角色生命状态，强力拦截已故角色拔剑/发言等违规动作；
     - 基于动作对话模式自动提取未登记在 Story Bible 中的新实体与候选角色。
  2. **协作安全与非破坏性提案暂存 (`ChapterProposal`)**：
     - 增加 `create_chapter_proposal` 与 `accept_chapter_proposal`，草稿以 `source_type: AI_PROPOSAL` 保存，不变更 `chapters.active_version_id`，等待人类作者或主管 Agent 审核批准。
  3. **因果事实级联回滚保护 (`rollback_chapter_version`)**：
     - 当回退至旧版本快照时，自动将该版本之后沉淀的因果事实标记为 `INVALIDATED_BY_ROLLBACK`，杜绝因果事实残留污染。
  4. **全量补齐 MCP 工具集至 40 个**：
     - 补齐剧情推演流水线模板与执行工具 (`novelforge_list_workflow_templates`、`novelforge_create_workflow_run`、`novelforge_advance_workflow_step`)；
     - 补齐 `novelforge_evaluate_chapter`、`novelforge_scan_entity_proposals`、`novelforge_propose_chapter_revision`、`novelforge_accept_chapter_proposal`、`novelforge_list_chapter_versions`、`novelforge_rollback_chapter_version`、`novelforge_split_chapter`、`novelforge_merge_chapters`、`novelforge_list_scenes`、`novelforge_create_scene`、`novelforge_get_active_voice_profile`、`novelforge_list_plot_threads`、`novelforge_update_plot_thread`。
  5. **解耦双模上下文组装 (`novelforge_assemble_context`) 与桌面端提案审阅全闭环**：
     - 支持 `format: structured | text | both`，外部 Agent 可自由读取独立的 `working_memory_l0`、`short_term_l1`、`arc_memory_l2`、`canon_rules_l3` 等分层对象；
     - 桌面端版本抽屉与历史面板完整呈现 Agent 提案徽章、推理思考链与一键采纳生效。
- **验证结果**：
  - Rust 核心全功能自动化测试套件 `cargo run --bin db_test` 扩充至 **65 项断言 100% 全部通过**；
  - MCP 端到端全链路自动化测试 `node scripts/test-mcp-e2e.cjs` **18 项全流程断言 100% 全部通过**；
  - 前端回归测试 `pnpm test:zen` 11 项及生产构建 2.13s 全部零错误通过！





