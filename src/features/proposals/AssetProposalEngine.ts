import { Character, WorldRule } from '@/types';
import { api } from '@/utils/tauriBridge';
import { AssetProposal } from './types';

export class AssetProposalEngine {
  /**
   * 清除正文 HTML 标签
   */
  static stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  }

  /**
   * 从章节正文中快速扫描未登记的新实体，生成反哺提案
   */
  static scanChapterProposals(params: {
    chapterId: string;
    chapterTitle: string;
    content: string;
    existingCharacters: Character[];
    existingRules: WorldRule[];
  }): AssetProposal[] {
    const { chapterId, chapterTitle, content, existingCharacters, existingRules } = params;
    const text = this.stripHtml(content);
    if (!text || text.length < 50) return [];

    const proposals: AssetProposal[] = [];
    const seenNames = new Set<string>();

    const existingCharNames = new Set(existingCharacters.map((c) => c.name.trim()));
    const existingRuleTitles = new Set(existingRules.map((r) => r.title.trim()));

    // 句子切分
    const sentences = text.split(/([。！？\n]+)/).filter((s) => s.trim().length > 0);

    // 1. 扫描未登记的新角色 (CHARACTER)
    // 匹配如：【沈长青】沉声道、只听【陆雪琪】冷笑、【萧晨】皱了皱眉
    const charPattern = /([“「]?)([\u4e00-\u9fa5]{2,4})(说道|沉声道|冷笑道|苦笑道|轻声道|喝道|怒道|冷哼一声|抱拳道|皱眉道|站起身|迈步走|一跃而起|心中暗想|眼中闪过)/g;
    let match: RegExpExecArray | null;

    // 过滤常见动词/副词误报
    const invalidCharPrefixes = new Set([
      '有人', '众人', '所有人', '几个', '两人', '那名', '这名', '对方', '老者',
      '少年', '青年', '女子', '掌柜', '小厮', '修士', '弟子', '突然', '这时',
      '随后', '只见', '不仅', '而且', '他们', '我们', '自己', '如果', '并且',
    ]);

    while ((match = charPattern.exec(text)) !== null) {
      let candidate = match[2];
      // 清理前置虚词/连词/感官动词（如：只见、只听、但见、见、听、便、却）
      candidate = candidate.replace(/^(?:只见|只听|忽见|忽听|但见|便见|却见)/, '');
      if (candidate.length > 3 && /^[见听便却并及与]/.test(candidate)) {
        candidate = candidate.slice(1);
      }

      if (
        candidate.length >= 2 &&
        candidate.length <= 4 &&
        !existingCharNames.has(candidate) &&
        !invalidCharPrefixes.has(candidate) &&
        !seenNames.has(candidate)
      ) {
        seenNames.add(candidate);

        // 找寻所在整句（优先包含完整触发动词的语句）
        const trigger = match[0];
        const context = sentences.find((s) => s.includes(trigger)) || sentences.find((s) => s.includes(candidate)) || trigger;

        proposals.push({
          id: `prop-char-${candidate}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: 'CHARACTER',
          categoryLabel: '人物角色',
          name: candidate,
          summary: `正文中登场并有独立台词/动作的新人物`,
          contextSentence: context.slice(0, 100),
          sourceChapterId: chapterId,
          sourceChapterTitle: chapterTitle,
          confidence: 0.85,
          status: 'PENDING',
          createdAt: Date.now(),
          suggestedAttributes: {
            role_type: '配角 / 出场人物',
            personality: '待补充',
            background: `首次现身于《${chapterTitle}》：“${context.trim().slice(0, 50)}…”`,
          },
        });
      }
    }

    // 2. 扫描未登记的门派/势力 (FACTION)
    // 匹配如：玄天宗、青云门、七星阁、黑煞帮、天机殿、林氏商会
    const factionPattern = /(?:^|[，。！？、“”「」\s与和及或是由在自入去向往临如]|只见|正是|便是|乃是|就是)([\u4e00-\u9fa5]{2,5}(?:宗|门|阁|帮|教|殿|盟|山庄|商会|神庭|圣地|王府|古派))/g;
    const invalidFactionWords = new Set(['宗门', '开门', '进门', '各门', '各大宗', '空门', '关门', '掌门']);

    while ((match = factionPattern.exec(text)) !== null) {
      const candidate = match[1];
      if (
        candidate &&
        candidate.length >= 3 &&
        !existingRuleTitles.has(candidate) &&
        !invalidFactionWords.has(candidate) &&
        !seenNames.has(candidate)
      ) {
        seenNames.add(candidate);
        const context = sentences.find((s) => s.includes(candidate)) || match[0];

        proposals.push({
          id: `prop-fac-${candidate}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: 'FACTION',
          categoryLabel: '门派势力',
          name: candidate,
          summary: `正文中提及的江湖宗门或势力阵营`,
          contextSentence: context.slice(0, 100),
          sourceChapterId: chapterId,
          sourceChapterTitle: chapterTitle,
          confidence: 0.88,
          status: 'PENDING',
          createdAt: Date.now(),
          suggestedAttributes: {
            authority_level: 'EXTENDED',
            rule_content: `出处于《${chapterTitle}》：“${context.trim().slice(0, 60)}”`,
          },
        });
      }
    }

    // 3. 扫描未登记的功法秘术 (TECHNIQUE)
    // 匹配如：《太虚剑经》、紫阳真经、八荒游龙步、大荒囚天指
    const techniquePattern = /(?:《([\u4e00-\u9fa5]{2,8})》|(?:^|[，。！？、“”「」\s修习|参悟|运转|施展|捏动|催动|修炼|习得])([\u4e00-\u9fa5]{2,5}(?:诀|经|掌|拳|剑法|心法|神功|秘术|身法|步法)))/g;
    const invalidTechniqueWords = new Set(['办法', '做法', '想法', '一拳', '一掌', '口诀']);

    while ((match = techniquePattern.exec(text)) !== null) {
      const candidate = match[1] || match[2];
      if (
        candidate &&
        candidate.length >= 3 &&
        !existingRuleTitles.has(candidate) &&
        !invalidTechniqueWords.has(candidate) &&
        !seenNames.has(candidate)
      ) {
        seenNames.add(candidate);
        const context = sentences.find((s) => s.includes(candidate)) || match[0];

        proposals.push({
          id: `prop-tech-${candidate}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: 'TECHNIQUE',
          categoryLabel: '功法绝技',
          name: candidate,
          summary: `正文战斗或修炼中出现的新战技秘法`,
          contextSentence: context.slice(0, 100),
          sourceChapterId: chapterId,
          sourceChapterTitle: chapterTitle,
          confidence: 0.82,
          status: 'PENDING',
          createdAt: Date.now(),
          suggestedAttributes: {
            authority_level: 'EXTENDED',
            rule_content: `首次见于《${chapterTitle}》：“${context.trim().slice(0, 60)}”`,
          },
        });
      }
    }

    // 4. 扫描未登记的法宝灵物 (ARTIFACT)
    // 匹配如：九龙神火罩、乾坤戒、七星龙渊剑、焚天炉
    const artifactPattern = /(?:^|[，。！？、“”「」\s的了着是个件口柄尊面枚副根条]|祭出|拿出|催动|手持|手握|头顶|佩戴|传闻中的)([\u4e00-\u9fa5]{2,5}(?:神剑|飞剑|宝剑|战刃|古鼎|神鼎|宝鉴|灵镜|宝塔|古钟|宝印|玉佩|储物戒|乾坤戒|飞舟|神火罩|宝珠|阵图|灵珠|法印|金丹|拂尘|古剑|长枪|神弓))/g;

    while ((match = artifactPattern.exec(text)) !== null) {
      const candidate = match[1];
      if (
        candidate &&
        candidate.length >= 3 &&
        !existingRuleTitles.has(candidate) &&
        !seenNames.has(candidate)
      ) {
        seenNames.add(candidate);
        const context = sentences.find((s) => s.includes(candidate)) || match[0];

        proposals.push({
          id: `prop-art-${candidate}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: 'ARTIFACT',
          categoryLabel: '法宝灵物',
          name: candidate,
          summary: `正文中登场的重要装备道具或神兵`,
          contextSentence: context.slice(0, 100),
          sourceChapterId: chapterId,
          sourceChapterTitle: chapterTitle,
          confidence: 0.8,
          status: 'PENDING',
          createdAt: Date.now(),
          suggestedAttributes: {
            authority_level: 'EXTENDED',
            rule_content: `出场于《${chapterTitle}》：“${context.trim().slice(0, 60)}”`,
          },
        });
      }
    }

    return proposals;
  }

  /**
   * 一键采纳反哺提案，并持久化沉淀写入 SQLite 数据库
   */
  static async acceptProposal(proposal: AssetProposal, novelId: string): Promise<boolean> {
    try {
      if (proposal.category === 'CHARACTER') {
        await api.createCharacter({
          novel_id: novelId,
          name: proposal.name,
          profile: proposal.summary || '正文反哺登场人物',
          personality: proposal.suggestedAttributes.personality || '待完善',
          background: proposal.suggestedAttributes.background || proposal.contextSentence,
          motivation: '主线推进',
        });
        return true;
      } else {
        // 其余宗门、功法、法宝、地点归入世界观世界法则 (WorldRule)
        await api.createWorldRule({
          novel_id: novelId,
          title: proposal.name,
          rule_content: `${proposal.summary}。\n出处引用：“${proposal.contextSentence}”\n属性详情：${proposal.suggestedAttributes.rule_content || '待补充'}`,
          authority_level: proposal.suggestedAttributes.authority_level || 'EXTENDED',
        });
        return true;
      }
    } catch (e) {
      console.error('采纳提案失败:', e);
      throw e;
    }
  }
}
