import { CharacterActorConfig, DialogueRoundRecord } from '@/types';

export interface PersonaAuditResult {
  hasDrift: boolean;
  warning?: string;
  severity: 'none' | 'info' | 'warning' | 'critical';
  driftType?: 'MODERN_JARGON' | 'CUSTOMER_SERVICE' | 'VERBOSE_DRIFT' | 'PREMATURE_SECRET';
}

/**
 * 现代黑话与 AI 违和词汇模式库
 */
const MODERN_JARGON_PATTERN =
  /(底层逻辑|信息差|认知闭环|降维打击|赛道|复盘|维度碾压|情绪价值|KPI|转化率|护城河|赋能|抓手|矩阵|沉淀方法论|打通链路)/;

/**
 * 客服腔与弱势客套短语
 */
const CUSTOMER_SERVICE_PATTERN =
  /(请问您|实在抱歉|劳烦阁下|如果方便的话|在下受教了|能否冒昧|让您久等了|不瞒您说|其实我是想|十分感谢)/;

/**
 * 人设崩坏与 OOC 智能审计引擎 (Persona Drift / OOC Sentinel)
 * 检查子代理生成的台词、微动作是否偏离了该角色的性格基准、私密动机或出现了 AI 腔调
 */
export function auditPersonaDrift(
  actor: CharacterActorConfig,
  round: DialogueRoundRecord,
  _allRounds?: DialogueRoundRecord[]
): PersonaAuditResult {
  // 旁白或突发事件不计入角色人设偏离
  if (round.is_narrator_event) {
    return { hasDrift: false, severity: 'none' };
  }

  const combinedText = `${round.character_action} ${round.speech}`;
  const speechText = round.speech || '';

  // 1. 现代商业 / AI 黑话严重污染检测 (Critical)
  const jargonMatch = combinedText.match(MODERN_JARGON_PATTERN);
  if (jargonMatch) {
    return {
      hasDrift: true,
      severity: 'critical',
      driftType: 'MODERN_JARGON',
      warning: `现代词汇出戏：台词中出现了“${jargonMatch[0]}”等现代商业/互联网术语，严重破坏小说古典与沉浸感。`,
    };
  }

  // 2. 客服腔与过度客套软化检测 (Warning)
  // 如果角色并非礼貌温顺人设（例如是冷酷、敌对、傲慢或处于生死审判局面）
  const actorMood = `${actor.private_motivation} ${actor.voice_quirks || ''}`.toLowerCase();
  const isHostileOrCold = /冷|傲|阴|狂|暴|敌|杀|恨|戒备|试探|逼迫|防备|死敌/.test(actorMood);
  const csMatch = speechText.match(CUSTOMER_SERVICE_PATTERN);
  if (isHostileOrCold && csMatch) {
    return {
      hasDrift: true,
      severity: 'warning',
      driftType: 'CUSTOMER_SERVICE',
      warning: `人设偏离警告：角色处于对峙戒备情境，但发言过于温和客套（包含“${csMatch[0]}”），缺少压迫感与警惕性。`,
    };
  }

  // 3. 惜字如金角色长篇大论 (Verbose Drift)
  const isTerseVoice = /惜字如金|少言|话留三分|言简意赅|短促|字字如金|沉默寡言/.test(actor.voice_quirks || '');
  if (isTerseVoice && speechText.length > 80) {
    return {
      hasDrift: true,
      severity: 'warning',
      driftType: 'VERBOSE_DRIFT',
      warning: `语言风格偏离：设定要求【惜字如金/少言寡语】，当前台词单句过长（${speechText.length}字），建议精炼并增加留白。`,
    };
  }

  // 4. 绝密软肋交锋初期早泄 (Premature Secret Leakage)
  if (actor.private_secret && actor.private_secret.length >= 4 && round.round_index <= 3) {
    // 检查是否有 >= 4 字符的秘密关键片段直接泄露在台词中
    const cleanSecret = actor.private_secret.replace(/[，。、！？；：\s]/g, '');
    let leakedSnippet = '';
    for (let len = Math.min(8, cleanSecret.length); len >= 4; len--) {
      for (let i = 0; i <= cleanSecret.length - len; i++) {
        const sub = cleanSecret.slice(i, i + len);
        if (
          !/^(就在我|其实是|但是我|如果是|没有的|只是在|其实我)/.test(sub) &&
          speechText.includes(sub)
        ) {
          leakedSnippet = sub;
          break;
        }
      }
      if (leakedSnippet) break;
    }

    if (leakedSnippet) {
      return {
        hasDrift: true,
        severity: 'warning',
        driftType: 'PREMATURE_SECRET',
        warning: `底牌过早泄露：交锋初期即脱口而出秘密核心片段“${leakedSnippet}”，削弱了戏剧张力与攻防推拉。`,
      };
    }
  }

  return { hasDrift: false, severity: 'none' };
}

/**
 * 生成按人设强纠偏重新生成提示词 (Prompt Reinforcement)
 */
export function generatePersonaCorrectionPrompt(
  actor: CharacterActorConfig,
  warningText: string
): string {
  return `【强制人设纠偏指示】
上一轮生成的台词被诊断出人设偏离问题：
“${warningText}”

请立即纠偏：
1. 恪守语言风格：必须严格体现【${actor.voice_quirks || '惜字如金，冷峻克制'}】的语言节奏与声调！
2. 坚守当场动机：牢记你的核心利益是【${actor.private_motivation}】，绝不轻易客套或妥协！
3. 守护隐藏秘密：隐藏底牌【${actor.private_secret}】绝不可轻易说出！
请以最符合你本色的方式重新给出一轮台词与微表情！`;
}

/**
 * 智能提炼潜台词弦外之音 (Subtext Distiller)
 * 若模型输出未带标准 <subtext>，从私密内心算盘中提炼一针见血的潜台词
 */
export function distillSubtext(round: DialogueRoundRecord): string {
  if (round.subtext && round.subtext.trim()) {
    return round.subtext.trim();
  }
  if (!round.inner_thought || !round.inner_thought.trim()) {
    return '（话里有话，暗藏试探）';
  }
  const thought = round.inner_thought.trim();
  // 提取第一句或核心算盘
  const match = thought.match(/(?:想|要|打算|意图|逼|试探|防备|不能让)([^。！？；\n]+)/);
  if (match) {
    return `（潜台词：${match[0].slice(0, 36)}...）`;
  }
  const firstSentence = thought.split(/[。！？\n]/)[0];
  return `（潜台词：${firstSentence.slice(0, 30)}）`;
}
