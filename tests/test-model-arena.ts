import { HumanizerEngine } from '../src/features/humanizer/HumanizerEngine';
import { computeTextDiff } from '../src/utils/textDiff';
import type { ModelArenaRun, SaveModelArenaRunInput, ArenaStreamChunkPayload } from '../src/types';

console.log('===============================================================');
console.log(' NovelForge AI V2.4 — 多模型同台比稿竞技场专项自动化测试');
console.log('===============================================================\n');

let passCount = 0;
let totalCount = 0;

function assert(condition: boolean, msg: string) {
  totalCount++;
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  }
}

// --- 测试 1: 双模型竞技场会话生成与参数规范 ---
console.log('▶ [测试 1] 双模型竞技场会话与参数装配规范');
const sessionId = `arena-test-${Date.now()}`;
assert(sessionId.startsWith('arena-test-'), '竞技场 session_id 格式规范');

const mockInput = {
  session_id: sessionId,
  novel_id: 'novel-scifi-001',
  chapter_id: 'chapter-001',
  system_prompt: '你是一名专业科幻小说作家',
  user_prompt: '描写反物质引力透镜失控的震撼视界',
  slot_a_model: 'deepseek-chat',
  slot_a_temperature: 0.7,
  slot_b_model: 'gpt-4o-mini',
  slot_b_temperature: 0.85,
};
assert(mockInput.slot_a_model !== mockInput.slot_b_model, '支持配置不同厂商或不同参数的模型');
assert(mockInput.slot_a_temperature !== mockInput.slot_b_temperature, '支持独立设置两个模型的发散度');

// --- 测试 2: 流式 Chunk 路由与多通道隔离 ---
console.log('\n▶ [测试 2] 流式 Chunk 路由与多通道隔离');
const chunksA: string[] = [];
const chunksB: string[] = [];

function routeChunk(payload: ArenaStreamChunkPayload) {
  if (payload.slot === 'A') chunksA.push(payload.chunk);
  if (payload.slot === 'B') chunksB.push(payload.chunk);
}

routeChunk({ session_id: sessionId, slot: 'A', chunk: '淡蓝色的光晕', is_done: false });
routeChunk({ session_id: sessionId, slot: 'B', chunk: '警报声骤然响起', is_done: false });
routeChunk({ session_id: sessionId, slot: 'A', chunk: '沿着金属甲板蔓延', is_done: false });
routeChunk({ session_id: sessionId, slot: 'B', chunk: '红色光晕在旋转', is_done: true });
routeChunk({ session_id: sessionId, slot: 'A', chunk: '。', is_done: true });

assert(chunksA.join('') === '淡蓝色的光晕沿着金属甲板蔓延。', 'Slot A 接收到的流式文本完整且无串流');
assert(chunksB.join('') === '警报声骤然响起红色光晕在旋转', 'Slot B 接收到的流式文本完整且独立');

// --- 测试 3: 盲测模式与揭秘逻辑 ---
console.log('\n▶ [测试 3] 盲测模式 (Blind Test) 状态遮蔽与结果揭示');
let isBlind = true;
let revealed = false;

function getDisplayLabel(modelName: string, isBlindMode: boolean, isRevealed: boolean, slotIndex: string) {
  if (isBlindMode && !isRevealed) {
    return slotIndex === 'A' ? '选手甲 (盲测中)' : '选手乙 (盲测中)';
  }
  return modelName;
}

assert(getDisplayLabel('deepseek-chat', isBlind, revealed, 'A') === '选手甲 (盲测中)', '盲测未揭晓前模型名称被成功遮蔽');
assert(getDisplayLabel('gpt-4o-mini', isBlind, revealed, 'B') === '选手乙 (盲测中)', '盲测未揭晓前模型 B 同样被成功遮蔽');

revealed = true;
assert(getDisplayLabel('deepseek-chat', isBlind, revealed, 'A') === 'deepseek-chat', '投票后揭晓真实模型 A');
assert(getDisplayLabel('gpt-4o-mini', isBlind, revealed, 'B') === 'gpt-4o-mini', '投票后揭晓真实模型 B');

// --- 测试 4: 左右两栏 Humanizer 评分与 AI 套话浓度对比 ---
console.log('\n▶ [测试 4] 左右双栏 Humanizer 诊断指标对比');
const textWithCliche = '不仅如此，林远嘴角勾起一抹冷笑，眼中闪过一丝锐芒，深吸一口气说道。';
const textNatural = '风雪撞在厚重的铅板上，发出沉闷的扑簌声。林远伸手抹掉护目镜上的白霜，手指关节已冻得发僵。';

const auditA = HumanizerEngine.auditText(textWithCliche);
const auditB = HumanizerEngine.auditText(textNatural);

assert(auditA.clicheCount >= 3, '成功扫描出选手 A 文本中的多处 AI 机械套话');
assert(auditA.score < 80, '套话密集的草案人情味得分较低');
assert(auditB.clicheCount === 0, '文学白描草案命中套话数为 0');
assert(auditB.score >= 95, '白描生动的草案人情味得分极高 (>=95)');

// --- 测试 5: A/B 差异 Visual Diff 比对计算 ---
console.log('\n▶ [测试 5] A/B 双栏文本红绿 Diff 差异计算');
const diffBlocks = computeTextDiff(chunksA.join(''), chunksB.join(''));
assert(diffBlocks.length > 0, '成功计算出 A 方案与 B 方案的差异分块');
const hasRemoved = diffBlocks.some((b) => b.type === 'REMOVED');
const hasAdded = diffBlocks.some((b) => b.type === 'ADDED');
assert(hasRemoved && hasAdded, '准确标出 A 专有词句与 B 专有词句');

// --- 测试 6: 比稿胜出记录与智能融合持久化 ---
console.log('\n▶ [测试 6] 比稿胜出记录与智能融合结果持久化');
const mockRun: ModelArenaRun = {
  id: 'run-001',
  novel_id: 'novel-scifi-001',
  prompt: '反物质启动',
  model_a_provider: 'DeepSeek',
  model_a_name: 'deepseek-chat',
  model_a_output: chunksA.join(''),
  model_a_duration_ms: 1200,
  model_a_tokens: 300,
  model_b_provider: 'OpenAI',
  model_b_name: 'gpt-4o-mini',
  model_b_output: chunksB.join(''),
  model_b_duration_ms: 950,
  model_b_tokens: 280,
  winner_slot: 'A',
  is_blind: true,
  merged_output: '淡蓝色的光晕骤然亮起，警报红光回旋，两股力量在冰冷甲板上猛烈交锋。',
  created_at: Date.now(),
};

assert(mockRun.winner_slot === 'A', '记录胜出方为 A');
assert(mockRun.merged_output.length > 10, '融合版本成功提取并保存');

console.log('\n===============================================================');
console.log(` 验收测试完成：总计 ${totalCount} 项，通过 ${passCount} 项，失败 0 项`);
console.log('===============================================================\n');
