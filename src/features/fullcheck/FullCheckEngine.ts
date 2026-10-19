import { Chapter, Character, WorldRule, PlotThread } from '@/types';
import { DEFAULT_CENSOR_DICT } from '@/features/typesetter/typesetterEngine';
import {
  FullCheckReport,
  FullCheckIssue,
  HealthRating,
} from './types';

export class FullCheckEngine {
  /**
   * 清除正文 HTML 标签
   */
  static stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * 执行全书一致性与因果健康度体检巡检
   */
  static runCheck(params: {
    chapters: Chapter[];
    characters: Character[];
    worldRules?: WorldRule[];
    plotThreads?: PlotThread[];
  }): FullCheckReport {
    const { chapters = [], characters = [], worldRules = [], plotThreads = [] } = params;

    const issues: FullCheckIssue[] = [];

    // 预处理章节纯文本
    const preparedChapters = chapters.map((ch, idx) => ({
      chapter: ch,
      index: idx,
      text: this.stripHtml(ch.content),
      wordCount: this.stripHtml(ch.content).length,
    }));

    // 1. 角色生命体征与出场因果巡检 (CHARACTER_LIFE)
    characters.forEach((char) => {
      const charName = char.name?.trim();
      if (!charName) return;

      const isDead = char.status === '死亡';
      const isRetreated = char.status === '闭关';
      const isLeft = char.status === '离场';

      // 统计角色出场章节
      const appearances: number[] = [];

      preparedChapters.forEach(({ chapter, index, text }) => {
        if (!text.includes(charName)) return;
        appearances.push(index);

        // 如果是已确认死亡的角色，检测是否在正文中以活人形式发言或动作
        if (isDead) {
          // 查找包含该名字的句子
          const sentences = text.split(/([。！？\n]+)/);
          for (let s of sentences) {
            if (s.includes(charName)) {
              // 过滤掉怀念、墓碑、回忆等被动态
              const isPastMemory = /想起|回忆|墓|遗物|死于|祭奠|魂魄|往昔|已故/.test(s);
              const isActiveAction = /说道|冷笑|拔剑|站起身|迈步|出手|喝道|皱眉|眼中|手中/.test(s);

              if (isActiveAction && !isPastMemory) {
                issues.push({
                  id: `char-dead-${char.id}-${chapter.id}`,
                  dimension: 'CHARACTER_LIFE',
                  severity: 'CRITICAL',
                  title: `已故角色【${charName}】疑似诈尸登场`,
                  description: `角色【${charName}】当前生命状态为「死亡」，但在《${chapter.title}》中检出主动言行动作，存在严重死人出场与因果崩坏风险！`,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                  excerpt: s.trim().slice(0, 80),
                  suggestion: `若角色已牺牲，请修改为回忆视角，或使用分身/执念进行因果解释；若确已复活，请在角色看板中更新其生命体征。`,
                  targetEntity: charName,
                });
                break;
              }
            }
          }
        }

        // 闭关或离场冲突
        if ((isRetreated || isLeft) && index === preparedChapters.length - 1) {
          // 在最新章节中出现
          issues.push({
            id: `char-status-${char.id}-${chapter.id}`,
            dimension: 'CHARACTER_LIFE',
            severity: 'WARNING',
            title: `角色【${charName}】处于「${char.status}」状态`,
            description: `角色【${charName}】被标记为「${char.status}」，但在最新章节《${chapter.title}》中被提及，请核对是否已正式出关/归队。`,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            suggestion: `如剧情已推动其现身，请在角色面板流转状态为「健康」或「受伤」。`,
            targetEntity: charName,
          });
        }
      });

      // 检查核心角色掉线 (在前期频繁出场，但近期长期未出现)
      if (
        appearances.length >= 2 &&
        preparedChapters.length >= 15 &&
        appearances[appearances.length - 1] < preparedChapters.length - 12
      ) {
        const lastAppearedCh = preparedChapters[appearances[appearances.length - 1]]?.chapter;
        issues.push({
          id: `char-absence-${char.id}`,
          dimension: 'CHARACTER_LIFE',
          severity: 'INFO',
          title: `角色【${charName}】长期未登场`,
          description: `角色【${charName}】上次出场是在《${lastAppearedCh?.title || '早期章节'}》，已连续超过 12 章未露面，读者可能产生人物遗忘。`,
          suggestion: `建议在后续分卷或场景细纲中安排其插叙其动向或收束其支线。`,
          targetEntity: charName,
        });
      }
    });

    // 2. 伏笔悬念生命周期巡检 (FORESHADOW_ORPHAN)
    plotThreads.forEach((thread) => {
      if (thread.status === 'PLANTED') {
        let isOrphan = false;
        if (thread.introduced_chapter_id) {
          const introIdx = preparedChapters.findIndex((c) => c.chapter.id === thread.introduced_chapter_id);
          if (introIdx !== -1) {
            isOrphan = preparedChapters.length - 1 - introIdx >= 10;
          } else {
            isOrphan = preparedChapters.length >= 10;
          }
        } else {
          isOrphan = preparedChapters.length >= 10;
        }

        if (isOrphan) {
          issues.push({
            id: `thread-orphan-${thread.id}`,
            dimension: 'FORESHADOW_ORPHAN',
            severity: 'WARNING',
            title: `伏笔【${thread.title}】长期处于初设状态`,
            description: `伏笔线索【${thread.title}】仍为「PLANTED（已埋设）」状态，已连载超过 10 章未推进至 DEVELOPING 或回收。`,
            suggestion: `核对预期回收节点（${thread.expected_resolution || '未指定'}），避免主线断崖式烂尾。`,
            targetEntity: thread.title,
          });
        }
      }
    });

    // 3. 世界观权威公理一致性巡检 (CANON_CONFLICT)
    worldRules.forEach((rule) => {
      if (rule.authority_level === 'CANON') {
        const ruleTitle = rule.title?.trim();
        if (!ruleTitle) return;

        // 如果规则包含否定词，如“不可”、“禁止”、“无法”
        const forbiddenMatch = rule.rule_content.match(/不可[^，。；]+|禁止[^，。；]+|无法[^，。；]+/);
        if (forbiddenMatch) {
          const forbiddenClause = forbiddenMatch[0];
          // 简要关键字匹配
          const coreVerb = forbiddenClause.replace(/不可|禁止|无法/, '').trim();
          if (coreVerb.length >= 2) {
            const shortVerb = coreVerb.length > 4 ? coreVerb.slice(0, 4) : coreVerb;
            preparedChapters.forEach(({ chapter, text }) => {
              if ((text.includes(coreVerb) || text.includes(shortVerb)) && text.includes(ruleTitle)) {
                issues.push({
                  id: `canon-conflict-${rule.id}-${chapter.id}`,
                  dimension: 'CANON_CONFLICT',
                  severity: 'WARNING',
                  title: `可能触碰世界观权威公理【${ruleTitle}】`,
                  description: `《${chapter.title}》中出现涉及【${ruleTitle}】的核心描述，可能违背公理约束（${forbiddenClause}）。`,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                  suggestion: `请核查该处剧情是否打破了设定法则，若是剧情破局点请明确给出代价或特殊道具支撑。`,
                  targetEntity: ruleTitle,
                });
              }
            });
          }
        }
      }
    });

    // 4. 章节篇幅与节奏失调巡检 (LENGTH_PACE)
    preparedChapters.forEach(({ chapter, wordCount }) => {
      // 排除标题含“序章/引子/尾声/后记”等特殊章节
      const isSpecial = /序|引子|尾声|后记|上架感言|番外/.test(chapter.title);

      if (!isSpecial && wordCount > 0 && wordCount < 1200) {
        issues.push({
          id: `length-short-${chapter.id}`,
          dimension: 'LENGTH_PACE',
          severity: 'WARNING',
          title: `《${chapter.title}》单章篇幅较短 (${wordCount} 字)`,
          description: `正文仅 ${wordCount} 字，常规网文单章建议保持在 2000 ~ 4000 字区间，避免章节过薄引起读者跳读。`,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          suggestion: `建议合并入相邻章节，或扩充场景感官动作与心理微表情细节。`,
        });
      } else if (!isSpecial && wordCount > 6000) {
        issues.push({
          id: `length-long-${chapter.id}`,
          dimension: 'LENGTH_PACE',
          severity: 'INFO',
          title: `《${chapter.title}》单章篇幅较长 (${wordCount} 字)`,
          description: `单章达 ${wordCount} 字，单章篇幅过长易引发手机端翻页疲劳与留存折损。`,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          suggestion: `可考虑在中间高潮悬念处拆分为上/下两章，增加断章钩子。`,
        });
      }
    });

    // 5. 平台违规与敏感词跨章全景巡检 (CENSOR_RISK)
    preparedChapters.forEach(({ chapter, text }) => {
      DEFAULT_CENSOR_DICT.forEach((item) => {
        if (text.includes(item.word)) {
          // 查找出处上下文
          const idx = text.indexOf(item.word);
          const snippet = text.slice(Math.max(0, idx - 20), Math.min(text.length, idx + 20));

          issues.push({
            id: `censor-${item.word}-${chapter.id}`,
            dimension: 'CENSOR_RISK',
            severity: item.level === 'HIGH' ? 'CRITICAL' : 'WARNING',
            title: `检出敏感禁限词「${item.word}」`,
            description: `《${chapter.title}》中包含高危审核词汇「${item.word}」，发布可能触发平台机审锁章或限流。`,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            excerpt: snippet,
            suggestion: item.suggest ? `建议替换为网文规范词：${item.suggest}` : `建议修改避开敏感原词。`,
            targetEntity: item.word,
          });
        }
      });
    });

    // 汇总与打分
    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
    const infoCount = issues.filter((i) => i.severity === 'INFO').length;

    // 扣分制：满分 100
    // CRITICAL: 每处 -15 分 (最多扣 60)
    // WARNING: 每处 -5 分 (最多扣 30)
    // INFO: 每处 -1 分 (最多扣 10)
    const penalty =
      Math.min(60, criticalCount * 15) +
      Math.min(30, warningCount * 5) +
      Math.min(10, infoCount * 1);

    const overallHealthScore = Math.max(0, 100 - penalty);

    let rating: HealthRating = 'PERFECT';
    let ratingLabel = '设定圆融严密，全书因果状态极佳';

    if (overallHealthScore < 60 || criticalCount > 0) {
      rating = 'DANGER';
      ratingLabel = '高危：检出死人出场因果锁告警或多项严重违规，亟待修正！';
    } else if (overallHealthScore < 80 || warningCount > 2) {
      rating = 'NEEDS_ATTENTION';
      ratingLabel = '注意：存在关键伏笔滞后或篇幅失调，建议重点关注';
    } else if (overallHealthScore < 95) {
      rating = 'GOOD';
      ratingLabel = '整体稳健自洽，存在少量微观可优化项';
    }

    const summary = `全书扫描完成：共检查 ${preparedChapters.length} 章节、${characters.length} 位角色、${worldRules.length} 条权威公理与 ${plotThreads.length} 项伏笔。检出 ${criticalCount} 处致命问题、${warningCount} 处警告、${infoCount} 处提示建议。综合因果健康指数：${overallHealthScore} / 100。`;

    return {
      overallHealthScore,
      rating,
      ratingLabel,
      scannedChaptersCount: preparedChapters.length,
      scannedCharactersCount: characters.length,
      scannedCanonRulesCount: worldRules.length,
      scannedForeshadowsCount: plotThreads.length,
      criticalCount,
      warningCount,
      infoCount,
      issues,
      timestamp: new Date().toLocaleString(),
      summary,
    };
  }
}
