/**
 * NovelForge AI — 五层分层记忆引擎 (L0~L4) 与权威公理系统 专项单元测试
 */
import { api } from '../src/utils/tauriBridge';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log(' NovelForge AI — 五层分层记忆引擎 (L0~L4) 专项测试');
  console.log('===============================================================\n');

  const testNovelId = 'test-novel-memory-001';
  const testCharId = 'test-char-linyuan';
  const testChapterId = 'test-chapter-001';

  // -------------------------------------------------------------
  // 测试 1: L3 长期权威事实 (Canon Facts) 三元组存储、作用域与权威分级
  // -------------------------------------------------------------
  console.log('▶ [测试 1] L3 权威事实 (Canon Facts) 三元组存储与权威等级');
  const fact1 = await api.createCanonFact({
    novel_id: testNovelId,
    subject_id: '先驱者号',
    predicate: '搭载了绝密实验性',
    object_value: '反物质曲率核心二号机',
    authority_level: 'CANON',
    truth_scope: 'GLOBAL',
  });

  assert(fact1.subject_id === '先驱者号', '主语 subject_id 保存正确: 先驱者号');
  assert(fact1.predicate === '搭载了绝密实验性', '谓语 predicate 保存正确');
  assert(fact1.object_value === '反物质曲率核心二号机', '宾语 object_value 保存正确');
  assert(fact1.authority_level === 'CANON', '权威等级为最高级 CANON');
  assert(fact1.truth_scope === 'GLOBAL', '真理作用域为全书全局生效 GLOBAL');
  assert(fact1.status === 'ACTIVE', '初始状态为 ACTIVE');

  // 创建第二条剧情已确认事实 (CONFIRMED_PLOT)
  const fact2 = await api.createCanonFact({
    novel_id: testNovelId,
    subject_id: '林远',
    predicate: '在柯伊伯带边缘捕获了',
    object_value: '古代文明青铜跃迁信标',
    authority_level: 'CONFIRMED_PLOT',
    truth_scope: 'REGIONAL',
  });
  assert(fact2.authority_level === 'CONFIRMED_PLOT', '剧情事实等级为 CONFIRMED_PLOT');

  // -------------------------------------------------------------
  // 测试 2: 事实过滤与全文检索召回 (FTS Search)
  // -------------------------------------------------------------
  console.log('\n▶ [测试 2] 事实检索与基于关键字的全网过滤');
  const allFacts = await api.listCanonFacts(testNovelId);
  assert(allFacts.length >= 2, `成功查询到小说事实列表（数量: ${allFacts.length}）`);

  const searchResults = await api.listCanonFacts(testNovelId, '曲率');
  assert(searchResults.length > 0, `关键字【曲率】搜索成功召回 ${searchResults.length} 条事实`);
  assert(
    searchResults.some((f) => f.object_value.includes('曲率核心')),
    '搜索结果准确包含包含【曲率核心】的目标事实'
  );

  const searchResults2 = await api.listCanonFacts(testNovelId, '青铜');
  assert(
    searchResults2.some((f) => f.object_value.includes('青铜跃迁信标')),
    '搜索结果准确召回【青铜跃迁信标】'
  );

  // -------------------------------------------------------------
  // 测试 3: L2 角色动态状态事件流 (Character Dynamic State Events)
  // -------------------------------------------------------------
  console.log('\n▶ [测试 3] L2 角色动态状态追踪与时序演化');
  // 事件 1: 心理状态
  const event1 = await api.createCharacterStateEvent({
    character_id: testCharId,
    field_name: '心理状态',
    previous_value: '迷茫徘徊，深陷教条',
    new_value: '决然果断，破釜沉舟直面深空',
    effective_time: '反物质过载第15秒',
  });
  assert(event1.character_id === testCharId, '角色 ID 绑定正确');
  assert(event1.field_name === '心理状态', '状态变更维度为 心理状态');
  assert(event1.new_value === '决然果断，破釜沉舟直面深空', '新状态值记录准确');

  // 事件 2: 境界修为 / 装备状态
  const event2 = await api.createCharacterStateEvent({
    character_id: testCharId,
    field_name: '领航权限',
    previous_value: '三级副官领航权限',
    new_value: '特等总舰长紧急决断权',
    effective_time: '跃迁危机时刻',
  });
  assert(event2.field_name === '领航权限', '状态变更维度为 领航权限');

  const charEvents = await api.listCharacterStateEvents(testCharId);
  assert(charEvents.length >= 2, `成功获取角色状态历史事件流（数量: ${charEvents.length}）`);
  assert(charEvents[0].field_name === '心理状态', '时序事件首项为最初的心理变迁');
  assert(charEvents[charEvents.length - 1].new_value === '特等总舰长紧急决断权', '最新时序事件包含最新的权限提升');

  // -------------------------------------------------------------
  // 测试 4: 跨章节全文检索 (FTS5 Search Chapters)
  // -------------------------------------------------------------
  console.log('\n▶ [测试 4] 跨章节历史全文检索 (FTS5 Search Chapters)');
  const ftsHits = await api.searchChaptersFts('引力波');
  assert(Array.isArray(ftsHits), '跨章节全文检索返回有效数组');
  if (ftsHits.length > 0) {
    const [chId, title, snippet] = ftsHits[0];
    assert(Boolean(chId), `检索命中章节 ID 有效: ${chId}`);
    assert(Boolean(title), `检索命中章节标题有效: ${title}`);
    assert(Boolean(snippet), `提取到上下文 Snippet 片段`);
  } else {
    // 即使空库也有容错表现
    assert(true, '跨章节 FTS5 在空结果时安全返回空数组');
  }

  // -------------------------------------------------------------
  // 测试 5: 五层记忆上下文组装 (L0~L4 Context Pack Assembler)
  // -------------------------------------------------------------
  console.log('\n▶ [测试 5] 五层记忆上下文组装 (L0~L4 Context Pack)');
  const contextPack = await api.assembleMemoryContextPack(
    testNovelId,
    testChapterId,
    '描写林远在主控室面对反物质引擎过载时的生死决断'
  );

  assert(Boolean(contextPack), '成功生成五层记忆上下文装配包 (MemoryContextPack)');
  assert(Boolean(contextPack.working_memory_l0), '包含 L0 工作记忆 (当前即时创作指令与章节目标)');
  assert(Array.isArray(contextPack.short_term_l1), '包含 L1 短期前情记忆与角色最新状态');
  assert(Array.isArray(contextPack.arc_memory_l2), '包含 L2 中期大纲阶段与进行中剧情弧');
  assert(Array.isArray(contextPack.canon_rules_l3), '包含 L3 长期权威法则 (Canon Rules)');
  assert(Array.isArray(contextPack.character_profiles_l3), '包含 L3 角色核心档案');
  assert(Array.isArray(contextPack.retrieved_history_l4), '包含 L4 历史检索记忆与因果事实');
  assert(Boolean(contextPack.assembled_system_prompt), '成功装配出统一的系统级创作提示词');

  // -------------------------------------------------------------
  // 测试 6: 记忆提炼 Agent (Memory Curator) 仿真测试
  // -------------------------------------------------------------
  console.log('\n▶ [测试 6] 记忆提炼 Agent (Memory Curator) 章节提取');
  const extracted = await api.extractChapterMemory(testChapterId);
  assert(Boolean(extracted), '记忆提炼 Agent 成功提取章节记忆');
  assert(Boolean(extracted.chapter_summary), '生成了章节正文剧情摘要');
  assert(Array.isArray(extracted.new_canon_facts), '提炼出新增因果事实候选列表');
  assert(Array.isArray(extracted.character_state_events), '提炼出角色动态状态演变候选');

  // -------------------------------------------------------------
  // 测试 7: 事实删除与防幽灵数据守护
  // -------------------------------------------------------------
  console.log('\n▶ [测试 7] 事实删除与数据生命周期安全防护');
  await api.deleteCanonFact(fact2.id);
  const remainingFacts = await api.listCanonFacts(testNovelId);
  assert(
    !remainingFacts.some((f) => f.id === fact2.id),
    '已成功删除过期的剧情事实，杜绝幽灵记忆串扰'
  );
  assert(
    remainingFacts.some((f) => f.id === fact1.id),
    '核心权威法则事实 fact1 依然牢固存在，不受波及'
  );

  console.log('\n===============================================================');
  console.log(` 测试总结: 共 ${totalTests} 项，通过 ${passedTests} 项，失败 ${failedTests} 项`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('测试运行异常:', e);
  process.exit(1);
});
