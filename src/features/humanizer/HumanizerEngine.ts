import { NOVEL_AI_CLICHES } from './clichéDictionary';
import type { ClicheMatch, HumanizerAuditReport } from './types';

export class HumanizerEngine {
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
   * 生成全面的人情味与 AI 味质量诊断报告
   */
  static auditText(text: string): HumanizerAuditReport {
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
      };
    }

    // 扣分机制：根据命中词的严重级别与字数密度综合加权
    let penalty = 0;
    for (const m of matches) {
      if (m.severity === 'HIGH') penalty += 12;
      else if (m.severity === 'MEDIUM') penalty += 6;
      else penalty += 3;
    }

    // 每千字基准归一化
    const densityRatio = (penalty / Math.max(wordCount, 300)) * 1000;
    const finalScore = Math.max(10, Math.round(100 - densityRatio * 0.8));

    let rating: HumanizerAuditReport['rating'] = 'EXCELLENT';
    let summary = '文学质感出众，极具现场呼吸感与人情味，未见明显 AI 痕迹。';

    if (finalScore < 60) {
      rating = 'SEVERE_AI_TONE';
      summary = `检测到较密集的典型 AI 套话（共 ${clicheCount} 处），存在脸谱化神态与说明文过渡，建议执行 Humanizer 深度重构。`;
    } else if (finalScore < 80) {
      rating = 'NEEDS_POLISH';
      summary = `存在若干处习惯性 AI 虚浮词（共 ${clicheCount} 处），建议以具象动作代替形容词与概括句。`;
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
