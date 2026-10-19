import type { SkillDefinition } from './types';

export const BUILTIN_SKILLS: SkillDefinition[] = [
  {
    id: 'humanizer',
    name: 'humanizer',
    displayName: 'Humanizer 小说文学润色与去AI味',
    version: '2.1.0',
    author: 'NovelForge AI 团队',
    category: 'polishing',
    description: '专注于中文长篇小说的文学化润色、彻底切除大模型脸谱化套话、以五感与微反应替代情绪宣告、消除策划术语外露，打造地道人情味叙事。',
    tags: ['小说文学化', '五感沉浸', '身体微动作', '对白潜台词', '流派指纹'],
    corpusStats: {
      words: '500+ 万字',
      articleCount: '1,200+ 章节',
      modelCount: '长篇网络文学金榜对照',
      comparisonBasis: '网文白金作家名作 vs 各主流大模型生成正文',
    },
    enabled: true,
    systemPromptFragment: `【Humanizer 文学润色守则】：
1. 严禁说明文式转折：严禁“首先、与此同时、这代表着、不仅如此、总的来说、不得不说”等议论文行文；
2. 严禁上帝视角虚假总结：严禁“殊不知，命运的齿轮已然开始转动”、“此时的他还不知道自己将面临什么”；
3. 践行 Show, Don't Tell：将抽象情绪转化为五感细节与真实肌肉生理反应（喉结滚动、指节发白、后背寒毛直立、耳畔风声）；
4. 绝不泄露策划与代码术语：正文与对白中严禁“Flag、回收、核心驱动力、结算、战力数值、剧情推进、逻辑矛盾”；
5. 对白生活化与潜台词：交锋在言外之意，说话伴随微动作，允许犹豫、反问、话留半句；
6. 封杀脸谱化肌肉抽搐：严禁“嘴角勾起冷笑/弧度”、“眼中闪过一丝不可察觉的……”、“深吸一口气”、“空气仿佛凝固”。`,
    rules: [
      {
        id: 'hum_show_not_tell',
        name: '具象化物理细节替代情绪宣告 (Show, Don\'t Tell)',
        trigger: '直接用抽象形容词宣告主角的情绪（极度愤怒、屈辱、默契、悲伤）',
        severity: 'HIGH',
        description: '大模型极爱用说明文方式总结情绪，文学创作必须通过具体肌肉动作、生理受力、环境声色呈现。',
        badExample: '他感到极度的愤怒与屈辱，胸中翻江倒海，嘴角扯出一抹冷笑。',
        goodExample: '他死死咬着后槽牙，牙龈渗出一股铁锈味，右拳在袖中攥得骨节发白，青石板地面被硬生生踩掉一层薄灰。',
      },
      {
        id: 'hum_no_meta_leakage',
        name: '严厉禁绝设计与系统术语外露 (No Meta Leakage)',
        trigger: '正文描写或非系统流对话中出现网文策划术语（Flag、回收、剧情推进、战力数值等）',
        severity: 'HIGH',
        description: '角色的反应必须根植于其当下生理状态与生存欲望，拒绝沦为作者推剧情的工具人。',
        badExample: '他意识到这是一个关键的剧情伏笔，自己必须在这一阶段完成任务目标。',
        goodExample: '他盯着地上的半枚铜钱，心里清楚，要是天黑前凑不齐下个月的汤药钱，娘熬不过这个冬天。',
      },
      {
        id: 'hum_dialogue_subtext',
        name: '对白生活化、留白与潜台词',
        trigger: '角色一口气倾倒大段毫无阻碍的背景说明或设定背诵',
        severity: 'MEDIUM',
        description: '真实人际交锋重在试探与弦外之音。说话时伴随眼神偏转、端茶不饮、点烟等微动作，拒绝宣讲。',
        badExample: '“张兄，正如你所知，灵霄阁在三十年前曾经爆发过一次内乱，分裂成了天道宗与地灵门……”',
        goodExample: '“三十年前灵霄阁那场大火……”他端起茶碗，在唇边停了半晌，到底没喝，又轻轻撂回桌上，“你真以为是走水？”',
      },
      {
        id: 'hum_cliche_mouth',
        name: '禁用嘴角抽搐式套话',
        trigger: '出现“嘴角勾起/扯出一抹……笑/弧度”',
        severity: 'HIGH',
        description: '网文大模型最高频的肌肉痉挛描写，严重削弱人物情绪真实度。',
        badExample: '见状，他嘴角勾起了一抹胜券在握的邪魅笑容。',
        goodExample: '他眉梢微微一挑，喉底溢出一声极轻的嗤笑，目光从对方脸上扫过。',
      },
      {
        id: 'hum_cliche_eyes',
        name: '禁用自相矛盾的眼神洞察',
        trigger: '出现“眼中闪过一丝不可察觉的……”',
        severity: 'HIGH',
        description: '既然“不可察觉”，作为第三人称叙述者又如何得知？属于典型的偷懒自相矛盾句。',
        badExample: '老者的眼中闪过了一丝微不可察的异色。',
        goodExample: '老者搭在拐杖上的枯瘦手指轻轻一颤，眼皮耷拉下来，没再搭话。',
      },
      {
        id: 'hum_cliche_breathe',
        name: '禁用公式化深呼吸',
        trigger: '遇到紧张或变故时必定“深吸了一口气”',
        severity: 'MEDIUM',
        description: '大模型每逢悬念或冲突必写深呼吸，造成严重的阅读疲劳。',
        badExample: '面对强敌，他深吸了一口气，拔出了腰间的长剑。',
        goodExample: '寒风卷过，他喉结上下滚了滚，掌心在剑柄缠裹的粗麻布上重重抹去冷汗。',
      },
      {
        id: 'hum_cliche_air_frozen',
        name: '禁用“空气仿佛凝固了”类环境套话',
        trigger: '出现“空气仿佛凝固/安静得连一根针掉在地上都听得见”',
        severity: 'MEDIUM',
        description: '极其偷懒的凝滞环境套话，应当用特定声音或静态物象落地。',
        badExample: '话音落下，整个大厅的空气仿佛瞬间凝固了。',
        goodExample: '屋里一下子没了动静。案头香炉里的一缕青烟笔直往上钻，连晃都没晃一下。',
      },
    ],
    negativeRules: [
      {
        id: 'hum_neg_no_generic_conclusion',
        name: '禁止用上帝视角作宏大空泛的宿命总结',
        reason: '网文最忌讳作者跳出来宣告命运，必须完全贴合主角有限在场视角。',
        forbiddenAction: '严禁写“殊不知，命运的齿轮在这一刻开始转动”',
        empiricalFact: '优秀中文长篇小说中主角无法预知未来，此类宣告会彻底打破沉浸代入感。',
      },
    ],
  },
  {
    id: 'lieflat-less-ai-tone',
    name: 'lieflat-less-ai-tone',
    displayName: 'Lieflat 语言学实证去AI味',
    version: '1.0.0',
    author: 'Moxt & larashero3',
    category: 'linguistics',
    description: '基于 283 万字对照语料（629 篇文章，5 大主流模型 vs 人类作家实作），经统计检验确立的 11 条真·AI 味白名单规则。未命中规则严禁乱改，保留原文事实与结构。',
    tags: ['283万字语料', '语言学量化', '白名单最小改动', '严防假去AI味', '实证检验'],
    corpusStats: {
      words: '2,826,972 汉字',
      articleCount: '629 篇（300 篇模型 / 329 篇人类）',
      modelCount: 'DeepSeek / Claude / GPT / Gemini / Kimi 5大模型对照',
      comparisonBasis: '逐项计算生成侧与人类侧的频率比，严格排除伪 AI 特征',
    },
    enabled: true,
    systemPromptFragment: `【Lieflat 语言学实证去 AI 味规则（白名单最小化手术，未命中规则严禁擅改）】：
1. 翻案腔：禁止虚立读者误解再推翻（“不是……而是……”、“看似……实则……”、“你以为……其实……”），直接正面给出判断；
2. 顿号罗列过密：一个分句内禁止出现两个以上顿号连起三项以上并列，改逐项罗列为概括或改变句法；
3. 相邻句结构同款：禁止相邻两句以上成分、句式、逗号位置高度对称（像在填表），必须打散一句的句法结构；
4. 破折号滥用：禁止拿破折号制造刻意停顿与揭晓（“——答案是专注”），改用正常逗号或直接陈述；
5. 冒号滥用：禁止提示语引出内容（“核心是：”、“一句话总结：”）或以冒号收尾引出列表的空转句；
6. 序数词小标题：禁止通篇小标题以“一、二、三”从头排到尾，删掉编号保留标题文字；
7. 拟人化职业喻体：严禁将工具或流程比作“像一位智慧的导师/永不疲倦的初级审查员”，换成实际行为说明；
8. 数据被名词化概括掩盖：原文已给出的具体数值、时间，严禁用“显著提升/优化”等抽象名词掩盖，恢复动词；
9. 禁用起手式：删掉“说白了”、“说穿了”、“先说结论”；
10. 5 类翻译腔：清除过长前置定语（>15字接“的”）、“当……时”前置从句、前置话题壳（“对于……来说”）、句首连接词路标、“这意味着”式同义复述；
11. 段首零主语评论：非首段禁止以“听起来/看起来/值得注意的是”开头却不给“这/那”等回指成分。
【严厉禁改区】：实测人类设问句是 AI 的 17 倍，比喻是 AI 的 2.4 倍，严禁删设问句和正常比喻！严禁盲目调句长拆短段！`,
    rules: [
      {
        id: 'lie_twist_cavil',
        name: '翻案腔 (先立靶子后反转)',
        trigger: '出现“不是……而是……”、“并非……而是……”、“表面……实际……”、“看似……实则……”、“你以为……其实……”、“说到底”',
        severity: 'HIGH',
        frequencyStat: 'AI 0.70/千字，人类极少无端预设读者误解',
        description: '翻案腔先立一个读者并没有的误解，再把它推翻。改法：直接从正面下判断。',
        badExample: '真正的壁垒不是技术，而是认知。',
        goodExample: '真正的壁垒是认知。',
      },
      {
        id: 'lie_dense_enumeration',
        name: '顿号罗列过密',
        trigger: '一个分句内出现两个以上顿号，连起三项以上并列成分',
        severity: 'MEDIUM',
        frequencyStat: '实测 AI 3.21/千字，人类 1.78，倍率近 2 倍',
        description: '一句里塞进一整份清单。改法：能概括就别逐项罗列；必须保留时改变其中一项句法。',
        badExample: '无论是初创公司、中型企业，还是大型集团，都能从中受益。',
        goodExample: '各种规模的公司都能用。',
      },
      {
        id: 'lie_adjacent_structure',
        name: '相邻句结构同款 (填表式句法)',
        trigger: '相邻两句以上，逗号数量相同、成分顺序相同、长度接近（连续主谓宾＋补充说明）',
        severity: 'HIGH',
        frequencyStat: '实测连续两句同构 AI 为人类 2 倍，连续三句为 2 倍',
        description: '单看每句都通顺，连起来像在填表。改法：打散其中一句的句法（合并、拆分、换语序）。',
        badExample: '这个功能上线后用户反馈很好。团队的开发效率提升明显。下一步的优化方向已经确定。',
        goodExample: '这个功能上线后用户反馈很好，团队开发效率也提升了。下一步优化什么，已经定了。',
      },
      {
        id: 'lie_dash_abuse',
        name: '破折号滥用 (刻意揭晓感)',
        trigger: '使用破折号“——”制造停顿后的戏剧性揭晓或冗余补充',
        severity: 'HIGH',
        frequencyStat: 'DeepSeek 5.16/千字，Claude 4.25/千字，人类仅 0.80',
        description: '拿破折号强调普通判断。改法：直接写完整句子，改用逗号或句号。',
        badExample: '答案其实很简单——专注。',
        goodExample: '答案是专注。',
      },
      {
        id: 'lie_colon_abuse',
        name: '冒号滥用 (提示语或空转行引出)',
        trigger: '冒号前是“核心是：”、“一句话总结：”、“原因有两个：”或空转行宣布下面有列表',
        severity: 'HIGH',
        frequencyStat: '提示语冒号 AI 是人类 3.8 倍；空转列表句 AI 是人类 9 倍',
        description: '让冒号替自己说话。改法：提示语不承担信息时直接删掉；空转句写成有内容的判断。',
        badExample: '一句话总结：这个方案成本太高。',
        goodExample: '这个方案成本太高。',
      },
      {
        id: 'lie_ordinal_headings',
        name: '序数词当小标题',
        trigger: '小标题（# 开头或独立加粗行）以“一、二、三”或“第一、第二”从头排到尾',
        severity: 'MEDIUM',
        frequencyStat: 'AI 典型模板特征，小标题说明内容被挤到次要位置',
        description: '改法：删掉“一、二、三”编号，保留小标题原有文字。',
        badExample: '## 一、先别急着写需求\n## 二、拆分核心模块\n## 三、合成可用草案',
        goodExample: '## 先别急着写需求\n## 拆分核心模块\n## 合成可用草案',
      },
      {
        id: 'lie_anthropomorphic_metaphor',
        name: '拟人化职业喻体',
        trigger: '“像/相当于 + 一位/一个 + 导师/秘书/助手/顾问/管家/审查员”配褒义修饰或“不仅……更……”',
        severity: 'HIGH',
        frequencyStat: '实测 AI 是人类的 7.3 倍；带“永不疲倦/智慧”修饰时高达 12.6 倍',
        description: '在替作者廉价抒情，没有解释任何机制。改法：换成这东西实际做了什么。',
        badExample: '它就像一位智慧的导师，不仅传授结论，更传授看待世界的多元视角。',
        goodExample: '它不只给结论，也讲看待问题的不同角度。',
      },
      {
        id: 'lie_data_nominalization',
        name: '把已有的具体数据写回概括表述',
        trigger: '用“实现了……的提升/优化/大幅增长”，同段已有具体数据',
        severity: 'MEDIUM',
        frequencyStat: '数字密度人类是 AI 的 2.8 倍，AI 喜用名词化掩盖材料',
        description: '改法：把已有的具体值提到概括词位置，恢复动词。',
        badExample: '新系统实现了效率的提升。处理时间从两小时缩短到四十分钟。',
        goodExample: '新系统把处理时间从两小时缩短到四十分钟。',
      },
      {
        id: 'lie_forbidden_openers',
        name: '禁用起手式',
        trigger: '句首出现“说白了”、“说穿了”、“先说结论”',
        severity: 'MEDIUM',
        frequencyStat: 'AI 议论文典型起手式',
        description: '删掉后直接陈述判断。',
        badExample: '说白了，这个项目没有足够的预算。',
        goodExample: '这个项目预算不足。',
      },
      {
        id: 'lie_translation_cliches',
        name: '5 类高频翻译腔',
        trigger: '过长前置定语（>15字接“的”）、“当……时”前置从句、前置话题壳（“对于……来说”）、句首连接词路标、“这意味着”式复述',
        severity: 'HIGH',
        frequencyStat: '英文关系从句直译的高频残留',
        description: '只处理这 5 种结构，其余不以翻译腔擅自改动。',
        badExample: '当所有人都能用 AI 写文章时，内容本身就不再是竞争优势。',
        goodExample: '所有人都能用 AI 写文章，内容本身就不再是竞争优势。',
      },
      {
        id: 'lie_zero_subject_comment',
        name: '段首零主语评论',
        trigger: '非首段以“听起来/看起来/说白了/值得注意的是/更重要的是”开头，整句无“这/那”等回指成分',
        severity: 'HIGH',
        frequencyStat: 'AI 发生率是人类的 4.4 倍',
        description: '读者得回上一段找主语。改法：在段首补一个回指词（如加一个“这”字）。',
        badExample: '听起来像一条功能描述，其实底下换掉了一样更根本的东西。',
        goodExample: '这听起来像一条功能描述，其实底下换掉了一样更根本的东西。',
      },
    ],
    negativeRules: [
      {
        id: 'lie_neg_no_deleting_questions',
        name: '严禁删除正文设问句与反问',
        reason: '流传观点认为设问是 AI 味，但实测人类正文设问句是 AI 的整整 17 倍！删掉设问反而严重丧失人情味。',
        forbiddenAction: '禁止删除文章或小说中的自问自答、反问与思考性设问',
        empiricalFact: '人类正文设问频率为每万字 23.4 次，AI 仅 1.3 次。',
      },
      {
        id: 'lie_neg_no_deleting_metaphors',
        name: '严禁删除正常比喻与独立成段比喻',
        reason: '人类使用比喻的频率是 AI 的 2.4 倍，比喻独立成段更是 AI 的 8 倍！本技能只禁止理想化职业拟人喻体。',
        forbiddenAction: '禁止将生动形象的人类喻体改写成干瘪陈述',
        empiricalFact: '人类比喻密度为 4.12/千字，AI 为 1.71/千字。',
      },
      {
        id: 'lie_neg_no_sentence_length_tweaking',
        name: '严禁为了所谓的“节奏”强行改句长或拆短段',
        reason: '实测人类与 AI 在句长散度、段落长短参差度上没有任何统计学差异。硬拆短句属于无意义折腾。',
        forbiddenAction: '禁止为了追求短句把连贯长句机械截断',
        empiricalFact: '人类句长标准差 12.8，AI 13.1，统计学检验 p > 0.05（无差异）。',
      },
      {
        id: 'lie_neg_no_deleting_parallelisms',
        name: '保留句内同构排比',
        reason: '“提升效率，降低成本，优化体验”这类同构短语人类用得不比 AI 少。本技能只处理句与句之间的骨架同款。',
        forbiddenAction: '禁止改动分句内部的对称并列',
        empiricalFact: '句内排比人类出现率与 AI 相当。',
      },
      {
        id: 'lie_neg_preserve_normal_passives',
        name: '保留现代汉语正常被动句与名词化',
        reason: '现代书面语已吸收了被动句与长句，属于合法规范中文，禁止盲目强加口语“被”字改写。',
        forbiddenAction: '禁止把严肃书面语统一降级为口头聊天大白话',
        empiricalFact: '抽象被动在 AI 样本中出现率不足 0.09/千字，非主要 AI 特征。',
      },
    ],
  },
  {
    id: 'story-architect',
    name: 'story-architect',
    displayName: 'Story Architect 宏观因果与剧情架构',
    version: '1.0.0',
    author: '小说戏剧张力 Skill Pack',
    category: 'architecture',
    description: '分析和设计小说宏观节奏、人物选择、因果链、情绪曲线及伏笔结构。解决剧情流水账、中段注水、冲突无后果、反转公式化等硬伤，输出可编辑的结构方案。',
    tags: ['宏观架构', '硬核因果链', '不可逆代价', '三向方案', '伏笔逆推', '非等距节奏'],
    executionChainHint: '新建故事阶段建议首选：/story-architect → /ending-forge → /scene-dramaturge',
    enabled: true,
    systemPromptFragment: `【Story Architect 宏观因果与剧情架构守则】：
1. 优秀节奏绝非等距冲突，而是读者的期待不断被人物的选择与现实后果重新塑造；
2. 拒绝匀速流水账与换皮反转，角色的危机必须从其性格盲点、资源限制与过往选择中自然衍生；
3. 为每个主要转折给出“因为 A 的选择，导致 B 的代价，因此 C 不得不改变策略”的硬核因果链；
4. 每次交付至少三种结构真正不同的剧情方案（角色先犯错、先赢后失去、持续不作为引发成本等）；
5. 找出每个方案的一个“最不愿做却必须做的决定”及其不可逆后果（失去信任、打破自我认识、关系瓦解等）；
6. 逆向检查伏笔：关键转折若依赖新信息，前文必须曾有可察觉的证据；读者可以误读，不该被作者欺骗；
7. 允许连续低压和日常静场，为后续情绪赋予独特抵押品。`,
    rules: [
      {
        id: 'sa_causal_chain',
        name: '硬核因果链 (拒绝“然后/恰好/突然”)',
        trigger: '情节推进依赖“然后/恰巧/突然之间/碰巧”，缺乏前置人物动机驱动',
        severity: 'HIGH',
        description: '转折必须遵循“因为 A 的选择，导致 B 的代价，因此 C 改变策略”，严禁外部巧合强推。',
        badExample: '主角在街上走着，突然跳出来一个刺客，恰好被路过的宗门长老救下。',
        goodExample: '主角为换取灵药私售宗门禁符，被坊市眼线盯上；巡街执事顺藤摸瓜将他堵在死巷，逼他交出账册。',
      },
      {
        id: 'sa_irreversible_cost',
        name: '不可逆决策代价',
        trigger: '人物作出了重大抉择，但次日状态完好如初，没有任何持久后果',
        severity: 'HIGH',
        description: '后果必须不可逆：失去信任、暴露底牌、打破自我认知或关系永久撕裂，不能只靠皮外伤搪塞。',
        badExample: '主角违背誓言偷盗秘籍，被罚面壁三日，出来后与师妹依旧说说笑笑。',
        goodExample: '主角擅动禁术虽保全了性命，却亲手烧毁了亡妹唯一的遗物，此后三年他再未踏入宗祠半步。',
      },
      {
        id: 'sa_non_uniform_pacing',
        name: '非等距张力与呼吸感',
        trigger: '按固定字数或固定百分比机械安排打斗和爆点，连续高压导致阅读麻木',
        severity: 'MEDIUM',
        description: '优秀叙事需要张弛有度。日常、琐碎与温情场景是后续毁灭与失去的必要抵押品。',
        badExample: '第一章遇刺，第二章打擂，第三章掉悬崖，第四章战妖兽，章章生死搏杀。',
        goodExample: '大战前夕，老卒围着火堆用刺刀削土豆，轻声念叨着开春给闺女带的绸带。营地外风声呜咽。',
      },
      {
        id: 'sa_foreshadow_check',
        name: '逆向伏笔查证',
        trigger: '高潮决胜突然掏出从未提过的神奇法宝或临时新增的规则救场',
        severity: 'HIGH',
        description: '前文必须有读者可误读但真实存在的物理证据，禁止机械降神与信息欺诈。',
        badExample: '危急关头，主角突然想起了师尊临行前悄悄塞入袖口的一枚九转破界神符。',
        goodExample: '主角摸向怀中那枚一直当成火折子用的生锈铁筒——那是三天前铁匠死前死死攥在手里的东西。',
      },
    ],
    negativeRules: [
      {
        id: 'sa_neg_no_auto_memory',
        name: '严禁将架构方案自动写入事实记忆',
        reason: '结构设计是可探索的多选方案，必须经作者审阅采纳后才可进入正史。',
        forbiddenAction: '禁止未经用户确认将 Architect 方案当成 Canon 写入 L4 记忆',
        empiricalFact: '作者通常会在此阶段迭代比对多个版本。',
      },
      {
        id: 'sa_neg_no_deleting_quiet_scenes',
        name: '严禁擅自删减情绪抵押静场',
        reason: '生活场景并非“注水”，没有平静的建立就没有失去的重量。',
        forbiddenAction: '禁止以“节奏缓慢”为由粗暴删除温情与生活细节',
        empiricalFact: '经典文学与高分网文的高光时刻依赖前期的情绪铺垫。',
      },
    ],
  },
  {
    id: 'scene-dramaturge',
    name: 'scene-dramaturge',
    displayName: 'Scene Dramaturge 单场景导演与呼吸',
    version: '1.0.0',
    author: '小说戏剧张力 Skill Pack',
    category: 'dramaturgy',
    description: '设计和改写小说单章、单场景的戏剧张力、微观节奏、潜台词、动作后果及语言呼吸。支持双导演方案进场，允许静默和生活场景，不强制每章反转。',
    tags: ['单场景导演', '双方案进场', '动作物象化', '潜台词博弈', '后坐力保留', '生活静场'],
    executionChainHint: '单章写作推演：提供【后果切入】与【细节延迟】两种导演方案，择优成稿',
    enabled: true,
    systemPromptFragment: `【Scene Dramaturge 单场景导演守则】：
1. 一场戏不一定有争吵或反转，但必须给阅读带来理由：关系微变、行动条件改变、生活细节日后可被重估；
2. 提交两条有显著差异的进入方式（如：从后果切入/压缩过程 vs 从微小生活细节切入/延迟揭露）；
3. 用场面中可观察的事物呈现情绪（动作变形、称呼改变、主动避开某个话题、此前珍视的东西被冷落），严禁给情绪直接贴标签；
4. 冲突优先是目标不兼容与人格边界，善良人在合理利益中也会彼此伤害；
5. 人物不应为制造戏剧性而突然失去常识或违背既定能力；
6. 保留剧情后坐力：现实成本不会凭一场道歉归零；
7. 允许在不完整情绪中自然停下，不强求每章必须有金句、诗意总结或机械悬念。`,
    rules: [
      {
        id: 'sd_dual_director_plan',
        name: '双导演方案进场 (后果切入 vs 细节延迟)',
        trigger: '进入新场景时总是千篇一律的时间地点报幕或流水账交代',
        severity: 'MEDIUM',
        description: '每次写作或重塑前，构思两条差异化进场策略，避免单一单调的进场套路。',
        badExample: '第二天清晨，太阳升起来了，主角来到李府大门前，敲响了门环。',
        goodExample: '方案A（后果切入）：李府正堂的青瓷茶盏摔得粉碎时，主角手里的半截欠条刚按上指印。\n方案B（细节延迟）：晨光斜照在门槛上，守门老仆一下一下扫着落叶，直到主角的黑靴踩住最后一片枯叶。',
      },
      {
        id: 'sd_observable_emotion',
        name: '情绪可观察物象化 (拒绝贴标签)',
        trigger: '直接使用“感到极度愤怒/震惊/陷入沉思/心中翻江倒海”宣告情绪',
        severity: 'HIGH',
        description: '用习惯动作变形、称呼改变、主动避开某个话题呈现情绪，严禁向读者报幕。',
        badExample: '听到这个噩耗，他感到极度震惊与心痛，脸色惨白。',
        goodExample: '他手里的筷子停在半空，停了三息，夹着的酱肉啪嗒一声掉在粗布裤腿上。他没去捡，只是直勾勾盯着油渍晕开。',
      },
      {
        id: 'sd_no_idiot_plot',
        name: '拒绝人物与反派临时降智',
        trigger: '角色为了触发危机突然丧失基本判断力，或老谋深算的反派突然大意犯错',
        severity: 'HIGH',
        description: '危机必须源自角色已有的固有盲点、信息差或两难取舍，不能强行降智。',
        badExample: '经验老道的斥候竟然在敌营旁边点燃大火烤肉，引来了追兵。',
        goodExample: '斥候明知林中有伏，但身中剧毒的战友体温失衡开始抽搐，他咬着牙点燃了仅剩的无烟松脂。',
      },
      {
        id: 'sd_scene_aftermath',
        name: '保留剧情真实后坐力',
        trigger: '激烈的背叛或争吵后，一句轻飘飘的道歉或玩笑就让关系毫发无损地复原',
        severity: 'MEDIUM',
        description: '现实冲突具有后坐力与隔阂。即使表面和解，人物的防御姿态和防备习惯依旧会残留。',
        badExample: '“对不起，是我误会你了。”“没事，我们还是好兄弟！”两人相视一笑，重归于好。',
        goodExample: '“昨晚的事……是我急了。”他递过干粮。对方接过去咬了一口，没接话，睡觉时靴子依然紧紧系着带子。',
      },
    ],
    negativeRules: [
      {
        id: 'sd_neg_no_forced_twists',
        name: '严禁每章强制塞入突发反转与爆点',
        reason: '每章强行制造反转不仅会让故事悬浮，更会透支读者的信任度。',
        forbiddenAction: '禁止无依据地插入外部车祸、暗杀、突发灾难',
        empiricalFact: '高质量中长篇小说的张力建立在持续的认知重估而非突发灾难。',
      },
      {
        id: 'sd_neg_preserve_dialogue_gaps',
        name: '保留对白中的防御与答非所问',
        reason: '真实对话充满潜台词与回避，禁止将其改写为互通信息的说明书。',
        forbiddenAction: '禁止将角色富有防御感的对话重构成扁平的一问一答',
        empiricalFact: '文学对话中 40% 的张力来自未说出口的信息。',
      },
    ],
  },
  {
    id: 'ending-forge',
    name: 'ending-forge',
    displayName: 'Ending Forge 有代价的结局与反转',
    version: '1.0.0',
    author: '小说戏剧张力 Skill Pack',
    category: 'dramaturgy',
    description: '专门处理小说高潮、转折与结尾无力：利用人物不可逆选择、前文因果伏笔、价值冲突、迟到的情绪回响，设计可信而不套路的结局。用于悲剧、末日、生存、亲情及悬疑等题材。',
    tags: ['结局设计', '高潮自洽', '三向价值结局', '不可逆代价', '倒推铺垫表', '迟到回响'],
    executionChainHint: '用结局反推前文：锁定主题代价与倒推铺垫表，核验正文是否已有公平支撑',
    enabled: true,
    systemPromptFragment: `【Ending Forge 结局与反转守则】：
1. 好的结局兑现主角一路以来的价值困境，使既有事实获得更深意义，并留下无法撤销的后果；
2. 至少生成三种价值判断不同的结局路线（苦涩兑现、克制和解、延迟认知），而非同一结局替换伤亡名单；
3. 主角必须亲自作出关键抉择，纯事故不能替代人物弧光；
4. 反转必须重新解释旧信息，严禁天降全新设定或规则救场；
5. 最后的情绪经由具体动作/物件/缺席产生，严禁旁白直接宣告“所有人泪流满面”；
6. 给出“结局倒推铺垫表”，指明前文哪个场景需要提前埋设可被误读的公平证据。`,
    rules: [
      {
        id: 'ef_protagonist_agency',
        name: '主角亲自做出关键抉择 (拒绝事故替代弧光)',
        trigger: '结局的高潮解决依靠自然灾害、敌人突发暴毙或路人偶然相救',
        severity: 'HIGH',
        description: '高潮的终局必须由主角在两个不可调和的代价之间作出不可逆抉择，确立人物弧光。',
        badExample: '大决战时，穷凶极恶的大反派突然被一道天降神雷劈死了。',
        goodExample: '主角在阵眼崩塌前最后一瞬，松开了握紧三年的本命仙剑，反手拉住了跌落深渊的同门。',
      },
      {
        id: 'ef_triple_value_endings',
        name: '三向价值结局设计',
        trigger: '构思结局时只考虑“谁死了/谁活着”的二元胜负，缺乏思想深度',
        severity: 'MEDIUM',
        description: '提供三种截然不同价值取向的收束路线：苦涩兑现、克制和解、延迟认知。',
        badExample: '结局一：主角杀了反派；结局二：主角被反派杀了。',
        goodExample: '方案甲（苦涩兑现）：赢得了王座，但昔日同生共死的伙伴已无人敢直视他的眼睛；\n方案乙（克制和解）：未能逆天改命，但在生命的终点终于放下了对父亲一生的怨怼；\n方案丙（延迟认知）：二十年后老宅翻新，在房梁下发现了当年那封未曾寄出的绝笔信。',
      },
      {
        id: 'ef_reinterpreting_clues',
        name: '反转重释旧信息 (拒绝临时加设定)',
        trigger: '反转全靠揭露读者与角色从未听过的新门派、新规则或临终录音',
        severity: 'HIGH',
        description: '绝妙的反转是“将早就摆在读者眼前的旧细节赋予完全不同的解释”，让读者恍然大悟。',
        badExample: '反派死前冷笑道：“其实我手里有一份世界意志留下的秘密卷轴，你们全被骗了！”',
        goodExample: '主角看着老管家递过来的左手茶，突然想起三年前第一次见面时，老管家也是用这只残废的左手端茶。',
      },
      {
        id: 'ef_quiet_aftermath',
        name: '高潮后留出半步安静 (拒绝金句口号)',
        trigger: '决战刚结束，旁白立刻长篇大论抒情宣布“这是一场伟大的胜利”或强行升华金句',
        severity: 'HIGH',
        description: '高潮后让情绪在具体物象中自行沉降。可以迅速截断，也可以给半步安静的余波。',
        badExample: '这注定是一场载入史册的壮举，命运的赞歌在天地间回荡，所有人泣不成声。',
        goodExample: '雨停了。泥水从断裂的城门槛上慢吞吞渗下去。他坐在残石上，把水囊拧开，喝了一口，又默默拧紧。',
      },
    ],
    negativeRules: [
      {
        id: 'ef_neg_no_cheap_death',
        name: '严禁为了煽情廉价发便当',
        reason: '突如其来的死亡无法弥补人物动机的苍白，反而暴露作者的情感操纵。',
        forbiddenAction: '禁止无前因后果地杀死重要配角催泪',
        empiricalFact: '经典悲剧的力量源于命运的不可避免，而非无因横祸。',
      },
      {
        id: 'ef_neg_no_deus_ex_machina',
        name: '严禁机械降神与新规则救场',
        reason: '在最后一章打破已建立的世界观公理是对读者契约的背叛。',
        forbiddenAction: '禁止使用未埋设过线索的超自然奇迹抹平困境',
        empiricalFact: '没有伏笔支撑的奇迹会使全书的情感真实度彻底归零。',
      },
    ],
  },
  {
    id: 'cold-reader',
    name: 'cold-reader',
    displayName: 'Cold Reader 零继承读者视角盲审',
    version: '1.0.0',
    author: '小说戏剧张力 Skill Pack',
    category: 'audit',
    description: '以首次阅读者视角盲审小说原文，找出节奏拖沓、假冲突、廉价反转、解释型情绪、人物降智和结局不兑现等具体问题。严格隔离作者大纲与辩解，只做有证据的诊断与最小修复建议，不擅自重写。',
    tags: ['读者盲审', '零继承隔离', '注意力卡顿', '伪高潮拦截', '证据短引', '最小修复建议'],
    executionChainHint: '已有稿件建议首选：先 /cold-reader 盲审体检 → 再针对性局部返修',
    enabled: true,
    systemPromptFragment: `【Cold Reader 零继承读者盲审守则】：
1. 严格隔离原则：作为首次阅读者，只读正文与受众，严禁加载作者的情节解释、大纲辩护与原审稿结论；
2. 边读边记录原文确切位置与短引文：标明何处注意力下降、何时预见反转、何处怀疑角色动机；
3. 严查伪高潮：突然杀死刚出场人物、偶然救援、反派临时失智、最后才告知关键规则、章末“然而他殊不知”机械断章；
4. 诊断契约格式：输出 3-5 句读者总体认知 + 带证据的诊断表 + 转折期许表（预期 vs 发生 vs 情绪效应）；
5. 最小修复建议：只提出优先级最高的三项修改方案，每项说明“过度修复会损失什么”；
6. 坚守非破坏性：只诊断不擅自重写正文，尊重作者最终决策权。`,
    rules: [
      {
        id: 'cr_attention_drop',
        name: '追踪读者注意力卡顿点',
        trigger: '大段说明性设定灌输、行动停滞、无意义重复争执导致读者阅读倦怠',
        severity: 'HIGH',
        description: '指出具体哪一段让读者想跳读或划走，并剖析是因果松弛还是信息冗余。',
        badExample: '连续三千字通过角色内心独白复述上一章已经发生过的往事。',
        goodExample: '精确指出段落位置，标记“第 4 自然段至第 7 自然段重复论述了家族贫困，缺乏新的行动压力”。',
      },
      {
        id: 'cr_predictable_twists',
        name: '预见性早衰与廉价反转',
        trigger: '反转设计过于刻意或模式化，读者在半途便已轻易猜透全部结局',
        severity: 'MEDIUM',
        description: '标明在哪个节点已识破反转，评估这种可预测性是建立了期待还是变成了无趣剧透。',
        badExample: '神秘黑袍人一出场，台词和习惯动作就与前面死去的师兄一模一样。',
        goodExample: '记录“在第 12 段提到‘药香味’时，读者已猜到卧底是神医，后文的反转失去了冲击力”。',
      },
      {
        id: 'cr_pseudo_climax',
        name: '封杀典型伪高潮与机械断章',
        trigger: '章末出现“然而他并不知道……”、“殊不知……”等机械制造的假悬念',
        severity: 'HIGH',
        description: '作者越俎代庖替读者制造悬念，暴露技巧拙劣，必须改为人物真实动作停顿。',
        badExample: '他收起玉简微笑着离去。然而他并不知道，黑暗中正有一双血红的眼睛死死盯着他的后背。',
        goodExample: '他把玉简收入袖中，走出回廊。风吹得檐角的铜铃当啷作响，雪地里多了一串还冒着热气的脚印。',
      },
      {
        id: 'cr_top3_minimal_repairs',
        name: '交付前三项高优先最小修复',
        trigger: '审稿建议动辄要求“推翻重写前三章”或“全面推翻主角人设”',
        severity: 'MEDIUM',
        description: '只挑出影响最大的三个核心断点，提供动手术最小的补强方案，并注明过度修改的风险。',
        badExample: '整章情节平淡，建议推倒重构，重写整个高潮冲突。',
        goodExample: '建议仅将第 8 段的口头认错改为“把仅剩的半袋水放在桌角”，即可保留人物的尊严与愧疚。',
      },
    ],
    negativeRules: [
      {
        id: 'cr_neg_no_silent_rewriting',
        name: '严禁未经许可擅自重写正文',
        reason: 'Cold Reader 的天职是精准诊断与提供视角，绝不越俎代庖替代原作者创作。',
        forbiddenAction: '禁止直接输出覆盖原文的完整修改正文',
        empiricalFact: '作者对作品拥有最高主权，诊断与改写必须职责隔离。',
      },
      {
        id: 'cr_neg_no_imposing_quota',
        name: '严禁强加机械高潮指标',
        reason: '每千字必须有冲突或每章强制留钩子会彻底摧毁小说的文学呼吸。',
        forbiddenAction: '禁止以“缺乏冲突”为由否定符合体裁契约的静美段落',
        empiricalFact: '长篇小说的厚重感恰恰源于非均匀的波长分布。',
      },
    ],
  },
];

