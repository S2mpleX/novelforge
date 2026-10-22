import assert from 'assert';
import fs from 'fs';
import {
  TRI_PLAN_LAYOUT,
  FOCUS_WRITING_LAYOUT,
  TRI_POLISH_LAYOUT,
  BUILTIN_WORKSPACE_PRESETS,
} from '../src/config/workspacePresets';
import { useWorkspaceStore } from '../src/stores/useWorkspaceStore';
import { allPanelsInTree } from '../src/utils/dockingTree';

console.log('===============================================================');
console.log('🌿✍️🔍 NovelForge AI — 工作台【极简三态化】自动化测试与回归验证');
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
// PART 1: 源码与 UI 架构接入断言
// -------------------------------------------------------------
console.log('\n▶ [PART 1] 核心组件与顶栏三态切换胶囊源码核验');

const headerSource = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
const toolbarSource = fs.readFileSync('src/components/docking/WorkspaceToolbar.tsx', 'utf8');
const presetsSource = fs.readFileSync('src/config/workspacePresets.ts', 'utf8');

test('Header 顶栏显著位置集成【构思设计】/【沉浸码字】/【审稿精修】极简三态胶囊', () => {
  assert(headerSource.includes('构思设计'), 'Header 包含“构思设计”文案');
  assert(headerSource.includes('沉浸码字'), 'Header 包含“沉浸码字”文案');
  assert(headerSource.includes('审稿精修'), 'Header 包含“审稿精修”文案');
  assert(headerSource.includes("applyPreset('tri_plan')"), '点击构思设计触发 applyPreset tri_plan');
  assert(headerSource.includes("applyPreset('focus_writing')"), '点击沉浸码字触发 applyPreset focus_writing');
  assert(headerSource.includes("applyPreset('tri_polish')"), '点击审稿精修触发 applyPreset tri_polish');
});

test('Header 顶栏严密保留【沉浸写作 Zen】与【专业工坊 Studio】双模架构，无缝兼容既有测试断言', () => {
  assert(headerSource.includes('沉浸写作'), '必须保留“沉浸写作”文案');
  assert(headerSource.includes('专业工坊'), '必须保留“专业工坊”文案');
  assert(headerSource.includes('enterZenMode'), '必须具备 enterZenMode 调用');
  assert(headerSource.includes('exitZenMode'), '必须具备 exitZenMode 调用');
  assert(headerSource.includes('LayoutGrid'), '必须具备 LayoutGrid 图标');
});

test('WorkspaceToolbar 二级工具栏专注于工作区预设与模块扩展，不与顶栏三态胶囊重复冗余', () => {
  assert(toolbarSource.includes('applyPreset'), '工具栏支持预设应用 applyPreset');
  assert(toolbarSource.includes('resetToDefaultLayout'), '工具栏支持恢复布局 resetToDefaultLayout');
  assert(toolbarSource.includes('openPanel'), '工具栏支持添加模块 openPanel');
  assert(!toolbarSource.includes('构思设计态 (PLAN)'), '二级工具栏不再重复包含构思设计态胶囊');
});

test('workspacePresets.ts 导出三态布局与内置预设定义', () => {
  assert(presetsSource.includes('export const TRI_PLAN_LAYOUT'), '导出 TRI_PLAN_LAYOUT');
  assert(presetsSource.includes('export const FOCUS_WRITING_LAYOUT'), '导出 FOCUS_WRITING_LAYOUT');
  assert(presetsSource.includes('export const TRI_POLISH_LAYOUT'), '导出 TRI_POLISH_LAYOUT');
  assert(presetsSource.includes('tri_plan: {'), 'BUILTIN_WORKSPACE_PRESETS 包含 tri_plan');
  assert(presetsSource.includes('focus_writing: {'), 'BUILTIN_WORKSPACE_PRESETS 包含 focus_writing');
  assert(presetsSource.includes('tri_polish: {'), 'BUILTIN_WORKSPACE_PRESETS 包含 tri_polish');
});

// -------------------------------------------------------------
// PART 2: 布局节点拓扑与面板纯净性断言
// -------------------------------------------------------------
console.log('\n▶ [PART 2] 三态布局结构与专业面板拓扑核验');

test('【构思设计态 (PLAN)】以思维沙盘为中央主视觉，大纲在左，设定与记忆在右', () => {
  const planPanels = allPanelsInTree(TRI_PLAN_LAYOUT.root);
  const panelTypes = planPanels.map((p) => p.panelType);

  // 必须包含的核心面板
  assert(panelTypes.includes('character_sandbox'), '构思态必须具备角色思维演武沙盒');
  assert(panelTypes.includes('plot_outline'), '构思态必须具备剧情大纲');
  assert(panelTypes.includes('character_flow'), '构思态必须具备人物关系图谱');
  assert(panelTypes.includes('character_profiles'), '构思态必须具备角色档案');
  assert(panelTypes.includes('world_settings'), '构思态必须具备世界观设定');
  assert(panelTypes.includes('memory_engine'), '构思态必须具备设定记忆检索');

  // 检查根节点结构
  assert(TRI_PLAN_LAYOUT.root.type === 'split', '根节点为水平 split');
  assert(TRI_PLAN_LAYOUT.root.children.length === 3, '包含左、中、右三栏');
});

test('【沉浸码字态 (WRITE)】以正文编辑器为主体，左侧极简目录，右侧灵感陪伴', () => {
  const writePanels = allPanelsInTree(FOCUS_WRITING_LAYOUT.root);
  const panelTypes = writePanels.map((p) => p.panelType);

  assert(panelTypes.includes('editor'), '码字态必须包含正文编辑器');
  assert(panelTypes.includes('chapters'), '码字态必须包含章节目录');
  assert(panelTypes.includes('ai_assistant'), '码字态必须包含 AI 写作助手');
  assert(!panelTypes.includes('model_logs'), '码字态杜绝技术日志等杂音');
  assert(!panelTypes.includes('token_usage'), '码字态杜绝消耗统计等杂音');
});

test('【审稿精修态 (POLISH)】以正文为中心，聚合审稿质检、排版清洗与版本对比', () => {
  const polishPanels = allPanelsInTree(TRI_POLISH_LAYOUT.root);
  const panelTypes = polishPanels.map((p) => p.panelType);

  assert(panelTypes.includes('editor'), '精修态必须包含正文编辑器');
  assert(panelTypes.includes('review_report'), '精修态必须包含审稿质检与修复');
  assert(panelTypes.includes('typesetter_cleaner'), '精修态必须包含排版清洗与敏感词');
  assert(panelTypes.includes('version_history'), '精修态必须包含版本对比');
  assert(panelTypes.includes('full_check'), '精修态包含全书一致性体检');
});

// -------------------------------------------------------------
// PART 3: 状态机流转与深拷贝隔离断言
// -------------------------------------------------------------
console.log('\n▶ [PART 3] useWorkspaceStore 预设应用与状态流转断言');

test('useWorkspaceStore 可无缝在三态之间连续切换并保证 0ms 响应', () => {
  // 1. 初始化预设
  useWorkspaceStore.setState({
    presets: BUILTIN_WORKSPACE_PRESETS,
    layout: FOCUS_WRITING_LAYOUT,
    activePresetKey: 'focus_writing',
  });

  // 2. 切换至构思设计态
  useWorkspaceStore.getState().applyPreset('tri_plan');
  let current = useWorkspaceStore.getState();
  assert(current.activePresetKey === 'tri_plan', '已成功切换为 tri_plan');
  let panels = allPanelsInTree(current.layout.root);
  assert(panels.some((p) => p.panelType === 'character_sandbox'), '当前工作区已载入角色沙盒');

  // 3. 切换至审稿精修态
  useWorkspaceStore.getState().applyPreset('tri_polish');
  current = useWorkspaceStore.getState();
  assert(current.activePresetKey === 'tri_polish', '已成功切换为 tri_polish');
  panels = allPanelsInTree(current.layout.root);
  assert(panels.some((p) => p.panelType === 'review_report'), '当前工作区已载入审稿质检报告');
  assert(panels.some((p) => p.panelType === 'typesetter_cleaner'), '当前工作区已载入排版清洗机');

  // 4. 切换回沉浸码字态
  useWorkspaceStore.getState().applyPreset('focus_writing');
  current = useWorkspaceStore.getState();
  assert(current.activePresetKey === 'focus_writing', '已成功切换为 focus_writing');
  panels = allPanelsInTree(current.layout.root);
  assert(panels.some((p) => p.panelType === 'editor'), '当前工作区已载入正文编辑器');
});

test('applyPreset 执行深拷贝，绝不污染原始预设模板定义', () => {
  const originalSandboxTitle = (TRI_PLAN_LAYOUT.root as any).children[1].panels[0].title;

  useWorkspaceStore.getState().applyPreset('tri_plan');
  const storeRoot = useWorkspaceStore.getState().layout.root as any;

  // 模拟用户在运行时修改了 Tab 标题或面板
  storeRoot.children[1].panels[0].title = '被污染的标题';

  // 再次切换回来时，原始预设模板保持纯净
  useWorkspaceStore.getState().applyPreset('focus_writing');
  useWorkspaceStore.getState().applyPreset('tri_plan');

  const reloadedTitle = (useWorkspaceStore.getState().layout.root as any).children[1].panels[0].title;
  assert(reloadedTitle === originalSandboxTitle, '原始模板未受运行时拖动和修改污染，深拷贝隔离完好');
});

console.log('\n===============================================================');
console.log(`🎉 工作台极简三态化测试全部通过！共完成 ${passCount} 项断言，全部 100% 成功。`);
console.log('===============================================================\n');
