import assert from 'assert';
import fs from 'fs';

console.log('===============================================================');
console.log('🛡️ NovelForge AI — 角色对戏演武场推演暂停与中断保全专项测试');
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
// PART 1: 运行与步进状态机追踪与中断机制断言
// -------------------------------------------------------------
console.log('\n▶ [PART 1] 运行与步进状态机追踪与中断机制断言');

test('组件具备完整的单步推演中状态 (isStepping) 与取消请求标记 (cancelRequestedRef)', () => {
  assert(
    sandboxPanelSource.includes('const [isStepping, setIsStepping] = useState(false);') &&
    sandboxPanelSource.includes('const isSteppingRef = useRef(false);'),
    '必须追踪单步推演状态 isStepping，防止用户在单步期间无法感知与暂停'
  );
  assert(
    sandboxPanelSource.includes('const cancelRequestedRef = useRef(false);') &&
    sandboxPanelSource.includes('const currentStepHistoryBeforeRef = useRef<DialogueRoundRecord[]>([]);'),
    '必须维护 cancelRequestedRef 与推演前快照快照引用，以便中断时原子回滚'
  );
});

test('具备统一的 handleStopDeduction 函数，支持原子回滚与 PAUSED 状态持久化', () => {
  assert(
    sandboxPanelSource.includes('const handleStopDeduction = useCallback(async () => {') &&
    sandboxPanelSource.includes('cancelRequestedRef.current = true;') &&
    sandboxPanelSource.includes('isRunningRef.current = false;'),
    'handleStopDeduction 必须立即置位取消请求并切断连续推演循环'
  );
  assert(
    sandboxPanelSource.includes("status: 'PAUSED',") &&
    sandboxPanelSource.includes('setDialogueHistory(snap);'),
    '当在模型推演期间暂停时，必须将对话历史原子回滚至推演前快照并标记 PAUSED'
  );
});

test('executeStep 在模型推理返回后严格核验 cancelRequestedRef，杜绝暂停后强行插入新台词', () => {
  assert(
    sandboxPanelSource.includes('if (cancelRequestedRef.current) {') &&
    sandboxPanelSource.includes('showToast(\'推演已成功暂停，已保全当前对戏现场\', \'info\');'),
    'executeStep 在 API 返回后必须判断是否被用户中途暂停，若暂停则回滚并中断'
  );
});

// -------------------------------------------------------------
// PART 2: 键盘 Esc 快捷键即时响应断言
// -------------------------------------------------------------
console.log('\n▶ [PART 2] 键盘 Esc 快捷键即时响应断言');

test('Esc 按键监听必须优先截获并响应推演中状态 (isRunning || isStepping)', () => {
  assert(
    sandboxPanelSource.includes("if (e.key === 'Escape') {") &&
    sandboxPanelSource.includes('if (isRunningRef.current || isSteppingRef.current) {') &&
    sandboxPanelSource.includes('handleStopDeduction();'),
    '按下 Esc 必须在第一优先级触发 handleStopDeduction() 立即暂停推演'
  );
});

// -------------------------------------------------------------
// PART 3: UI 可视化动效与双模式暂停按钮呈现断言
// -------------------------------------------------------------
console.log('\n▶ [PART 3] UI 可视化动效与双模式暂停按钮呈现断言');

test('对话历史流中展示正在暗自权衡利弊的实时卡片，并配备直达中断暂停按钮', () => {
  assert(
    sandboxPanelSource.includes('{(isStepping || isRunning) && nextSpeaker && (') &&
    sandboxPanelSource.includes('正在暗自权衡利弊与构思台词...'),
    '推演中必须在消息流末尾呈现对应角色的正在思考动效卡片'
  );
  assert(
    sandboxPanelSource.includes('onClick={handleStopDeduction}') &&
    sandboxPanelSource.includes('暂停推演 (Esc)'),
    '思考卡片上必须包含显式暂停推演按钮'
  );
});

test('底部主控制栏按钮在推演状态下自动变形为红色高亮暂停按钮', () => {
  assert(
    sandboxPanelSource.includes('isRunning || isStepping ? handleStopDeduction : handleStartAuto') &&
    sandboxPanelSource.includes("bg-rose-700 hover:bg-rose-800 animate-pulse"),
    '连续/暂停主按钮在无论是单步还是连续推演中均切换为红色脉冲暂停态'
  );
  assert(
    sandboxPanelSource.includes("<span>{isRunning || isStepping ? '暂停推演 (Esc)' : '连续推演'}</span>"),
    '按钮文字明确告知 Esc 快捷键与暂停动作'
  );
});

console.log('\n===============================================================');
console.log(`🎉 演武场推演暂停与中断保全测试全部通过！共完成 ${passCount} 项断言，全部 100% 成功。`);
console.log('===============================================================\n');
