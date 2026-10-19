import { FullCheckEngine } from '../src/features/fullcheck/FullCheckEngine';
import { AssetProposalEngine } from '../src/features/proposals/AssetProposalEngine';
import { DeconstructEngine, DECONSTRUCT_DIMENSIONS } from '../src/features/deconstruct/DeconstructEngine';
import { Chapter, Character, WorldRule, PlotThread } from '../src/types';
import { AssetProposal } from '../src/features/proposals/types';
import { api } from '../src/utils/tauriBridge';

console.log('===============================================================');
console.log(' NovelForge AI V2.5 — 第二梯队核心生产力引擎自动化测试套件');
console.log(' 覆盖：全书因果体检巡检、正文资产反哺提案、拆书工坊与0-Token离线分析');
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

// -----------------------------------------------------------------------------
// PART 1: 全书因果体检与违规巡检引擎 (FullCheckEngine)
// -----------------------------------------------------------------------------
console.log('▶ [PART 1] 全书因果体检与违规巡检引擎 (FullCheckEngine)');

// 1. stripHtml
const rawHtml = '<p>第一行&nbsp;正文</p><span>第二行<b>强调</b></span>';
assert(FullCheckEngine.stripHtml(rawHtml) === '第一行 正文第二行强调', 'stripHtml 正常剔除 HTML 标签与转换实体字符');

// 构造测试数据
const mockChapters: Chapter[] = [
  {
    id: 'ch-01',
    novel_id: 'nov-1',
    title: '第一章 剑出青云',
    content: '<p>林远深吸一口气，握紧手中的铁剑。青云门的大门就在眼前。</p>',
    order_num: 1,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'ch-02',
    novel_id: 'nov-1',
    title: '第二章 绝境反击',
    content: '<p>林远拔剑迎敌。黑衣刺客冷笑道：“区区外门弟子，也敢放肆！”</p>',
    order_num: 2,
    created_at: '2026-01-02',
    updated_at: '2026-01-02',
  },
  {
    id: 'ch-03',
    novel_id: 'nov-1',
    title: '第三章 昔人已逝',
    content: '<p>林远站在悬崖边，想起赵无极死于万魔深渊的往昔，心中百感交集，祭奠了一杯烈酒。</p>',
    order_num: 3,
    created_at: '2026-01-03',
    updated_at: '2026-01-03',
  },
  {
    id: 'ch-04',
    novel_id: 'nov-1',
    title: '第四章 诡异现身',
    content: '<p>夜半更深，阴风呼啸。赵无极冷笑着迈步走来，拔剑直刺林远咽喉！</p>',
    order_num: 4,
    created_at: '2026-01-04',
    updated_at: '2026-01-04',
  },
];

const mockCharacters: Character[] = [
  {
    id: 'char-1',
    novel_id: 'nov-1',
    name: '林远',
    role_type: '主角',
    personality: '沉稳坚毅',
    status: '健康',
  },
  {
    id: 'char-2',
    novel_id: 'nov-1',
    name: '赵无极',
    role_type: '反派',
    personality: '阴狠毒辣',
    status: '死亡', // 标记为死亡
  },
  {
    id: 'char-3',
    novel_id: 'nov-1',
    name: '清风道长',
    role_type: '配角',
    personality: '仙风道骨',
    status: '闭关',
  },
];

// 测试 2: 死人诈尸检测 (CRITICAL)
console.log('\n  [测试 2] 死人诈尸主动登场拦截 (CRITICAL)');
const reportDead = FullCheckEngine.runCheck({
  chapters: mockChapters,
  characters: mockCharacters,
});

const zombieIssue = reportDead.issues.find(
  (i) => i.dimension === 'CHARACTER_LIFE' && i.severity === 'CRITICAL' && i.targetEntity === '赵无极'
);
assert(!!zombieIssue, '成功检出已故角色赵无极诈尸主动登场问题');
assert(zombieIssue?.chapterId === 'ch-04', '精准定位到第四章《第四章 诡异现身》');
assert(zombieIssue?.excerpt?.includes('赵无极冷笑'), '精确摘录出诈尸动作语句');

// 测试 3: 回忆/墓碑安全过滤
console.log('\n  [测试 3] 死亡角色回忆/怀念/墓碑被动语态白名单过滤');
const thirdChapterZombie = reportDead.issues.find(
  (i) => i.dimension === 'CHARACTER_LIFE' && i.chapterId === 'ch-03'
);
assert(!thirdChapterZombie, '第三章属于回忆祭奠，不应被误判为诈尸');

// 测试 4: 闭关/离场角色在最新章登场 (WARNING)
console.log('\n  [测试 4] 闭关/离场角色状态冲突巡检 (WARNING)');
const chaptersWithRetreated = [
  ...mockChapters,
  {
    id: 'ch-05',
    novel_id: 'nov-1',
    title: '第五章 风云突变',
    content: '<p>清风道长从天而降，拂尘一挥震退强敌。</p>',
    order_num: 5,
    created_at: '2026-01-05',
    updated_at: '2026-01-05',
  },
];
const reportRetreat = FullCheckEngine.runCheck({
  chapters: chaptersWithRetreated,
  characters: mockCharacters,
});
const retreatIssue = reportRetreat.issues.find(
  (i) => i.dimension === 'CHARACTER_LIFE' && i.severity === 'WARNING' && i.targetEntity === '清风道长'
);
assert(!!retreatIssue, '成功识别闭关中角色清风道长在最新章节突兀现身');

// 测试 5: 核心角色掉线检测 (INFO)
console.log('\n  [测试 5] 长期掉线角色巡检 (INFO)');
// 构建 16 章节序列，某角色在第 1、2 章出场后，直至第 16 章均未露面
const longChapters: Chapter[] = Array.from({ length: 16 }, (_, idx) => ({
  id: `ch-seq-${idx + 1}`,
  novel_id: 'nov-1',
  title: `第${idx + 1}章 旅途`,
  content:
    idx === 0 || idx === 1
      ? '<p>白小纯大声说道：我不会放弃的！随后向前奔跑超过两千字叙述……' + '测试'.repeat(400) + '</p>'
      : '<p>主角继续前行，跨越高山大河。' + '剧情推进'.repeat(400) + '</p>',
  order_num: idx + 1,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
}));

const reportAbsence = FullCheckEngine.runCheck({
  chapters: longChapters,
  characters: [
    {
      id: 'char-bai',
      novel_id: 'nov-1',
      name: '白小纯',
      role_type: '主要配角',
      personality: '机敏',
      status: '健康',
    },
  ],
});
const absenceIssue = reportAbsence.issues.find(
  (i) => i.dimension === 'CHARACTER_LIFE' && i.severity === 'INFO' && i.targetEntity === '白小纯'
);
assert(!!absenceIssue, '成功捕获连续超过 12 章未登场的掉线角色白小纯');

// 测试 6: 伏笔未回收巡检 (FORESHADOW_ORPHAN)
console.log('\n  [测试 6] 伏笔悬念滞后烂尾巡检 (WARNING)');
const mockThreads: PlotThread[] = [
  {
    id: 'thread-1',
    novel_id: 'nov-1',
    title: '青铜残片的秘密',
    description: '主角在第一章捡到的锈蚀残片，似乎隐藏神级功法',
    status: 'PLANTED',
    expected_resolution: '第十章秘境开启时揭晓',
    created_at: '2026-01-01',
  },
];
const reportThreads = FullCheckEngine.runCheck({
  chapters: longChapters, // 16 chapters >= 10
  characters: [],
  plotThreads: mockThreads,
});
const threadIssue = reportThreads.issues.find((i) => i.dimension === 'FORESHADOW_ORPHAN');
assert(!!threadIssue, '成功检测连载超过 10 章仍为 PLANTED 初设状态的滞后伏笔');

// 测试 7: 权威公理一致性违背 (CANON_CONFLICT)
console.log('\n  [测试 7] 权威公理一致性违背巡检 (CANON_CONFLICT)');
const mockRules: WorldRule[] = [
  {
    id: 'rule-canon-1',
    novel_id: 'nov-1',
    title: '天道时光法则',
    category: '宇宙法则',
    rule_content: '因果天理循环，任何修士哪怕成仙也无法逆转时光复活亡者',
    authority_level: 'CANON',
    is_active: true,
  },
];
const conflictChapters: Chapter[] = [
  {
    id: 'ch-conflict',
    novel_id: 'nov-1',
    title: '第七章 逆天改命',
    content: '<p>林远参悟了天道时光法则，双手一划，竟然逆转时光将师尊复活！</p>',
    order_num: 7,
    created_at: '2026-01-07',
    updated_at: '2026-01-07',
  },
];
const reportCanon = FullCheckEngine.runCheck({
  chapters: conflictChapters,
  characters: [],
  worldRules: mockRules,
});
const canonIssue = reportCanon.issues.find((i) => i.dimension === 'CANON_CONFLICT');
assert(!!canonIssue, '成功检测涉及【天道时光法则】且触犯否定性公理（逆转时光）的剧情');

// 测试 8: 章节篇幅失衡检测 (LENGTH_PACE)
console.log('\n  [测试 8] 章节篇幅与节奏失调巡检 (LENGTH_PACE)');
const paceChapters: Chapter[] = [
  {
    id: 'ch-short',
    novel_id: 'nov-1',
    title: '第八章 匆匆一战',
    content: '<p>林远一剑斩出，敌人倒下，全章完。</p>', // < 1200 字
    order_num: 8,
    created_at: '2026-01-08',
    updated_at: '2026-01-08',
  },
  {
    id: 'ch-preface',
    novel_id: 'nov-1',
    title: '序章 万物初始',
    content: '<p>天地混沌，盘古开天。</p>', // 特殊章节免检
    order_num: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];
const reportPace = FullCheckEngine.runCheck({
  chapters: paceChapters,
  characters: [],
});
const shortIssue = reportPace.issues.find((i) => i.chapterId === 'ch-short' && i.dimension === 'LENGTH_PACE');
const prefaceIssue = reportPace.issues.find((i) => i.chapterId === 'ch-preface' && i.dimension === 'LENGTH_PACE');
assert(!!shortIssue, '成功发现单章篇幅过短 (< 1200 字) 的问题');
assert(!prefaceIssue, '序章/引子等特殊章节成功被白名单豁免');

// 测试 9: 敏感词与合规巡检 (CENSOR_RISK)
console.log('\n  [测试 9] 敏感词跨章合规巡检 (CENSOR_RISK)');
const censorChapters: Chapter[] = [
  {
    id: 'ch-censor',
    novel_id: 'nov-1',
    title: '第九章 涉险',
    content: '<p>这帮黑衣魔修手段残忍，肆意虐杀生灵。</p>',
    order_num: 9,
    created_at: '2026-01-09',
    updated_at: '2026-01-09',
  },
];
const reportCensor = FullCheckEngine.runCheck({
  chapters: censorChapters,
  characters: [],
});
const censorIssue = reportCensor.issues.find((i) => i.dimension === 'CENSOR_RISK');
assert(!!censorIssue, '成功检出平台敏感词并提供合规建议');

// 测试 10: 扣分制与健康评级计算
console.log('\n  [测试 10] 扣分制与综合健康评级计算');
assert(typeof reportDead.overallHealthScore === 'number', '返回数值型整体健康评分');
assert(reportDead.overallHealthScore < 100, '存在 CRITICAL 诈尸问题时健康分发生扣减');
assert(['PERFECT', 'GOOD', 'NEEDS_ATTENTION', 'DANGER'].includes(reportDead.rating), '生成标准健康评级枚举');

// -----------------------------------------------------------------------------
// PART 2: 正文资产反哺提案引擎 (AssetProposalEngine)
// -----------------------------------------------------------------------------
console.log('\n▶ [PART 2] 正文资产反哺提案引擎 (AssetProposalEngine)');

const rawNovelChapter = `
林远与沈长青并肩而立。沈长青沉声道：“前方就是青云门与七星阁的交界处，万万不可大意！”
就在这时，树林深处传来一阵冷笑，只见陆雪琪冷笑道：“凭你们也想染指此地？”
她身形一闪，玉手捏动《太虚剑经》法诀，周身剑气呼啸，赫然祭出了传闻中的九龙神火罩！
`;

// 测试 11: 扫描未登记的新角色 (CHARACTER)
console.log('\n  [测试 11] 扫描正文野生新角色提案');
const proposals = AssetProposalEngine.scanChapterProposals({
  chapterId: 'ch-prop-01',
  chapterTitle: '第十章 秘境初探',
  content: rawNovelChapter,
  existingCharacters: [
    { id: 'c-1', novel_id: 'n-1', name: '林远', role_type: '主角', personality: '', status: '健康' },
  ],
  existingRules: [],
});

const charShen = proposals.find((p) => p.category === 'CHARACTER' && p.name === '沈长青');
const charLu = proposals.find((p) => p.category === 'CHARACTER' && p.name === '陆雪琪');
assert(!!charShen, '成功从正文动作对白中提取野生新角色【沈长青】');
assert(!!charLu, '成功从正文动作对白中提取野生新角色【陆雪琪】');
assert(charShen?.confidence === 0.85, '新角色提案置信度为 0.85');
assert(charShen?.contextSentence.includes('沈长青沉声道'), '自动提取角色出处上下文整句');

// 测试 12: 动词/副词/代词误报过滤
console.log('\n  [测试 12] 代词/常见误报词白名单过滤');
const textWithFalsePositives = `有人说道：“天色不早了。”老者沉声道：“我们走吧。”随后只见两人迈步走去。`;
const proposalsFalsePositives = AssetProposalEngine.scanChapterProposals({
  chapterId: 'ch-prop-02',
  chapterTitle: '第十一章 街头',
  content: textWithFalsePositives,
  existingCharacters: [],
  existingRules: [],
});
const hasSomeone = proposalsFalsePositives.some((p) => ['有人', '老者', '两人', '他们'].includes(p.name));
assert(!hasSomeone, '成功过滤“有人、老者、两人”等代词误判为新角色');

// 测试 13: 过滤已登记角色
console.log('\n  [测试 13] 过滤已登记角色');
const hasLinYuan = proposals.some((p) => p.name === '林远');
assert(!hasLinYuan, '已登记在库的现有角色林远被准确过滤，不重复提案');

// 测试 14: 扫描未登记门派势力 (FACTION)
console.log('\n  [测试 14] 扫描未登记门派势力 (FACTION)');
const facQingYun = proposals.find((p) => p.category === 'FACTION' && p.name === '青云门');
const facQiXing = proposals.find((p) => p.category === 'FACTION' && p.name === '七星阁');
assert(!!facQingYun, '成功提取宗门势力【青云门】');
assert(!!facQiXing, '成功提取江湖派系【七星阁】');

// 测试 15: 扫描未登记功法绝技 (TECHNIQUE)
console.log('\n  [测试 15] 扫描未登记功法绝技 (TECHNIQUE)');
const techSword = proposals.find((p) => p.category === 'TECHNIQUE' && p.name === '太虚剑经');
assert(!!techSword, '成功从书名号提取新功法【太虚剑经】');

// 测试 16: 扫描未登记法宝灵物 (ARTIFACT)
console.log('\n  [测试 16] 扫描未登记神兵法宝 (ARTIFACT)');
const artShield = proposals.find((p) => p.category === 'ARTIFACT' && p.name === '九龙神火罩');
assert(!!artShield, '成功提取神兵灵物【九龙神火罩】');

// 测试 17: 一键采纳落地数据格式与委托 (mock tauri bridge)
console.log('\n  [测试 17] 一键采纳沉淀持久化写入 SQLite 数据管道验证');
let createdCharPayload: any = null;
let createdRulePayload: any = null;

// Mock api
(api as any).createCharacter = async (data: any) => {
  createdCharPayload = data;
  return { id: 'char-new-1', ...data };
};
(api as any).createWorldRule = async (data: any) => {
  createdRulePayload = data;
  return { id: 'rule-new-1', ...data };
};

(async () => {
  if (charShen) {
    const successChar = await AssetProposalEngine.acceptProposal(charShen, 'nov-test-123');
    assert(successChar === true, '采纳角色提案成功返回 true');
    assert(createdCharPayload.novel_id === 'nov-test-123', '角色绑定正确的作品 ID');
    assert(createdCharPayload.name === '沈长青', '角色名称落库准确');
    assert(createdCharPayload.background.includes('第十章 秘境初探'), '角色背景附带首次现身章节与原句');
  }

  if (artShield) {
    const successArt = await AssetProposalEngine.acceptProposal(artShield, 'nov-test-123');
    assert(successArt === true, '采纳法宝提案成功返回 true');
    assert(createdRulePayload.novel_id === 'nov-test-123', '法宝世界法则绑定正确的作品 ID');
    assert(createdRulePayload.title === '九龙神火罩', '法则条目名称准确');
    assert(createdRulePayload.authority_level === 'EXTENDED', '自动赋予 EXTENDED 扩展法则级别');
  }

  // -----------------------------------------------------------------------------
  // PART 3: 拆书工坊与 0-Token 纯离线快速分析引擎 (DeconstructEngine)
  // -----------------------------------------------------------------------------
  console.log('\n▶ [PART 3] 拆书工坊与 0-Token 纯离线快速分析引擎 (DeconstructEngine)');

  // 测试 18: 专有提示词动态装配
  console.log('\n  [测试 18] 专有提示词动态装配');
  const promptPack = DeconstructEngine.assemblePrompt({
    title: '《斗破乾坤》第一卷',
    sourceText: '这里是十万字竞品小说样章正文节选……',
    scale: 'detailed',
    dimensions: ['golden', 'pacing', 'reusable'],
    extraFocus: '特别关注退婚逆袭剧情的情绪张力与打脸节奏',
  });
  assert(promptPack.systemPrompt.includes('拆书专家与剧作总监'), '系统提示词严格确立剧作总监专业角色');
  assert(promptPack.systemPrompt.includes('严禁泛泛而谈的空洞赞美'), '系统提示词注入严格防泛化要求');
  assert(promptPack.userPrompt.includes('黄金三章与开篇钩子'), '动态注入选定维度');
  assert(promptPack.userPrompt.includes('逐章精细拆解模式'), '根据 scale 精准注入规模指令');
  assert(promptPack.userPrompt.includes('特别关注退婚逆袭剧情'), '注入用户自定义关注焦点');

  // 测试 19: 本地 0-Token 纯离线快速结构分析
  console.log('\n  [测试 19] 本地 0-Token 纯离线快速结构分析');
  const sampleDeconstructText = `
夜雨如注。
少年林远抹了把脸上的雨水，握紧拳头：“三年之约，我绝不会输！”
“你拿什么赢？”暗处的老者冷笑，“你的灵脉已经彻底碎了。”
“那就重铸灵脉！”林远眼神炽烈，转身跃入奔腾的黑水河中。
暗流汹涌，冰冷刺骨，而河底深处，一枚残破的古鼎正散发出微弱的幽芒……
  `.trim();

  const offlineReport = DeconstructEngine.generateOfflineAnalysis('试炼样本', sampleDeconstructText);
  assert(offlineReport.sourceLength === sampleDeconstructText.length, '离线分析准确统计字数');
  assert(offlineReport.markdownContent.includes('自然段落数'), '离线报告生成自然段落宏观统计');
  assert(offlineReport.markdownContent.includes('对话台词占比'), '离线报告计算对话台词占比');
  assert(offlineReport.markdownContent.includes('黄金开篇与前 300 字切入'), '离线报告切片展示开篇前 300 字切入诊断');
  assert(offlineReport.markdownContent.includes('章末断章悬念与尾钩'), '离线报告切片展示末尾悬念诊断');

  // 测试 20: 拆书报告结构化解析与套路卡抽取
  console.log('\n  [测试 20] 拆书报告结构化解析与套路卡抽取');
  const mockAiMarkdown = `
# 《斗破苍穹》前三章拆书剖析报告

### 套路一：极致压抑与第三变量介入法
- 步骤 1：先通过天才陨落与族人冷眼拉满主角屈辱值。
- 步骤 2：安排婚约撕毁将外部矛盾推向最高潮。
- 步骤 3：在主角绝望发誓瞬间唤醒戒指老爷爷。

### 打法二：章末绝对悬念钩子法
- 步骤 1：每次断章必停在不可逆转的重大动作前一秒。
- 步骤 2：严禁解答悬念，留至次章首段揭晓。
  `;

  const parsedReport = DeconstructEngine.parseReport(mockAiMarkdown, '斗破前三章', mockAiMarkdown.length);
  assert(parsedReport.reusableSkills.length >= 2, '成功识别并提取出 2 个可复用套路打法');
  assert(parsedReport.reusableSkills[0].name.includes('极致压抑与第三变量介入法'), '提取套路卡名称精准无误');
  assert(parsedReport.extractedPlotBeats.length === 3, '自动生成标配戏剧节拍流');

  // -----------------------------------------------------------------------------
  // 测试总结
  // -----------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(` 🎉 全部测试通过！共完成 ${totalCount} 项断言，成功 ${passCount} 项，失败 0 项。`);
  console.log(' NovelForge AI 第二梯队核心生产力引擎全部通过回归与因果验证！');
  console.log('===============================================================');
})();
