import assert from 'node:assert';
import { api } from '../src/utils/tauriBridge';

console.log('\n===============================================================');
console.log('💡 NovelForge AI — 演武场角色行动探针、灵感提炼与高光精修专项测试');
console.log('===============================================================\n');

async function runTests() {
  const testNovelId = 'novel_test_inspiration_' + Date.now();

  console.log('▶ [测试 1] 角色创建与沙盒推演初始化');
  const hero = await api.createCharacter({
    novel_id: testNovelId,
    name: '沈墨白',
    gender: '男',
    personality: '沉静似水，心机深沉',
    motivation: '替师门洗雪沉冤',
  });
  const rival = await api.createCharacter({
    novel_id: testNovelId,
    name: '顾红妆',
    gender: '女',
    personality: '狡黠莫测，亦正亦邪',
    motivation: '夺回被扣押的长生古卷',
  });

  const session = await api.createSandboxSession({
    novel_id: testNovelId,
    title: '听雨楼深夜试剑',
    scene_setting: '听雨楼二层，轩窗半掩，秋雨连绵，桌前只有一局未下完的残棋。',
    scene_goal: '试探长生古卷下落，同时暗中查探对方身上是否留有师门旧伤。',
    characters_config: [
      {
        character_id: hero.id,
        character_name: hero.name,
        private_motivation: '绝不向她吐露当年的古籍真相。',
        private_secret: '长生残卷早已被我暗中背诵并烧毁。',
        order_index: 0,
        is_human: false,
      },
      {
        character_id: rival.id,
        character_name: rival.name,
        private_motivation: '逼迫沈墨白现出当年伤痕。',
        private_secret: '我手中其实握着当年害死他师傅的真正信物。',
        order_index: 1,
        is_human: false,
      },
    ],
  });
  assert(session && session.id, '沙盒会话成功创建');
  console.log('  ✅ PASS: 角色与沙盒会话就绪');

  console.log('▶ [测试 2] 角色行动探针断言 (What Would They Do? / probeCharacterNextActions)');
  const probeRes = await api.probeCharacterNextActions({
    session_id: session.id,
    target_speaker_id: hero.id,
  });
  assert(probeRes, '探针执行成功返回结果');
  assert.strictEqual(probeRes.speaker_id, hero.id, '探针准确锁定目标角色 ID');
  assert.strictEqual(probeRes.speaker_name, hero.name, '探针准确识别目标角色名字');
  assert(Array.isArray(probeRes.options) && probeRes.options.length >= 3, '必须生成至少 3 种差异化应对策略');

  for (const opt of probeRes.options) {
    assert(opt.id, '选项必须有 ID');
    assert(opt.label && opt.label.length > 0, '选项必须有简明策略标题');
    assert(opt.stance && opt.stance.length > 0, '选项必须有策略心理立场描述');
    assert(opt.inner_motive && opt.inner_motive.length > 0, '选项必须包含内心算盘');
    assert(opt.action_preview && opt.action_preview.length > 0, '选项必须有肢体微动作预判');
    assert(opt.speech_preview && opt.speech_preview.length > 0, '选项必须有话术或示例对白');
  }
  console.log(`  ✅ PASS: 成功生成 ${probeRes.options.length} 条鲜活的行动抉择路线 (${probeRes.options.map(o => o.label).join(' | ')})`);

  console.log('▶ [测试 3] 采纳行动路线指引步进断言 (action_guidance)');
  const chosenOpt = probeRes.options[0];
  const guidance = `${chosenOpt.label}：${chosenOpt.stance}。内心计划：${chosenOpt.inner_motive}`;
  const stepRes = await api.executeSandboxStep({
    session_id: session.id,
    target_speaker_id: hero.id,
    action_guidance: guidance,
  });
  assert(stepRes && stepRes.round, '带行动指引的步进成功生成回合');
  assert.strictEqual(stepRes.round.speaker_name, hero.name, '发言人正确');
  console.log('  ✅ PASS: 角色精准遵循作者选定的行动路线完成推演步进');

  // 再走一步，形成多轮对戏实录
  await api.executeSandboxStep({
    session_id: session.id,
    target_speaker_id: rival.id,
  });

  console.log('▶ [测试 4] 全场灵感火花提炼断言 (distillSandboxInspirations)');
  const distillRes = await api.distillSandboxInspirations({
    session_id: session.id,
  });
  assert(distillRes, '灵感提炼接口正常响应');
  assert(Array.isArray(distillRes.golden_quotes), '必须返回金句数组');
  assert(Array.isArray(distillRes.micro_actions), '必须返回微动作数组');
  assert(Array.isArray(distillRes.psychological_insights), '必须返回心理暗流数组');
  assert(Array.isArray(distillRes.plot_twists), '必须返回反转脑洞数组');
  assert(distillRes.golden_quotes.length > 0, '至少提炼出 1 条金句');
  console.log(`  ✅ PASS: 成功提炼全场灵感 (金句: ${distillRes.golden_quotes.length}条, 微动作: ${distillRes.micro_actions.length}处, 心理暗流: ${distillRes.psychological_insights.length}项, 反转: ${distillRes.plot_twists.length}条)`);

  console.log('▶ [测试 5] 高光文段精修打磨多风格与局部范围断言 (synthesizeSandboxProse)');
  const polishRes = await api.synthesizeSandboxProse({
    session_id: session.id,
    polishing_style: 'CINEMATIC',
    start_round_index: 0,
    end_round_index: 1,
    custom_guidance: '侧重雨声与眼神交锋',
  });
  assert(polishRes && polishRes.synthesized_prose, '精修文段成功返回');
  assert(polishRes.word_count > 0, '字数大于0');
  console.log(`  ✅ PASS: 成功完成高光文段电影感打磨 (${polishRes.word_count} 字)`);

  console.log('▶ [测试 6] 灵感火花便签持久化断言 (inspiration_notes_json)');
  const notesMock = [
    {
      id: 'insp-1',
      type: 'QUOTE' as const,
      content: '“阁下此言，莫非当真以为在下无路可退？”',
      speaker_name: hero.name,
      round_index: 1,
      created_at: Date.now(),
    },
    {
      id: 'insp-2',
      type: 'ACTION' as const,
      content: '垂眸掩去眼底冷意，指尖轻轻摩挲佩剑剑柄。',
      speaker_name: hero.name,
      round_index: 1,
      created_at: Date.now(),
    },
  ];
  await api.updateSandboxSession({
    id: session.id,
    inspiration_notes_json: JSON.stringify(notesMock),
  });

  const reloaded = await api.getSandboxSession(session.id);
  assert(reloaded, '重新加载沙盒会话成功');
  assert(reloaded.inspiration_notes_json, '灵感便签 JSON 存在');
  const parsed = JSON.parse(reloaded.inspiration_notes_json);
  assert.strictEqual(parsed.length, 2, '灵感便签完整保留');
  assert.strictEqual(parsed[0].type, 'QUOTE', '便签类型准确持久化');
  console.log('  ✅ PASS: 灵感火花盒数据在数据库中完整安全持久化');

  // 清理临时会话
  await api.deleteSandboxSession(session.id);
}

runTests().then(() => {
  console.log('\n===============================================================');
  console.log('🎉 演武场角色行动探针、灵感提炼与高光精修专项测试全部 100% 通过！');
  console.log('===============================================================\n');
}).catch((err) => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
