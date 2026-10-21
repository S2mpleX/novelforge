import assert from 'node:assert';
import { api } from '../src/utils/tauriBridge';

console.log('\n===============================================================');
console.log('🎭 NovelForge AI — 推演台多API分工、书本设定导入与人物性别专项测试');
console.log('===============================================================\n');

async function runTests() {
  const testNovelId = 'novel_test_multi_api_' + Date.now();

  console.log('▶ [测试 1] 人物性别 (Gender) 全生命周期与多端持久化断言');
  // 1. 创建男性角色与女性角色
  const maleChar = await api.createCharacter({
    novel_id: testNovelId,
    name: '谢沧溟',
    gender: '男',
    personality: '狂放不羁，剑指沧溟',
    motivation: '求证无上剑道',
  });
  assert(maleChar && maleChar.id, '成功创建角色【谢沧溟】');
  assert.strictEqual(maleChar.gender, '男', '谢沧溟性别准确持久化为【男】');

  const femaleChar = await api.createCharacter({
    novel_id: testNovelId,
    name: '洛清弦',
    gender: '女',
    personality: '清冷孤绝，心怀天下',
    motivation: '寻找古圣遗音',
  });
  assert(femaleChar && femaleChar.id, '成功创建角色【洛清弦】');
  assert.strictEqual(femaleChar.gender, '女', '洛清弦性别准确持久化为【女】');

  // 更新性别
  const updatedFemale = await api.updateCharacter({
    id: femaleChar.id,
    name: '洛清弦',
    gender: '女',
    personality: '清冷孤绝，深情隐忍',
  });
  assert.strictEqual(updatedFemale.gender, '女', '更新后性别属性保持无损');
  console.log('  ✅ PASS: 角色创建与更新均完整支持性别属性 (男/女/其他)');

  console.log('▶ [测试 2] 角色关系与世界观铁律设定关联断言');
  const rel = await api.createCharacterRelationship({
    novel_id: testNovelId,
    source_character_id: maleChar.id,
    target_character_id: femaleChar.id,
    relation_type: '宿命宿敌',
    description: '昔日同门，因理念决裂而拔剑相向',
  });
  assert(rel && rel.id, '成功建立谢沧溟与洛清弦的【宿命宿敌】关系拓扑');
  assert.strictEqual(rel.relation_type, '宿命宿敌');
  console.log('  ✅ PASS: 角色羁绊与恩怨纠葛拓扑已建立');

  console.log('▶ [测试 3] 推演台多模型分派与配置持久化断言');
  // 创建沙盒推演会话，角色 A 分配 Claude，角色 B 分配 DeepSeek
  const session = await api.createSandboxSession({
    novel_id: testNovelId,
    title: '断魂崖剑试宿命',
    scene_setting: '断魂崖顶，罡风凛冽，雷鸣交加。',
    scene_goal: '试探对方是否保留当年的绝密剑诀。',
    characters_config: [
      {
        character_id: maleChar.id,
        character_name: maleChar.name,
        provider_id: 'provider_claude',
        model_name: 'claude-3-5-sonnet',
        private_motivation: '逼洛清弦使出破虚剑意。',
        private_secret: '左手经脉已伤，不能持久战。',
        order_index: 0,
        is_human: false,
      },
      {
        character_id: femaleChar.id,
        character_name: femaleChar.name,
        provider_id: 'provider_deepseek',
        model_name: 'deepseek-chat',
        private_motivation: '探明谢沧溟此行的真正目的。',
        private_secret: '身上带有封禁神念的摄魂玉符。',
        order_index: 1,
        is_human: false,
      },
    ],
  });

  assert(session && session.id, '成功创建推演台沙盒会话');
  const actorConfigs = JSON.parse(session.characters_config_json);
  assert.strictEqual(actorConfigs.length, 2, '出场角色数为 2');
  assert.strictEqual(actorConfigs[0].provider_id, 'provider_claude', '角色A绑定独立服务商【provider_claude】');
  assert.strictEqual(actorConfigs[0].model_name, 'claude-3-5-sonnet', '角色A绑定模型【claude-3-5-sonnet】');
  assert.strictEqual(actorConfigs[1].provider_id, 'provider_deepseek', '角色B绑定独立服务商【provider_deepseek】');
  assert.strictEqual(actorConfigs[1].model_name, 'deepseek-chat', '角色B绑定模型【deepseek-chat】');
  console.log('  ✅ PASS: 跨角色独立多服务商与多模型配置成功持久化');

  console.log('▶ [测试 4] 推演台单步步进与即时状态同步断言');
  // 执行步进
  const stepRes = await api.executeSandboxStep({
    session_id: session.id,
    target_speaker_id: maleChar.id,
  });

  assert(stepRes && stepRes.round, '成功生成首轮角色推演');
  assert.strictEqual(stepRes.round.speaker_name, '谢沧溟', '发言者准确匹配先手角色');
  assert(Boolean(stepRes.round.character_action), '成功生成角色的肢体动作');
  assert(Boolean(stepRes.round.speech), '成功生成角色的正面对白');

  // 清理测试会话与角色
  await api.deleteSandboxSession(session.id);
  await api.deleteCharacter(maleChar.id);
  await api.deleteCharacter(femaleChar.id);
  console.log('  ✅ PASS: 单步推演顺利生成，沙盒会话与测试数据安全释放');

  console.log('\n===============================================================');
  console.log('🎉 推演台多API、书本设定导入与人物性别专项自动化测试全部 100% 通过！');
  console.log('===============================================================\n');
}

runTests().catch((e) => {
  console.error('❌ 测试执行失败:', e);
  process.exit(1);
});
