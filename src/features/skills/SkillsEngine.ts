import { NOVEL_AI_CLICHES } from '@/features/humanizer/clichéDictionary';
import { BUILTIN_SKILLS } from './skillsRegistry';
import type { SkillAuditIssue, SkillAuditReport, SkillAuditRating } from './types';

export class SkillsEngine {
  /**
   * 综合扫描文本中的所有已激活技能规则（包括 Humanizer 网文套话与 Lieflat 11 大实证特征）
   */
  static auditText(text: string, enabledSkillIds: string[] = ['humanizer', 'lieflat-less-ai-tone']): SkillAuditReport {
    const trimmed = text ? text.trim() : '';
    const wordCount = trimmed.replace(/\s+/g, '').length;

    const activeSkills = BUILTIN_SKILLS.filter(s => enabledSkillIds.includes(s.id));
    const activeSkillNames = activeSkills.map(s => s.displayName);

    if (wordCount === 0) {
      return {
        score: 100,
        rating: 'EXCELLENT',
        wordCount: 0,
        issueCount: 0,
        issues: [],
        summary: '当前暂无文本内容',
        activeSkillNames,
      };
    }

    const issues: SkillAuditIssue[] = [];

    // 1. 如果启用了 Humanizer，执行网文典型套话与生理肌肉抽搐扫描
    if (enabledSkillIds.includes('humanizer')) {
      for (const item of NOVEL_AI_CLICHES) {
        let startIndex = 0;
        while ((startIndex = trimmed.indexOf(item.phrase, startIndex)) !== -1) {
          issues.push({
            ruleId: `hum_${item.category}`,
            skillId: 'humanizer',
            skillName: 'Humanizer 文学润色',
            ruleName: `套话拦截: ${item.phrase}`,
            excerpt: item.phrase,
            startIndex,
            endIndex: startIndex + item.phrase.length,
            suggestion: item.suggestion,
            severity: item.severity,
            badExample: `……${item.phrase}……`,
            goodExample: item.suggestion,
          });
          startIndex += item.phrase.length;
        }
      }
    }

    // 2. 如果启用了 Lieflat 语言学去 AI 味，执行 11 大实证量化特征扫描
    if (enabledSkillIds.includes('lieflat-less-ai-tone')) {
      // 2.1 翻案腔 (不是……而是…… / 看似……实则…… / 你以为……其实……)
      const twistRegex = /(不是|并非|与其说|表面上?|看似|你以为|不在于)[^。！？\n]{2,30}?(而是|实则|不如说|实际上?|其实|而在于|回头才发现|说到底)/g;
      let match: RegExpExecArray | null;
      while ((match = twistRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'lie_twist_cavil',
          skillId: 'lieflat-less-ai-tone',
          skillName: 'Lieflat 语言学去AI味',
          ruleName: '翻案腔 (先立靶子后反转)',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '直接从正面给出客观判断，避免虚立读者不存在的误解。',
          severity: 'HIGH',
          badExample: match[0],
          goodExample: '直接陈述核心事实或判断。',
        });
      }

      // 2.2 冒号滥用 (提示语引出内容，如“一句话总结：”、“核心是：”、“原因有两个：”)
      const colonClicheRegex = /(一句话总结|核心是|关键在于|原因如下|结论|本质上|换句话说|原因有两个|主要表现在)[：:]/g;
      while ((match = colonClicheRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'lie_colon_abuse',
          skillId: 'lieflat-less-ai-tone',
          skillName: 'Lieflat 语言学去AI味',
          ruleName: '冒号滥用 (提示语冒号)',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '提示语本身不承担信息时直接删掉，直接写内容；或换成逗号。',
          severity: 'HIGH',
          badExample: match[0],
          goodExample: '直接陈述判断，去除提示语。',
        });
      }

      // 2.3 破折号滥用 (检测连续破折号 —— 或 -- 制造刻意停顿)
      const dashRegex = /(——|--)[^。！？\n]{1,20}(——|--)?/g;
      while ((match = dashRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'lie_dash_abuse',
          skillId: 'lieflat-less-ai-tone',
          skillName: 'Lieflat 语言学去AI味',
          ruleName: '破折号滥用 (刻意揭晓感)',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '除非确有必要，改用普通逗号或句号，避免拿破折号强调普通判断。',
          severity: 'HIGH',
          badExample: match[0],
          goodExample: '改用逗号连接或独立成句。',
        });
      }

      // 2.4 禁用起手式 (说白了、说穿了、先说结论)
      const openerRegex = /(说白了|说穿了|先说结论)[，,]/g;
      while ((match = openerRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'lie_forbidden_openers',
          skillId: 'lieflat-less-ai-tone',
          skillName: 'Lieflat 语言学去AI味',
          ruleName: '禁用起手式',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '删去“说白了/先说结论”套话，直接给出事实或结论。',
          severity: 'MEDIUM',
          badExample: match[0],
          goodExample: '直接陈述后续内容。',
        });
      }

      // 2.5 拟人化职业喻体 (像一位智慧的导师/永不疲倦的审查员)
      const personifyRegex = /(像|相当于|宛如)(一个|一位)(智慧的|全能的|永不疲倦的)?(导师|秘书|助手|顾问|管家|审查员|实习生)/g;
      while ((match = personifyRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'lie_anthropomorphic_metaphor',
          skillId: 'lieflat-less-ai-tone',
          skillName: 'Lieflat 语言学去AI味',
          ruleName: '拟人化职业喻体',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '换成该工具/流程实际做了什么，避免用理想化职业形象替作者廉价抒情。',
          severity: 'HIGH',
          badExample: match[0],
          goodExample: '它响应迅速，能承担基础审查工作。',
        });
      }

      // 2.6 翻译腔：句首“当……时”
      const whenClauseRegex = /当[^。！？\n]{3,35}时[，,]/g;
      while ((match = whenClauseRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'lie_translation_cliches',
          skillId: 'lieflat-less-ai-tone',
          skillName: 'Lieflat 语言学去AI味',
          ruleName: '翻译腔: “当……时”前置时间从句',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '删掉句首的“当”和“时”，让从句直接作为自然前置分句。',
          severity: 'MEDIUM',
          badExample: match[0],
          goodExample: match[0].replace(/^当/, '').replace(/时[，,]/, '，'),
        });
      }

      // 2.7 翻译腔：“这意味着 / 这表明”
      const thisMeansRegex = /(这意味着|这表明|这说明|换句话说)[^。！？\n]{2,30}/g;
      while ((match = thisMeansRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'lie_translation_cliches',
          skillId: 'lieflat-less-ai-tone',
          skillName: 'Lieflat 语言学去AI味',
          ruleName: '翻译腔: “这意味着”式复述句',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '若与前句同义，直接并入前句或删除该提示语。',
          severity: 'MEDIUM',
          badExample: match[0],
          goodExample: '直接合并或提炼为独立结论。',
        });
      }

      // 2.8 顿号过密扫描（单句内出现 3 项以上连缀顿号）
      const sentences = trimmed.split(/[。！？\n]/);
      let sentenceOffset = 0;
      for (const sent of sentences) {
        const commaCount = (sent.match(/、/g) || []).length;
        if (commaCount >= 2 && sent.length < 50) {
          const sentIdx = trimmed.indexOf(sent, sentenceOffset);
          if (sentIdx !== -1) {
            issues.push({
              ruleId: 'lie_dense_enumeration',
              skillId: 'lieflat-less-ai-tone',
              skillName: 'Lieflat 语言学去AI味',
              ruleName: '顿号罗列过密',
              excerpt: sent.trim(),
              startIndex: sentIdx,
              endIndex: sentIdx + sent.length,
              suggestion: '避免在一句话内用顿号塞入过长清单，能概括尽量概括，或改变分项句式。',
              severity: 'LOW',
              badExample: sent.trim(),
              goodExample: '改用整体概括词或调整主次句法。',
            });
          }
        }
        sentenceOffset += sent.length + 1;
      }
    }

    // 3. 如果启用了 Scene Dramaturge 或 Story Architect，扫描戏剧张力硬伤
    if (enabledSkillIds.includes('scene-dramaturge') || enabledSkillIds.includes('story-architect')) {
      // 3.1 情绪直接贴标签宣告
      const emotionTellRegex = /(感到|心中|内心|脑海中)(极度|十分|无比|由衷地)?(震惊|恐惧|愤怒|悲痛|心痛|陷入了沉思|翻江倒海)/g;
      let match: RegExpExecArray | null;
      while ((match = emotionTellRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'sd_observable_emotion',
          skillId: 'scene-dramaturge',
          skillName: 'Scene Dramaturge 场景导演',
          ruleName: '情绪直接贴标签宣告 (Tell 而非 Show)',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '用动作变形、手头微动作、生理受力（如咬破嘴唇、手抖、避开目光）代替直接宣讲情绪。',
          severity: 'HIGH',
          badExample: match[0],
          goodExample: '描写具体肌肉动作与生理物象互动。',
        });
      }

      // 3.2 偷懒偶然推进 (突然之间 / 巧合的是 / 恰好在此时)
      const accidentRegex = /(突然之间|巧合的是|碰巧的是|恰好在此时|好巧不巧)[，,]?/g;
      while ((match = accidentRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'sa_causal_chain',
          skillId: 'story-architect',
          skillName: 'Story Architect 因果架构',
          ruleName: '偷懒偶然推进 (因果链断裂)',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '情节推进必须遵循“因为 A 的选择导致 B 的代价”，避免用外部突发巧合代替因果驱动。',
          severity: 'HIGH',
          badExample: match[0],
          goodExample: '让主角的主动动机或前期遗留漏洞引出后果。',
        });
      }
    }

    // 4. 如果启用了 Ending Forge，扫描高潮假煽情与金句泛滥
    if (enabledSkillIds.includes('ending-forge')) {
      const cheapPathosRegex = /(所有人泣不成声|泪流满面|命运的赞歌|这注定是一场|命运的齿轮在这一刻开始转动)/g;
      let match: RegExpExecArray | null;
      while ((match = cheapPathosRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'ef_quiet_aftermath',
          skillId: 'ending-forge',
          skillName: 'Ending Forge 结局锻造',
          ruleName: '旁白直接煽情升华 (缺乏物象沉降)',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '高潮后给读者留出平静半步，用残破物件或人物动作让情绪自行沉淀，严禁旁白喊口号。',
          severity: 'HIGH',
          badExample: match[0],
          goodExample: '描写风停、水落、物件破损等客观现实。',
        });
      }
    }

    // 5. 如果启用了 Cold Reader，扫描机械断章与伪悬念
    if (enabledSkillIds.includes('cold-reader')) {
      const hookRegex = /(然而他并不知道|殊不知|但他不知道|谁曾想)[^。\n]{0,20}(命运|暗中|血红|杀机|危险|即将)/g;
      let match: RegExpExecArray | null;
      while ((match = hookRegex.exec(trimmed)) !== null) {
        issues.push({
          ruleId: 'cr_pseudo_climax',
          skillId: 'cold-reader',
          skillName: 'Cold Reader 读者盲审',
          ruleName: '机械制造伪悬念 (偷懒断章)',
          excerpt: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          suggestion: '作者越俎代庖替读者下结论，属于低端机械钩子。请改用人物自然动作停顿与现场余音。',
          severity: 'HIGH',
          badExample: match[0],
          goodExample: '以人物当下未完成的动作或环境冷寂收束。',
        });
      }
    }

    // 按在文本中出现的先后位置排序，去重相同区间
    const sortedIssues = issues.sort((a, b) => a.startIndex - b.startIndex);

    // 评分计算 (以 100 分为基准扣减)
    let penalty = 0;
    for (const issue of sortedIssues) {
      if (issue.severity === 'HIGH') penalty += 10;
      else if (issue.severity === 'MEDIUM') penalty += 5;
      else penalty += 2;
    }

    // 基于字数归一化
    const densityRatio = (penalty / Math.max(wordCount, 300)) * 1000;
    const finalScore = Math.max(10, Math.round(100 - densityRatio * 0.75));

    let rating: SkillAuditRating = 'EXCELLENT';
    let summary = '文学质感出众，未检测到明显 AI 套话或机械句式。';

    if (finalScore < 60) {
      rating = 'SEVERE_AI_TONE';
      summary = `检测到较密集的典型 AI 痕迹与套话（共 ${sortedIssues.length} 处），建议启动多技能组合精修。`;
    } else if (finalScore < 80) {
      rating = 'NEEDS_POLISH';
      summary = `存在多处 AI 惯性句式或说明文过渡（共 ${sortedIssues.length} 处），建议结合白名单规则精准重塑。`;
    } else if (finalScore < 95) {
      rating = 'GOOD';
      summary = '语言自然度良好，仅有轻微句式可以进一步具象化。';
    }

    return {
      score: finalScore,
      rating,
      wordCount,
      issueCount: sortedIssues.length,
      issues: sortedIssues,
      summary,
      activeSkillNames,
    };
  }

  /**
   * 组装带有所有已启用 Skills 严苛约束的专业重写 Prompt
   */
  static buildCombinedPolishingPrompt(
    rawText: string,
    genre: string = '中文长篇小说',
    instruction: string = '彻底消灭 AI 腔调，强化中式小说身体微动作白描与现场呼吸感',
    enabledSkillIds: string[] = ['humanizer', 'lieflat-less-ai-tone', 'scene-dramaturge']
  ): string {
    const activeSkills = BUILTIN_SKILLS.filter(s => enabledSkillIds.includes(s.id));

    const rulesBlocks = activeSkills.map(s => s.systemPromptFragment).join('\n\n');

    return `你是一位顶级中文小说文学精修与去 AI 味大师。当前搭载已启用的专业技能规范：【${activeSkills.map(s => s.displayName).join(' + ')}】。

【当前小说题材】：${genre}
【精修专项指令】：${instruction}

==================================================
【必须严格执行的 Skills 规范合集】：
${rulesBlocks}
==================================================

【执行要求】：
1. 白名单最小化改写：严格解决上述规则命中的问题，未命中规则的文字必须尽量保留，严禁擅自篡改剧情框架或增减核心设定；
2. 严禁删除正文设问句与正常文学比喻；
3. 直接输出润色后的高质量纯小说正文，绝不要带任何“好的”、“这是修改后”等解释寒暄。

【待精修的原始文本】：
${rawText}`;
  }

  /**
   * Story Architect: 宏观因果与剧情架构提示词
   */
  static buildStoryArchitectPrompt(inputs: {
    genre?: string;
    concept: string;
    targetEmotion?: string;
    existingBible?: string;
  }): string {
    return `你是一位专业长篇小说故事架构师 (Story Architect)。
请基于核心脑洞【${inputs.concept}】，在题材【${inputs.genre || '长篇小说'}】下，围绕核心情绪【${inputs.targetEmotion || '震撼与共鸣'}】设计故事因果架构。

【必须遵循的架构信念】：
1. 拒绝匀速流水账与换皮反转，拒绝按固定百分比硬推高潮；
2. 交付三个【因果结构真正不同】的剧情方案（例如：主角先犯错型、先赢后失去型、持续不作为引发滚雪球成本型）；
3. 每个方案必须明确：
   - 主角真正欲望 vs 内心恐惧；
   - 最不愿做却必须做的决定及其【不可逆代价】（失去信任、打破自我认识、关系瓦解等，绝不仅是死亡）；
   - 主要转折硬核因果链（因为 A 的选择导致 B 的代价，因此 C 改变策略）；
   - 逆向伏笔查证表（区分硬事实与解释）；
   - 慢节奏生活场景的抵押品说明。
4. 严格输出结构方案，不要直接代写正文！

${inputs.existingBible ? `【现有世界观与人物设定参考】：\n${inputs.existingBible}` : ''}`;
  }

  /**
   * Scene Dramaturge: 单场景双方案导演提示词
   */
  static buildSceneDramaturgePrompt(inputs: {
    genre?: string;
    prevContext: string;
    sceneGoal: string;
    activeCharacters?: string;
    targetEmotion?: string;
  }): string {
    return `你是一位小说单场景戏剧导演 (Scene Dramaturge)。
请为接下来的场景设计戏剧张力与成稿策略。

【场景目标】：${inputs.sceneGoal}
【出场人物】：${inputs.activeCharacters || '主角与相关人物'}
【目标情绪】：${inputs.targetEmotion || '张力递进'}
【前情摘要】：
${inputs.prevContext}

【导演要求】：
1. 先给出两条不同导演方案：
   - 方案甲（后果切入）：从冲突后果或剧变现场进入，压缩过程；
   - 方案乙（细节延迟）：从看似平静的日常生活微细节切入，延迟揭露；
2. 推荐其中一个更符合当前呼吸节奏的方案，并直接输出成稿正文；
3. 正文必须将情绪转化为可观察的身体动作变形与环境物象交互，严禁直接宣告“感到震惊/心痛”；
4. 保留冲突后的真实后坐力，允许在不完整情绪中自然停步，不强求每章爆点或金句。`;
  }

  /**
   * Ending Forge: 有代价的结局反推提示词
   */
  static buildEndingForgePrompt(inputs: {
    genre?: string;
    storyPremise: string;
    establishedClues?: string;
    protagonistChoice?: string;
  }): string {
    return `你是一位小说结局锻造师 (Ending Forge)。
基于已有故事前提【${inputs.storyPremise}】，设计在价值上深刻成立、代价无法撤销的结局。

【设计原则】：
1. 给出三种价值取向不同的结局路线：
   - 路线 A（苦涩兑现）：外部目标获得，主角失去以往定义自己的信念或亲密关系；
   - 路线 B（克制和解）：外部结果失败，但人物终于完成以前做不到的心灵跨越；
   - 路线 C（延迟认知）：多年以后，一个早已存在的客观细节使过去的抉择产生第二重理解；
2. 逆向验证：
   - 确保主角亲自做决定，拒绝纯意外或机械降神替代人物弧光；
   - 检查反转是否重新解释旧信息，严禁天降全新未交代过的规则；
   - 交付“结局倒推铺垫表”，标明前文哪个场景需要埋设什么可被误读的证据；
3. 输出三案对比与推荐案收束正文片段（给情绪留出半步安静，严禁旁白喊口号）。

${inputs.establishedClues ? `【已确立的线索与事实】：\n${inputs.establishedClues}` : ''}`;
  }

  /**
   * Cold Reader: 零继承读者视角独立盲审提示词
   */
  static buildColdReaderPrompt(
    text: string,
    genre: string = '长篇小说',
    targetAudience: string = '网络小说大众读者'
  ): string {
    return `你是一位首次阅读这部作品的挑剔小说读者与盲审质检员 (Cold Reader)。
你处于完全隔离的盲审模式中，不知道作者的内心意图、大纲计划或辩护理由。

【小说体裁】：${genre}
【受众群体】：${targetAudience}

【待审正文】：
${text}

==================================================
【严格盲审契约】：
1. 用 3-5 句话复述“作为普通读者，我以为这是一个关于什么的故事”；
2. 制作【带证据的诊断表】：
   - 标明在哪一段注意力下降、为何失去兴趣（说明代替体验/因果松弛/行动停滞）；
   - 标明何时过早猜中反转或牺牲，是否伤害了期待；
   - 标明何处怀疑角色动机（是否为了制造冲突突然降智）；
   - 标明是否存在伪高潮（偶然救援/章末“然而他殊不知”机械断章/旁白廉价煽情）；
3. 制作【转折期许表】：列出关键节点的“原本期待 → 实际发生 → 读者情绪效应”；
4. 交付【最高优先级前三项最小修复建议】：每项给出动刀最小的改进方案，并特别注明“过度修复会损失什么”；
5. 只做诊断与建议，严禁擅自重写正文！`;
  }
}

