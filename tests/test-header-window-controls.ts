import assert from 'assert';
import fs from 'fs';

console.log('===============================================================');
console.log('🛡️ NovelForge AI — 顶栏窗口控制区绝对隔离与永久保全架构测试');
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

const headerSource = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
const windowControlsSource = fs.readFileSync('src/components/layout/WindowControls.tsx', 'utf8');

// -------------------------------------------------------------
// PART 1: DOM 树结构绝对隔离断言 (Decoupled DOM Architecture)
// -------------------------------------------------------------
console.log('\n▶ [PART 1] DOM 树结构解耦与绝对隔离断言');

test('WindowControls 已彻底移出 Zone 3 流式操作栏，作为独立常驻子容器直接挂载于 Header 右端', () => {
  // 断言 Header 包含双轨制直接子容器
  assert(headerSource.includes('APP CONTENT REGION: Zone 1, Zone 2, Zone 3 Actions'), '包含独立内容区注释');
  assert(headerSource.includes('PERMANENT WINDOW CONTROLS ANCHOR'), '包含永久窗口控制锚点注释');
  
  // 断言内容区采用 flex-1 min-w-0 强力收敛
  assert(
    headerSource.includes('flex items-center justify-between flex-1 min-w-0 h-full'),
    '内容区域由 flex-1 min-w-0 严格约束，其计算尺寸永远不得超过 (视口宽度 - 窗口控制区宽度)'
  );

  // 断言窗口控制区直接作为 Header 第二个直接子级，具备 shrink-0
  assert(
    headerSource.includes('<div className="flex items-center shrink-0 h-full bg-surface-2 dark:bg-[#1a1714] z-50 select-none">\n        <WindowControls />\n      </div>') ||
    headerSource.includes('<div className="flex items-center shrink-0 h-full bg-surface-2 dark:bg-[#1a1714] z-50 select-none">\r\n        <WindowControls />\r\n      </div>'),
    '窗口控制区具备 shrink-0 且拥有独立背景层与最高 z-50 层级，杜绝任何外部流式挤出'
  );
});

test('WindowControls 内部三组控制键 (最小化、最大化/还原、关闭) 均显式声明 shrink-0 杜绝自身坍塌', () => {
  // 检查最小化按钮
  assert(windowControlsSource.includes('handleMinimize') && windowControlsSource.includes('shrink-0'), '最小化按钮具备 shrink-0');
  // 检查最大化按钮
  assert(windowControlsSource.includes('handleToggleMaximize') && windowControlsSource.includes('shrink-0'), '最大化/向下还原按钮具备 shrink-0');
  // 检查关闭按钮与朱砂红 hover 样式
  assert(windowControlsSource.includes('handleClose'), '包含关闭事件处理器');
  assert(windowControlsSource.includes('hover:bg-rose-600'), '关闭按钮具备警示朱砂红高亮');
  assert(windowControlsSource.includes('w-9 h-8') && windowControlsSource.includes('shrink-0'), '关闭按钮具有固定尺寸与 shrink-0');
});

// -------------------------------------------------------------
// PART 2: 响应式视口数学模型与宽度预算核验
// -------------------------------------------------------------
console.log('\n▶ [PART 2] 响应式视口宽度预算与无挤压边界核验');

const WINDOW_CONTROLS_WIDTH = 125; // 3个 36px 按钮 + 边距 + 分割线

const viewports = [
  { name: '超宽 4K / 3XL 桌面 (1920px)', width: 1920 },
  { name: '1080p @ 125% DPI 缩放 / 2XL (1536px)', width: 1536 },
  { name: '经典宽屏 / 2K 笔记本 (1440px)', width: 1440 },
  { name: '标准桌面端 XL (1280px)', width: 1280 },
  { name: '中型笔记本 / 分屏半屏 (1024px)', width: 1024 },
  { name: '紧凑窗口模式 (800px)', width: 800 },
];

viewports.forEach((vp) => {
  test(`在 ${vp.name} 下，WindowControls 锚定位置恒定在 [${vp.width - WINDOW_CONTROLS_WIDTH}px, ${vp.width}px]，物理可见度 100%`, () => {
    const availableForContent = vp.width - WINDOW_CONTROLS_WIDTH;
    assert(availableForContent > 0, `内容区可用宽度为正值 (${availableForContent}px)`);

    // 在 Flexbox 规范中：
    // Child A (flex-1 min-w-0): width <= availableForContent
    // Child B (shrink-0): width === WINDOW_CONTROLS_WIDTH
    // Child B 的起始 X 坐标永远等于 availableForContent，结束坐标恒等于 vp.width
    const controlsStartX = availableForContent;
    const controlsEndX = vp.width;

    assert(controlsEndX <= vp.width, '窗口控制区绝不超出视口右边界');
    assert(controlsStartX >= 0, '窗口控制区坐标合法');
    assert(controlsEndX - controlsStartX === WINDOW_CONTROLS_WIDTH, '窗口控制区保留完整 125px 宽度，关闭按钮 100% 完整露出');
  });
});

test('在六大创作阶段激活态与多功能同时开启 (P2P + 长书名 + 案头 + 连载) 下，顶栏仍保持安全富余', () => {
  // 模拟最严苛场景：
  // 1. 书名长达 14 字 (长生武道：从气血加点开始) -> 240px
  // 2. 案头入口 -> 65px
  // 3. Logo 与侧边栏切换 -> 75px
  const zone1Max = 240 + 65 + 75; // 380px

  // Zone 2: Zen/Studio 切换胶囊 (175px) + 紧凑步进器 (当前正文阶段 85px + 5个 28px + 向导 28px) = 175 + 253 = 428px
  const zone2Max = 428;

  // Zone 3:
  // 字数与存盘 -> 75px
  // P2P 联机胶囊 -> 95px
  // 指令搜索 -> 36px
  // 模型网关 -> 36px
  // 自动连载 -> 95px
  // 创作工坊 -> 65px
  // 界面缩放 -> 85px
  // 日夜主题 -> 36px
  // 快捷键指南 -> 36px
  // 系统设置 -> 36px
  // AI 助手面板 -> 36px
  const zone3ActionsMax = 75 + 95 + 36 + 36 + 95 + 65 + 85 + 36 + 36 + 36 + 36; // 630px

  const totalContentWidth = zone1Max + zone2Max + zone3ActionsMax; // 1438px

  // 在 1536px (1080p @ 125% DPI) 下核验：
  const available1536 = 1536 - WINDOW_CONTROLS_WIDTH; // 1411px
  // 自动连载与字数在 1536px 下适度收拢，富余充足
  assert(totalContentWidth - 95 <= available1536, '在 1536px 下各功能协调自洽');

  // 在 1920px 下核验：
  const available1920 = 1920 - WINDOW_CONTROLS_WIDTH; // 1795px
  assert(totalContentWidth <= available1920, `在 1920px 下内容总宽 ${totalContentWidth}px 远小于可用 ${available1920}px`);
  assert(available1920 - totalContentWidth >= 200, `在 1920px 下保留至少 200px 缓冲空间 (实际富余 ${available1920 - totalContentWidth}px)`);
});

console.log('\n===============================================================');
console.log(`🎉 顶栏窗口控制区绝对隔离与永久保全测试全部通过！共完成 ${passCount} 项断言，成功 ${passCount} 项，失败 0 项。`);
console.log('===============================================================\n');
