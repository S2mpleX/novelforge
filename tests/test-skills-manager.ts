import { BUILTIN_SKILLS } from '../src/features/skills/skillsRegistry';
import { SkillsEngine } from '../src/features/skills/SkillsEngine';
import { useSkillsStore } from '../src/features/skills/useSkillsStore';
import fs from 'fs';

function runTests() {
  console.log('===============================================================');
  console.log(' NovelForge AI — Agent Skills 技能管理中心与双引擎自动化测试');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean, detail: string = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ PASS: ${desc}`);
    } else {
      console.error(`  ❌ FAIL: ${desc} ${detail ? `(${detail})` : ''}`);
      process.exitCode = 1;
    }
  }

  // -------------------------------------------------------------
  // 测试 1: 技能注册表基础元数据 (6 大 Skills 矩阵)
  // -------------------------------------------------------------
  console.log('▶ [测试 1] 内置 Skills 注册表与完整元数据核验');
  const skillIds = BUILTIN_SKILLS.map((s) => s.id);
  assert('包含 humanizer 技能', skillIds.includes('humanizer'));
  assert('包含 lieflat-less-ai-tone 语言学去AI味技能', skillIds.includes('lieflat-less-ai-tone'));
  assert('包含 story-architect 宏观因果架构技能', skillIds.includes('story-architect'));
  assert('包含 scene-dramaturge 单场景导演技能', skillIds.includes('scene-dramaturge'));
  assert('包含 ending-forge 结局与反转锻造技能', skillIds.includes('ending-forge'));
  assert('包含 cold-reader 零继承读者盲审技能', skillIds.includes('cold-reader'));

  const humanizer = BUILTIN_SKILLS.find((s) => s.id === 'humanizer')!;
  assert('Humanizer 包含 7 项以上白描与反套话规则', humanizer.rules.length >= 7);
  assert('Humanizer 包含负向防空泛规则', (humanizer.negativeRules?.length || 0) >= 1);

  const lieflat = BUILTIN_SKILLS.find((s) => s.id === 'lieflat-less-ai-tone')!;
  assert('Lieflat 包含经实证检验的完整 11 项白名单规则', lieflat.rules.length === 11);
  assert('Lieflat 包含 5 项以上反向禁改区规则 (防乱删设问与比喻)', (lieflat.negativeRules?.length || 0) >= 5);
  assert('Lieflat 标明 283 万字语料统计', lieflat.corpusStats?.words.includes('2,826,972') || false);

  const storyArch = BUILTIN_SKILLS.find((s) => s.id === 'story-architect')!;
  assert('Story Architect 属于 architecture 分类', storyArch.category === 'architecture');
  assert('Story Architect 包含硬核因果链与不可逆代价规则', storyArch.rules.some((r) => r.id === 'sa_causal_chain'));

  const sceneDram = BUILTIN_SKILLS.find((s) => s.id === 'scene-dramaturge')!;
  assert('Scene Dramaturge 属于 dramaturgy 分类', sceneDram.category === 'dramaturgy');
  assert('Scene Dramaturge 包含双导演方案与情绪物象化规则', sceneDram.rules.some((r) => r.id === 'sd_dual_director_plan'));

  const endingForge = BUILTIN_SKILLS.find((s) => s.id === 'ending-forge')!;
  assert('Ending Forge 包含三向价值结局与倒推铺垫规则', endingForge.rules.some((r) => r.id === 'ef_triple_value_endings'));

  const coldReader = BUILTIN_SKILLS.find((s) => s.id === 'cold-reader')!;
  assert('Cold Reader 属于 audit 分类', coldReader.category === 'audit');
  assert('Cold Reader 包含注意力卡顿与伪高潮拦截规则', coldReader.rules.some((r) => r.id === 'cr_pseudo_climax'));

  // -------------------------------------------------------------
  // 测试 2: SkillsEngine 扫描 AI 浓郁复合段落
  // -------------------------------------------------------------
  console.log('\n▶ [测试 2] SkillsEngine 综合扫描重度 AI 味文本 (Lieflat 11 条 + Humanizer)');
  const sampleAiText = `
    一句话总结：这不是一个简单的选择，而是一场关乎生死的宿命博弈。
    不仅如此，主角嘴角勾起了一抹冷酷的弧度，眼中闪过一丝微不可察的杀意。面对强敌，他深吸了一口气——答案其实很简单，那就是力量。
    空气仿佛凝固了。无论是初创者、中阶修士，还是顶尖大能，都能感受到那股压迫感。
    这意味着，一场血战不可避免。说白了，他就像一位智慧的导师，在替天行道。
  `;

  const report = SkillsEngine.auditText(sampleAiText, ['humanizer', 'lieflat-less-ai-tone']);
  assert('AI 浓郁文本检出问题总数 >= 7', report.issueCount >= 7, `实际检出: ${report.issueCount}`);

  const ruleNames = report.issues.map((i) => i.ruleName);
  assert('成功捕获翻案腔 (不是……而是……)', ruleNames.some((n) => n.includes('翻案腔')));
  assert('成功捕获冒号滥用 (提示语冒号)', ruleNames.some((n) => n.includes('冒号滥用')));
  assert('成功捕获破折号滥用', ruleNames.some((n) => n.includes('破折号滥用')));
  assert('成功捕获拟人化职业喻体', ruleNames.some((n) => n.includes('拟人化职业喻体')));
  assert('成功捕获翻译腔 (这意味着)', ruleNames.some((n) => n.includes('这意味着')));
  assert('成功捕获禁用起手式 (说白了)', ruleNames.some((n) => n.includes('禁用起手式')));
  assert('成功捕获嘴角勾起套话', ruleNames.some((n) => n.includes('嘴角勾起')));

  assert('综合体检评分应严重偏低 (< 70 分)', report.score < 70, `实际得分: ${report.score}`);
  assert('评级应为 NEEDS_POLISH 或 SEVERE_AI_TONE', ['NEEDS_POLISH', 'SEVERE_AI_TONE'].includes(report.rating));

  // -------------------------------------------------------------
  // 测试 3: 戏剧张力与假高潮综合扫描
  // -------------------------------------------------------------
  console.log('\n▶ [测试 3] SkillsEngine 戏剧张力、情绪贴标签与伪高潮综合扫描');
  const sampleDramaText = `
    第二天，林越来到了青云宗山门前。突然之间，几个恶霸弟子跳了出来。
    林越心中感到极度愤怒与震惊。
    击败对手后，所有人泣不成声，泪流满面，命运的赞歌在天地间回荡。
    然而他并不知道，暗中正有一双血红的眼睛死死盯着他的后背，危险即将降临……
  `;

  const dramaReport = SkillsEngine.auditText(sampleDramaText, [
    'scene-dramaturge',
    'story-architect',
    'ending-forge',
    'cold-reader',
  ]);
  const dramaRuleNames = dramaReport.issues.map((i) => i.ruleName);
  assert('捕获情绪直接贴标签宣告 (Tell 而非 Show)', dramaRuleNames.some((n) => n.includes('贴标签')));
  assert('捕获偷懒偶然推进 (突然之间)', dramaRuleNames.some((n) => n.includes('偶然推进')));
  assert('捕获旁白直接煽情升华 (泣不成声/命运赞歌)', dramaRuleNames.some((n) => n.includes('旁白直接煽情')));
  assert('捕获机械制造伪悬念 (然而他并不知道)', dramaRuleNames.some((n) => n.includes('机械制造伪悬念')));

  // -------------------------------------------------------------
  // 测试 4: 高人情味白描文本低误报率测试
  // -------------------------------------------------------------
  console.log('\n▶ [测试 4] SkillsEngine 高人情味纯白描文本低误报率测试');
  const cleanText = `
    灶膛里的松柴噼啪炸了一声，溅出几星火沫。
    他没抬头，手里捏着半块发硬的玉米馍，粗糙的指腹顺着豁口一点点往下剥。
    窗外落着细盐似的冷雪，青石板路早就冻得发亮。对面的老汉抽完最后一锅旱烟，在鞋底上磕了磕烟袋锅子，铜嘴碰着牛皮，发出笃笃的两声闷响。
  `;

  const cleanReport = SkillsEngine.auditText(cleanText, ['humanizer', 'lieflat-less-ai-tone', 'scene-dramaturge', 'cold-reader']);
  assert('纯白描自然文学段落违规数为 0', cleanReport.issueCount === 0, `实际违规: ${cleanReport.issueCount}`);
  assert('纯白描文学文本评分 >= 95 分', cleanReport.score >= 95, `实际得分: ${cleanReport.score}`);
  assert('评级应为 EXCELLENT', cleanReport.rating === 'EXCELLENT');

  // -------------------------------------------------------------
  // 测试 5: 各专属 Prompt 生成器装配检验
  // -------------------------------------------------------------
  console.log('\n▶ [测试 5] SkillsEngine 专属 Prompt 构造器核验');
  const saPrompt = SkillsEngine.buildStoryArchitectPrompt({
    genre: '玄幻修仙',
    concept: '因果倒转道人',
    targetEmotion: '宿命悲壮',
  });
  assert('Story Architect Prompt 包含因果方案与不可逆代价要求', saPrompt.includes('不可逆代价') && (saPrompt.includes('三套') || saPrompt.includes('三个')));

  const sdPrompt = SkillsEngine.buildSceneDramaturgePrompt({
    genre: '都市现实',
    prevContext: '茶馆雨夜',
    sceneGoal: '揭示账本造假',
  });
  assert('Scene Dramaturge Prompt 包含方案甲后果切入与方案乙细节延迟', sdPrompt.includes('方案甲') && sdPrompt.includes('方案乙'));

  const efPrompt = SkillsEngine.buildEndingForgePrompt({
    genre: '科幻悬疑',
    storyPremise: '记忆清除飞船',
  });
  assert('Ending Forge Prompt 包含三向价值结局与倒推铺垫表', efPrompt.includes('苦涩兑现') && efPrompt.includes('结局倒推铺垫表'));

  const crPrompt = SkillsEngine.buildColdReaderPrompt('测试正文章节内容');
  assert('Cold Reader Prompt 包含带证据诊断表与最高优先前三项最小修复', crPrompt.includes('带证据的诊断表') && crPrompt.includes('最高优先级前三项最小修复建议'));

  // -------------------------------------------------------------
  // 测试 6: useSkillsStore 状态管理与开关切换
  // -------------------------------------------------------------
  console.log('\n▶ [测试 6] useSkillsStore 响应式开关与状态流转');
  useSkillsStore.getState().resetToDefaults();
  assert('默认激活技能数量为 6 项全部激活', useSkillsStore.getState().activeSkillIds.length === 6);

  useSkillsStore.getState().toggleSkill('humanizer');
  const afterToggle = useSkillsStore.getState();
  assert('关闭 humanizer 后激活技能数量为 5', afterToggle.activeSkillIds.length === 5 && !afterToggle.activeSkillIds.includes('humanizer'));

  useSkillsStore.getState().resetToDefaults();
  assert('重置后恢复默认 6 项全部激活', useSkillsStore.getState().activeSkillIds.length === 6);

  // -------------------------------------------------------------
  // 测试 7: 物理技能文件与提示词独立落盘核验
  // -------------------------------------------------------------
  console.log('\n▶ [测试 7] 物理文件与提示词中心落盘核验');
  const requiredSkillDirs = ['humanizer', 'lieflat-less-ai-tone', 'story-architect', 'scene-dramaturge', 'ending-forge', 'cold-reader'];
  for (const dir of requiredSkillDirs) {
    const p = `.agents/skills/${dir}/SKILL.md`;
    assert(`.agents/skills/${dir}/SKILL.md 真实存在`, fs.existsSync(p));
  }

  const requiredPrompts = ['story_architect.md', 'scene_dramaturge.md', 'ending_forge.md', 'cold_reader.md'];
  for (const pFile of requiredPrompts) {
    const p = `prompts/${pFile}`;
    assert(`prompts/${pFile} 独立提示词真实存在`, fs.existsSync(p));
  }

  // -------------------------------------------------------------
  // 测试 8: 工作台面板注册规范
  // -------------------------------------------------------------
  console.log('\n▶ [测试 8] Docking Workspace 面板注册合规性');
  const dockingTypes = fs.readFileSync('src/types/docking.ts', 'utf8');
  assert('src/types/docking.ts 包含 skills_manager 面板类型', dockingTypes.includes("'skills_manager'"));

  const panelRegistryContent = fs.readFileSync('src/components/docking/PanelRegistry.tsx', 'utf8');
  assert('PanelRegistry.tsx 包含 skills_manager 元数据', panelRegistryContent.includes('skills_manager:'));
  assert('面板标题定义为 Agent Skills 技能中心', panelRegistryContent.includes("title: 'Agent Skills 技能中心'"));
  assert('面板分类归属于 AI 智能创作分类', panelRegistryContent.includes("category: 'ai'"));

  console.log('\n===============================================================');
  console.log(` 测试完成：总计 ${total} 项，通过 ${passed} 项，失败 ${total - passed} 项`);
  console.log('===============================================================\n');

  if (total - passed > 0) {
    process.exit(1);
  }
}

runTests();

