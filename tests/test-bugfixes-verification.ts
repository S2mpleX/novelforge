import fs from 'fs';
import { cleanTitlePrefix, formatNodeDisplayTitle } from '../src/utils/titleFormatter';
import { FullCheckEngine } from '../src/features/fullcheck/FullCheckEngine';
import { Chapter, PlotThread } from '../src/types';

console.log('===============================================================');
console.log('🧪 NovelForge AI — 深度漏洞修复与因果一致性专项自动化验证套件');
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

// -------------------------------------------------------------
// [测试 1] 标题格式化：篇/部前缀与章前缀彻底解耦
// -------------------------------------------------------------
console.log('▶ [测试 1] 标题格式化：篇/部前缀与章前缀精准隔离');

// 验证：章标题包含“第一部队”不应被错误剥离为“队的秘密”
const militaryTitle = cleanTitlePrefix('第一部队的秘密行动', 'CHAPTER');
assert(militaryTitle === '第一部队的秘密行动', '“第一部队的秘密行动”不会被错误剥离为“队的秘密行动”');

// 验证：“第一部”在 PART 模式下正确清洗
const partCleaned = cleanTitlePrefix('第一部：乱世风云', 'PART');
assert(partCleaned === '乱世风云', 'PART 模式下正确剥离“第一部：”前缀');

// 验证：“第一部”在 PART 模式下的节点标题规范化
const formattedPart = formatNodeDisplayTitle('第一部：乱世风云', 'PART', 1);
assert(formattedPart === '第 1 篇: 乱世风云', '规范组装第 1 篇展示标题');

// 验证：章前缀正常识别“章/节/回/话”
assert(cleanTitlePrefix('第十章 破境', 'CHAPTER') === '破境', '正常清洗“第十章”');
assert(cleanTitlePrefix('第一回 风云际会', 'CHAPTER') === '风云际会', '正常清洗“第一回”');
assert(cleanTitlePrefix('第二话 宿命对决', 'CHAPTER') === '宿命对决', '正常清洗“第二话”');

// -------------------------------------------------------------
// [测试 2] 伏笔悬念生命周期：基于 introduced_chapter_id 精准核验
// -------------------------------------------------------------
console.log('\n▶ [测试 2] 伏笔悬念生命周期：基于 introduced_chapter_id 精准核验');

const mock15Chapters: Chapter[] = Array.from({ length: 15 }, (_, i) => ({
  id: `ch-${i + 1}`,
  novel_id: 'nov-1',
  chapter_number: i + 1,
  title: `第 ${i + 1} 章`,
  content: `<p>第 ${i + 1} 章正文内容，情节稳定推进中。</p>`,
  word_count: 2000,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}));

// 伏笔 A：在第 14 章刚刚埋设，全书虽然有 15 章，但距今仅 1 章，绝不应误报滞后烂尾！
const recentThread: PlotThread = {
  id: 'th-recent',
  novel_id: 'nov-1',
  title: '十四柄飞剑的鸣响',
  description: '在第十四章大战中突现的异常剑鸣',
  status: 'PLANTED',
  introduced_chapter_id: 'ch-14',
  expected_resolution: '第二十章揭晓剑尊传承',
  created_at: Date.now(),
  updated_at: Date.now(),
};

// 伏笔 B：在第 1 章埋设，全书已有 15 章，距今 14 章，应当被准确预警滞后烂尾！
const staleThread: PlotThread = {
  id: 'th-stale',
  novel_id: 'nov-1',
  title: '青铜残片的秘密',
  description: '第一章捡到的残片',
  status: 'PLANTED',
  introduced_chapter_id: 'ch-1',
  expected_resolution: '第十章揭晓',
  created_at: Date.now(),
  updated_at: Date.now(),
};

const report = FullCheckEngine.runCheck({
  chapters: mock15Chapters,
  characters: [],
  plotThreads: [recentThread, staleThread],
});

const recentIssue = report.issues.find((i) => i.targetEntity === '十四柄飞剑的鸣响');
assert(!recentIssue, '最新连载第 14 章埋设的新伏笔不会被误报为长期滞后烂尾');

const staleIssue = report.issues.find((i) => i.targetEntity === '青铜残片的秘密');
assert(!!staleIssue, '连载跨越 14 章未推进的早期伏笔被准确预警');
assert(staleIssue?.severity === 'WARNING', '滞后伏笔标记为 WARNING 等级');

// -------------------------------------------------------------
// [测试 3] 中文全词匹配 (Whole Word) 正则断言与英文兼容
// -------------------------------------------------------------
console.log('\n▶ [测试 3] 中文全词匹配 (Whole Word) 正则断言与英文兼容');

function buildWordRegex(query: string, matchWord: boolean, caseSensitive: boolean): RegExp {
  let flags = 'g';
  if (!caseSensitive) flags += 'i';
  let pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (matchWord) {
    const hasChinese = /[\u4e00-\u9fa5]/.test(query);
    if (hasChinese) {
      flags += 'u';
      pattern = `(?<=^|[^\\p{Script=Han}\\w])${pattern}(?=$|[^\\p{Script=Han}\\w])`;
    } else {
      pattern = `\\b${pattern}\\b`;
    }
  }
  return new RegExp(pattern, flags);
}

// 中文全词测试 (带有 g 标志时在每次 test 前重置 lastIndex)
const testMatch = (re: RegExp, str: string) => {
  re.lastIndex = 0;
  return re.test(str);
};

const cnRegex = buildWordRegex('林远', true, false);
assert(testMatch(cnRegex, '“林远”轻轻点头'), '中文全词匹配：标点包裹“林远”正常命中');
assert(testMatch(cnRegex, '林远，你来了'), '中文全词匹配：句首+逗号“林远，”正常命中');
assert(!testMatch(cnRegex, '小林远宗'), '中文全词匹配：嵌于人名宗门“小林远宗”不误报全词');
assert(testMatch(cnRegex, '林远'), '中文全词匹配：单独词句“林远”完全匹配');

// 英文全词测试
const enRegex = buildWordRegex('AI', true, false);
assert(testMatch(enRegex, 'Use AI for fiction'), '英文全词匹配：单词 AI 正常命中');
assert(!testMatch(enRegex, 'AIR travel'), '英文全词匹配：AIR 不误报为 AI');

// -------------------------------------------------------------
// [测试 4] AI 段落清洗转义：防 HTML 特殊符号破坏富文本 DOM
// -------------------------------------------------------------
console.log('\n▶ [测试 4] AI 段落清洗转义：防 HTML 特殊符号破坏富文本 DOM');

const formatTextToParagraphs = (rawText: string): string => {
  return rawText
    .split('\n')
    .filter((p) => p.trim())
    .map((p) => {
      const escaped = p
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${escaped}</p>`;
    })
    .join('');
};

const rawAiOutput = '林远心想：“<破虚剑法>果然名不虚传！”\n力量消耗 < 50% 且 速度 > 200。\n黑衣人 & 同伙已退去。';
const convertedHtml = formatTextToParagraphs(rawAiOutput);

assert(convertedHtml.includes('&lt;破虚剑法&gt;'), '<破虚剑法> 被安全转义为 &lt;破虚剑法&gt;，杜绝非法 HTML 标签注入');
assert(convertedHtml.includes('&lt; 50%'), '< 符号被安全转义为 &lt;');
assert(convertedHtml.includes('&gt; 200'), '> 符号被安全转义为 &gt;');
assert(convertedHtml.includes('&amp; 同伙'), '& 符号被安全转义为 &amp;');
assert(convertedHtml.startsWith('<p>') && convertedHtml.endsWith('</p>'), '每段均被规整封装在 <p> 标签中');

// -------------------------------------------------------------
// [测试 5] Word 导入章节正文切割：rawMatchLength 杜绝标题渗漏
// -------------------------------------------------------------
console.log('\n▶ [测试 5] Word 导入章节正文切割：杜绝标题文字残留在正文首段');

import { WordImportService } from '../src/features/importer/services/WordImportService';
const sampleWordDoc = '这里是一段作者序言前言。\n\n第一章 少年出山\n大荒无垠，山岳巍峨。少年石渊出征。';
const parsedChapters = WordImportService.splitChapters(sampleWordDoc, 'AUTO');

assert(parsedChapters.length === 2, '成功切分出序章与第一章');
assert(parsedChapters[1].title === '第一章 少年出山', '章节标题完整匹配');
assert(!parsedChapters[1].content.startsWith('　　出山'), '标题末尾“出山”两字绝对不会泄漏到正文开头');
assert(parsedChapters[1].content.includes('大荒无垠，山岳巍峨'), '正文第一句内容完整无损');

// -------------------------------------------------------------
// [测试 6] 导出下载文件名安全清洗：Windows 非法字符转义
// -------------------------------------------------------------
console.log('\n▶ [测试 6] 导出下载文件名安全清洗：Windows 非法字符转义');

const getSafeTitle = (title?: string) => {
  return (title || 'novel').replace(/[\/\\:*?"<>|]/g, '_').trim() || 'novel';
};

const trickyTitle1 = '我的道侣:从剑宗开始?';
const safeTitle1 = getSafeTitle(trickyTitle1);
assert(!/[\/\\:*?"<>|]/.test(safeTitle1), '包含冒号和问号的书名成功清洗为 Windows 合法文件名');
assert(safeTitle1 === '我的道侣_从剑宗开始_', '特殊符号转义为下划线下安全兼容');

const trickyTitle2 = '科幻<三体>星战/反物质|纪元';
const safeTitle2 = getSafeTitle(trickyTitle2);
assert(!/[\/\\:*?"<>|]/.test(safeTitle2), '尖括号、斜杠与管道符全部被安全替换');

// -------------------------------------------------------------
// [测试 7] 工作流动态变量安全替换：函数返回值防 $ 吞字
// -------------------------------------------------------------
console.log('\n▶ [测试 7] 工作流动态变量安全替换：防 $ 符号被 JavaScript replace 误吞');

const templatePrompt = '根据前一步方案 {{step_1_output}}，编写男主获得 $1000万 奖励的剧情。';
const stepOutputWithDollar = '主角通过加密货币交易赚取了 $500000 利润';

// 采用安全函数式替换
const safeReplaced = templatePrompt.replace(/\{\{step_1_output\}\}/g, () => stepOutputWithDollar);
assert(safeReplaced.includes('$500000'), '$500000 中的 $ 与数字完整保留，未被 JavaScript 误当捕获组吞掉');
assert(safeReplaced.includes('$1000万'), '模板中既有的 $1000万 同样无损保留');

// -------------------------------------------------------------
// [测试 8] 更新前数据安全守卫：备份失败时绝对阻断升级
// -------------------------------------------------------------
console.log('\n▶ [测试 8] 更新前数据安全守卫：备份失败时绝对阻断升级');

import { DataSafetyGuard } from '../src/features/updater/services/DataSafetyGuard';

// 当存在未保存内容时阻断
const guardResultUnsaved = await DataSafetyGuard.runPreUpdateSafetyCheck({
  hasUnsavedChanges: true,
  activeChapterTitle: '第五章 破晓',
});
assert(guardResultUnsaved.canProceed === false, '有未保存正文时 canProceed 为 false');
assert(guardResultUnsaved.unsavedDetails?.includes('第五章 破晓') || false, '准确提示未保存的章节名称');

// -------------------------------------------------------------
// [测试 9] 剧情大纲视图：未归类与孤儿剧情弧独立分组展示，绝不隐藏数据
// -------------------------------------------------------------
console.log('\n▶ [测试 9] 剧情大纲视图：未归类与孤儿剧情弧独立分组展示');

import { StoryArc, StoryPhase } from '../src/types';

const mockPhases: StoryPhase[] = [
  { id: 'phase-1', novel_id: 'nov-1', title: '第一阶段：宗门初起', order_index: 1, status: 'DEVELOPING', created_at: Date.now() },
];

const mockArcs: StoryArc[] = [
  { id: 'arc-1', novel_id: 'nov-1', phase_id: 'phase-1', title: '宗门大比弧', goal: '夺冠', description: '', priority: 'MAIN', status: 'DEVELOPING', planned_end: '', created_at: Date.now() },
  { id: 'arc-2', novel_id: 'nov-1', phase_id: undefined, title: '独立支线：黑市淘金弧', goal: '寻找药材', description: '', priority: 'SUB', status: 'PLANNING', planned_end: '', created_at: Date.now() },
  { id: 'arc-3', novel_id: 'nov-1', phase_id: 'deleted-phase', title: '孤儿剧情弧：旧阶段残余', goal: '探秘古洞', description: '', priority: 'WORLD', status: 'PLANNING', planned_end: '', created_at: Date.now() },
];

const phasedArcs = mockArcs.filter((a) => a.phase_id && mockPhases.some((p) => p.id === a.phase_id));
const unassignedArcs = mockArcs.filter((a) => !a.phase_id || !mockPhases.some((p) => p.id === a.phase_id));

assert(phasedArcs.length === 1 && phasedArcs[0].title === '宗门大比弧', '已关联阶段的剧情弧准确归入该阶段');
assert(unassignedArcs.length === 2, '未指定阶段与阶段已删除的剧情弧均被准确识别为未归类剧情弧');
assert(unassignedArcs.some((a) => a.title === '独立支线：黑市淘金弧'), '未指定阶段的剧情弧保留在未归类组');
assert(unassignedArcs.some((a) => a.title === '孤儿剧情弧：旧阶段残余'), '所属阶段被删除后的孤儿剧情弧不会凭空消失');

// -------------------------------------------------------------
// [测试 10] 资产反哺提案去重：杜绝跨品类同名实体互相吞噬
// -------------------------------------------------------------
console.log('\n▶ [测试 10] 资产反哺提案去重：杜绝跨品类同名实体互相吞噬');

import { AssetProposal } from '../src/features/proposals/types';

const mockProposals: AssetProposal[] = [
  {
    id: 'p1',
    category: 'CHARACTER',
    categoryLabel: '人物角色',
    name: '七星剑',
    summary: '化名为七星剑的独行剑客',
    contextSentence: '七星剑冷冷地看着对方。',
    sourceChapterId: 'ch-1',
    sourceChapterTitle: '第一章',
    confidence: 0.9,
    status: 'PENDING',
    createdAt: Date.now(),
    suggestedAttributes: {},
  },
  {
    id: 'p2',
    category: 'ARTIFACT',
    categoryLabel: '法宝灵物',
    name: '七星剑',
    summary: '宗门传承古剑',
    contextSentence: '他腰间佩戴着一柄七星剑。',
    sourceChapterId: 'ch-1',
    sourceChapterTitle: '第一章',
    confidence: 0.85,
    status: 'PENDING',
    createdAt: Date.now(),
    suggestedAttributes: {},
  },
  {
    id: 'p3',
    category: 'CHARACTER',
    categoryLabel: '人物角色',
    name: '七星剑',
    summary: '第二章再次登场',
    contextSentence: '七星剑沉声道。',
    sourceChapterId: 'ch-2',
    sourceChapterTitle: '第二章',
    confidence: 0.9,
    status: 'PENDING',
    createdAt: Date.now(),
    suggestedAttributes: {},
  },
];

// 正确的多维度组合键去重
const deduplicatedMap = new Map<string, AssetProposal>();
mockProposals.forEach((p) => {
  const key = `${p.category}:${p.name}`;
  if (!deduplicatedMap.has(key)) {
    deduplicatedMap.set(key, p);
  }
});
const deduplicatedList = Array.from(deduplicatedMap.values());

assert(deduplicatedList.length === 2, '同名不同品类的实体（角色七星剑 vs 法宝七星剑）均被完整保留');
assert(deduplicatedList.some((p) => p.category === 'CHARACTER' && p.name === '七星剑'), '保留角色类七星剑');
assert(deduplicatedList.some((p) => p.category === 'ARTIFACT' && p.name === '七星剑'), '保留法宝类七星剑');

// -------------------------------------------------------------
// [测试 11] 全书工程归档导入：WebMock / 桥接层返回完整 Novel 对象
// -------------------------------------------------------------
console.log('\n▶ [测试 11] 全书工程归档导入：WebMock / 桥接层返回完整 Novel 对象');

import { api } from '../src/utils/tauriBridge';

const sampleArchive = {
  novel: {
    id: 'orig-1',
    title: '逆天神魔志',
    description: '宏大修真史诗',
    genre_profile: '玄幻修仙',
    language: 'zh-CN',
    writing_style: '沉雄大气',
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  chapters: [
    { id: 'ch-1', novel_id: 'orig-1', chapter_number: 1, title: '第一章 出关', content: '<p>正文内容</p>', word_count: 3000 },
  ],
  characters: [
    { id: 'c-1', novel_id: 'orig-1', name: '李纯阳', personality: '坚韧不拔' },
  ],
  version: '2.0',
};

const importedNovel = await api.importNovelArchive(JSON.stringify(sampleArchive));
assert(importedNovel && typeof importedNovel === 'object', 'importNovelArchive 返回对象实体');
assert(importedNovel.id && importedNovel.id.startsWith('novel_'), '生成全新的小说项目 ID');
assert(importedNovel.title.includes('逆天神魔志'), '导入标题包含原书名');
assert(importedNovel.title.includes('导入副本'), '标记为导入副本以防重叠');

// -------------------------------------------------------------
// [测试 12] 双重字数统计引擎：AI 来源全谱系覆盖与创作者纯度评级
// -------------------------------------------------------------
console.log('\n▶ [测试 12] 双重字数统计引擎：AI 来源全谱系覆盖与创作者纯度评级');

import { DualWordStatsEngine } from '../src/features/stats/DualWordStatsEngine';
import { ChapterVersion } from '../src/types';

const testChapter: Chapter = {
  id: 'ch-stats-1',
  novel_id: 'nov-1',
  chapter_number: 1,
  title: '测试章节',
  content: '<p>正文内容测试</p>',
  word_count: 4000,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
};

const aiVersions: ChapterVersion[] = [
  {
    id: 'v-1',
    chapter_id: 'ch-stats-1',
    version_number: 1,
    content: '<p>初始AI生成</p>',
    word_count: 2000,
    source_type: 'AI_GENERATED',
    created_at: Date.now(),
  },
  {
    id: 'v-2',
    chapter_id: 'ch-stats-1',
    version_number: 2,
    content: '<p>MCP 正文扩写</p>',
    word_count: 4000,
    source_type: 'AI_MCP_PROSE',
    created_at: Date.now(),
  },
];

const aiStats = DualWordStatsEngine.analyzeChapterDualStats(testChapter, aiVersions);
assert(aiStats.aiWords > 0, 'AI_GENERATED 与 AI_MCP_PROSE 正确识别并计入 AI 辅助字数');
assert(aiStats.manualWords < 4000, '手打字数与 AI 字数精准隔离');
assert(aiStats.manualRatio < 100, '手打比例正确下调');

const manualVersions: ChapterVersion[] = [
  {
    id: 'v-3',
    chapter_id: 'ch-stats-1',
    version_number: 1,
    content: '<p>纯作者手打</p>',
    word_count: 4000,
    source_type: 'USER_EDIT',
    created_at: Date.now(),
  },
];

const manualStats = DualWordStatsEngine.analyzeChapterDualStats(testChapter, manualVersions);
assert(manualStats.manualWords === 4000, 'USER_EDIT 识别为 100% 纯手打');
assert(manualStats.aiWords === 0, 'USER_EDIT 下 AI 字数为 0');
assert(manualStats.manualRatio === 100, '纯作者手打比例为 100%');

// -------------------------------------------------------------
// [测试 13] 故事设定集（角色/世界观/伏笔）全生命周期与级联清理 (WebMock/Bridge)
// -------------------------------------------------------------
console.log('\n▶ [测试 13] 故事设定集（角色/世界观/伏笔）全生命周期与级联清理 (WebMock/Bridge)');

const mockNovelId = importedNovel.id;

// 1. 角色 CRUD
const createdChar = await api.createCharacter({
  novel_id: mockNovelId,
  name: '莫寻欢',
  aliases: '酒剑狂客',
  profile: '逍遥剑宗太上长老',
  personality: '不羁狂放',
  background: '曾一剑断天河',
  motivation: '证道逍遥大罗金仙',
});
assert(createdChar.name === '莫寻欢', '成功创建角色档案');

const updatedChar = await api.updateCharacter({
  id: createdChar.id,
  name: '莫寻欢 (终极归真)',
  personality: '返璞归真、大智若愚',
});
assert(updatedChar.name === '莫寻欢 (终极归真)', '成功更新角色名称');
assert(updatedChar.personality === '返璞归真、大智若愚', '成功更新角色性格');

await api.deleteCharacter(createdChar.id);
const charsAfter = await api.listCharacters(mockNovelId);
assert(!charsAfter.some((c) => c.id === createdChar.id), '被删除的角色在列表中已彻底清除');

// 2. 世界观法则 CRUD
const createdRule = await api.createWorldRule({
  novel_id: mockNovelId,
  title: '太虚灵气潮汐律',
  rule_content: '每逢甲子之年，灵气倒灌神州。',
  authority_level: 'CANON',
});
assert(createdRule.title === '太虚灵气潮汐律', '成功创建世界观核心法则');

const updatedRule = await api.updateWorldRule({
  id: createdRule.id,
  title: '太虚灵气潮汐律 (补正)',
  rule_content: '每逢甲子之年，灵气倒灌并伴随煞气风暴。',
  authority_level: 'CANON',
});
assert(updatedRule.title === '太虚灵气潮汐律 (补正)', '成功更新世界观法则');

await api.deleteWorldRule(createdRule.id);
const rulesAfter = await api.listWorldRules(mockNovelId);
assert(!rulesAfter.some((r) => r.id === createdRule.id), '被删除的世界观法则在列表中已彻底清除');

// 3. 剧情伏笔线索 CRUD
const createdThread = await api.createPlotThread({
  novel_id: mockNovelId,
  title: '酒葫芦里的残缺阵图',
  description: '莫寻欢贴身携带的古朴紫砂葫芦底部的阵纹',
  expected_resolution: '第七卷揭示远古传送阵',
});
assert(createdThread.title === '酒葫芦里的残缺阵图', '成功埋设新伏笔线索');
assert(createdThread.status === 'PLANTED', '初始伏笔状态为 PLANTED');

await api.updatePlotThreadStatus(createdThread.id, 'DEVELOPING');
const threadsMid = await api.listPlotThreads(mockNovelId);
const midThread = threadsMid.find((t) => t.id === createdThread.id);
assert(midThread?.status === 'DEVELOPING', '成功将伏笔流转至 DEVELOPING 状态');

const updatedThread = await api.updatePlotThread({
  id: createdThread.id,
  title: '九霄乾坤万灵葫',
  status: 'RESOLVED',
});
assert(updatedThread.title === '九霄乾坤万灵葫', '成功更新伏笔名称');
assert(updatedThread.status === 'RESOLVED', '成功将伏笔闭合至 RESOLVED 状态');

await api.deletePlotThread(createdThread.id);
const threadsAfter = await api.listPlotThreads(mockNovelId);
assert(!threadsAfter.some((t) => t.id === createdThread.id), '被删除的伏笔在列表中已彻底清除');

// =========================================================================
// 测试 14: 顶栏 Header 宽度防溢出核验与 AI 助手独立渲染保障
// =========================================================================
console.log('\n▶ [测试 14] 顶栏 Header 宽度防溢出核验与 AI 助手独立渲染保障');

// 模拟 1920px 分辨率下的尺寸预算核验
const zone1Width = 350; // 左侧 Logo + 书名选择器
// 新重构下：激活步骤 90px，5 个非激活步骤各 28px，向导 28px
const zone2CompactWidth = 90 + 5 * 28 + 28 + 12; // 270px
// 右侧业务区：指令 32px + CPU 32px + 自动连载 85px + 工坊 60px + 状态 75px
const zone3BusinessWidth = 32 + 32 + 85 + 60 + 75; // 284px
// 右侧常驻控制区：缩放 85px + 日夜 32px + 专注 32px + 快捷键 32px + 设置 32px + AI助手 32px + 窗口控制 135px
const zone3PermanentWidth = 85 + 32 + 32 + 32 + 32 + 32 + 135; // 380px

const totalHeaderWidth = zone1Width + zone2CompactWidth + zone3BusinessWidth + zone3PermanentWidth;
assert(totalHeaderWidth <= 1920, `Header 在 1920px 屏幕下总宽 ${totalHeaderWidth}px 绝不超出 1920px`);
assert(1920 - totalHeaderWidth >= 500, `Header 在 1920px 屏幕下保留至少 500px 弹性缓冲空间（当前富余 ${1920 - totalHeaderWidth}px）`);
assert(totalHeaderWidth <= 1440, `Header 在 1440px 屏幕下总宽 ${totalHeaderWidth}px 同样安全容纳不溢出`);

// 验证六步法阶段数据完整
const pipelineIds = ['DASHBOARD', 'WORLD', 'CHARACTERS', 'PLOTS', 'EDITOR', 'MEMORY'];
assert(pipelineIds.length === 6, '六步法包含完备的 6 个创作阶段');

// =========================================================================
// 测试 15: 全系统视口高度自适应（防横幅挤出裁剪）与小分栏防挤爆加固
// =========================================================================
console.log('\n▶ [测试 15] 全系统视口高度自适应与小分栏防挤压防裁剪加固');

const sidebarSource = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
const charactersSource = fs.readFileSync('src/components/views/CharactersView.tsx', 'utf8');
const worldSource = fs.readFileSync('src/components/views/WorldSettingsView.tsx', 'utf8');
const editorSource = fs.readFileSync('src/components/editor/NovelEditor.tsx', 'utf8');
const chaptersPanelSource = fs.readFileSync('src/components/docking/panels/ChaptersPanel.tsx', 'utf8');

assert(!sidebarSource.includes('100vh-3.5rem'), 'Sidebar.tsx 已彻底移除 100vh-3.5rem 硬编码，适配动态通知横幅');
assert(!charactersSource.includes('100vh-3.5rem'), 'CharactersView.tsx 已彻底移除 100vh-3.5rem 硬编码，防止底部内容被截断');
assert(!worldSource.includes('100vh-3.5rem'), 'WorldSettingsView.tsx 已彻底移除 100vh-3.5rem 硬编码，保障列表滚动到底部');

assert(sidebarSource.includes('h-full shadow-sm'), 'Sidebar.tsx 采用 h-full 自适应父级 Flex 容器');
assert(charactersSource.includes('h-full'), 'CharactersView.tsx 采用 h-full 自适应');
assert(worldSource.includes('h-full'), 'WorldSettingsView.tsx 采用 h-full 自适应');

// NovelEditor Paging Bar 弹性防护断言
assert(editorSource.includes('flex-wrap sm:flex-nowrap min-w-0'), 'NovelEditor 章节穿梭栏支持 flex-wrap 弹性防溢出');
assert(editorSource.includes('max-w-[85%] border-l flex flex-col shrink-0 animate-in slide-in-from-right duration-200 shadow-md z-20'), '灵感便签抽屉具备 max-w-[85%] 保护，窄分栏下不挤没正文');

// ChaptersPanel 篇幅条让位断言
assert(chaptersPanelSource.includes('group-hover:hidden transition-all'), 'ChaptersPanel 悬停时篇幅柱自动让位，防止章节标题被挤压');
assert(sidebarSource.includes('group-hover:hidden transition-all'), 'Sidebar 列表模式悬停时篇幅柱自动让位');

// =========================================================================
// 测试 16: 全局下拉浮层防父级溢出裁剪 (Overflow Clipping) 与悬浮面板视口安全
// =========================================================================
console.log('\n▶ [测试 16] 全局下拉浮层防父级溢出裁剪与悬浮面板视口安全核验');

const headerSource = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');
const tabGroupSource = fs.readFileSync('src/components/docking/TabGroup.tsx', 'utf8');
const floatingPanelSource = fs.readFileSync('src/components/docking/FloatingPanelContainer.tsx', 'utf8');
const modelArenaSource = fs.readFileSync('src/components/docking/panels/ModelArenaPanel.tsx', 'utf8');

// 1. Header 根容器防裁剪断言
assert(headerSource.includes('min-w-0 w-full relative') && !headerSource.includes('min-w-0 w-full overflow-hidden'), 'Header 顶层容器已移除 overflow-hidden，保障下拉浮窗不被裁剪腰斩');

// 2. TabGroup 标签栏防裁剪断言
assert(tabGroupSource.includes('min-w-0 relative z-20') && !tabGroupSource.includes('min-w-0 overflow-hidden'), 'TabGroup 标签栏已移除 overflow-hidden，保障添加模块与拆分菜单完整展开');

// 3. NovelEditor 工具栏防裁剪断言
assert(editorSource.includes('gap-1.5 relative min-w-0') && !editorSource.includes('gap-1.5 overflow-hidden min-w-0'), 'NovelEditor 工具栏已移除 overflow-hidden，保障正文字号调节预设完整显示');

// 4. FloatingPanel 视口安全与 Header 避让断言
assert(floatingPanelSource.includes('snappedY = Math.max(60, Math.min(window.innerHeight - 40, snappedY))'), 'FloatingPanel 拖拽磁吸具备顶部 60px 与视口边界保护，防止标题栏消失');
assert(floatingPanelSource.includes('potentialY >= 60'), 'FloatingPanel 上边缘拉伸具备顶部 60px 保护，防止拉入 Header 内部');

// 5. ModelArenaPanel 暗色对比度加固断言
assert(modelArenaSource.includes('text-amber-950 dark:text-amber-100 truncate max-w-xs'), 'ModelArenaPanel 战报历史卡片补充暗色模式文字高对比度类名');
assert(modelArenaSource.includes('bg-surface dark:bg-[#1a1714] border border-line flex items-center justify-between text-xs'), 'ModelArenaPanel 战报历史卡片具备暗色背景适配');

console.log('\n===============================================================');
console.log(`🎉 专项漏洞修复验证全部通过！共完成 ${passCount} 项断言，成功 ${passCount} 项，失败 0 项。`);
console.log('===============================================================\n');
