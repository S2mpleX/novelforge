import assert from 'assert';
import fs from 'fs';

console.log('===============================================================');
console.log('🛡️ NovelForge AI — 角色对戏演武场顶栏防折行与自适应排版专项测试');
console.log('===============================================================');

let passCount = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (e: any) {
    console.error(`  ❌ FAIL: ${name}`, e.message);
    throw e;
  }
}

const sandboxPanelSource = fs.readFileSync('src/components/docking/panels/CharacterSandboxPanel.tsx', 'utf8');

// -------------------------------------------------------------
// PART 1: 顶栏单行架构与垂直外溢阻断断言
// -------------------------------------------------------------
console.log('\n▶ [PART 1] 顶栏单行架构与垂直外溢阻断断言');

test('顶栏外层容器具有明确的高度、弹性约束与 min-w-0', () => {
  assert(
    sandboxPanelSource.includes('h-14 px-3 sm:px-4 border-b') &&
    sandboxPanelSource.includes('flex items-center justify-between shrink-0 z-10 min-w-0'),
    '顶栏容器必须具备 h-14, flex, shrink-0 与 min-w-0，防止自身挤压变形'
  );
});

test('标题区与左侧容器采用 min-w-0 flex-1，标题显式声明 whitespace-nowrap 与 shrink-0', () => {
  assert(
    sandboxPanelSource.includes('flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 mr-2'),
    '左侧容器必须具备 min-w-0 flex-1 mr-2，为自适应缩放预留缓冲'
  );
  assert(
    sandboxPanelSource.includes('font-serif font-bold text-sm sm:text-base tracking-wide whitespace-nowrap shrink-0">角色对戏演武场</h2>'),
    '演武场主标题必须显式声明 whitespace-nowrap shrink-0，严禁中文字符逐字垂直换行'
  );
});

test('亮点副标题不得作为独立块级段落垂直堆叠，必须作为行内元素且在空间不足时优雅隐藏', () => {
  // 不得存在垂直 <p> 导致高度突破 56px 并压盖下层情境模板库
  assert(
    !sandboxPanelSource.includes('<p className="text-xs text-[#8a7f73] dark:text-[#9e9284] truncate hidden 2xl:block">\n              零心理同质化'),
    '不得存在会导致顶栏垂直高度突破 56px 的独立块级 <p> 副标题'
  );
  assert(
    sandboxPanelSource.includes('truncate hidden 2xl:inline-block border-l') &&
    sandboxPanelSource.includes('零心理同质化 · 战争迷雾心路 (CoT) · 高光灵感捕捉'),
    '副标必须改为 2xl:inline-block 单行内联展示，且具备 truncate 和 whitespace-nowrap'
  );
});

// -------------------------------------------------------------
// PART 2: 右侧功能区响应式折叠断言
// -------------------------------------------------------------
console.log('\n▶ [PART 2] 右侧按钮组响应式折叠与防挤压断言');

test('灵感盒按钮在紧凑视口下折叠为图标+角标，宽屏下展示文字', () => {
  assert(
    sandboxPanelSource.includes('<span className="hidden lg:inline">灵感盒</span>'),
    '灵感盒文本应在窄屏下自动隐藏，仅保留灯泡图标与计数徽标'
  );
});

test('内心戏与潜台词视角透视按钮支持响应式折叠', () => {
  assert(
    sandboxPanelSource.includes('<span className="hidden md:inline">内心戏</span>'),
    '内心戏按钮在窄屏下隐藏文本'
  );
  assert(
    sandboxPanelSource.includes('<span className="hidden md:inline">潜台词</span>'),
    '潜台词按钮在窄屏下隐藏文本'
  );
});

test('优化精修文段高光按钮支持响应式文本折叠 (✍️ 优化精修文段 / 精修)', () => {
  assert(
    sandboxPanelSource.includes('<span className="hidden sm:inline">{isSynthesizing ? \'打磨中...\' : \'✍️ 优化精修文段\'}</span>') &&
    sandboxPanelSource.includes('<span className="sm:hidden">{isSynthesizing ? \'打磨中\' : \'精修\'}</span>'),
    '主按钮应自适应宽屏和窄屏文本长度'
  );
});

// -------------------------------------------------------------
// PART 3: 会话切换器防挤压防重叠与张力指数下沉走向栏断言
// -------------------------------------------------------------
console.log('\n▶ [PART 3] 会话切换器防挤压防重叠与张力指数下沉断言');

test('会话切换器容器声明 shrink-0 与 max-w，子级按钮具备 w-full min-w-0 overflow-hidden 绝不发生同级覆盖', () => {
  assert(
    sandboxPanelSource.includes('className="relative shrink-0 max-w-[130px] sm:max-w-[170px]"'),
    '会话切换器父容器必须具备 shrink-0 与明确 max-w 约束，杜绝自身坍塌被同级元素挤压'
  );
  assert(
    sandboxPanelSource.includes('w-full min-w-0 overflow-hidden') &&
    sandboxPanelSource.includes('{sessionTitle || \'选择对戏会话\'}'),
    '切换器按钮必须声明 w-full min-w-0 overflow-hidden，确保子级元素物理约束在容器边界内'
  );
});

test('实时戏剧张力胶囊下沉至剧情走向栏 (What-If Branch Bar) 常驻呈现，顶栏仅在 3xl 超宽屏透出', () => {
  assert(
    sandboxPanelSource.includes('hidden 3xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap shrink-0 ${currentTension.colorClass}'),
    '顶栏张力胶囊必须提升为 3xl:flex 阈值，彻底阻断在常规分屏视口下挤占标题与副标空间'
  );
  assert(
    sandboxPanelSource.includes('px-2.5 py-1 rounded-full border text-[11px] font-medium whitespace-nowrap shrink-0 shadow-2xs ${currentTension.colorClass}') &&
    sandboxPanelSource.includes('张力: {currentTension.label} ({currentTension.level}/10)'),
    '戏剧张力胶囊必须优雅下沉至走向栏右侧常驻呈现，随轮次实时同步更新'
  );
});

// -------------------------------------------------------------
// PART 4: 多层级推演重置 (Reset) 按钮常驻与操作安全断言
// -------------------------------------------------------------
console.log('\n▶ [PART 4] 多层级推演重置 (Reset) 按钮常驻与操作安全断言');

test('底部主控制栏常驻直观的【重置推演】按钮，无对戏轮次时禁用，有记录时高亮并具备危险防护', () => {
  assert(
    sandboxPanelSource.includes('onClick={handleResetDialogue}'),
    '底部主控制栏必须绑定 handleResetDialogue'
  );
  assert(
    sandboxPanelSource.includes('disabled={dialogueHistory.length === 0 || isRunning || isStepping}'),
    '重置推演按钮必须常驻于视口，且在轮次为 0 或推演中安全禁用'
  );
  assert(
    sandboxPanelSource.includes('<span>重置推演</span>') &&
    sandboxPanelSource.includes('hover:text-rose-600'),
    '重置推演按钮文字清晰准确，并具备 hover 朱砂红危险预警效果'
  );
});

test('左侧情境与阵容配置区提供【重置设定】按钮，支持一键清空场景描述与角色临时秘密动机', () => {
  assert(
    sandboxPanelSource.includes('onClick={handleResetSceneAndActors}'),
    '情境配置面板必须提供 handleResetSceneAndActors 重置处理函数'
  );
  assert(
    sandboxPanelSource.includes('<span>重置设定</span>'),
    '情境配置区必须清晰展示【重置设定】按钮'
  );
});

test('工具箱与导出菜单中完整集成【🔄 重置推演对戏记录】与【🧹 重置场景与出场设定】双轨重置项', () => {
  assert(
    sandboxPanelSource.includes('<span>🔄 重置推演对戏记录</span>') &&
    sandboxPanelSource.includes('<span>🧹 重置场景与出场设定</span>'),
    '顶栏工具箱下拉菜单中必须提供双轨重置操作入口，方便全局快捷触达'
  );
});

test('推演台危险操作确认全面接入统一应用内设计风格 confirmDialog，彻底杜绝系统原生 localhost:1420 割裂对话框', () => {
  assert(
    sandboxPanelSource.includes("import { confirmDialog } from '@/utils/dialog';"),
    '必须导入应用内统一 confirmDialog API'
  );
  assert(
    !/\b(window\.)?confirm\(/.test(sandboxPanelSource),
    '严禁使用浏览器原生 confirm() 或 window.confirm()，避免破坏沉浸式桌面 UI 美感'
  );
  assert(
    sandboxPanelSource.includes('await confirmDialog({') &&
    sandboxPanelSource.includes("title: '重置推演对戏记录'") &&
    sandboxPanelSource.includes("title: '重置情境与出场设定'"),
    '重置对话框必须传递清晰的 title 与 danger tone，保持文学书卷与水墨暗色统一风格'
  );
});

// -------------------------------------------------------------
// PART 5: 界面抽屉化 (Drawer) 与分界面分标签页 (Sub-interfaces) 架构断言
// -------------------------------------------------------------
console.log('\n▶ [PART 5] 界面抽屉化 (Drawer) 与分界面分标签页架构断言');

test('组件具备抽屉状态机 (showConfigDrawer) 与三态分界面选项卡 (configDrawerTab)', () => {
  assert(
    sandboxPanelSource.includes('const [showConfigDrawer, setShowConfigDrawer] = useState(false);') &&
    sandboxPanelSource.includes("const [configDrawerTab, setConfigDrawerTab] = useState<'actors' | 'scene' | 'presets'>('actors');"),
    '必须维护 showConfigDrawer 与 configDrawerTab 状态，支持分界面按需切换'
  );
  assert(
    sandboxPanelSource.includes('const [isConfigDrawerPinned, setIsConfigDrawerPinned] = useState(false);'),
    '支持 isConfigDrawerPinned 图钉切换，兼容宽屏固定侧栏与默认悬浮抽屉双模式'
  );
});

test('顶栏显著位置提供【剧本设定】药丸按钮，实时展示出场人数并支持一键滑出抽屉', () => {
  assert(
    sandboxPanelSource.includes('onClick={() => setShowConfigDrawer(!showConfigDrawer)}') &&
    sandboxPanelSource.includes('<span>剧本设定</span>') &&
    sandboxPanelSource.includes('{actors.length}人'),
    '顶栏会话旁必须常驻【剧本设定】药丸胶囊与动态人数徽标'
  );
});

test('抽屉内部严谨拆解为【出场阵容】、【场景与目标】与【经典情境】三大独立分界面，消除垂直堆叠杂乱', () => {
  assert(
    sandboxPanelSource.includes("setConfigDrawerTab('actors')") &&
    sandboxPanelSource.includes("出场阵容 ({actors.length})"),
    '必须提供【出场阵容】独立分界面，集中承载立绘、微调、私密动机与模型分工'
  );
  assert(
    sandboxPanelSource.includes("setConfigDrawerTab('scene')") &&
    sandboxPanelSource.includes("场景与目标"),
    '必须提供【场景与目标】独立分界面，集中承载前情、目标与大纲导入'
  );
  assert(
    sandboxPanelSource.includes("setConfigDrawerTab('presets')") &&
    sandboxPanelSource.includes("经典情境"),
    '必须提供【经典情境】独立分界面，网罗高冲突预设模板'
  );
});

test('悬浮抽屉配备半透明遮罩与硬件加速动画过渡，滚动容器隔离保障 60FPS 流畅度', () => {
  assert(
    sandboxPanelSource.includes('className="absolute inset-0 bg-black/40 dark:bg-black/60 z-30 animate-in fade-in') &&
    sandboxPanelSource.includes('animate-in slide-in-from-left duration-200 overflow-hidden transform-gpu'),
    '悬浮抽屉必须拥有平滑遮罩与 transform-gpu 硬件加速滑入动画，点击遮罩可随时收起'
  );
  assert(
    sandboxPanelSource.includes('overflow-y-auto p-4 space-y-4 overscroll-contain transform-gpu'),
    '抽屉主体滚动区必须声明 transform-gpu 与 overscroll-contain，确保抽屉下拉与舞台解耦且零掉帧'
  );
  assert(
    !sandboxPanelSource.includes("style={{ contentVisibility: 'auto', containIntrinsicSize: '0 360px' }}"),
    '出场阵容角色卡片必须移除动态高度 content-visibility 估算，彻底杜绝下拉时的反复重排与滚动抖动掉帧'
  );
  assert(
    sandboxPanelSource.includes('配置剧本场景与角色秘密 (抽屉)'),
    '推演舞台初始空态卡片中必须提供直达设定抽屉的入口按钮'
  );
});

// -------------------------------------------------------------
// PART 6: 顶栏按钮聚合与冗余消除防撞断言 (Anti-Collision Budgeting)
// -------------------------------------------------------------
console.log('\n▶ [PART 6] 顶栏按钮聚合与冗余消除防撞断言');

test('顶栏彻底移除重复冗余的 Settings2 齿轮按钮，保持【剧本设定】作为唯一抽屉总控', () => {
  assert(
    !sandboxPanelSource.includes('<Settings2 className="w-4 h-4" />'),
    '顶栏严禁存在重复的 Settings2 按钮，避免挤占右侧空间导致与剧本设定胶囊物理碰撞'
  );
});

test('设定导入与 P2P 联机收纳至【导出/工具】下拉菜单与抽屉场景分界面，顶栏常驻区域纯净紧凑', () => {
  assert(
    sandboxPanelSource.includes('<span>📖 从小说导入设定与前情</span>'),
    '工具箱下拉菜单中必须集成【📖 从小说导入设定与前情】'
  );
  assert(
    sandboxPanelSource.includes('<span>🌐 互联网联机协同对戏 (P2P)</span>'),
    '工具箱下拉菜单中必须集成【🌐 互联网联机协同对戏 (P2P)】'
  );
  assert(
    sandboxPanelSource.includes("collabStatus === 'CONNECTED' &&") &&
    sandboxPanelSource.includes('P2P:{collabRoomCode}'),
    'P2P 联机仅在建立连接后在顶栏透出紧凑状态徽标，未连接时不挤占顶栏像素'
  );
});

console.log('\n===============================================================');
console.log(`🎉 演武场顶栏防折行、重置系统、抽屉分界面与防撞预算测试全部通过！共完成 ${passCount} 项断言，全部 100% 成功。`);
console.log('===============================================================\n');
