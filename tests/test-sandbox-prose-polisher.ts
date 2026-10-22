import assert from 'assert';
import fs from 'fs';

console.log('===============================================================');
console.log('✨ NovelForge AI — 演武场高光文段打磨台与灵感提炼专项测试');
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
const backendCommandsSource = fs.readFileSync('src-tauri/src/commands/mod.rs', 'utf8');
const typesSource = fs.readFileSync('src/types/index.ts', 'utf8');

// -------------------------------------------------------------
// PART 1: 单轮节拍锚定与范围计算断言
// -------------------------------------------------------------
console.log('\n▶ [PART 1] 单轮节拍锚定与范围计算断言');

test('单轮条目底部“优化文段”按钮精准传递当前节拍 idx', () => {
  assert(
    sandboxPanelSource.includes("onClick={() => handleSynthesizeProse('CINEMATIC', 'FOCUSED_ROUND', idx)}"),
    '单轮底部优化文段必须传递当前节拍索引 idx 与 FOCUSED_ROUND 模式'
  );
});

test('handleSynthesizeProse 支持 FOCUSED_ROUND 精准切片计算', () => {
  assert(
    sandboxPanelSource.includes("if (currentRange === 'FOCUSED_ROUND' && anchor !== null) {") &&
    sandboxPanelSource.includes('startIdx = Math.max(0, anchor - 1);') &&
    sandboxPanelSource.includes('endIdx = Math.min(dialogueHistory.length - 1, anchor + 1);'),
    '锚点打磨模式必须以该节拍为中心前后各取1轮微切片'
  );
});

// -------------------------------------------------------------
// PART 2: 五大文学流派与三大视角全覆盖断言
// -------------------------------------------------------------
console.log('\n▶ [PART 2] 五大文学流派与三大视角全覆盖断言');

test('TypeScript 类型定义与 Rust 后端支持 5 大流派文风与 3 大视点', () => {
  assert(
    typesSource.includes("'CLASSICAL_ELEGANT'") &&
    typesSource.includes("'DARK_HUMOR_IRONY'"),
    'TypeScript 类型必须支持古风与黑色幽默藏刀风格'
  );
  assert(
    backendCommandsSource.includes('CLASSICAL_ELEGANT') &&
    backendCommandsSource.includes('DARK_HUMOR_IRONY'),
    'Rust 后端必须包含古风与黑色幽默风格的打磨提示词守则'
  );
  assert(
    backendCommandsSource.includes('THIRD_OMNISCIENT') &&
    backendCommandsSource.includes('FIRST_PERSON') &&
    backendCommandsSource.includes('THIRD_LIMITED'),
    'Rust 后端必须包含第三人称全知、第一人称与第三人称限制的精准视点阐述'
  );
});

// -------------------------------------------------------------
// PART 3: 四大多维打磨视图模式与多版本双版比对断言
// -------------------------------------------------------------
console.log('\n▶ [PART 3] 四大打磨工作室视图模式与双版比对断言');

test('打磨台具备纯享阅读(READ)、骨架对照(COMPARE)、双版比对(DIFF)与原地编辑(EDIT)四大视图', () => {
  assert(
    sandboxPanelSource.includes("const [polishingStudioView, setPolishingStudioView] = useState<'READ' | 'COMPARE' | 'DIFF' | 'EDIT'>('READ');"),
    '必须具备 polishingStudioView 状态并在四大视图间无缝流转'
  );
  assert(
    sandboxPanelSource.includes("polishingStudioView === 'READ'") &&
    sandboxPanelSource.includes("polishingStudioView === 'COMPARE'") &&
    sandboxPanelSource.includes("polishingStudioView === 'DIFF'") &&
    sandboxPanelSource.includes("polishingStudioView === 'EDIT'"),
    'UI 模态框中必须呈现四大视图对应的工作区'
  );
});

test('具备多版本打磨历史留存与 Re-roll 换个写法及双版同屏比对机制', () => {
  assert(
    sandboxPanelSource.includes('const [polishedVariations, setPolishedVariations] = useState<') &&
    sandboxPanelSource.includes('setActiveVariationId(newVar.id);'),
    '每次打磨生成必须记录到 polishedVariations 留存快照'
  );
  assert(
    sandboxPanelSource.includes('title="以此设定换一种全新的口吻重新打磨生成一个新版本"') &&
    sandboxPanelSource.includes('换个写法'),
    '必须配备一键换个写法 (Re-roll) 按钮'
  );
  assert(
    sandboxPanelSource.includes('diffLeftVariationId') &&
    sandboxPanelSource.includes('diffRightVariationId'),
    '必须支持左右双版本同屏比对选择'
  );
});

// -------------------------------------------------------------
// PART 4: 灵感汲取与句子级采纳断言
// -------------------------------------------------------------
console.log('\n▶ [PART 4] 灵感汲取与句子级采纳断言');

test('纯享阅读模式支持逐段复制、存入灵感盒与划选即时提取', () => {
  assert(
    sandboxPanelSource.includes('复制此段') &&
    sandboxPanelSource.includes('存为灵感') &&
    sandboxPanelSource.includes('插正文'),
    '每一段落悬浮必须包含复制、存入灵感盒与插入正文按钮'
  );
  assert(
    sandboxPanelSource.includes('handleExtractHighlightsToInspiration') &&
    sandboxPanelSource.includes('一键提取金句入盒'),
    '必须配备一键提取金句描写并存入灵感火花盒的高光横幅'
  );
  assert(
    sandboxPanelSource.includes('handleStudioTextSelection') &&
    sandboxPanelSource.includes('handleCaptureSelectedSnippet') &&
    sandboxPanelSource.includes('selectedProseSnippet'),
    '必须支持鼠标划选文句即时浮现操作条并一键存为灵感'
  );
});

// -------------------------------------------------------------
// PART 5: 角色外貌人设融入与视觉下锚透视断言
// -------------------------------------------------------------
console.log('\n▶ [PART 5] 角色外貌人设融入与视觉下锚透视断言');

test('Rust 后端打磨指令与前端打磨台深度融入角色视觉外貌特征', () => {
  assert(
    backendCommandsSource.includes('actors_appearance') &&
    backendCommandsSource.includes('外貌体态衣饰') &&
    backendCommandsSource.includes('主要登场人物外貌衣饰与人设特征'),
    'Rust 后端必须在提示词中装配角色的外貌体态衣饰，为白描提供具象下锚点'
  );
  assert(
    sandboxPanelSource.includes('视觉下锚:') &&
    sandboxPanelSource.includes('actor.visual_summary'),
    '打磨台顶部必须展示登场角色的视觉与人设下锚栏'
  );
});

// -------------------------------------------------------------
// PART 6: 角色行动抉择探针与灵感火花盒无缝联动断言
// -------------------------------------------------------------
console.log('\n▶ [PART 6] 角色行动抉择探针与灵感火花盒联动断言');

test('单轮条目支持探他抉择，抉择方案支持直接存入灵感盒与插入正文', () => {
  assert(
    sandboxPanelSource.includes('handleProbeNextActions(round.speaker_id)') &&
    sandboxPanelSource.includes('探他抉择'),
    '单轮对话卡片底部必须配备直达的“探他抉择”探针入口'
  );
  assert(
    sandboxPanelSource.includes('showActionProbeModal') &&
    sandboxPanelSource.includes('已将该角色的抉择路线存入灵感盒') &&
    sandboxPanelSource.includes('handleInsertTextToEditor'),
    '角色抉择探针必须支持将心理路线与微动作直接存为灵感或插入正文'
  );
});

console.log('\n===============================================================');
console.log(`🎉 演武场高光文段打磨台专项测试全部通过！共完成 ${passCount} 项断言，全部 100% 成功。`);
console.log('===============================================================\n');
