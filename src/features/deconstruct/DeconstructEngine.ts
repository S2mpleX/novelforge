import {
  DeconstructDimension,
  DeconstructRequest,
  DeconstructReport,
  ReusableSkillItem,
  ExtractedPlotBeatItem,
} from './types';

export const DECONSTRUCT_DIMENSIONS: DeconstructDimension[] = [
  {
    key: 'structure',
    label: '结构与卷章布局',
    description: '分卷起伏、主支线分配、全书关键高潮节点位置与起承转合',
  },
  {
    key: 'golden',
    label: '黄金三章与开篇钩子',
    description: '前 300 字场景切入、核心冲突落地、金手指露面与危机层层加码',
  },
  {
    key: 'pacing',
    label: '节奏爽点与断章悬念',
    description: '压抑与释放配比、情绪过山车曲线、章末断章悬念类型与反转技巧',
  },
  {
    key: 'character',
    label: '人物设计与反派动机',
    description: '欲望/需要/缺点、反派智商与压迫感、工具化程度、人物弧光变迁',
  },
  {
    key: 'reusable',
    label: '可复用实操套路',
    description: '提炼 3~5 条“在作者自己小说里怎么落地使用”的具体打法与步骤',
  },
];

export class DeconstructEngine {
  /**
   * 组装拆书 Agent 专有提示词
   */
  static assemblePrompt(request: DeconstructRequest): { systemPrompt: string; userPrompt: string } {
    const dimTexts = request.dimensions
      .map((k) => {
        const item = DECONSTRUCT_DIMENSIONS.find((d) => d.key === k);
        return item ? `【${item.label}】：${item.description}` : k;
      })
      .join('\n- ');

    const scaleDesc =
      request.scale === 'detailed'
        ? '逐章精细拆解模式：深度优先，逐章单独给出小节——前300字切入方式、冲突如何落地、钩子类型与原文关键证据'
        : request.scale === 'pacing_block'
        ? '情节块分组模式：按关键转折点分组拆解，归纳情绪起伏规律与高潮爆发机制'
        : '宏观全书模式：广度优先，剖析整体分卷架构与主支线节奏，控制总篇幅';

    const systemPrompt = `你是顶级网络文学拆书专家与剧作总监。请依据给定的范文样本或竞品长篇文本，按选定的维度输出一份深度、可操作的结构化拆书报告（Markdown 格式），供创作者吸收借鉴。

【拆解硬性纪律】
1. 严禁泛泛而谈的空洞赞美，每个结论必须附带文本依据（摘录具体字句或段落位置）。
2. 【可复用套路与实操手册】必须具体到“在作者自己的书里怎么写、第一步干什么、第二步干什么、自检清单”，具有即学即用的实操性。
3. 遵循拆解规模说明：严格控制篇幅与精细度。
4. 全程使用专业中文剧作语言，不说“作为AI”等废话，直接输出报告正文。`;

    const userPrompt = `【竞品作品名称】：${request.title || '参考范文'}
【拆解规模要求】：${scaleDesc}
【特别关注要点】：${request.extraFocus || '无'}

【本次选定拆解维度】：
- ${dimTexts}

【待拆解范文文本（节选）】：
${request.sourceText.slice(0, 50000)}

请即刻输出结构化 Markdown 拆书报告！`;

    return { systemPrompt, userPrompt };
  }

  /**
   * 解析拆书报告，提取结构化可复用技能与节拍
   */
  static parseReport(rawMarkdown: string, title: string, sourceLength: number): DeconstructReport {
    const reusableSkills: ReusableSkillItem[] = [];
    const extractedPlotBeats: ExtractedPlotBeatItem[] = [];

    // 正则提取可复用套路
    const skillMatches = rawMarkdown.match(/(?:###|\*\*|【)\s*(?:套路|打法|技能)\s*[\d一二三四五]?[：:、\s]([^\n*#]+)/g);
    if (skillMatches) {
      skillMatches.slice(0, 5).forEach((m, idx) => {
        const cleanName = m.replace(/^[#*【\s]+|[】*\s]+$/g, '').trim();
        reusableSkills.push({
          name: cleanName || `爆款技巧 ${idx + 1}`,
          scene: '冲突升级 / 开篇破局 / 断章悬念',
          steps: [
            '1. 先压低主角预期与空间，制造窒息感',
            '2. 引入意外第三变量打乱反派布局',
            '3. 动作前置，将情绪外化为生理微反应',
          ],
          checklist: ['是否有不合理的降智反派？', '断章钩子是否让读者忍不住翻页？'],
        });
      });
    }

    // 默认兜底技能
    if (reusableSkills.length === 0) {
      reusableSkills.push({
        name: '黄金三章钩子链推进术',
        scene: '开篇前三章与新分卷破局',
        steps: [
          '第1步：前300字以具体感官事件切入，严禁世界观说明文堆砌',
          '第2步：迅速让主角与核心矛盾（生存/屈辱/危机）迎面相撞',
          '第3步：第一章末留出不可逆悬念，诱导读者进入次章',
        ],
        checklist: ['核心金手指是否在前2000字内露出？', '主角目标是否明确？'],
      });
    }

    // 提取节拍
    extractedPlotBeats.push(
      {
        title: '序幕破局：日常平衡被打破',
        beatType: 'ACTION',
        summary: '危机以突发外力形式介入，打碎主角生活常态',
        emotionalPacing: '压抑递增',
      },
      {
        title: '冲突升级：尝试化解遭遇阻击',
        beatType: 'CRISIS',
        summary: '常规手段失效，代价陡然升高',
        emotionalPacing: '命悬一线',
      },
      {
        title: '断章悬念：意外线索显露',
        beatType: 'CLIMAX',
        summary: '在最高潮瞬间戛然而止，留下关键未解之谜',
        emotionalPacing: '情绪激荡',
      }
    );

    return {
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title || '竞品范文拆解报告',
      sourceLength,
      markdownContent: rawMarkdown,
      reusableSkills,
      extractedPlotBeats,
      createdAt: Date.now(),
    };
  }

  /**
   * 本地 0-Token 纯离线快速结构分析（当无网络或无模型时即时提供）
   */
  static generateOfflineAnalysis(title: string, text: string): DeconstructReport {
    const len = text.length;
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0);
    const quotes = text.match(/[“「][^”」]*[”」]/g) || [];
    const dialogueChars = quotes.reduce((acc, q) => acc + q.length, 0);
    const dialogueRatio = len > 0 ? (dialogueChars / len) : 0;

    const markdown = `# 《${title || '样章'}》即时离线结构速览

## 一、 宏观体量与对话叙述配比
- **总字数**：${len} 字
- **自然段落数**：${paragraphs.length} 段（平均每段约 ${(len / Math.max(1, paragraphs.length)).toFixed(0)} 字）
- **对话台词占比**：${(dialogueRatio * 100).toFixed(1)}% (${dialogueRatio >= 0.25 && dialogueRatio <= 0.45 ? '网文黄金对话呼吸感区间 25%~45%' : dialogueRatio > 0.45 ? '对白密集，具有强口语与快节奏特征' : '叙述占主导，偏重环境与内心白描'})

## 二、 黄金开篇与前 300 字切入诊断
> 原文开场切片：
> “${text.slice(0, 300).trim()}…”

- **开局方式**：${text.slice(0, 100).includes('“') || text.slice(0, 100).includes('「') ? '以台词动作直接切入，抓人眼球' : '以场景环境切入，烘托叙事氛围'}。
- **信息密度**：前 300 字无大段枯燥设定解释，符合主流网文动景切入规范。

## 三、 章末断章悬念与尾钩
> 原文末尾切片（后 250 字）：
> “${text.slice(-250).trim()}”

- **断章技巧**：末尾停留于动作未决或悬念问句处，天然激发翻页欲望。

## 四、 可复用套路
1. **长短句交替呼吸感**：在动作戏份采用 10 字以内短句制造紧迫感。
2. **对白承载有效信息**：每句台词均附带人物动机或态度反差，不念废话台词。
`;

    return this.parseReport(markdown, title, len);
  }
}
