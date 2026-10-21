import { Chapter } from '@/types';
import { api } from '@/utils/tauriBridge';
import {
  BatchRevisePreset,
  BatchRevisePresetKey,
  BatchReviseScope,
} from './types';

export const BATCH_REVISE_PRESETS: BatchRevisePreset[] = [
  {
    key: 'DEAI_POLISH',
    label: '去 AI 味与消除工整排比',
    description: '拆解机械排比三连、消除假反折、剔除“嘴角勾起/眼中闪过/不仅如此”等 50+ 典型套话，强化真实人情味。',
    iconName: 'Sparkles',
    defaultPrompt: '重点审查并消除文中所有典型 AI 机械套话、工整排比三连与假靶子句型，增强口语呼吸感与生理微动作。',
  },
  {
    key: 'PACE_ACCELERATE',
    label: '节奏提速与压缩冗余',
    description: '删减冗长说明性环境描写与重复心理交代，缩短过渡段，使用紧凑短句直奔矛盾核心。',
    iconName: 'Zap',
    defaultPrompt: '压缩冗余的说明文字与过渡铺垫，强化动作戏与交锋推进，使全章情节密度显著提升。',
  },
  {
    key: 'HOOK_ENHANCE',
    label: '强化章末断章悬念尾钩',
    description: '重塑最后 300 字，停留在未决动作前一秒或危机突变处，扣人心弦，激发读者翻页欲。',
    iconName: 'Anchor',
    defaultPrompt: '重点重塑章末收尾，将平淡收束改为高悬念断章尾钩，让读者迫不及待想要进入下一章。',
  },
  {
    key: 'SENSORY_DETAIL',
    label: '具象化五感动作与微表情',
    description: '践行 Show Don\'t Tell，将抽象心理说明替换为视觉微表情、听觉声响、触觉温度及场景道具交互。',
    iconName: 'Eye',
    defaultPrompt: '将抽象的情绪说明转化为具体的人体微表情、声音、气味及环境道具动作互动。',
  },
  {
    key: 'CUSTOM',
    label: '自定义专项批量指令',
    description: '输入专属修改提示词，对选定章节执行定制化修稿。',
    iconName: 'Wand2',
    defaultPrompt: '',
  },
];

export class BatchReviseEngine {
  /**
   * 清除正文 HTML 标签
   */
  static stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * 筛选符合范围的章节列表
   */
  static filterChaptersByScope(chapters: Chapter[], scope: BatchReviseScope): Chapter[] {
    if (!chapters || chapters.length === 0) return [];

    switch (scope.type) {
      case 'ALL':
        return [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);

      case 'RANGE': {
        const start = scope.rangeStart ?? 1;
        const end = scope.rangeEnd ?? chapters.length;
        return chapters
          .filter((ch) => ch.chapter_number >= start && ch.chapter_number <= end)
          .sort((a, b) => a.chapter_number - b.chapter_number);
      }

      case 'SELECTION': {
        const idSet = new Set(scope.selectedChapterIds);
        return chapters
          .filter((ch) => idSet.has(ch.id))
          .sort((a, b) => a.chapter_number - b.chapter_number);
      }

      default:
        return chapters;
    }
  }

  /**
   * 动态装配批量修订专有提示词
   */
  static assemblePrompt(params: {
    chapterTitle: string;
    content: string;
    presetKey: BatchRevisePresetKey;
    customInstruction?: string;
  }): { systemPrompt: string; userPrompt: string } {
    const { chapterTitle, content, presetKey, customInstruction } = params;

    const preset = BATCH_REVISE_PRESETS.find((p) => p.key === presetKey) || BATCH_REVISE_PRESETS[0];
    const instructionText = customInstruction?.trim() || preset.defaultPrompt;

    const systemPrompt = `你是顶级长篇小说批量精修架构师与文学总监。你的任务是在【绝对保持原章节核心剧情发展、人物命运死活与事件因果不变】的前提下，针对章节正文执行专项重塑。

【核心精修戒律】
1. 绝对保真：严禁篡改战斗胜负、改变主角动机、或擅自添加破坏世界观设定的要素；
2. 目标专一：严格聚焦本次指定修订目标；
3. 输出纯粹：直接输出重塑后的章节完整纯文本（或段落 HTML），严禁输出任何客套前言或总结后记。`;

    const userPrompt = `【待修订章节】：${chapterTitle}
【本次专项精修要求】：
${instructionText}

【原始正文】：
${this.stripHtml(content).slice(0, 30000)}

请即刻输出精修重塑后的完整正文！`;

    return { systemPrompt, userPrompt };
  }

  /**
   * 计算字符级差异指标与简述
   */
  static calculateDiffMetrics(
    originalText: string,
    revisedText: string,
    isOfflineFallback = false
  ): {
    addedChars: number;
    removedChars: number;
    summary: string;
  } {
    const origClean = this.stripHtml(originalText);
    const revClean = this.stripHtml(revisedText);

    const isIdentical = origClean === revClean;
    const diffLen = revClean.length - origClean.length;
    const addedChars = Math.max(0, diffLen);
    const removedChars = Math.max(0, -diffLen);

    let summary = '';
    if (isOfflineFallback) {
      if (isIdentical) {
        summary = '【离线规则降级】未命中套话正则，正文无变化 (字数变化 +0)';
      } else {
        summary = `【离线规则降级】局部关键词正则替换 (字数变化 ${diffLen >= 0 ? '+' : ''}${diffLen}，未调用大模型)`;
      }
    } else {
      if (diffLen > 100) {
        summary = `扩充细节描写，净增 ${diffLen} 字`;
      } else if (diffLen < -100) {
        summary = `精炼压缩文字，净削减 ${Math.abs(diffLen)} 字`;
      } else {
        summary = `保持相近体量，局部遣词精微打磨 (字数变化 ${diffLen >= 0 ? '+' : ''}${diffLen})`;
      }
    }

    return { addedChars, removedChars, summary };
  }

  /**
   * 本地 0-Token 纯离线快速规则清洗与演示（无模型或网络时即刻可用）
   */
  static offlineFastRevise(originalText: string, presetKey: BatchRevisePresetKey): string {
    let text = this.stripHtml(originalText);

    if (presetKey === 'DEAI_POLISH') {
      // 常见套话机械清洗
      text = text
        .replace(/不仅如此[，,]?/g, '')
        .replace(/嘴角勾起(?:了一抹)?(?:冷笑|微笑|弧度)?[，,]?/g, '神色微敛，')
        .replace(/(?:眼|眼神)中闪过(?:了一抹|一丝|几分)?(?:决绝|惊诧|冷意|异色|光芒|复杂)?/g, '目光微凝')
        .replace(/空气仿佛(?:凝固|停滞)(?:了一般|住了)?[，,]?/g, '四周骤然陷入死寂，')
        .replace(/深吸了一口气[，,]?/g, '')
        .replace(/不得不说[，,]?/g, '')
        .replace(/殊不知[，,]?/g, '然而');
    } else if (presetKey === 'PACE_ACCELERATE') {
      // 压缩过多短促感叹
      text = text.replace(/！{2,}/g, '！').replace(/？{2,}/g, '？');
    } else if (presetKey === 'HOOK_ENHANCE') {
      // 在末尾强化悬念标识
      if (!text.endsWith('……') && !text.endsWith('？')) {
        text += '\n\n夜风呼啸，暗处的杀机已然悄然逼近……';
      }
    }

    return text;
  }

  /**
   * 一键采纳单章修订草案，并真实写入 SQLite 数据库（自动提交版本快照）
   */
  static async acceptProposal(chapterId: string, revisedContent: string): Promise<boolean> {
    try {
      await api.saveChapterContent(chapterId, revisedContent, true, 'BATCH_REVISE');
      return true;
    } catch (e) {
      console.error('采纳批量修改草案失败:', e);
      throw e;
    }
  }
}
