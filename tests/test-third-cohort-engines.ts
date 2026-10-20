import { BatchReviseEngine, BATCH_REVISE_PRESETS } from '../src/features/batchrevise/BatchReviseEngine';
import { DualWordStatsEngine } from '../src/features/stats/DualWordStatsEngine';
import { MapEngine } from '../src/features/map/MapEngine';
import { Chapter, WorldRule, ChapterVersion } from '../src/types';
import { BatchReviseScope } from '../src/features/batchrevise/types';
import { MapMarker } from '../src/features/map/types';
import { api } from '../src/utils/tauriBridge';

if (typeof (globalThis as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
}

console.log('===============================================================');
console.log(' NovelForge AI V2.6 — 第三梯队核心生产力引擎自动化测试套件');
console.log(' 覆盖：跨章批量修改流、手打/AI双流字数统计、架空世界沙盘与行军因果核验');
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

// 构造测试数据
const mockNovelId = 'nov-001';

const mockChapters: Chapter[] = [
  {
    id: 'ch-01',
    novel_id: mockNovelId,
    chapter_number: 1,
    title: '第一章 青云出岫',
    content: '<p>不仅如此，青云门宛如云海孤岛。林远嘴角勾起了一抹微笑，眼神中闪过一丝决绝。</p>',
    word_count: 50,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'ch-02',
    novel_id: mockNovelId,
    chapter_number: 2,
    title: '第二章 剑气动八荒',
    content: '<p>剑锋微鸣。黑衣死士欺身而上，刃光撕裂残阳。林远旋身避开，反手刺向其肋下空档。！！！！？？？？</p>',
    word_count: 55,
    created_at: '2026-01-02',
    updated_at: '2026-01-02',
  },
  {
    id: 'ch-03',
    novel_id: mockNovelId,
    chapter_number: 3,
    title: '第三章 幽都暗流',
    content: '<p>夜雨如注。幽都古城深处的青石板路上，滴落着黑褐色的妖血。</p>',
    word_count: 35,
    created_at: '2026-01-03',
    updated_at: '2026-01-03',
  },
];

const mockWorldRules: WorldRule[] = [
  {
    id: 'rule-01',
    novel_id: mockNovelId,
    title: '大乾九州地理版图',
    category: 'GEOGRAPHY',
    rule_content: '北方为幽都荒原与太玄山脉，中央为大乾帝都天极城，南方为无尽怒海，东为东海归墟。',
    authority_level: 'CANON',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'rule-02',
    novel_id: mockNovelId,
    title: '太玄剑门宗门禁制',
    category: 'CULTURE_POWER',
    rule_content: '太玄剑门立于青云峰之巅，宗门护山大阵笼罩方圆三百里。',
    authority_level: 'CANON',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

// -----------------------------------------------------------------------------
// PART 1: 跨章节批量修改与提案引擎 (BatchReviseEngine)
// -----------------------------------------------------------------------------
console.log('▶ [PART 1] 跨章节批量修改与提案引擎 (BatchReviseEngine)');

// 1.1 预设项完整性检验
assert(BATCH_REVISE_PRESETS.length === 5, '内置 5 大预设模式（去AI味、提速、尾钩、具象化、自定义）');
const deaiPreset = BATCH_REVISE_PRESETS.find((p) => p.key === 'DEAI_POLISH');
assert(deaiPreset !== undefined && deaiPreset.label.includes('去 AI 味'), 'DEAI_POLISH 预设完备');

// 1.2 提示词装配 (assemblePrompt)
const promptObj = BatchReviseEngine.assemblePrompt({
  chapterTitle: mockChapters[0].title,
  content: mockChapters[0].content,
  presetKey: 'DEAI_POLISH',
});
assert(promptObj.systemPrompt.includes('顶级长篇小说批量精修架构师'), 'SystemPrompt 包含架构师文学总监职责定位');
assert(promptObj.systemPrompt.includes('严禁篡改战斗胜负'), 'SystemPrompt 包含核心因果保真戒律');
assert(promptObj.userPrompt.includes('第一章 青云出岫'), 'UserPrompt 包含当前章节名称');
assert(promptObj.userPrompt.includes('典型 AI 机械套话'), 'UserPrompt 融入去 AI 味专项要求');

const customPromptObj = BatchReviseEngine.assemblePrompt({
  chapterTitle: mockChapters[1].title,
  content: mockChapters[1].content,
  presetKey: 'CUSTOM',
  customInstruction: '增加夜雨磅礴的环境感官细节',
});
assert(customPromptObj.userPrompt.includes('增加夜雨磅礴的环境感官细节'), 'UserPrompt 完美组装自定义指令');

// 1.3 作用域筛选 (filterChaptersByScope)
const scopeAll: BatchReviseScope = { type: 'ALL' };
const allChs = BatchReviseEngine.filterChaptersByScope(mockChapters, scopeAll);
assert(allChs.length === 3, 'ALL 作用域涵盖全书 3 章');

const scopeRange: BatchReviseScope = { type: 'RANGE', rangeStart: 1, rangeEnd: 2 };
const rangeChs = BatchReviseEngine.filterChaptersByScope(mockChapters, scopeRange);
assert(rangeChs.length === 2 && rangeChs[0].chapter_number === 1 && rangeChs[1].chapter_number === 2, 'RANGE 作用域准确截取 1~2 章');

const scopeSelection: BatchReviseScope = { type: 'SELECTION', selectedChapterIds: ['ch-01', 'ch-03'] };
const selChs = BatchReviseEngine.filterChaptersByScope(mockChapters, scopeSelection);
assert(selChs.length === 2 && selChs[0].id === 'ch-01' && selChs[1].id === 'ch-03', 'SELECTION 作用域准确定位勾选章节');

// 1.4 差异指标统计 (calculateDiffMetrics)
const baseText = '太玄剑宗立于云海。';
const longExpandedText = '太玄剑宗立于万丈云海之上，万道金光穿透晨雾，照彻玉虚飞阁，气象森然。' +
  '群峰如利剑直插九霄，天际隐有仙鹤引颈长鸣，云涛浩荡奔涌不息。白玉广场之上，万千剑修弟子迎着朝霞吐纳乾坤灵气，周身剑气如虹，震撼寰宇。浩瀚的天地威压令人心生敬畏，这便是统御九域万载岁月的不朽仙门！';
const diffMetricsExpand = BatchReviseEngine.calculateDiffMetrics(baseText, longExpandedText);
assert(diffMetricsExpand.addedChars > 0, '扩写产生新增字数');
assert(diffMetricsExpand.summary.includes('扩充细节描写'), '扩写输出对应中文语义摘要');

const diffMetricsCompress = BatchReviseEngine.calculateDiffMetrics(longExpandedText, baseText);
assert(diffMetricsCompress.removedChars > 0, '精简产生削减字数');
assert(diffMetricsCompress.summary.includes('精炼压缩文字'), '精简输出对应中文语义摘要');

const diffMetricsSubtle = BatchReviseEngine.calculateDiffMetrics(baseText, '太玄剑门耸立于苍茫云海之巅。');
assert(diffMetricsSubtle.summary.includes('保持相近体量'), '微调输出相近体量打磨摘要');

// 1.5 0-Token 纯离线快速规则清洗 (offlineFastRevise)
const offlineCleaned = BatchReviseEngine.offlineFastRevise(mockChapters[0].content, 'DEAI_POLISH');
assert(!offlineCleaned.includes('不仅如此'), '离线清洗成功移除 "不仅如此"');
assert(!offlineCleaned.includes('嘴角勾起'), '离线清洗成功替换 "嘴角勾起" 为真实神态动作');
assert(!offlineCleaned.includes('眼神中闪过一丝决绝'), '离线清洗消除 "眼神中闪过一丝" 套话');

const offlinePacing = BatchReviseEngine.offlineFastRevise(mockChapters[1].content, 'PACE_ACCELERATE');
assert(!offlinePacing.includes('！！！！'), '离线节奏提速压缩多余叹号');

const offlineHook = BatchReviseEngine.offlineFastRevise(mockChapters[2].content, 'HOOK_ENHANCE');
assert(offlineHook.includes('杀机已然悄然逼近'), '离线断章尾钩自动注入章末悬念');

// 1.6 采纳提案持久化存盘 (acceptProposal)
let savedChapterId = '';
let savedContent = '';
let savedSourceType = '';
const originalSave = api.saveChapterContent;
api.saveChapterContent = async (chapterId: string, content: string, createSnapshot?: boolean, sourceType?: string) => {
  savedChapterId = chapterId;
  savedContent = content;
  savedSourceType = sourceType || '';
  return true;
};

const accepted = await BatchReviseEngine.acceptProposal('ch-01', '<p>重塑后的第一章正文</p>');
assert(accepted === true, 'acceptProposal 返回成功');
assert(savedChapterId === 'ch-01', 'acceptProposal 保存正确的 chapterId');
assert(savedContent.includes('重塑后的第一章正文'), 'acceptProposal 保存修订后的新正文');
assert(savedSourceType === 'BATCH_REVISE', 'acceptProposal 带有 BATCH_REVISE 来源快照');

// 还原 mock
api.saveChapterContent = originalSave;

// -----------------------------------------------------------------------------
// PART 2: 手写 vs AI 字数双流统计与心流追踪 (DualWordStatsEngine)
// -----------------------------------------------------------------------------
console.log('\n▶ [PART 2] 手写 vs AI 字数双流统计与心流追踪 (DualWordStatsEngine)');

// 2.1 单章统计分析 (analyzeChapterDualStats)
const singleManualCh: Chapter = {
  id: 'ch-manual',
  novel_id: mockNovelId,
  chapter_number: 10,
  title: '纯手工匠心章节',
  content: '<p>天风浩荡，一人一剑，独行于茫茫北原之上。踏碎万重霜雪，终见古城轮廓。</p>',
  word_count: 36,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};
// 纯手动无版本历史
const manualStats = DualWordStatsEngine.analyzeChapterDualStats(singleManualCh, []);
assert(manualStats.totalWords === 36, '单章无版本历史精准计算总字数');
assert(manualStats.manualWords > 0 && manualStats.manualRatio >= 80, '无版本记录默认认定高原创度');

// 带 AI 连续版本历史
const aiVersions: ChapterVersion[] = [
  { id: 'v1', chapter_id: 'ch-manual', version_number: 1, content: '...', word_count: 36, source_type: 'PROSE_WRITER_GEN', created_at: '2026-01-01' },
  { id: 'v2', chapter_id: 'ch-manual', version_number: 2, content: '...', word_count: 36, source_type: 'AI_ASSISTANT_REVISE', created_at: '2026-01-01' },
];
const aiHeavyStats = DualWordStatsEngine.analyzeChapterDualStats(singleManualCh, aiVersions);
assert(aiHeavyStats.aiWords > aiHeavyStats.manualWords, 'AI 版本权重驱动 AI 字数判定');
assert(aiHeavyStats.manualRatio < 50, 'AI 重度辅助使得手打比例降低');

// 2.2 全书双流统计聚合与心流评级 (calculateNovelDualStats)
const novelDualStats = DualWordStatsEngine.calculateNovelDualStats(mockNovelId, mockChapters, {
  'ch-01': [
    { id: 'v1', chapter_id: 'ch-01', version_number: 1, content: '...', word_count: 50, source_type: 'USER_EDIT', created_at: '2026-01-01' },
  ],
  'ch-02': [
    { id: 'v2', chapter_id: 'ch-02', version_number: 1, content: '...', word_count: 55, source_type: 'USER_EDIT', created_at: '2026-01-02' },
  ],
});

assert(novelDualStats.novelId === mockNovelId, '双流大盘归属于当前作品');
assert(novelDualStats.totalWordCount > 0, '全书总字数统计准确');
assert(novelDualStats.manualWordCount + novelDualStats.aiWordCount === novelDualStats.totalWordCount, '手打字数 + AI 字数与全书总字数严格相等无泄漏');
assert(novelDualStats.creatorPurityLevel === 'PURIST', '纯手打作品评定为 PURIST（纯粹原创 · 匠心手作）');
assert(novelDualStats.purityLabel.includes('纯粹原创'), '拥有专业文学心流标签');
assert(novelDualStats.chapterRecords.length === 3, '包含所有 3 个章节的细分明细');

// 边界测试：空书统计
const emptyNovelStats = DualWordStatsEngine.calculateNovelDualStats(mockNovelId, []);
assert(emptyNovelStats.totalWordCount === 0, '空书总字数为 0');
assert(emptyNovelStats.manualRatio === 100, '空书比例平滑兜底');

// -----------------------------------------------------------------------------
// PART 3: 架空世界地理沙盘与行军因果核验 (MapEngine)
// -----------------------------------------------------------------------------
console.log('\n▶ [PART 3] 架空世界地理沙盘与行军因果核验 (MapEngine)');

// 3.1 默认沙盘初始化 (createDefaultMap)
const createdMap = MapEngine.createDefaultMap(mockNovelId, mockWorldRules);
assert(createdMap.novelId === mockNovelId, '沙盘所属作品 ID 正确');
assert(createdMap.markers.length >= 2, '根据地理/宗门世界法则提取出至少 2 个地标');
assert(createdMap.markers.some((m) => m.category === 'SECT' || m.category === 'CITY'), '提取的地标包含 SECT 或 CITY 分类');
assert(createdMap.routes.length >= 1, '自动关联生成了地标间的初级历练路线');

// 无任何法则时的降级保底初始化
const fallbackMap = MapEngine.createDefaultMap('nov-empty', []);
assert(fallbackMap.markers.length === 3, '无法则时保底生成三大标准沙盘地标（青云主峰、天斗古城、落日深渊）');
assert(fallbackMap.routes.length === 2, '保底生成两条历练路线');

// 3.2 行军因果核验 (verifyTravelSpeed)
const startMarker: MapMarker = {
  id: 'm-north',
  name: '北方绝顶雪山',
  category: 'SECT',
  x: 10,
  y: 10,
};
const endMarker: MapMarker = {
  id: 'm-south',
  name: '极南海岛',
  category: 'CITY',
  x: 95,
  y: 95,
};

// 场景 A：极远距离仅用 0.5 天（跨越 85% 地图）
const speedCheckFail = MapEngine.verifyTravelSpeed(startMarker, endMarker, 0.5);
assert(speedCheckFail.isReasonable === false, '超远距离日行万里被因果检测拦截');
assert(speedCheckFail.warning !== undefined && speedCheckFail.warning.includes('因果降智'), '违背因果时给出专业警告');

// 场景 B：合理天数（15 天）
const speedCheckPass = MapEngine.verifyTravelSpeed(startMarker, endMarker, 15);
assert(speedCheckPass.isReasonable === true, '合理行程天数顺利通过');

// 场景 C：邻近坐标（距离短）
const nearMarker: MapMarker = {
  id: 'm-near',
  name: '山脚客栈',
  category: 'TOWN',
  x: 12,
  y: 13,
};
const nearCheck = MapEngine.verifyTravelSpeed(startMarker, nearMarker, 0.5);
assert(nearCheck.isReasonable === true, '近距离短时间行军顺利通过');

// 3.3 跨流派自适应与“去神州化”测试 (Genre Adaptive & Non-Shenzhou)
// 科幻流派
const sciFiMap = MapEngine.generateMapFromRules('nov-scifi', [], '深空巡游者', { genre: '科幻', targetAudience: '大众' });
assert(sciFiMap.title.includes('深空巡游者') && sciFiMap.title.includes('星图势力沙盘'), '科幻作品自动命名为星图势力沙盘，不再固定叫神州');
assert(sciFiMap.bgTheme === 'COSMIC_DEEP', '科幻流派自动匹配 COSMIC_DEEP 深空星轨背景主题');
assert(sciFiMap.markers.some((m) => m.name.includes('星港') || m.name.includes('空间站') || m.name.includes('带') || m.category === 'LANDMARK' || m.category === 'SECT'), '科幻沙盘自动生成星际枢纽或奇观要冲');

// 废土流派
const wastelandMap = MapEngine.generateMapFromRules('nov-waste', [], '末日废土记', { genre: '废土末世' });
assert(wastelandMap.title.includes('末日废土记') && wastelandMap.title.includes('废土生存沙盘'), '废土作品自适应命名为废土生存沙盘');
assert(wastelandMap.bgTheme === 'DESERT_BROWN', '废土流派自动匹配 DESERT_BROWN 废土沙盘主题');
assert(wastelandMap.markers.some((m) => m.name.includes('避难所') || m.name.includes('集市') || m.name.includes('辐射')), '废土沙盘自动生成末世聚落');

// 历史遗留旧硬编码“神州山河总略图”平滑升级测试
const legacyMapJson = JSON.stringify({
  id: 'map-legacy',
  novelId: 'nov-upgrade',
  title: '神州山河总略图',
  markers: [],
  routes: [],
  updatedAt: 1000,
});
localStorage.setItem('novelforge_map_nov-upgrade', legacyMapJson);
const upgradedMap = MapEngine.loadMapFromStorage('nov-upgrade', [], '银河帝国史诗', { genre: '科幻' });
assert(upgradedMap.title.includes('银河帝国史诗') && upgradedMap.title.includes('星图势力沙盘'), '旧版神州山河总略图被自动平滑升级为书名定制沙盘');

console.log('\n===============================================================');
console.log(` ✅ 全部通过！第三梯队三大引擎自动化测试断言: ${passCount} / ${totalCount} (100%)`);
console.log('===============================================================\n');
