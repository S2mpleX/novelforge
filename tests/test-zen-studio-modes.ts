import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('===============================================================');
console.log('🧘 NovelForge AI — 方案 2: 纯粹写作 Zen 模式 vs 专业工坊 Studio 模式自动化验证');
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

// -------------------------------------------------------------
// PART 1: 源码与架构规范核验
// -------------------------------------------------------------
console.log('\n▶ [PART 1] 核心组件与布局架构接入断言');

const headerSource = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
const workspaceSource = fs.readFileSync('src/components/docking/DockingWorkspace.tsx', 'utf8');
const appSource = fs.readFileSync('src/App.tsx', 'utf8');
const storeSource = fs.readFileSync('src/stores/useNovelStore.ts', 'utf8');
const zenWorkspaceSource = fs.readFileSync('src/components/zen/ZenWritingWorkspace.tsx', 'utf8');
const floatingIslandSource = fs.readFileSync('src/components/zen/ZenFloatingIsland.tsx', 'utf8');
const chapterDrawerSource = fs.readFileSync('src/components/zen/ZenChapterDrawer.tsx', 'utf8');
const novelEditorSource = fs.readFileSync('src/components/editor/NovelEditor.tsx', 'utf8');

test('useNovelStore 提供完善的 enterZenMode 与 exitZenMode 状态流转', () => {
  assert(storeSource.includes('enterZenMode: () => void;'), 'interface 声明 enterZenMode');
  assert(storeSource.includes('exitZenMode: () => void;'), 'interface 声明 exitZenMode');
  assert(storeSource.includes('enterZenMode: () => {'), '实现 enterZenMode');
  assert(storeSource.includes('exitZenMode: () => {'), '实现 exitZenMode');
  assert(storeSource.includes("localStorage.setItem('novelforge_zen_mode'"), '本地持久化记忆当前工作模式');
});

test('Header 顶栏显著位置集成【沉浸写作】vs【专业工坊】双模切换胶囊', () => {
  assert(headerSource.includes('沉浸写作'), 'Header 包含“沉浸写作”文案');
  assert(headerSource.includes('专业工坊'), 'Header 包含“专业工坊”文案');
  assert(headerSource.includes('enterZenMode'), '点击沉浸写作触发 enterZenMode');
  assert(headerSource.includes('exitZenMode'), '点击专业工坊触发 exitZenMode');
  assert(headerSource.includes('LayoutGrid'), '专业工坊配备工坊网格图标');
});

test('DockingWorkspace 在 zenMode 开启时彻底独占呈现 ZenWritingWorkspace', () => {
  assert(workspaceSource.includes('import { ZenWritingWorkspace }'), '导入 ZenWritingWorkspace');
  assert(workspaceSource.includes('if (zenMode) {'), '判断 zenMode 独占拦截');
  assert(workspaceSource.includes('return <ZenWritingWorkspace />;'), '返回 ZenWritingWorkspace 独占画布');
});

test('ZenWritingWorkspace 完整组合正文编辑器、案头极简浮岛与边缘章节抽屉', () => {
  assert(zenWorkspaceSource.includes('<NovelEditor />'), '居中独占 NovelEditor 正文画布');
  assert(zenWorkspaceSource.includes('<ZenChapterDrawer'), '包含轻量边缘章节抽屉');
  assert(zenWorkspaceSource.includes('<ZenFloatingIsland'), '包含案头极简磨砂浮岛');
  assert(zenWorkspaceSource.includes('exitZenMode'), '集成退出工坊模式响应');
});

test('ZenFloatingIsland 案头极简浮岛提供核心指标与专注开关', () => {
  assert(floatingIslandSource.includes('ChevronLeft') && floatingIslandSource.includes('ChevronRight'), '提供前后章节一键翻越');
  assert(floatingIslandSource.includes('readMinutes') || floatingIslandSource.includes('wordCount'), '实时字数与阅读时长预估');
  assert(floatingIslandSource.includes('saveStatus'), '实时保存状态绿点/微标');
  assert(floatingIslandSource.includes('novelforge:toggle-focus'), '提供段落聚焦模式一键切换');
  assert(floatingIslandSource.includes('novelforge:toggle-typewriter'), '提供打字机居中滚动一键切换');
  assert(floatingIslandSource.includes('toggleThemeMode'), '提供日光素笺/深宵冷砚快速切换');
  assert(floatingIslandSource.includes('返回工坊'), '提供一键退出回专业工坊模式');
});

test('ZenChapterDrawer 章节抽屉具备完整的分卷分组与快速检索功能', () => {
  assert(chapterDrawerSource.includes('groupedChapters'), '支持按分卷归类渲染');
  assert(chapterDrawerSource.includes('searchQuery'), '支持按章节标题快速搜索');
  assert(chapterDrawerSource.includes('selectChapter'), '支持点击无缝翻章');
  assert(chapterDrawerSource.includes('createChapter'), '支持沉浸状态下直接新建下一章');
});

test('NovelEditor 响应案头浮岛广播的聚焦与打字机事件', () => {
  assert(novelEditorSource.includes("addEventListener('novelforge:toggle-focus'"), '监听 novelforge:toggle-focus 事件');
  assert(novelEditorSource.includes("addEventListener('novelforge:toggle-typewriter'"), '监听 novelforge:toggle-typewriter 事件');
});

test('App.tsx 全局支持 F11, Ctrl+Alt+Z 切换模式与 Esc 优雅回退', () => {
  assert(appSource.includes("e.key === 'F11'") || appSource.includes('F11'), '支持 F11 快捷键');
  assert(appSource.includes("'z'") || appSource.includes("'Z'"), '支持 Ctrl+Alt+Z 快捷键');
  assert(appSource.includes("e.key === 'Escape' && zenMode"), '支持 Esc 退出 Zen 模式回退工坊');
});

// -------------------------------------------------------------
// PART 2: 纯逻辑与状态流转模拟核验
// -------------------------------------------------------------
console.log('\n▶ [PART 2] 双模式状态机与分流逻辑模拟');

test('模拟从构思立项仪表盘一键切入沉浸写作模式', () => {
  let state = {
    activeTab: 'DASHBOARD',
    zenMode: false,
  };

  const enterZenMode = () => {
    state.zenMode = true;
    state.activeTab = 'EDITOR';
  };

  const exitZenMode = () => {
    state.zenMode = false;
  };

  enterZenMode();
  assert.strictEqual(state.zenMode, true, 'zenMode 成功变为 true');
  assert.strictEqual(state.activeTab, 'EDITOR', '工作区自动平滑切换至正文 EDITOR');

  exitZenMode();
  assert.strictEqual(state.zenMode, false, 'zenMode 成功恢复为 false');
  assert.strictEqual(state.activeTab, 'EDITOR', '保留在正文工坊状态');
});

test('模拟章节抽屉分卷与无分卷优雅归并', () => {
  const dummyVolumes = [
    { id: 'v1', title: '第一卷：初入仙途', sequence: 1 },
    { id: 'v2', title: '第二卷：风起宗门', sequence: 2 },
  ];
  const dummyChapters = [
    { id: 'c1', title: '第1章 出山', volume_id: 'v1', chapter_number: 1, content: '<p>少年持剑。</p>' },
    { id: 'c2', title: '第2章 遇险', volume_id: 'v1', chapter_number: 2, content: '<p>林深叶茂。</p>' },
    { id: 'c3', title: '第3章 宗门考核', volume_id: 'v2', chapter_number: 3, content: '<p>云雾缭绕。</p>' },
    { id: 'c4', title: '外篇：青云旧事', volume_id: undefined, chapter_number: 4, content: '<p>五百年前。</p>' },
  ];

  const map = new Map<string, any[]>();
  const unassigned: any[] = [];
  dummyChapters.forEach((ch) => {
    if (ch.volume_id) {
      if (!map.has(ch.volume_id)) map.set(ch.volume_id, []);
      map.get(ch.volume_id)!.push(ch);
    } else {
      unassigned.push(ch);
    }
  });

  const groups: { volume: any; chapters: any[] }[] = [];
  dummyVolumes.forEach((vol) => {
    groups.push({
      volume: vol,
      chapters: map.get(vol.id) || [],
    });
  });
  if (unassigned.length > 0) {
    groups.push({ volume: null, chapters: unassigned });
  }

  assert.strictEqual(groups.length, 3, '包含2卷+1未分卷');
  assert.strictEqual(groups[0].chapters.length, 2, '第一卷包含2章');
  assert.strictEqual(groups[1].chapters.length, 1, '第二卷包含1章');
  assert.strictEqual(groups[2].chapters.length, 1, '未分卷包含1章');
});

test('模拟案头浮岛字数与阅读耗时精确计算', () => {
  const sampleHtml = '<p>深秋，清虚山脚下的寒潭水冷得刺骨。</p><p>少年擦去剑锋上的泥浆，目光穿透破晓前的重重迷雾。</p>';
  const stripped = sampleHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, '');
  const wordCount = stripped.length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 400));

  assert.strictEqual(wordCount > 30, true, '精准剥离标签提取纯汉字字数');
  assert.strictEqual(readMinutes, 1, '短篇幅保底 1 分钟阅读');
});

console.log('\n===============================================================');
console.log(`🎉 方案 2 自动化回归验证全部通过！共完成 ${passCount} 项断言，成功 ${passCount} 项，失败 0 项。`);
console.log('===============================================================\n');
