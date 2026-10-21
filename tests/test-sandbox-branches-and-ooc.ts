/**
 * NovelForge AI V3.6 — 演武场树状分支推演 (What-If Branching) 与潜台词/人设崩坏 (OOC) 智能审计专项自动化测试
 */

import { api } from '../src/utils/tauriBridge';
import type { CharacterActorConfig, DialogueRoundRecord, SandboxBranch } from '../src/types';
import {
  auditPersonaDrift,
  generatePersonaCorrectionPrompt,
  distillSubtext,
} from '../src/utils/personaAuditor';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${msg}`);
}

async function runTests() {
  console.log('\n===============================================================');
  console.log(' NovelForge AI V3.6 — 演武场树状分支与 OOC 智能审计专项自动化测试');
  console.log('===============================================================\n');

  // --- 测试 1: 潜台词提炼与透视能力 ---
  console.log('▶ [测试 1] 潜台词提炼与透视能力断言');
  const roundWithSubtext: DialogueRoundRecord = {
    round_index: 1,
    speaker_id: 'c1',
    speaker_name: '萧离',
    inner_thought: '试探对方是否掌握当年真相，绝不能让他发现我受内伤。',
    subtext: '表面平静反问，实则探查暗桩虚实',
    character_action: '轻拂袖口霜雪',
    speech: '国师深夜造访，莫非就为了这几句闲谈？',
    is_narrator_event: false,
    is_edited_by_user: false,
    timestamp: Date.now(),
  };
  assert(distillSubtext(roundWithSubtext) === '表面平静反问，实则探查暗桩虚实', '显式 subtext 正确提取');

  const roundWithoutSubtext: DialogueRoundRecord = {
    round_index: 2,
    speaker_id: 'c1',
    speaker_name: '萧离',
    inner_thought: '我想逼迫对方露出破绽，绝不能让他离开这间屋子。',
    character_action: '按住剑柄',
    speech: '今夜你走不了。',
    is_narrator_event: false,
    is_edited_by_user: false,
    timestamp: Date.now(),
  };
  const distilled = distillSubtext(roundWithoutSubtext);
  assert(distilled.includes('想逼迫对方露出破绽'), '从 inner_thought 智能蒸馏出精准潜台词');

  // --- 测试 2: 人设崩坏与 OOC 智能审计引擎 (Persona Drift Sentinel) ---
  console.log('\n▶ [测试 2] 人设崩坏与 OOC 智能审计引擎四大维度断言');
  const coldActor: CharacterActorConfig = {
    character_id: 'char_lin',
    character_name: '林渊',
    private_motivation: '隐瞒魔功，试探对方证据，处于殊死戒备防线',
    private_secret: '密阁的真正账簿就在我袖中夹层里',
    voice_quirks: '语气平淡沉稳，惜字如金，语速极慢',
    order_index: 0,
  };

  // 维度 A: 现代商业/AI黑话严重出戏
  const modernJargonRound: DialogueRoundRecord = {
    round_index: 1,
    speaker_id: 'char_lin',
    speaker_name: '林渊',
    inner_thought: '思考对策',
    character_action: '凝视对方',
    speech: '洛使者，我们之间的底层逻辑与信息差根本无法打通。',
    is_narrator_event: false,
    is_edited_by_user: false,
    timestamp: Date.now(),
  };
  const auditA = auditPersonaDrift(coldActor, modernJargonRound);
  assert(auditA.hasDrift === true, '成功捕获现代违和词汇');
  assert(auditA.driftType === 'MODERN_JARGON', '准确标记为现代术语违和 (MODERN_JARGON)');
  assert(auditA.severity === 'critical', '黑话违和标记为严重级别 (critical)');

  // 维度 B: 戒备冷酷角色出现客服腔与过度客套
  const customerServiceRound: DialogueRoundRecord = {
    round_index: 2,
    speaker_id: 'char_lin',
    speaker_name: '林渊',
    inner_thought: '暗中运功',
    character_action: '低头行礼',
    speech: '实在抱歉请问您能否告知在下，当年之事究竟是何人所为？',
    is_narrator_event: false,
    is_edited_by_user: false,
    timestamp: Date.now(),
  };
  const auditB = auditPersonaDrift(coldActor, customerServiceRound);
  assert(auditB.hasDrift === true, '成功捕获敌对冷峻情境下的过度客套软化');
  assert(auditB.driftType === 'CUSTOMER_SERVICE', '准确标记为客服腔偏离 (CUSTOMER_SERVICE)');

  // 维度 C: 惜字如金人设出现冗长篇幅
  const verboseRound: DialogueRoundRecord = {
    round_index: 3,
    speaker_id: 'char_lin',
    speaker_name: '林渊',
    inner_thought: '试探',
    character_action: '站起身来',
    speech: '关于当年断魂崖那场漫天大火，江湖各派皆传言是魔教余孽勾结暗探所为，但依我之见背后定然另有朝廷鹰犬与刑律殿的授意，否则断不可能在短短半个时辰之内将整个山庄屠戮殆尽且无一人走脱。',
    is_narrator_event: false,
    is_edited_by_user: false,
    timestamp: Date.now(),
  };
  const auditC = auditPersonaDrift(coldActor, verboseRound);
  assert(auditC.hasDrift === true, '成功捕获惜字如金角色的冗长发言');
  assert(auditC.driftType === 'VERBOSE_DRIFT', '准确标记为篇幅超限偏离 (VERBOSE_DRIFT)');

  // 维度 D: 秘密在交锋前 3 轮主动泄露
  const leakRound: DialogueRoundRecord = {
    round_index: 2,
    speaker_id: 'char_lin',
    speaker_name: '林渊',
    inner_thought: '慌乱',
    character_action: '抚摸衣袖',
    speech: '你休想拿到我袖中夹层里的真正账簿！',
    is_narrator_event: false,
    is_edited_by_user: false,
    timestamp: Date.now(),
  };
  const auditD = auditPersonaDrift(coldActor, leakRound);
  assert(auditD.hasDrift === true, '成功捕获底牌早泄');
  assert(auditD.driftType === 'PREMATURE_SECRET', '准确标记为隐藏秘密过早外泄 (PREMATURE_SECRET)');

  // --- 测试 3: 人设强纠偏 Prompt 生成验证 ---
  console.log('\n▶ [测试 3] 人设强纠偏重掷 Prompt 强化断言');
  const correctionPrompt = generatePersonaCorrectionPrompt(coldActor, auditB.warning!);
  assert(correctionPrompt.includes('语气平淡沉稳，惜字如金'), '纠偏提示包含角色的语言习惯约束');
  assert(correctionPrompt.includes('隐瞒魔功'), '纠偏提示包含角色的核心动机');
  assert(correctionPrompt.includes('绝不轻易客套或妥协'), '纠偏提示明确封杀软化妥协倾向');

  // --- 测试 4: 演武场树状分支推演 (What-If Branching) 全生命周期 ---
  console.log('\n▶ [测试 4] 树状分支推演 (What-If Branching) 隔离与流转断言');
  const novel = await api.createNovel({
    title: '分支推演测试小说',
    genre: '玄幻修仙',
    description: '用于演武场 What-If 分支测试',
  });

  const session = await api.createSandboxSession({
    novel_id: novel.id,
    title: '密室双向抉择博弈',
    scene_setting: '幽暗密室，烛火摇曳',
    scene_goal: '试探解药，决定结盟或决裂',
    characters_config: [coldActor],
  });
  assert(session.id.length > 0, '成功创建沙盒会话');

  // 1. 在主线上推演 3 轮
  const r1 = await api.executeSandboxStep({ session_id: session.id });
  const r2 = await api.executeSandboxStep({ session_id: session.id });
  const r3 = await api.executeSandboxStep({ session_id: session.id });

  let sessAfterSteps = await api.getSandboxSession(session.id);
  let mainHistory: DialogueRoundRecord[] = JSON.parse(sessAfterSteps?.dialogue_history_json || '[]');
  assert(mainHistory.length === 3, '主时间线成功累积 3 轮推演');

  // 2. 从第 2 轮处开辟分支 A (What-If: 坦白真相分支)
  const forkRoundIndex = 1; // 第 2 轮 (index 1)
  const branchAHistory = mainHistory.slice(0, forkRoundIndex + 1);
  const branchAId = 'branch-truth-001';
  const branchAName = '分支A：坦白真相';

  const branchA: SandboxBranch = {
    id: branchAId,
    name: branchAName,
    fork_round_index: forkRoundIndex,
    history: [
      ...branchAHistory,
      {
        round_index: 3,
        speaker_id: coldActor.character_id,
        speaker_name: coldActor.character_name,
        inner_thought: '决定亮出底牌，换取生机。',
        subtext: '表面孤注一掷，实则绝地求生',
        character_action: '从袖中掷出一卷染血账本',
        speech: '当年断魂崖的账本就在此，信与不信，随你。',
        is_narrator_event: false,
        is_edited_by_user: true,
        branch_id: branchAId,
        timestamp: Date.now(),
      },
    ],
    created_at: Date.now(),
  };

  const updatedSessWithBranch = await api.updateSandboxSession({
    id: session.id,
    branches_json: JSON.stringify([branchA]),
    active_branch_id: branchAId,
    dialogue_history: branchA.history,
  });

  assert(updatedSessWithBranch?.active_branch_id === branchAId, '会话活跃分支成功置为分支 A');
  const parsedBranches: SandboxBranch[] = JSON.parse(updatedSessWithBranch?.branches_json || '[]');
  assert(parsedBranches.length === 1, '分支列表成功持久化 1 个平行分支');
  assert(parsedBranches[0].name === branchAName, '分支名称保持无损');
  assert(parsedBranches[0].history.length === 3, '分支 A 独立拥有 3 轮对白');
  assert(parsedBranches[0].history[2].speech.includes('账本就在此'), '分支 A 拥有完全独立于主线的结局台词');

  // 3. 切换回主时间线并验证主线历史未被破坏
  const switchedBack = await api.updateSandboxSession({
    id: session.id,
    active_branch_id: 'main',
    dialogue_history: mainHistory,
  });
  assert(switchedBack?.active_branch_id === 'main', '成功切换回主时间线');
  const mainHistoryRestored: DialogueRoundRecord[] = JSON.parse(switchedBack?.dialogue_history_json || '[]');
  assert(mainHistoryRestored.length === 3, '主时间线历史完整无损保留');
  assert(!mainHistoryRestored[2].speech.includes('账本就在此'), '主线第 3 轮严格与分支 A 保持隔离');

  // 4. 清理会话
  await api.deleteSandboxSession(session.id);
  const deleted = await api.getSandboxSession(session.id);
  assert(deleted === null, '测试沙盒会话成功清理');

  // --- 测试 5: 基于分支的独立正文转译合成 ---
  console.log('\n▶ [测试 5] 基于指定分支的独立正文转译合成断言');
  const proseRes = await api.synthesizeSandboxProse({
    session_id: session.id,
    custom_guidance: '侧重刻画分支A中抛出账本后的死寂与窒息感',
    pov_mode: 'THIRD_LIMITED',
  });
  assert(proseRes.synthesized_prose.length > 50, '成功合成高文学质感小说段落');
  assert(proseRes.word_count > 0, '正文字数统计准确');

  console.log('\n===============================================================');
  console.log(' 🎉 演武场树状分支推演与 OOC 智能审计验收完成：全部 5 项断言 100% 通过！');
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('测试运行异常:', err);
  process.exit(1);
});
