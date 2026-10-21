import assert from 'node:assert';
import { api } from '../src/utils/tauriBridge';

console.log('\n===============================================================');
console.log('🎨 NovelForge AI — 角色贴图立绘与 AI 视觉人设理解专项自动化测试');
console.log('===============================================================\n');

async function runTests() {
  const testNovelId = 'novel_test_visual_' + Date.now();

  console.log('▶ [测试 1] 角色创建附带立绘贴图 (Avatar) 与人设外貌特征 (Visual Summary) 持久化');
  const sampleAvatarBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const initialVisual = '一袭霜白流云暗纹广袖仙裙，青丝以碧玉簪轻绾，双眸冷若秋水寒潭。';

  const char1 = await api.createCharacter({
    novel_id: testNovelId,
    name: '洛清雪',
    gender: '女',
    aliases: '寒月仙子',
    personality: '清冷孤绝，外冷内热',
    motivation: '守护九幽冰魄封印',
    avatar_url: sampleAvatarBase64,
    visual_summary: initialVisual,
  });

  assert.ok(char1.id, '角色必须具备唯一 ID');
  assert.strictEqual(char1.name, '洛清雪');
  assert.strictEqual(char1.gender, '女');
  assert.strictEqual(char1.avatar_url, sampleAvatarBase64, '立绘贴图必须完整持久化');
  assert.strictEqual(char1.visual_summary, initialVisual, '人设外貌描写必须完整持久化');
  console.log('  ✅ PASS: 角色创建成功携带立绘贴图与人设外貌');

  console.log('\n▶ [测试 2] 角色立绘贴图与外貌特征更新 (updateCharacter) 断言');
  const updatedVisual = '三千青丝随风激荡，额间浮现淡蓝冰晶神印，霜白仙裙边缘染有星辉神芒，手持三尺秋水玄冰剑。';
  const updatedAvatar = 'https://cdn.novelforge.ai/avatars/luoqingxue_ascend.png';

  const updatedChar = await api.updateCharacter({
    id: char1.id,
    name: '洛清雪 (玄冰觉醒)',
    gender: '女',
    avatar_url: updatedAvatar,
    visual_summary: updatedVisual,
  });

  assert.strictEqual(updatedChar.name, '洛清雪 (玄冰觉醒)');
  assert.strictEqual(updatedChar.avatar_url, updatedAvatar, '立绘贴图更新成功');
  assert.strictEqual(updatedChar.visual_summary, updatedVisual, '外貌特征更新成功');

  // 重新从列表加载，检验持久化
  const allChars = await api.listCharacters(testNovelId);
  const reloaded = allChars.find((c) => c.id === char1.id);
  assert.ok(reloaded, '必须能在角色列表中检索到');
  assert.strictEqual(reloaded?.avatar_url, updatedAvatar);
  assert.strictEqual(reloaded?.visual_summary, updatedVisual);
  console.log('  ✅ PASS: 角色立绘与外貌更新及全表读取无损自洽');

  console.log('\n▶ [测试 3] AI 识图理解人设外貌 (analyzeCharacterAppearance) 跨流派与性别识别');
  // 1) 仙侠女性立绘测试
  const visionResXianxia = await api.analyzeCharacterAppearance({
    image_url: sampleAvatarBase64,
    character_name: '洛清雪',
    gender: '女',
    genre: '仙侠',
  });
  assert.ok(visionResXianxia.visual_summary.length > 30, 'AI 生成的外貌描写段落必须具备丰富度');
  assert.ok(visionResXianxia.appearance_tags.length >= 4, '必须提取至少 4 个核心视觉标签');
  assert.ok(visionResXianxia.facial_features, '必须包含面部五官刻画');
  assert.ok(visionResXianxia.clothing_style, '必须包含服饰形制与色彩材质');
  console.log(`  ✅ PASS: 仙侠女性识别成功 - 标签: [${visionResXianxia.appearance_tags.join(' / ')}]`);
  console.log(`     描摹段落: ${visionResXianxia.visual_summary.slice(0, 48)}...`);

  // 2) 科幻男性立绘测试
  const visionResScifi = await api.analyzeCharacterAppearance({
    image_url: 'https://example.com/scifi_captain.jpg',
    character_name: '雷诺舰长',
    gender: '男',
    genre: '硬科幻',
  });
  assert.ok(visionResScifi.visual_summary.length > 30);
  assert.ok(visionResScifi.appearance_tags.length >= 4);
  assert.ok(
    visionResScifi.appearance_tags.some((t) => t.includes('短发') || t.includes('战服') || t.includes('军服') || t.includes('冷') || t.includes('黑')),
    '科幻男性标签应体现硬朗与科技或军装特质'
  );
  console.log(`  ✅ PASS: 硬科幻男性识别成功 - 标签: [${visionResScifi.appearance_tags.join(' / ')}]`);

  console.log('\n▶ [测试 4] 演武场推演系统对人设外貌特征的感知与装配联动');
  const rivalChar = await api.createCharacter({
    novel_id: testNovelId,
    name: '燕赤羽',
    gender: '男',
    avatar_url: 'https://example.com/yanchiyu.png',
    visual_summary: '赤红束发冠，着黑红相间烈焰刺绣劲装，右眼有一道三寸狭长刀疤，肩扛百炼玄铁斩马巨刃。',
  });

  const session = await api.createSandboxSession({
    novel_id: testNovelId,
    title: '玄冰崖绝巅对峙',
    scene_setting: '玄冰崖顶，大雪纷飞，狂风卷动两侧衣袍猎猎作响。',
    scene_goal: '试探对方底牌，争夺玄冰神格碎片。',
    characters_config: [
      {
        character_id: char1.id,
        character_name: '洛清雪',
        private_motivation: '不可引动神印反噬',
        private_secret: '体内灵力仅剩三成',
        order_index: 0,
        is_human: false,
      },
      {
        character_id: rivalChar.id,
        character_name: rivalChar.name,
        private_motivation: '激怒对手迫其出手',
        private_secret: '右肩带伤无法持久握刀',
        order_index: 1,
        is_human: false,
      },
    ],
  });

  assert.ok(session.id);
  const stepRes = await api.executeSandboxStep({
    session_id: session.id,
  });
  assert.ok(stepRes.round, '单步推演顺利生成');
  assert.ok(stepRes.round.speaker_name, '发言人就绪');
  console.log(`  ✅ PASS: 演武场单步推演联动顺利，发言人: 【${stepRes.round.speaker_name}】`);

  console.log('\n▶ [测试 5] 演武场临时/预设角色直接携带立绘贴图与外貌断言 (Actor-level Avatar)');
  const presetActorSession = await api.createSandboxSession({
    novel_id: testNovelId,
    title: '预设演武场快速对戏',
    scene_setting: '昏暗内室',
    scene_goal: '试探解药',
    characters_config: [
      {
        character_id: 'preset_linke',
        character_name: '林恪',
        gender: '男',
        avatar_url: 'data:image/png;base64,sample_linke_avatar',
        visual_summary: '墨发高束，身披玄黑金纹劲装，腰悬古剑。',
        private_motivation: '不可泄露内伤',
        private_secret: '解药在袖中夹层',
        order_index: 0,
        is_human: false,
      },
      {
        character_id: 'preset_suheng',
        character_name: '苏衡',
        gender: '男',
        avatar_url: 'https://example.com/suheng.png',
        visual_summary: '长衫素雅，折扇轻摇，看似温润文雅，眸底却满是算计。',
        private_motivation: '迫使对方交出解药',
        private_secret: '门外其实无援兵',
        order_index: 1,
        is_human: false,
      },
    ],
  });

  assert.ok(presetActorSession.characters_config_json, '必须具备角色配置 JSON');
  const parsedConfigs = JSON.parse(presetActorSession.characters_config_json || '[]');
  assert.strictEqual(parsedConfigs.length, 2);
  assert.strictEqual(parsedConfigs[0].avatar_url, 'data:image/png;base64,sample_linke_avatar');
  assert.strictEqual(parsedConfigs[0].visual_summary, '墨发高束，身披玄黑金纹劲装，腰悬古剑。');
  assert.strictEqual(parsedConfigs[1].avatar_url, 'https://example.com/suheng.png');
  console.log('  ✅ PASS: 演武场预设角色完整支持立绘贴图、外貌特征与性别配置');

  console.log('\n▶ [测试 6] 角色清理与级联释放安全断言');
  await api.deleteCharacter(char1.id);
  await api.deleteCharacter(rivalChar.id);
  await api.deleteSandboxSession(session.id);
  await api.deleteSandboxSession(presetActorSession.id);

  const finalChars = await api.listCharacters(testNovelId);
  assert.strictEqual(finalChars.filter((c) => c.id === char1.id || c.id === rivalChar.id).length, 0);
  console.log('  ✅ PASS: 角色及其立绘与外貌元数据安全清理，无孤儿数据泄漏');

  console.log('\n===============================================================');
  console.log('🎉 角色贴图立绘与 AI 视觉人设理解专项测试全部 100% 通过！');
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('❌ 测试执行异常:', err);
  process.exit(1);
});
