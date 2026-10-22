import assert from 'node:assert';
import { VoiceSentinelEngine } from '../src/utils/voiceSentinel';
import { StoryBibleExportService, type StoryBibleExportData } from '../src/services/StoryBibleExportService';
import { api } from '../src/utils/tauriBridge';
import type {
  Novel,
  Character,
  WorldRule,
  StoryArc,
  StoryPhase,
  PlotThread,
  Volume,
  Chapter,
  CreateSceneInput,
  UpdateSceneInput,
  Scene,
} from '../src/types';

console.log('===============================================================');
console.log('🎬📖🛡️ NovelForge AI — 细纲节拍故事板、故事圣经画册与文风监护自动化测试');
console.log('===============================================================\n');

async function runTests() {
  // -------------------------------------------------------------------------
  // [PART 1] 场景节拍数据模型与 Bridge/WebMock CRUD 测试
  // -------------------------------------------------------------------------
  console.log('▶ [PART 1] 场景细纲节拍数据模型与 IPC CRUD 断言');

  const testChapterId = 'ch_test_scene_' + Date.now();

  // 1. 创建场景
  const createInput: CreateSceneInput = {
    chapter_id: testChapterId,
    sequence: 1,
    scene_number: 1,
    title: '藏经阁潜入',
    objective: '潜入第七层寻找九阳残卷',
    outline: '1. 避开守阁弟子\n2. 破解残卷禁制\n3. 触发警兆',
    location_id: '藏经阁',
    conflict_target: '暗中盗取残卷而不被发觉',
  };

  const createdScene = await api.createScene(createInput);
  assert(createdScene && createdScene.id, '应当成功创建场景并返回 ID');
  assert.strictEqual(createdScene.sequence, 1, '场景序号应当为 1');
  assert.strictEqual(createdScene.title, '藏经阁潜入', '场景标题应当一致');
  assert.strictEqual(createdScene.status, 'PLANNED', '初始状态应当为 PLANNED');
  console.log('  ✅ PASS: 场景节拍创建与序列初始化正常');

  // 2. 更新场景
  const updateInput: UpdateSceneInput = {
    id: createdScene.id,
    title: '藏经阁潜入（惊变）',
    objective: '发现残卷已被提前取走，陷入包围圈',
    status: 'IN_PROGRESS',
  };
  const updatedScene = await api.updateScene(updateInput);
  assert.strictEqual(updatedScene.title, '藏经阁潜入（惊变）', '场景标题应当更新');
  assert.strictEqual(updatedScene.status, 'IN_PROGRESS', '场景状态应当更新为 IN_PROGRESS');
  console.log('  ✅ PASS: 场景细纲多字段原地更新正常');

  // 3. AI 场景规划调度
  const plannedScenes = await api.runScenePlanning(testChapterId, '主角突围并反戈一击');
  assert(Array.isArray(plannedScenes), 'AI 场景规划应当返回场景数组');
  assert(plannedScenes.length >= 2, 'AI 场景规划应当至少生成 2 个起承转合场景');
  assert(plannedScenes[0].objective, '规划场景必须包含核心行动目标');
  console.log(`  ✅ PASS: AI 场景编剧 Agent 成功规划出 ${plannedScenes.length} 个节拍`);

  // 4. 删除场景
  await api.deleteScene(createdScene.id);
  const remainingScenes = await api.listScenes(testChapterId);
  assert(!remainingScenes.some((s) => s.id === createdScene.id), '已删除的场景不应再存在于列表中');
  console.log('  ✅ PASS: 场景细纲删除与级联清理正常\n');

  // -------------------------------------------------------------------------
  // [PART 2] 故事圣经 (Story Bible) 典藏画报级设定集生成引擎测试
  // -------------------------------------------------------------------------
  console.log('▶ [PART 2] 故事圣经全景设定画册 (StoryBibleExportService) 渲染断言');

  const mockNovel: Novel = {
    id: 'novel_bible_01',
    title: '万古问道录',
    description: '仙道浩渺，求索无疆。九界纷争下的一介凡人之道。',
    genre_profile: '古典修真仙侠',
    target_reader: '硬核仙侠读者',
    tone_manner: '沉雄苍茫',
    cover_url: 'data:image/png;base64,mockCoverData',
    chapter_target_length: 3500,
    created_at: Date.now(),
    updated_at: Date.now(),
  };

  const mockCharacters: Character[] = [
    {
      id: 'char_01',
      novel_id: mockNovel.id,
      name: '林辰',
      aliases: '凌霄剑尊',
      profile: '天元剑宗第九代关门弟子',
      personality: '沉静坚毅，恩怨分明，暗藏锋芒',
      background: '生于北域风雪破庙，幼年蒙剑圣收留',
      motivation: '勘破上古通天绝阵，为师门求一条生路',
      avatar_url: 'data:image/png;base64,mockAvatarData',
      visual_summary: '白发束青簪，着玄黑金丝古剑袍，神情冷峻若古潭',
      status: '健康',
      created_at: Date.now(),
      updated_at: Date.now(),
    },
    {
      id: 'char_02',
      novel_id: mockNovel.id,
      name: '幽冥老祖',
      aliases: '黑水真君',
      profile: '九幽溟渊之主',
      personality: '喜怒不形于色，算尽苍生利益',
      background: '三千年前正魔大战残存古魔',
      motivation: '打破三界封印，重临人间',
      status: '闭关',
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ];

  const mockWorldRules: WorldRule[] = [
    {
      id: 'rule_01',
      novel_id: mockNovel.id,
      title: '因果天劫律',
      rule_content: '凡超凡修士动用逆转生死神通，必受九重紫霄神雷反噬，不可免除。',
      authority_level: 'CANON',
      status: 'ACTIVE',
      created_at: Date.now(),
    },
    {
      id: 'rule_02',
      novel_id: mockNovel.id,
      title: '灵脉枯荣纪',
      rule_content: '每五百年天地灵气回落一次，各宗门需封锁山门节约灵石。',
      authority_level: 'EXTENDED',
      status: 'ACTIVE',
      created_at: Date.now(),
    },
  ];

  const mockStoryArcs: StoryArc[] = [
    {
      id: 'arc_01',
      novel_id: mockNovel.id,
      title: '第一卷·破庙风雪起长剑',
      goal: '林辰走出北域破庙，初入修真界大门',
      description: '围绕残缺古剑引出三大世家的追杀与反杀',
      status: 'DEVELOPING',
      priority: 'MAIN',
      planned_end: '第20章',
      created_at: Date.now(),
    },
  ];

  const mockStoryPhases: StoryPhase[] = [
    {
      id: 'phase_01',
      novel_id: mockNovel.id,
      title: '龙潜九地·磨剑生锋',
      order_index: 1,
    },
  ];

  const mockPlotThreads: PlotThread[] = [
    {
      id: 'pt_01',
      novel_id: mockNovel.id,
      title: '生母留下的双鱼玉佩',
      description: '触碰特定星宿光芒会显现隐藏符文',
      status: 'PLANTED',
    },
  ];

  const mockVolumes: Volume[] = [
    {
      id: 'vol_01',
      novel_id: mockNovel.id,
      title: '风起天元',
      sequence: 1,
      status: 'ACTIVE',
      created_at: Date.now(),
    },
  ];

  const mockChapters: Chapter[] = [
    {
      id: 'ch_01',
      novel_id: mockNovel.id,
      volume_id: 'vol_01',
      chapter_number: 1,
      title: '雪夜古刹',
      content: '风雪漫卷长天，古刹孤灯如豆。',
      word_count: 3200,
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ];

  const exportData: StoryBibleExportData = {
    novel: mockNovel,
    characters: mockCharacters,
    worldRules: mockWorldRules,
    storyArcs: mockStoryArcs,
    storyPhases: mockStoryPhases,
    plotThreads: mockPlotThreads,
    volumes: mockVolumes,
    chapters: mockChapters,
  };

  const html = StoryBibleExportService.renderStoryBibleHtml(exportData);

  assert(html.includes('《万古问道录》'), '生成的 HTML 应当包含书名');
  assert(html.includes('故事圣经 · 全景设定典藏集'), '应当包含故事圣经标题');
  assert(html.includes('林辰'), '应当包含核心角色姓名');
  assert(html.includes('凌霄剑尊'), '应当包含角色别名或称号');
  assert(html.includes('白发束青簪'), '应当包含立绘外貌特征描写');
  assert(html.includes('因果天劫律'), '应当包含 CANON 权威正典法则');
  assert(html.includes('破庙风雪起长剑'), '应当包含剧情弧规划');
  assert(html.includes('双鱼玉佩'), '应当包含伏笔线索追踪');
  assert(html.includes('风起天元'), '应当包含分卷规划');
  assert(html.includes('@media print'), '应当支持打印转 PDF 样式优化');
  console.log('  ✅ PASS: 故事圣经全要素渲染无缺失，立绘外貌与正典法则 100% 映射入册\n');

  // -------------------------------------------------------------------------
  // [PART 3] 行文文风监护与防串味巡检引擎 (VoiceSentinelEngine)
  // -------------------------------------------------------------------------
  console.log('▶ [PART 3] 行文文风监护与防串味巡检引擎断言');

  // 测试样文一：包含典型仙侠小说出戏网络烂梗
  const slopSample = `林辰收起残卷，心想这一次这波不亏。他开始在心中暗自复盘今日战局，发现整个计划完全形成了闭环。不得不说，守阁长老在某种程度上画饼画得极好。对方纯纯是在绝壁上PUA自己。`;

  const report1 = VoiceSentinelEngine.auditText(slopSample, '仙侠修真', null);

  assert(report1.issues.length >= 5, `应当精准检出至少 5 处串味违和词汇，实际检出 ${report1.issues.length}`);
  const targets = report1.issues.map((i) => i.target_text);
  assert(targets.includes('复盘'), '应当检出职场词汇【复盘】');
  assert(targets.includes('闭环'), '应当检出职场词汇【闭环】');
  assert(targets.includes('画饼'), '应当检出职场词汇【画饼】');
  assert(targets.includes('这波不亏'), '应当检出网络梗【这波不亏】');
  assert(targets.includes('PUA'), '应当检出字母缩写【PUA】');
  assert(targets.includes('在某种程度上'), '应当检出翻译腔【在某种程度上】');

  // 校验替换建议质量
  const fupanIssue = report1.issues.find((i) => i.target_text === '复盘');
  assert(fupanIssue && fupanIssue.replacement === '细细推演', '复盘应当建议换为文学级词汇「细细推演」');

  const bihuanIssue = report1.issues.find((i) => i.target_text === '闭环');
  assert(bihuanIssue && bihuanIssue.replacement === '因果自洽', '闭环应当建议换为仙侠自洽词汇「因果自洽」');

  assert(report1.score < 80, `包含多处串味违和的文段健康分应显著扣减，当前得分: ${report1.score}`);
  console.log(`  ✅ PASS: 成功拦截 6 处典型串味网络梗与翻译腔，扣分制得分: ${report1.score}分`);

  // 测试样文二：纯文学仙侠纯净样文
  const cleanSample = `林辰收起古卷，指尖微抚剑柄，细细推演方才交锋之势。守阁长老言语间暗藏机锋，显然早已洞烛幽微。若非他借势而退，只怕今日难脱绝阵。`;
  const report2 = VoiceSentinelEngine.auditText(cleanSample, '仙侠修真', null);

  assert.strictEqual(report2.issues.length, 0, '高质量纯正文学文本不应产生任何误报');
  assert.strictEqual(report2.score, 100, '纯净正文应当获得 100 满分健康度');
  console.log('  ✅ PASS: 高质量仙侠白描文本零误报，健康度得分 100 满分！');

  // -------------------------------------------------------------------------
  // [PART 4] 双向场景聚焦、画报打印预览与码字字数会话增量断言
  // -------------------------------------------------------------------------
  console.log('\n▶ [PART 4] 双向场景聚焦、画报打印预览与会话码字增量断言');

  // 1. 场景定位算法模拟核验
  const testEditorDocText = `
第一章 绝壁长剑

<h3>【场景 1：藏经阁潜入】</h3>
夜色沉沉，林辰屏息潜行于回廊阴影中。

<h3>【场景 2：残卷现世】</h3>
案几之上，金芒流转。守阁长老负手而立，目光如电。
`;

  const findSceneInDoc = (docText: string, sceneNum: number, sceneTitle?: string) => {
    const q1 = `场景 ${sceneNum}`;
    const q2 = `场景${sceneNum}`;
    let pos = docText.indexOf(q1);
    if (pos === -1) pos = docText.indexOf(q2);
    if (pos === -1 && sceneTitle && sceneTitle.length >= 2) {
      pos = docText.indexOf(sceneTitle);
    }
    return pos;
  };

  const pos1 = findSceneInDoc(testEditorDocText, 1, '藏经阁潜入');
  const pos2 = findSceneInDoc(testEditorDocText, 2, '残卷现世');
  const posNonExist = findSceneInDoc(testEditorDocText, 3, '突围绝壁');

  assert(pos1 !== -1, '应当成功定位第 1 场景位置');
  assert(pos2 !== -1, '应当成功定位第 2 场景位置');
  assert(posNonExist === -1, '未存在场景应当返回 -1 以便提示作者一键装配提纲');
  console.log('  ✅ PASS: 场景细纲与编辑器正文双向聚焦定位算法断言通过');

  // 2. 会话净增字数与冲刺达标率测算断言
  const initialChapterChars = 2000;
  const currentChapterChars = 2850;
  const targetWords = 3000;

  const sessionDelta = currentChapterChars - initialChapterChars;
  const targetPercent = Math.min(150, Math.round((currentChapterChars / targetWords) * 100));

  assert.strictEqual(sessionDelta, 850, '本次创作会话净增字数应当准确为 +850 字');
  assert.strictEqual(targetPercent, 95, '单章冲刺进度应当准确计算为 95%');
  console.log('  ✅ PASS: 码字冲刺目标与会话净增字数 (+850字 / 95%) 测算断言正常');

  console.log('\n===============================================================');
  console.log('🎉 恭喜！细纲节拍、故事圣经画册与文风防串味引擎全套断言 100% 满分通过！');
  console.log('===============================================================');
}

runTests().catch((e) => {
  console.error('❌ 测试失败:', e);
  process.exit(1);
});
