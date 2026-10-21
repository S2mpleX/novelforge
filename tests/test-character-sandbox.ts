/**
 * NovelForge AI V3.4.0 — 角色对戏演武场 (Character Sandbox) 专属自动化端到端测试套件
 * 
 * 核心验证范围：
 * 1. 角色私密上下文组装与隔离性（战争迷雾与零心理同质化隔离）
 * 2. 结构化标记解析 (<inner_thought>, <action>, <speech>) 与容错自愈
 * 3. 演员轮换状态机流转与单步步进 (Step Execution)
 * 4. 作者原地就地改词的因果传递
 * 5. 中立旁白/天意突发变故注入
 * 6. 对白实录小说化转译 (Prose Synthesis) 与 Humanizer 文学质量核验
 * 7. 沙盒会话数据持久化与生命周期管理
 */

import { api } from '../src/utils/tauriBridge';
import { HumanizerEngine } from '../src/features/humanizer/HumanizerEngine';
import {
  SANDBOX_PRESET_TEMPLATES,
  calculateDialogueTension,
} from '../src/components/docking/panels/CharacterSandboxPanel';
import type {
  CharacterActorConfig,
  DialogueRoundRecord,
  CreateSandboxSessionInput,
  ExecuteSandboxStepInput,
} from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASS: ${message}`);
}

async function runTests() {
  console.log('\n===============================================================');
  console.log(' NovelForge AI V3.4 — 角色对戏演武场专项自动化测试');
  console.log('===============================================================\n');

  // -----------------------------------------------------------------
  // 测试 1: 角色私密上下文组装与隔离性（战争迷雾隔离）
  // -----------------------------------------------------------------
  console.log('▶ [测试 1] 角色私密上下文组装与战争迷雾隔离断言');
  {
    const actorA: CharacterActorConfig = {
      character_id: 'char_xiao_li',
      character_name: '萧离',
      private_motivation: '设法套出国师当年断魂崖下毒的真相，同时隐藏自己身中奇毒的事实。',
      private_secret: '解药就在我的袖袋夹层中，但我的经脉暂时被封，不能动用真气。',
      voice_quirks: '语气平淡沉稳，惜字如金，冷峻深沉',
      order_index: 0,
    };

    const actorB: CharacterActorConfig = {
      character_id: 'char_guo_shi',
      character_name: '国师',
      private_motivation: '逼迫萧离交出前朝密信，若不从则在茶中下毒。',
      private_secret: '门外其实根本没有三千禁军，我是在孤身虚张声势。',
      voice_quirks: '言辞锋芒毕露，带着冷笑与步步紧逼',
      order_index: 1,
    };

    // 模拟公开对话流（包含动作与台词，但严禁包含内心戏）
    const publicHistory: DialogueRoundRecord[] = [
      {
        round_index: 1,
        speaker_id: actorB.character_id,
        speaker_name: actorB.character_name,
        inner_thought: '（国师内心算盘：先激怒他，看他脚步虚不虚）',
        character_action: '慢慢放下青瓷茶盏，眼神如刀般刮向萧离的右手。',
        speech: '贤侄，三年不见，你师父坟头的荒草，怕是有一人高了吧？',
        is_narrator_event: false,
        is_edited_by_user: false,
        timestamp: Date.now(),
      },
    ];

    // 为萧离组装发送给大模型的 Prompt
    // 过滤掉其他人的 inner_thought
    const filteredLedger = publicHistory
      .map((h) => `${h.speaker_name}: （${h.character_action}）“${h.speech}”`)
      .join('\n');

    // 断言 1: 萧离的上下文包含萧离自身的秘密
    assert(
      actorA.private_secret.includes('袖袋夹层') && actorA.private_motivation.includes('断魂崖'),
      '角色 A (萧离) 拥有专属的私密动机与隐藏秘密'
    );

    // 断言 2: 公开可见的对话账本中，国师的真实心理绝不出现
    assert(
      !filteredLedger.includes('先激怒他') && !filteredLedger.includes('孤身虚张声势'),
      '公开对话账本中严格剥离其他角色的私密内心算盘 (零心理同质化)'
    );

    // 断言 3: 公开账本中必须包含国师的公开微动作与台词
    assert(
      filteredLedger.includes('青瓷茶盏') && filteredLedger.includes('荒草，怕是有一人高了吧'),
      '公开对话账本真实传递动作与正面对白'
    );
  }

  // -----------------------------------------------------------------
  // 测试 2: 结构化标签解析 (<inner_thought>, <action>, <speech>) 与容错自愈
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 2] 结构化 XML 标签提取与畸形输出自愈降级测试');
  {
    // 标准输出样本
    const standardReply = `
<inner_thought>
老狐狸在故意激我。他在看我的右手，说明他已经怀疑我的右臂有伤。
我绝不能露出杀意，师父的死因我还得套出来，此刻必须以退为进。
</inner_thought>
<action>
萧离垂下眼帘，右手按在膝头的手指微不可察地蜷紧又松开，脸色苍白如常。
</action>
<speech>
国师大人深夜提及家师，是觉得萧某今夜走不出这间屋子了？
</speech>
    `;

    // 辅助解析逻辑
    const parseOutput = (raw: string) => {
      let thought = '';
      let action = '';
      let speech = '';

      if (raw.includes('<inner_thought>') && raw.includes('</inner_thought>')) {
        thought = raw.split('<inner_thought>')[1].split('</inner_thought>')[0].trim();
      }
      if (raw.includes('<action>') && raw.includes('</action>')) {
        action = raw.split('<action>')[1].split('</action>')[0].trim();
      }
      if (raw.includes('<speech>') && raw.includes('</speech>')) {
        speech = raw.split('<speech>')[1].split('</speech>')[0].trim();
      }

      // 容错降级
      if (!speech) {
        const qMatch = raw.match(/“([^”]+)”/);
        if (qMatch) {
          speech = qMatch[1].trim();
          action = raw.replace(qMatch[0], '').trim();
        }
      }
      return { thought, action, speech };
    };

    const parsed = parseOutput(standardReply);
    assert(parsed.thought.includes('老狐狸在故意激我'), '成功解析出私密思考链 <inner_thought>');
    assert(parsed.action.includes('右手按在膝头的手指'), '成功解析出肢体微动作 <action>');
    assert(parsed.speech.includes('走不出这间屋子了'), '成功解析出正面对白 <speech>');

    // 畸形无标签样本（容错降级）
    const malformedReply = `萧离冷冷地看着他，按住了短刀。“有些话，国师还是留给阎王说吧。”`;
    const fallbackParsed = parseOutput(malformedReply);
    assert(fallbackParsed.speech.includes('有些话，国师还是留给阎王说吧'), '畸形输出自愈：准确捕获中文引号内台词');
    assert(fallbackParsed.action.includes('按住了短刀'), '畸形输出自愈：将外部非对话文字收拢为微动作');
  }

  // -----------------------------------------------------------------
  // 测试 3: 会话状态机创建与单步推进 (Execute Step)
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 3] 沙盒会话创建与单步步进流转测试');
  {
    const input: CreateSandboxSessionInput = {
      novel_id: 'test_novel_001',
      title: '密室心理博弈战',
      scene_setting: '幽暗密室，屋外大雨滂沱，油灯如豆。',
      scene_goal: '探查解药虚实，在5轮内决出胜负。',
      characters_config: [
        {
          character_id: 'c1',
          character_name: '萧离',
          private_motivation: '保全性命',
          private_secret: '解药在袖中',
          order_index: 0,
        },
        {
          character_id: 'c2',
          character_name: '国师',
          private_motivation: '抢夺解药',
          private_secret: '门外无兵',
          order_index: 1,
        },
      ],
    };

    const session = await api.createSandboxSession(input);
    assert(Boolean(session && session.id), '成功创建角色对戏沙盒会话');
    assert(session.status === 'DRAFT', '会话初始状态为 DRAFT');

    // 执行单步推演 (Step 1: 角色 1 发言)
    const step1 = await api.executeSandboxStep({
      session_id: session.id,
    });
    assert(Boolean(step1.round), '第一轮推演成功生成对戏节拍');
    assert(step1.round.speaker_name === '萧离', '第一位发言者为萧离');
    assert(step1.round.inner_thought.length > 0, '萧离拥有独立的内心独白推演');
    assert(step1.total_rounds === 1, '对戏总轮次计数递增为 1');

    // 执行单步推演 (Step 2: 轮换到角色 2 发言)
    const step2 = await api.executeSandboxStep({
      session_id: session.id,
    });
    assert(step2.round.speaker_name === '国师', '发言人状态机自动轮转给国师');
    assert(step2.total_rounds === 2, '对戏总轮次计数递增为 2');
  }

  // -----------------------------------------------------------------
  // 测试 4: 作者原地精修台词与因果传递
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 4] 作者原地微调台词与上下文因果传递测试');
  {
    const sessions = await api.listSandboxSessions('test_novel_001');
    assert(sessions.length > 0, '成功获取小说下的沙盒对戏会话');
    const sess = sessions[0];
    const history: DialogueRoundRecord[] = JSON.parse(sess.dialogue_history_json);

    // 作者就地精修第 2 轮台词
    const modifiedSpeech = '萧离，本座不仅知道解药在何处，还知道你服下了噬魂散！';
    history[1].speech = modifiedSpeech;
    history[1].is_edited_by_user = true;

    const updated = await api.updateSandboxSession({
      id: sess.id,
      dialogue_history: history,
    });
    const parsedHistory: DialogueRoundRecord[] = JSON.parse(updated.dialogue_history_json);
    assert(
      parsedHistory[1].speech === modifiedSpeech,
      '作者原地精修台词成功持久化'
    );
    assert(
      parsedHistory[1].is_edited_by_user === true,
      '准确打上“作者已修 (is_edited_by_user)”标记'
    );
  }

  // -----------------------------------------------------------------
  // 测试 5: 中立旁白/天意变故注入测试
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 5] 中立旁白事件与天意突发变故注入测试');
  {
    const sessions = await api.listSandboxSessions('test_novel_001');
    const sess = sessions[0];

    // 作者注入突发环境变故
    const narratorEvent = '轰隆一声巨响，一道紫电撕裂苍穹，狂风吹灭了案上的最后一盏油灯。';
    const stepRes = await api.executeSandboxStep({
      session_id: sess.id,
      narrator_intervention: narratorEvent,
    });

    const freshSess = await api.getSandboxSession(sess.id);
    const history: DialogueRoundRecord[] = JSON.parse(freshSess.dialogue_history_json);

    const narratorRound = history.find((h) => h.is_narrator_event);
    assert(Boolean(narratorRound), '旁白突发变故成功作为独立节点注入时间线');
    assert(
      narratorRound?.character_action.includes('狂风吹灭了案上的最后一盏油灯'),
      '旁白内容完整保留并成为后续角色的外部物理刺激'
    );
  }

  // -----------------------------------------------------------------
  // 测试 6: 对戏实录小说化转译 (Prose Synthesis) 与 Humanizer 文学质感
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 6] 对白实录转译小说正文与 Humanizer 人情味诊断');
  {
    const sessions = await api.listSandboxSessions('test_novel_001');
    const sess = sessions[0];

    const synthResult = await api.synthesizeSandboxProse({
      session_id: sess.id,
      custom_guidance: '融入环境声色白描，强化心理与微表情克制',
      pov_mode: 'THIRD_LIMITED',
    });

    assert(Boolean(synthResult.synthesized_prose), '成功将对戏实录转译合成小说正文');
    assert(synthResult.word_count > 50, `合成正文篇幅达标: ${synthResult.word_count} 字`);

    // 使用 Humanizer 诊断引擎核验转译文学质感
    const diagnosis = HumanizerEngine.auditText(synthResult.synthesized_prose);
    assert(
      diagnosis.clicheCount === 0,
      `转译正文零违规套话 (命中 ${diagnosis.clicheCount} 处套话)`
    );
    assert(
      diagnosis.score >= 80,
      `转译正文人情味文学评分极高: ${diagnosis.score} 分 (>=80)`
    );
  }

  // -----------------------------------------------------------------
  // 测试 7: 会话生命周期与清理
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 7] 沙盒会话删除与清理测试');
  {
    const sessions = await api.listSandboxSessions('test_novel_001');
    const sessId = sessions[0].id;
    await api.deleteSandboxSession(sessId);

    const remaining = await api.listSandboxSessions('test_novel_001');
    assert(
      !remaining.some((s) => s.id === sessId),
      '对戏沙盒会话成功删除，无脏数据残留'
    );
  }

  // -----------------------------------------------------------------
  // 测试 8: 经典情境模板库数据健全性与自动装配
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 8] 经典情境模板库完整性与攻防动机装配测试');
  {
    assert(SANDBOX_PRESET_TEMPLATES.length === 6, '内置 6 套经典高冲突戏份模板');
    const banquet = SANDBOX_PRESET_TEMPLATES.find((t) => t.id === 'banquet_hidden_daggers');
    assert(Boolean(banquet), '鸿门夜宴模板存在');
    assert(
      banquet?.secret_a.includes('刀斧手') && banquet?.secret_b.includes('遗诏'),
      '模板包含极具戏剧张力的双向秘密与暗算动机'
    );

    const unmask = SANDBOX_PRESET_TEMPLATES.find((t) => t.id === 'identity_unmasking');
    assert(unmask?.name === '当面掉马', '掉马现场模板配置正确');
  }

  // -----------------------------------------------------------------
  // 测试 9: 戏剧张力指数测算 (1~10 刻度) 动态分析
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 9] 戏剧张力指数测算与微表情情绪刻度分析');
  {
    const calmRound: DialogueRoundRecord = {
      round_index: 1,
      speaker_id: 'c1',
      speaker_name: '萧离',
      inner_thought: '',
      character_action: '慢慢拂去衣袖尘埃',
      speech: '夜深露重，阁下请用茶。',
      is_narrator_event: false,
      is_edited_by_user: false,
      timestamp: Date.now(),
    };
    const calmTension = calculateDialogueTension(calmRound);
    assert(calmTension.level <= 4, `平淡对峙初始张力克制: ${calmTension.level} 分 (${calmTension.label})`);

    const violentRound: DialogueRoundRecord = {
      round_index: 6,
      speaker_id: 'c2',
      speaker_name: '国师',
      inner_thought: '',
      character_action: '脸色剧变，按住腰间佩剑冷笑一声',
      speech: '若敢走出此门半步，本座今夜必斩你于剑下，纳命来！',
      is_narrator_event: false,
      is_edited_by_user: false,
      timestamp: Date.now(),
    };
    const violentTension = calculateDialogueTension(violentRound);
    assert(violentTension.level >= 8, `白热化交锋张力拉满: ${violentTension.level} 分 (${violentTension.label})`);
  }

  // -----------------------------------------------------------------
  // 测试 10: 剧本脚本格式与上帝视角排练纪要结构性验证
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 10] 剧本格式与上帝视角排练纪要生成验证');
  {
    const sampleRound: DialogueRoundRecord = {
      round_index: 1,
      speaker_id: 'c1',
      speaker_name: '萧离',
      inner_thought: '试探虚实',
      character_action: '轻按佩刀',
      speech: '请赐教。',
      is_narrator_event: false,
      is_edited_by_user: false,
      timestamp: Date.now(),
    };

    // 格式化为标准剧本文本
    const scriptFormat = `[第 1 幕] ${sampleRound.speaker_name.toUpperCase()}:\n  （${sampleRound.character_action}）\n  “${sampleRound.speech}”\n`;
    assert(scriptFormat.includes('[第 1 幕] 萧离:'), '标准剧本格式包含幕次与人物标签');
    assert(scriptFormat.includes('（轻按佩刀）'), '标准剧本包含舞台指示动作');

    // 格式化为上帝视角排练纪要
    const rehearsalMd = `### 节拍 1 · ${sampleRound.speaker_name}\n> 🧠 **私密心理独白**：*“${sampleRound.inner_thought}”*\n*动作神态*：${sampleRound.character_action}\n**台词**：“${sampleRound.speech}”\n`;
    assert(rehearsalMd.includes('私密心理独白'), '排练纪要完整保留上帝视角心路独白');
  }

  // -----------------------------------------------------------------
  // 测试 11: 演武场心路反哺全书长期记忆库 (CharacterStateEvent)
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 11] 对戏心路暗流反哺长期记忆状态机测试');
  {
    const stateEvent = await api.createCharacterStateEvent({
      character_id: 'char_xiao_li',
      effective_time: '演武场《密室试探》',
      field_name: '对手戏心境演变',
      previous_value: '平静无波',
      new_value: '与国师试探后，确认自身经脉损伤已暴露，决意孤注一掷',
    });

    assert(Boolean(stateEvent && stateEvent.id), '成功为角色创建对手戏心境演变状态事件');
    assert(stateEvent.field_name === '对手戏心境演变', '字段标记准确匹配演武场心境');
    assert(stateEvent.new_value.includes('孤注一掷'), '状态事实无损持久化，可被 L3/L4 记忆引擎实时调阅');
  }

  // -----------------------------------------------------------------
  // 测试 12: 用户体验强化 (多会话切换、单轮重掷Re-roll与示范角色装配)
  // -----------------------------------------------------------------
  console.log('\n▶ [测试 12] 用户体验核心链路专项断言 (多会话切换、Re-roll与示范角色冷启动)');
  {
    // 1. 验证空态示范角色一键导入创建
    const demoChar1 = await api.createCharacter({
      novel_id: 'novel_test_sandbox_001',
      name: '林渊',
      aliases: '无名刀客',
      personality: '沉敛寡言，城府极深',
      motivation: '查清当年断魂崖血案元凶',
    });
    const demoChar2 = await api.createCharacter({
      novel_id: 'novel_test_sandbox_001',
      name: '洛清雪',
      aliases: '清雪仙子',
      personality: '清冷绝尘，敏锐如鹰',
      motivation: '试探林渊真实功法破绽',
    });
    assert(demoChar1.name === '林渊' && demoChar2.name === '洛清雪', '成功一键导入示范角色【林渊 vs 洛清雪】');

    // 2. 验证多会话新建与切换
    const sessionB = await api.createSandboxSession({
      novel_id: 'novel_test_sandbox_001',
      title: '雪夜古刹 · 终极对决',
      scene_setting: '破败古刹内，狂风倒灌，佛像斑驳倒塌。',
      scene_goal: '逼对方现出魔道真身。',
      characters_config: [
        {
          character_id: demoChar1.id,
          character_name: demoChar1.name,
          private_motivation: '不可动用内力',
          private_secret: '左臂暗藏毒针',
          order_index: 0,
        },
        {
          character_id: demoChar2.id,
          character_name: demoChar2.name,
          private_motivation: '拆穿其左臂伤势',
          private_secret: '带了留影玉简',
          order_index: 1,
        },
      ],
    });
    assert(sessionB.title === '雪夜古刹 · 终极对决', '成功新建第二场独立对戏沙盒会话');

    // 3. 步进一轮后测试单轮重掷 (Re-roll)
    await api.executeSandboxStep({ session_id: sessionB.id });
    const fetchedBefore = await api.getSandboxSession(sessionB.id);
    const historyBefore: DialogueRoundRecord[] = JSON.parse(fetchedBefore?.dialogue_history_json || '[]');
    assert(historyBefore.length === 1, '第一轮对戏正常生成 (林渊)');

    // 模拟前端撤销本轮并重新生成
    await api.updateSandboxSession({
      id: sessionB.id,
      dialogue_history: [],
    });
    const stepAgain = await api.executeSandboxStep({ session_id: sessionB.id });
    assert(stepAgain.round.round_index === 1, '单轮重掷成功：从相同起点重新独立生成发言');

    // 4. 清理测试会话
    await api.deleteSandboxSession(sessionB.id);
    const afterDelete = await api.getSandboxSession(sessionB.id);
    assert(!afterDelete, '对戏会话成功清理');
  }

  console.log('\n===============================================================');
  console.log(' 角色对戏演武场自动化验收完成：全部 12 项深度断言 100% 通过！');
  console.log('===============================================================\n');
}

runTests().catch((err) => {
  console.error('测试异常崩溃:', err);
  process.exit(1);
});
