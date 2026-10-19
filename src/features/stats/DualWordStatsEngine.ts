import { Chapter, ChapterVersion } from '@/types';
import {
  DualWordStats,
  ChapterStatsRecord,
  CreatorPurityLevel,
} from './types';

export class DualWordStatsEngine {
  /**
   * 清除正文 HTML 标签
   */
  static stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * 分析单章的手写与 AI 辅助字数构成
   */
  static analyzeChapterDualStats(
    chapter: Chapter,
    versions: ChapterVersion[] = []
  ): ChapterStatsRecord {
    const text = this.stripHtml(chapter.content);
    const totalWords =
      typeof chapter.word_count === 'number' && chapter.word_count > 0
        ? chapter.word_count
        : text.length;

    if (totalWords === 0) {
      return {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        totalWords: 0,
        manualWords: 0,
        aiWords: 0,
        manualRatio: 100,
      };
    }

    // 若存在版本历史，统计各版本 source_type
    if (versions.length > 0) {
      const aiSources = new Set([
        'AI_ASSISTANT_REVISE',
        'PROSE_WRITER_GEN',
        'BATCH_REVISE',
        'INLINE_AI_APPLY',
        'CONTINUATION',
        'AI_GENERATED',
        'AI_REVISED',
        'AI_APPEND',
        'AI_REPLACE',
        'AI_MCP_PROSE',
      ]);

      let aiVersionCount = 0;
      versions.forEach((v) => {
        if (aiSources.has(v.source_type || '')) {
          aiVersionCount++;
        }
      });

      const aiRatioWeight = Math.min(0.85, (aiVersionCount / versions.length) * 0.9);
      const aiWords = Math.round(totalWords * aiRatioWeight);
      const manualWords = Math.max(0, totalWords - aiWords);
      const manualRatio = totalWords > 0 ? Math.round((manualWords / totalWords) * 100) : 100;

      return {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        totalWords,
        manualWords,
        aiWords,
        manualRatio,
      };
    }

    // 默认兜底：若暂无版本记录，默认视为纯作者手打原创 (100% 手打 / 0% AI)
    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      totalWords,
      manualWords: totalWords,
      aiWords: 0,
      manualRatio: 100,
    };
  }

  /**
   * 计算整部作品的手打 vs AI 字数双轨大盘
   */
  static calculateNovelDualStats(
    novelId: string,
    chapters: Chapter[],
    versionsMap: Record<string, ChapterVersion[]> = {}
  ): DualWordStats {
    let totalWordCount = 0;
    let manualWordCount = 0;
    let aiWordCount = 0;

    const chapterRecords: ChapterStatsRecord[] = [];

    chapters.forEach((ch) => {
      const versions = versionsMap[ch.id] || [];
      const rec = this.analyzeChapterDualStats(ch, versions);
      chapterRecords.push(rec);

      totalWordCount += rec.totalWords;
      manualWordCount += rec.manualWords;
      aiWordCount += rec.aiWords;
    });

    const manualRatio =
      totalWordCount > 0 ? Math.round((manualWordCount / totalWordCount) * 100) : 100;
    const aiRatio = Math.max(0, 100 - manualRatio);

    let creatorPurityLevel: CreatorPurityLevel = 'BALANCED_COPILOT';
    let purityLabel = '人机协同 · 平衡心流';
    let purityDescription = '作者构思主导骨架与关键转折，AI 辅助部分场景细节与润色。';

    if (manualRatio >= 85) {
      creatorPurityLevel = 'PURIST';
      purityLabel = '纯粹原创 · 匠心手作';
      purityDescription = '全书绝大部分字句由创作者亲手打磨敲定，具有极高的人类文学纯粹度。';
    } else if (manualRatio < 50) {
      creatorPurityLevel = 'AI_HEAVY';
      purityLabel = '深度赋能 · 概念总监';
      purityDescription = '创作者深度调动多 Agent 流水线与模型生成，偏重结构把控与宏观审校。';
    }

    return {
      novelId,
      totalWordCount,
      manualWordCount,
      aiWordCount,
      manualRatio,
      aiRatio,
      creatorPurityLevel,
      purityLabel,
      purityDescription,
      chapterRecords,
      lastUpdated: Date.now(),
    };
  }
}
