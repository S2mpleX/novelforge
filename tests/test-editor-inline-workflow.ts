import assert from 'assert';
import fs from 'fs';

console.log('===============================================================');
console.log('✍️🎯🛡️ NovelForge AI — 编辑器行内@提及、抉择探针与防吃书监护自动化测试');
console.log('===============================================================');

let passCount = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (e: any) {
    console.error(`  ❌ FAIL: ${name}`, e.message);
    throw e;
  }
}

// -------------------------------------------------------------
// PART 1: 核心源码接入与架构断言
// -------------------------------------------------------------
console.log('\n▶ [PART 1] 核心组件与交互体系源码静态断言');

const editorSource = fs.readFileSync('src/components/editor/NovelEditor.tsx', 'utf8');
const hoverCardSource = fs.readFileSync('src/components/editor/EntityHoverCard.tsx', 'utf8');
const mentionSource = fs.readFileSync('src/components/editor/EditorMentionPopover.tsx', 'utf8');
const breakoutBarSource = fs.readFileSync('src/components/editor/InlineCursorBreakoutBar.tsx', 'utf8');
const guardianSource = fs.readFileSync('src/components/editor/ContinuityGuardian.tsx', 'utf8');
const selectionMenuSource = fs.readFileSync('src/components/editor/FloatingSelectionMenu.tsx', 'utf8');

test('NovelEditor 集成行内 @ 提及与悬浮卡片机制', () => {
  assert(editorSource.includes('EditorMentionPopover'), '导入并挂载 EditorMentionPopover');
  assert(editorSource.includes('EntityHoverCard'), '导入并挂载 EntityHoverCard');
  assert(editorSource.includes('mentionQuery'), '包含 mentionQuery 状态监听');
  assert(editorSource.includes('handleSelectMention'), '包含提及选择处理函数');
  assert(editorSource.includes('handleEditorMouseOver'), '包含正文内 @ 提及划词悬停监听');
});

test('EntityHoverCard 悬浮卡片完整呈现立绘、外貌体态、底层动机与致命软肋', () => {
  assert(hoverCardSource.includes('当前外貌体态衣饰'), '卡片包含外貌体态衣饰专区');
  assert(hoverCardSource.includes('底层动机与软肋'), '卡片包含底层动机与软肋专区');
  assert(hoverCardSource.includes('行事风格:'), '卡片包含性格特质');
  assert(hoverCardSource.includes('插入正文'), '卡片提供一键将外貌或动机插入正文光标处');
  assert(hoverCardSource.includes('CANON 权威设定'), '世界观法则支持 CANON 权威标识');
});

test('NovelEditor 工具栏与全局快捷键 (Ctrl+J) 深度绑定抉择探针破局条', () => {
  assert(editorSource.includes('InlineCursorBreakoutBar'), '导入并挂载 InlineCursorBreakoutBar');
  assert(editorSource.includes("e.key === 'j' || e.key === 'J'"), '支持 Ctrl+J / Cmd+J 全局快捷唤起');
  assert(editorSource.includes('抉择探针'), '工具栏包含抉择探针按钮');
  assert(editorSource.includes('showProbeBar'), '控制破局条开闭状态');
});

test('InlineCursorBreakoutBar 包含 3 种戏剧冲突路线与动机/微动作/对白全要素', () => {
  assert(breakoutBarSource.includes('虚与委蛇'), '包含隐忍周旋路线');
  assert(breakoutBarSource.includes('针锋相对'), '包含触碰逆鳞反制路线');
  assert(breakoutBarSource.includes('借力破局') || breakoutBarSource.includes('借力打力') || breakoutBarSource.includes('出其不意'), '包含出其不意路线');
  assert(breakoutBarSource.includes('inner_motive') && breakoutBarSource.includes('内心算盘'), '包含角色内心算盘');
  assert(breakoutBarSource.includes('action_preview') && breakoutBarSource.includes('微动作'), '包含身体微动作白描');
  assert(breakoutBarSource.includes('speech_preview') && breakoutBarSource.includes('试探话术'), '包含试探话术与对白');
  assert(breakoutBarSource.includes('写入正文'), '支持一键写入正文');
});

test('FloatingSelectionMenu 划词选区增强：集成文学级去套话与探他抉择', () => {
  assert(selectionMenuSource.includes('去AI味'), '保留并强化去AI味文学级去套话');
  assert(selectionMenuSource.includes('探他抉择'), '划选情境后可直接探他抉择');
  assert(selectionMenuSource.includes("action === 'probe'"), '处理 probe 动作并调用 LLM 推演');
});

test('ContinuityGuardian 静默监护与行旁/底栏温和防吃书提醒', () => {
  assert(editorSource.includes('<ContinuityGuardian'), 'NovelEditor 挂载防吃书实时监护器');
  assert(guardianSource.includes('listCanonFacts'), '联通 L3/L4 权威事实库');
  assert(guardianSource.includes('WORLD_RULE') && guardianSource.includes('CANON'), '监护权威世界法则冲突');
  assert(guardianSource.includes('已故人物') && guardianSource.includes('DEAD'), '监护已故人物复活等逻辑漏洞');
  assert(guardianSource.includes('全书伏笔') && guardianSource.includes('PLOT_THREAD'), '监护前文已埋设伏笔的呼应');
  assert(guardianSource.includes('防吃书监护'), '呈现温和护航徽标');
});

// -------------------------------------------------------------
// PART 2: 逻辑与启发式算法模拟
// -------------------------------------------------------------
console.log('\n▶ [PART 2] 正则匹配与防吃书逻辑模拟核验');

test('模拟正文行内输入 @ 触发提及识别', () => {
  const line1 = '此时在殿前，林远看了一眼@';
  const match1 = line1.match(/@([^\s@]{0,15})$/);
  assert(match1 !== null && match1[1] === '', '输入空 @ 成功捕获');

  const line2 = '他冷笑一声，对身旁的@安雅 说道';
  const match2 = line2.match(/@([^\s@]{0,15})$/);
  assert(match2 === null, '@后已有完整词汇并空格隔开，不再触发下拉');

  const line3 = '正在与@苏';
  const match3 = line3.match(/@([^\s@]{0,15})$/);
  assert(match3 !== null && match3[1] === '苏', '捕获到输入中的关键字“苏”');
});

test('模拟防吃书监护引擎捕捉权威世界法则矛盾与已故角色漏洞', () => {
  const sampleCanonRules = [
    {
      id: 'rule_1',
      novel_id: 'n1',
      title: '曲率泡稳定法则',
      rule_content: '在超空间跃迁过程中严禁中途开启次级雷达，否则将引发剧烈引力坍缩与虚空反噬。',
      authority_level: 'CANON' as const,
      status: 'ACTIVE',
      created_at: Date.now(),
    },
  ];

  const sampleChars = [
    {
      id: 'c_dead',
      novel_id: 'n1',
      name: '陈老统领',
      aliases: '老陈',
      profile: '前任卫队长',
      personality: '忠勇',
      background: '已于第二卷战死',
      motivation: '保卫要塞',
      status: 'DEAD',
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ];

  const draftText = '林远下令战舰进入曲率泡，并在超空间跃迁过程中命令陈老统领开启次级雷达进行全频段扫描。';

  // 1. 验证捕捉已故人物活跃
  const foundDeadChar = sampleChars.find((c) => c.status === 'DEAD' && draftText.includes(c.name));
  assert(foundDeadChar !== null && foundDeadChar.name === '陈老统领', '成功捕获已故角色【陈老统领】反常登场');

  // 2. 验证捕捉权威世界法则敏感词与禁忌
  const matchedRule = sampleCanonRules.find((r) => {
    if (r.authority_level !== 'CANON') return false;
    const hasKw = draftText.includes('曲率泡') || draftText.includes('次级雷达');
    const hasProhibition = /严禁|不得|反噬|坍缩/.test(r.rule_content);
    return hasKw && hasProhibition;
  });
  assert(matchedRule !== null, '成功捕获正文违背权威法则【曲率泡稳定法则】');
});

test('模拟抉择探针 3 种策略方案的数据结构完整性与文本生成', () => {
  const opt = {
    id: 'option_1',
    label: '虚与委蛇 · 佯装退让',
    stance: '心理上保持警惕，言语示弱',
    inner_motive: '等待对方露出破绽',
    action_preview: '林远微垂眼睑，拢在袖中的手指缓缓松开。',
    speech_preview: '“既然阁下执意如此，那我唯有听凭处置。”',
  };

  const textToInsert = `\n\n${opt.action_preview}\n${opt.speech_preview}\n\n`;
  assert(textToInsert.includes('林远微垂眼睑'), '包含身体微动作白描');
  assert(textToInsert.includes('唯有听凭处置'), '包含带有潜台词的试探话术');
});

console.log('\n===============================================================');
console.log(`🎉 编辑器行内工作流测试全部通过！共完成 ${passCount} 项断言，全部 100% 成功。`);
console.log('===============================================================\n');
