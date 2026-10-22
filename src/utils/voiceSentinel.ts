import type { VoiceProfile } from '../types';

export interface VoiceSentinelIssue {
  id: string;
  type: 'OUT_OF_GENRE' | 'TRANSLATIONESE' | 'AI_CLICHE' | 'RUN_ON_SENTENCE' | 'CUSTOM_RULE';
  target_text: string;
  context_snippet: string;
  offset: number;
  reason: string;
  replacement: string;
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
}

export interface VoiceSentinelReport {
  score: number; // 0 ~ 100
  issues: VoiceSentinelIssue[];
  genre: string;
  profileName: string;
}

// 常见跨流派违和网络烂梗与职场黑话词库
const OUT_OF_GENRE_DICTIONARY: Array<{
  keyword: string;
  reason: string;
  replacement: string;
  genres: string[]; // 哪些流派命中算违和（如仙侠、古言、玄幻、历史）
}> = [
  { keyword: '复盘', reason: '现代商业术语，破坏古风/玄幻叙事沉浸感', replacement: '细细推演', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: '闭环', reason: '互联网职场黑话，在小说叙述中极度出戏', replacement: '因果自洽', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: '画饼', reason: '现代职场口头语，缺乏文学质感', replacement: '空言许诺', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: 'PUA', reason: '现代缩写词，严禁直接出现在正文叙述中', replacement: '诛心蛊惑', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠', '科幻'] },
  { keyword: 'CPU', reason: '现代缩写词/谐音梗，违背文学规范', replacement: '惑乱心智', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: 'DNA动了', reason: '网络流行梗，破坏古典/严肃基调', replacement: '血脉微凝', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠', '科幻', '悬疑'] },
  { keyword: '格局打开', reason: '短视频网络烂梗，削弱严肃博弈氛围', replacement: '放眼大局', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: '这波不亏', reason: '游戏电竞直播语录，属于严重串味词', replacement: '倒也未曾吃亏', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: '打工人', reason: '现代流行标签，破坏世界观代入感', replacement: '杂役走卒', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: '恋爱脑', reason: '网络口头语，缺乏深度心理刻画', replacement: '情障入髓', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: '降维打击', reason: '科幻概念滥用于非科幻题材', replacement: '绝对压制', genres: ['仙侠', '修真', '古言', '历史', '武侠'] },
  { keyword: '纯纯', reason: '口语化网络叠词（如“纯纯找死”）', replacement: '全然', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠', '科幻'] },
  { keyword: '绝绝子', reason: '低质网络饭圈语，严重降低行文格调', replacement: '堪称绝伦', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠', '科幻', '悬疑'] },
  { keyword: '秒了', reason: '游戏用语，缺乏动作交互细节描写', replacement: '瞬息诛灭', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: '破防', reason: '网络流行词，建议用具体生理动作代替', replacement: '心神失守', genres: ['仙侠', '修真', '玄幻', '古言', '历史', '武侠'] },
  { keyword: '甚至于', reason: '口语赘词，文学写作中显得拖沓', replacement: '甚至', genres: ['ALL'] },
  { keyword: '不得不说', reason: 'AI 叙述典型机械套话，跳出故事指手画脚', replacement: '', genres: ['ALL'] },
  { keyword: '殊不知', reason: '全知视角滥用套话，破坏镜头沉浸', replacement: '', genres: ['ALL'] },
];

// 常见欧化翻译腔词组
const TRANSLATIONESE_DICTIONARY: Array<{
  keyword: string;
  reason: string;
  replacement: string;
}> = [
  { keyword: '在某种程度上', reason: '欧化从句翻译腔，中文写作宜精炼', replacement: '几分 / 略微' },
  { keyword: '作为一个', reason: '翻译腔定语前置，可精炼表达', replacement: '身为' },
  { keyword: '是关于...的', reason: '机械结构，削弱汉语动词力量', replacement: '事涉 / 关乎' },
  { keyword: '无时不刻不', reason: '常见语法病句误用', replacement: '无时无刻不在' },
];

export class VoiceSentinelEngine {
  /**
   * 审查文本的文风一致性与防串味健康度
   */
  static auditText(
    text: string,
    genre: string = '仙侠',
    activeVoiceProfile?: VoiceProfile | null
  ): VoiceSentinelReport {
    if (!text || text.trim().length === 0) {
      return { score: 100, issues: [], genre, profileName: activeVoiceProfile?.name || '默认' };
    }

    const issues: VoiceSentinelIssue[] = [];

    // 1. 扫描网络流行烂梗与违和黑话
    for (const rule of OUT_OF_GENRE_DICTIONARY) {
      const matchGenre = rule.genres.includes('ALL') || rule.genres.some((g) => genre.includes(g));
      if (!matchGenre) continue;

      let pos = text.indexOf(rule.keyword);
      while (pos !== -1) {
        const start = Math.max(0, pos - 20);
        const end = Math.min(text.length, pos + rule.keyword.length + 20);
        const snippet = text.slice(start, end);

        issues.push({
          id: `out_genre_${pos}_${rule.keyword}`,
          type: 'OUT_OF_GENRE',
          target_text: rule.keyword,
          context_snippet: snippet,
          offset: pos,
          reason: rule.reason,
          replacement: rule.replacement,
          severity: 'WARNING',
        });

        pos = text.indexOf(rule.keyword, pos + rule.keyword.length);
      }
    }

    // 2. 扫描欧化翻译腔
    for (const trans of TRANSLATIONESE_DICTIONARY) {
      let pos = text.indexOf(trans.keyword);
      while (pos !== -1) {
        const start = Math.max(0, pos - 20);
        const end = Math.min(text.length, pos + trans.keyword.length + 20);
        const snippet = text.slice(start, end);

        issues.push({
          id: `trans_${pos}_${trans.keyword}`,
          type: 'TRANSLATIONESE',
          target_text: trans.keyword,
          context_snippet: snippet,
          offset: pos,
          reason: trans.reason,
          replacement: trans.replacement,
          severity: 'SUGGESTION',
        });

        pos = text.indexOf(trans.keyword, pos + trans.keyword.length);
      }
    }

    // 3. 扫描自定义文风法则（若有）
    if (activeVoiceProfile?.custom_rules_json) {
      try {
        const customRules: string[] = JSON.parse(activeVoiceProfile.custom_rules_json);
        if (Array.isArray(customRules)) {
          for (const rawRule of customRules) {
            // 支持 "禁限词: 替换词" 格式
            const parts = rawRule.split(/[:：]/);
            if (parts.length >= 2) {
              const bannedWord = parts[0].trim();
              const suggested = parts[1].trim();
              if (bannedWord) {
                let pos = text.indexOf(bannedWord);
                while (pos !== -1) {
                  const start = Math.max(0, pos - 20);
                  const end = Math.min(text.length, pos + bannedWord.length + 20);
                  issues.push({
                    id: `custom_${pos}_${bannedWord}`,
                    type: 'CUSTOM_RULE',
                    target_text: bannedWord,
                    context_snippet: text.slice(start, end),
                    offset: pos,
                    reason: `违背活跃文风「${activeVoiceProfile.name}」设定法则`,
                    replacement: suggested,
                    severity: 'CRITICAL',
                  });
                  pos = text.indexOf(bannedWord, pos + bannedWord.length);
                }
              }
            }
          }
        }
      } catch (_) {}
    }

    // 4. 按 offset 排序
    issues.sort((a, b) => a.offset - b.offset);

    // 5. 扣分计算健康分 (初始 100 分，每次 WARNING 扣 5 分，CRITICAL 扣 8 分，SUGGESTION 扣 2 分)
    let penalty = 0;
    for (const issue of issues) {
      if (issue.severity === 'CRITICAL') penalty += 8;
      else if (issue.severity === 'WARNING') penalty += 5;
      else penalty += 2;
    }
    const score = Math.max(0, 100 - penalty);

    return {
      score,
      issues,
      genre,
      profileName: activeVoiceProfile?.name || '默认文风',
    };
  }
}
