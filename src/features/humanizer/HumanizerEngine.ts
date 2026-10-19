import { NOVEL_AI_CLICHES } from './clichéDictionary';
import type {
  ClicheMatch,
  HumanizerAuditReport,
  HumanizerGenre,
  HumanSignalDimension,
  HumanSignalReport,
  RedCardMatch,
} from './types';

interface SentenceItem {
  text: string;
  len: number;
  isDialogue: boolean;
  startIndex: number;
  endIndex: number;
}

interface RedRuleDefinition {
  key: string;
  label: string;
  pattern: RegExp;
  hint: string;
  genres: HumanizerGenre[];
}

const RED_RULES: RedRuleDefinition[] = [
  {
    key: 'notA-butB',
    label: '「不是A，而是B」假靶子句式',
    pattern: /不是[^。！？，]{1,18}[，,]?\s*(?:不是[^。！？，]{1,18}[，,]?\s*)*而是/,
    hint: '三毒句式之首：假靶子/同义替换/硬凑。建议删前半句直接写B，或改「不仅是A更是B」',
    genres: ['fiction', 'article'],
  },
  {
    key: 'elegant-parallel',
    label: '同构工整排比三连',
    pattern: /有的[^。；]{1,20}有的[^。；]{1,20}有的|一边[^。；]{1,20}一边[^。；]{1,20}一边/,
    hint: '优雅工整排比是AI检测器敏感特征（实测判定极高）。建议保留最强一条，其余改写成参差散句',
    genres: ['fiction', 'article'],
  },
  {
    key: 'eye-flash',
    label: '「眼中闪过一丝」刻板神态',
    pattern: /(眼中|眼里|眼底|眸中|眸子)里?闪过一?[丝抹缕]?/,
    hint: '三字鉴定词级AI指纹。建议改成具象动作：他垂下眼 / 他笑了一下，没到眼底',
    genres: ['fiction'],
  },
  {
    key: 'mouth-curve',
    label: '「嘴角勾起一抹」脸谱化肌肉抽搐',
    pattern: /嘴角(勾起|微微?上扬|掠过)/,
    hint: '典型网文脸谱化套话。建议白描：他笑了，没到眼底',
    genres: ['fiction'],
  },
  {
    key: 'heart-surge',
    label: '「心中涌起一股」抽象情绪外化',
    pattern: /(心中|心头|心底)(涌起|泛起|掠过|一震|一动|一紧|暗道)/,
    hint: '情绪外化套话。建议改用身体反应：手在抖 / 攥紧拳头 / 喉咙发紧',
    genres: ['fiction'],
  },
  {
    key: 'dai-zhe',
    label: '「，带着…」万能状语尾巴',
    pattern: /，带着(一[丝抹股种]|某种|几分)/,
    hint: '万能状语导致句式僵化。建议拆成短句或换为具体肢体动作',
    genres: ['fiction'],
  },
  {
    key: 'shen-xi',
    label: '「深吸一口气」公式化呼吸',
    pattern: /深吸(了一口|一口)气?/,
    hint: '一级禁用动作。建议替换为与环境具体物象的交互动作',
    genres: ['fiction'],
  },
  {
    key: 'sh-fang-fu',
    label: '「仿佛/犹如…一般」廉价比喻',
    pattern: /(仿佛|犹如|宛若|如同)[^。！？]{1,24}(一般|般|似的)/,
    hint: '没有生活逻辑的虚浮比喻，建议删掉比喻改白描',
    genres: ['fiction'],
  },
  {
    key: 'bu-rong-zhi-yi',
    label: '「不容置疑/不易察觉」判定词',
    pattern: /不容置疑|不容置喙|不易察觉/,
    hint: '直接上帝视角判定。建议直接写出声音沙哑、语调放沉等动作特征',
    genres: ['fiction'],
  },
  {
    key: 'mech-connect',
    label: '「首先/其次/综上所述」说明文过渡',
    pattern: /(首先|其次|再者)[，、]|综上所述|总而言之|值得一提的是|值得注意的是|不难发现|由此可见|不可否认的是|毋庸置疑/,
    hint: '典型报幕词。小说中禁止出现，请删掉直接描写事实',
    genres: ['fiction', 'article'],
  },
  {
    key: 'xuan-hua',
    label: '「影响深远/意义重大」升华套话',
    pattern: /(影响深远|意义重大|不言而喻|这引发了广泛|具有十分重要的意义|在当今[^。]{0,10}的时代|随着[^。]{0,12}的不断发展)/,
    hint: '虚假宣告：只宣布重要性没给内容。删掉或换具体事实',
    genres: ['article'],
  },
  {
    key: 'fu-yan',
    label: '「赋能/闭环/深入探讨」公文行话',
    pattern: /(通过[^。]{1,12}来?实现|赋能|抓手|闭环|助力[^。]{0,8}发展|深入探讨)/,
    hint: '黑话句式，破坏文学呼吸感。建议换成具体人做的事',
    genres: ['fiction', 'article'],
  },
  {
    key: 'ni-shuo',
    label: '「你以为A，实际上B」老师说教腔',
    pattern: /你以为[^。！？]{1,30}[，,]?\s*实际(上|是)/,
    hint: '说教腔严重。建议删前半句直接说事实',
    genres: ['fiction', 'article'],
  },
  {
    key: 'zi-wen-zi-da',
    label: '自问自答设问套路',
    pattern: /(这叫什么|说明什么|怎么办到的|看明白了吗|看到没有)[？?]/,
    hint: '自问自答破坏沉浸感。建议删掉提问直接陈述情节',
    genres: ['fiction', 'article'],
  },
];

// 实体具体性特征匹配规则
const SPECIFIC_PATTERNS = [
  /\d+(个|位|名|人|次|章|字|天|日|岁|米|斤|两|块|成|倍|两|丈|尺)/,
  /[“「][^”」]{1,8}[”」]/,
  /第[一二三四五六七八九十百千\d]+[章节回卷峰门阶重步层]/,
  /[A-Z][a-z]+/,
  /(19|20)\d{2}年?/,
  /[一二两三四五六七八九十]\s*(个|位|处|柄|面|枚|道|轮|只|头|匹|丈|尺|两)/,
];

// 对话层疑虑词 (在正文模式下仅计入台词层)
const DIALOG_DOUBT_PATTERNS = [
  /说实话/,
  /拿不准/,
  /谁知道呢/,
  /我也没完全想明白/,
  /吃不准/,
  /谁说得准/,
  /保不齐/,
  /难说/,
  /指不定/,
];

// 对话层口语活人词 (在正文模式下仅计入台词层)
const DIALOG_VOICE_PATTERNS = [
  /啥/,
  /咋/,
  /你别说/,
  /怎么说呢/,
  /不是我说/,
  /得了吧/,
  /可不是嘛/,
  /哪能啊/,
  /行了行了/,
  /成吧/,
  /拉倒吧/,
  /怪事/,
];

// 对话层闲笔离题词 (在正文模式下仅计入台词层)
const DIALOG_DIGRESS_PATTERNS = [
  /说起来/,
  /扯远了/,
  /题外话/,
  /话说回来/,
  /顺带一提/,
  /先不论这个/,
  /闲话少叙/,
];

const SIGNAL_WEIGHTS: Record<
  HumanizerGenre,
  { key: string; label: string; w: number; threshold: number; hint: string }[]
> = {
  fiction: [
    { key: 'specificity', label: '具体性', w: 0.3, threshold: 6, hint: '塞入具体人名/数字/年份/地名/量词，千字 6 处满分（降困惑度最狠的一招）' },
    { key: 'burstiness', label: '爆发度', w: 0.22, threshold: 0.6, hint: '叙述句长落差拉大：偶尔短句碎片、偶尔一口气长句（CV≥1.0 满分，0.6 及格）' },
    { key: 'doubt', label: '疑虑', w: 0.13, threshold: 3, hint: '角色台词里适度加入「说实话/拿不准/谁知道呢」（仅对话层）' },
    { key: 'voice', label: '口语声', w: 0.13, threshold: 3, hint: '台词要像活人说话：啥/咋/你别说/得了吧（仅对话层）' },
    { key: 'digress', label: '离题闲笔', w: 0.12, threshold: 2, hint: '台词允许跑题插话，叙述层可适度融入一两句真实生活闲笔' },
    { key: 'imperfect', label: '不完美度', w: 0.1, threshold: 2, hint: '碎片句与长句自然交织，避免每段结构过分工整对仗' },
  ],
  article: [
    { key: 'specificity', label: '具体性', w: 0.3, threshold: 6, hint: '补充翔实数字、具体事实、案例出处' },
    { key: 'burstiness', label: '爆发度', w: 0.22, threshold: 0.6, hint: '拉大段落与句长落差，避免均质排布' },
    { key: 'doubt', label: '疑虑', w: 0.13, threshold: 3, hint: '作者声音允许保留真实推敲：“坦白讲/我自己也没完全想明白”' },
    { key: 'voice', label: '口语声', w: 0.13, threshold: 2, hint: '作者自然语态：“你想想看/怎么说呢”' },
    { key: 'digress', label: '离题闲笔', w: 0.12, threshold: 2, hint: '允许插一句不相干的真实生活小事再拉回论述' },
    { key: 'imperfect', label: '不完美度', w: 0.1, threshold: 2, hint: '允许观点在推敲中演进，破除八股文架子' },
  ],
};

export class HumanizerEngine {
  /**
   * 拆分文本为句子单元，并精准分离叙述句与对话句
   */
  static splitSentences(text: string): SentenceItem[] {
    if (!text) return [];

    const items: SentenceItem[] = [];
    // 匹配常规断句标点，包括引号内容
    const quoteRegex = /([“「『][^”」』]*[”」』])/g;
    let match: RegExpExecArray | null;

    // 先提取对话片段位置
    const dialogueSpans: { start: number; end: number; text: string }[] = [];
    while ((match = quoteRegex.exec(text)) !== null) {
      dialogueSpans.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
    }

    // 简单高效的句子切分
    const rawSentences = text.split(/([。！？!?\n]+)/);
    let currentOffset = 0;

    for (let i = 0; i < rawSentences.length; i += 2) {
      const sentText = rawSentences[i] || '';
      const punct = rawSentences[i + 1] || '';
      const fullSent = sentText + punct;
      const trimmed = fullSent.trim();
      const lengthWithoutSpace = trimmed.replace(/\s+/g, '').length;

      if (lengthWithoutSpace > 0) {
        const startIndex = text.indexOf(fullSent, currentOffset);
        const actualStart = startIndex !== -1 ? startIndex : currentOffset;
        const actualEnd = actualStart + fullSent.length;

        // 判断是否属于对话：若包含在任一引号区间内或包含引号
        const isDialogue =
          /[“「『]/.test(fullSent) ||
          dialogueSpans.some(
            (span) =>
              (actualStart >= span.start && actualStart < span.end) ||
              (actualEnd > span.start && actualEnd <= span.end)
          );

        items.push({
          text: trimmed,
          len: lengthWithoutSpace,
          isDialogue,
          startIndex: actualStart,
          endIndex: actualEnd,
        });

        currentOffset = actualEnd;
      }
    }

    return items;
  }

  /**
   * 计算一组数值的变异系数 (Coefficient of Variation = 标准差 / 均值)
   */
  static calculateCv(numbers: number[]): number {
    if (numbers.length < 2) return 0;
    const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
    if (mean <= 0) return 0;
    const variance =
      numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance) / mean;
  }

  /**
   * 扫描文本中的红牌毒句式 (出现即修，最高优先级)
   */
  static detectRedCards(text: string, genre: HumanizerGenre = 'fiction'): RedCardMatch[] {
    if (!text || typeof text !== 'string') return [];

    const matches: RedCardMatch[] = [];

    for (const rule of RED_RULES) {
      if (!rule.genres.includes(genre)) continue;

      const regex = new RegExp(rule.pattern.source, 'gi');
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        matches.push({
          key: rule.key,
          label: rule.label,
          sample: m[0].slice(0, 50),
          hint: rule.hint,
          startIndex: m.index,
          endIndex: m.index + m[0].length,
        });
      }
    }

    return matches.sort((a, b) => (a.startIndex || 0) - (b.startIndex || 0));
  }

  /**
   * 独立运行的六维人类信号量化评估引擎 (0-Token 本地快速评估)
   */
  static auditHumanSignals(text: string, genre: HumanizerGenre = 'fiction'): HumanSignalReport {
    const raw = (text || '').trim();
    const chars = raw.replace(/\s+/g, '').length;

    if (chars === 0) {
      return {
        score: 100,
        genre,
        burstinessCv: 0,
        dialogueRatio: 0,
        dimensions: SIGNAL_WEIGHTS[genre].map((w) => ({
          key: w.key,
          label: w.label,
          score: 1,
          weight: w.w,
          threshold: w.threshold,
          hint: w.hint,
        })),
        redCards: [],
        warnings: [],
      };
    }

    const sentences = this.splitSentences(raw);
    const narrativeSentences = sentences.filter((s) => !s.isDialogue);
    const dialogueSentences = sentences.filter((s) => s.isDialogue);

    const dialogueChars = dialogueSentences.reduce((acc, s) => acc + s.len, 0);
    const dialogueRatio = chars > 0 ? dialogueChars / chars : 0;

    // 爆发度：小说模式下只统计叙述句长，避免对白行过短造成虚假高落差
    const burstPool = (genre === 'fiction' && narrativeSentences.length >= 3 ? narrativeSentences : sentences)
      .map((s) => s.len)
      .filter((n) => n > 0);
    const burstCv = this.calculateCv(burstPool);

    // 具体性：统计数字、量词、年份、书名号等实体频次，归一化到千字基准
    let specificHits = 0;
    for (const pat of SPECIFIC_PATTERNS) {
      const match = raw.match(new RegExp(pat.source, 'g'));
      if (match) specificHits += match.length;
    }
    const targetSpecHits = Math.max(1, (chars / 1000) * 6);
    const specScore = Math.min(1, specificHits / targetSpecHits);

    // 对话专有信号文本池
    const dialogueText = (genre === 'fiction' ? dialogueSentences : sentences).map((s) => s.text).join('\n');

    let doubtHits = 0;
    for (const pat of DIALOG_DOUBT_PATTERNS) {
      const m = dialogueText.match(new RegExp(pat.source, 'g'));
      if (m) doubtHits += m.length;
    }
    const doubtScore = Math.min(1, doubtHits / 3);

    let voiceHits = 0;
    for (const pat of DIALOG_VOICE_PATTERNS) {
      const m = dialogueText.match(new RegExp(pat.source, 'g'));
      if (m) voiceHits += m.length;
    }
    const voiceScore = Math.min(1, voiceHits / (genre === 'fiction' ? 3 : 2));

    let digressHits = 0;
    for (const pat of DIALOG_DIGRESS_PATTERNS) {
      const m = dialogueText.match(new RegExp(pat.source, 'g'));
      if (m) digressHits += m.length;
    }
    const digressScore = Math.min(1, digressHits / 2);

    // 不完美度：叙述中碎片短句 (<=6字) 与一口气长句 (>=48字) 的混合度
    const pool = genre === 'fiction' ? narrativeSentences : sentences;
    const frags = pool.filter((s) => s.len > 0 && s.len <= 6).length;
    const longs = pool.filter((s) => s.len >= 48).length;
    const imperfScore = Math.min(1, ((frags + longs) / Math.max(1, pool.length)) * 1.5);

    const subScores: Record<string, number> = {
      specificity: specScore,
      burstiness: Math.min(1, burstCv / 1.0),
      doubt: doubtScore,
      voice: voiceScore,
      digress: digressScore,
      imperfect: imperfScore,
    };

    const redCards = this.detectRedCards(raw, genre);

    const dimensions: HumanSignalDimension[] = SIGNAL_WEIGHTS[genre].map((w) => ({
      key: w.key,
      label: w.label,
      score: Math.round((subScores[w.key] ?? 0) * 100) / 100,
      weight: w.w,
      threshold: w.threshold,
      hint: w.hint,
    }));

    // 计算六维加权得分 (0 ~ 100)
    let compositeScore = Math.round(
      dimensions.reduce((acc, dim) => acc + dim.score * dim.weight, 0) * 100
    );

    // 扣减红牌罚分 (每张红牌扣 10 分)
    compositeScore = Math.max(5, compositeScore - redCards.length * 10);

    const warnings: string[] = [];
    for (const d of dimensions) {
      if (d.score < 0.4) {
        warnings.push(`【${d.label}】偏弱：${d.hint}`);
      }
    }

    if (genre === 'fiction' && dialogueRatio < 0.08 && chars > 800) {
      warnings.push('对话占比过低：长篇叙述层撑满全篇，爆发度与活人感偏弱，建议适当补充人物对手戏与现场潜台词');
    }

    for (const rc of redCards) {
      warnings.push(`【红牌拦截】${rc.label}：${rc.sample} → ${rc.hint}`);
    }

    return {
      score: compositeScore,
      genre,
      burstinessCv: Math.round(burstCv * 100) / 100,
      dialogueRatio: Math.round(dialogueRatio * 100) / 100,
      dimensions,
      redCards,
      warnings,
    };
  }

  /**
   * 扫描文本中的 AI 套话、肌肉抽搐与说明文腔调
   */
  static detectClichés(text: string): ClicheMatch[] {
    if (!text || typeof text !== 'string') return [];

    const matches: ClicheMatch[] = [];

    for (const item of NOVEL_AI_CLICHES) {
      let startIndex = 0;
      while ((startIndex = text.indexOf(item.phrase, startIndex)) !== -1) {
        matches.push({
          phrase: item.phrase,
          category: item.category,
          severity: item.severity,
          startIndex,
          endIndex: startIndex + item.phrase.length,
          reason: item.reason,
          suggestion: item.suggestion,
        });
        startIndex += item.phrase.length;
      }
    }

    // 按在文本中出现的先后顺序排序
    return matches.sort((a, b) => a.startIndex - b.startIndex);
  }

  /**
   * 生成全面的人情味与 AI 味质量诊断报告 (全面融合红牌与六维人类信号)
   */
  static auditText(text: string, genre: HumanizerGenre = 'fiction'): HumanizerAuditReport {
    const trimmed = text ? text.trim() : '';
    const wordCount = trimmed.replace(/\s+/g, '').length;
    const matches = this.detectClichés(trimmed);
    const clicheCount = matches.length;

    if (wordCount === 0) {
      return {
        score: 100,
        rating: 'EXCELLENT',
        wordCount: 0,
        clicheCount: 0,
        matches: [],
        summary: '当前暂无文本内容',
        signals: this.auditHumanSignals('', genre),
      };
    }

    const signals = this.auditHumanSignals(trimmed, genre);

    // 套话扣分机制：根据命中词的严重级别与字数密度综合加权
    let penalty = 0;
    for (const m of matches) {
      if (m.severity === 'HIGH') penalty += 12;
      else if (m.severity === 'MEDIUM') penalty += 6;
      else penalty += 3;
    }

    // 每千字基准归一化
    const densityRatio = (penalty / Math.max(wordCount, 300)) * 1000;
    const baseClicheScore = Math.max(10, Math.round(100 - densityRatio * 0.8));

    // 最终得分：结合传统套话扣分与六维人类信号量化分
    // 如果套话扣分极低，以套话惩罚为上界；如果套话为0，则取决于白描与现场感
    let finalScore = baseClicheScore;
    if (clicheCount > 0) {
      finalScore = Math.min(baseClicheScore, Math.round(baseClicheScore * 0.7 + signals.score * 0.3));
    } else {
      // 纯白描文本：保持极高分数基准
      finalScore = Math.max(95, Math.min(100, Math.round(signals.score * 0.2 + 80)));
    }

    let rating: HumanizerAuditReport['rating'] = 'EXCELLENT';
    let summary = '文学质感出众，极具现场呼吸感与人情味，未见明显 AI 痕迹。';

    if (finalScore < 60) {
      rating = 'SEVERE_AI_TONE';
      summary = `检测到较密集的典型 AI 套话与红牌句式（共 ${clicheCount + signals.redCards.length} 处），存在脸谱化神态与说明文过渡，建议执行 Humanizer 深度重构。`;
    } else if (finalScore < 80) {
      rating = 'NEEDS_POLISH';
      summary = `存在若干处习惯性 AI 虚浮词（共 ${clicheCount} 处），句长变异系数或具体性偏低，建议以具象动作代替形容词与概括句。`;
    } else if (finalScore < 95) {
      rating = 'GOOD';
      summary = '行文自然顺畅，偶有极轻微的惯性词汇，整体代入感良好。';
    }

    return {
      score: finalScore,
      rating,
      wordCount,
      clicheCount,
      matches,
      summary,
      signals,
    };
  }

  /**
   * 装配带有 Humanizer 严苛约束的专业重写 Prompt
   */
  static buildPolishingPrompt(
    rawText: string,
    genre: string = '通用小说',
    instruction: string = '祛除 AI 腔调，增强身体微动作与对白潜台词'
  ): string {
    return `你是一位顶级中文小说文学精修大师 (Humanizer Polisher)。

【当前小说题材】：${genre}
【精修指令】：${instruction}

【核心 Humanizer 戒律】：
1. 绝对严禁使用任何机械套话（如“嘴角勾起弧度”、“眼中闪过”、“仿佛/宛如”滥用、“深吸一口气”、“殊不知”、“不得不承认”、“空气凝固”）；
2. 践行“Show, Don't Tell”，将抽象情绪转化为五感细节与真实肌肉生理反应（喉头干痛、指甲嵌入掌心、后背寒毛直立、耳畔风声）；
3. 彻底删除任何“首先、与此同时、不仅如此、换言之、总的来说”等说明文议论过渡词；
4. 对话要有潜台词、时代生活质感与中式人情世故留白；
5. 直接输出润色后的高质量小说纯正文，绝不要带任何“好的”、“这是修改后”等解释寒暄。

【待精修的原始文本】：
${rawText}

请直接输出精修重塑后的纯正文：`;
  }
}
