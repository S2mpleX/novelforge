import type { ClicheItem } from './types';

export const NOVEL_AI_CLICHES: ClicheItem[] = [
  // 1. 脸谱化肌肉抽搐 (FACIAL_TWITCH)
  {
    phrase: '嘴角勾起',
    category: 'FACIAL_TWITCH',
    severity: 'HIGH',
    reason: '网文大模型极其高频的脸谱化机械动作，破坏人物神态真实性',
    suggestion: '改为眉骨微动、垂下眼睑、手指轻扣桌面或具体冷哼出声',
  },
  {
    phrase: '嘴角扯出',
    category: 'FACIAL_TWITCH',
    severity: 'HIGH',
    reason: '同质化严重的假面式表情',
    suggestion: '改为面皮微紧、嘴角扯动半分便又收敛，或用咬牙微动作替代',
  },
  {
    phrase: '眼中闪过',
    category: 'FACIAL_TWITCH',
    severity: 'HIGH',
    reason: '叙述者偷窥式描写，俗套且不自然',
    suggestion: '改为眼神在对方某处停留片刻、瞳孔微缩或刻意避开目光',
  },
  {
    phrase: '眼中掠过',
    category: 'FACIAL_TWITCH',
    severity: 'HIGH',
    reason: '廉价神态套话',
    suggestion: '改为移开视线、垂眸掩去眸中神色',
  },
  {
    phrase: '不可察觉的',
    category: 'FACIAL_TWITCH',
    severity: 'MEDIUM',
    reason: '既然不可察觉，叙事视角如何得知？自相矛盾',
    suggestion: '删去该词，直接写极隐蔽的物理小动作',
  },

  // 2. 机械化公式比喻与形容 (MECHANICAL_METAPHOR)
  {
    phrase: '仿佛',
    category: 'MECHANICAL_METAPHOR',
    severity: 'MEDIUM',
    reason: '过度泛滥的廉价副词，90%的情况下删去后文意更精炼有力',
    suggestion: '建议直接陈述客观物象事实，或用具体触觉/听觉感知取代虚浮比喻',
  },
  {
    phrase: '宛如',
    category: 'MECHANICAL_METAPHOR',
    severity: 'MEDIUM',
    reason: '书面化假大空比喻，削弱现场在场感',
    suggestion: '落地为特定物象属性（如霜雪、玄铁、枯叶）的具体质感',
  },
  {
    phrase: '空气仿佛凝固',
    category: 'MECHANICAL_METAPHOR',
    severity: 'HIGH',
    reason: '大模型描写紧张气氛的偷懒惯用套语',
    suggestion: '改为环境细节白描：如窗外忽止的风声、茶汤泛起的微波、烛芯噼啪爆开的声音',
  },
  {
    phrase: '空气凝固',
    category: 'MECHANICAL_METAPHOR',
    severity: 'HIGH',
    reason: '大模型描写紧张气氛的偷懒惯用套语',
    suggestion: '改为环境细节白描：如更夫打更的梆子骤停、门外落雪的沙沙声',
  },
  {
    phrase: '天地间仿佛只剩下',
    category: 'MECHANICAL_METAPHOR',
    severity: 'HIGH',
    reason: '极端夸张的假大空套话，缺乏真实声色',
    suggestion: '写第一视角感官过滤：周围的人声化为嗡嗡杂音，只听得见自己急促的心跳',
  },

  // 3. 说明文/议论文过渡腔 (EXPOSITORY_TRANSITION)
  {
    phrase: '与此同时',
    category: 'EXPOSITORY_TRANSITION',
    severity: 'HIGH',
    reason: '典型的说明文转折词，打断小说叙事沉浸感',
    suggestion: '用场景切换空行直接起笔，或从正在发生的声音/影子切入视角',
  },
  {
    phrase: '不仅如此',
    category: 'EXPOSITORY_TRANSITION',
    severity: 'HIGH',
    reason: '论文/新闻体连接词，严禁在小说正文中出现',
    suggestion: '删除连接词，直接叙述递进的事实',
  },
  {
    phrase: '毫无疑问',
    category: 'EXPOSITORY_TRANSITION',
    severity: 'HIGH',
    reason: '议论文作者说教腔，出戏',
    suggestion: '直接删去，陈述客观事实，让读者自行下结论',
  },
  {
    phrase: '不得不说',
    category: 'EXPOSITORY_TRANSITION',
    severity: 'HIGH',
    reason: '口水话与网络随笔腔，削弱文学沉浸感',
    suggestion: '直接删除，以人物第一反应写心理活动',
  },
  {
    phrase: '总而言之',
    category: 'EXPOSITORY_TRANSITION',
    severity: 'HIGH',
    reason: '总结概括腔，严重违反 Show Don\'t Tell 原则',
    suggestion: '删除概括，用角色作出的具体决断来收束段落',
  },
  {
    phrase: '总的来说',
    category: 'EXPOSITORY_TRANSITION',
    severity: 'HIGH',
    reason: '总结概括腔，严禁出现在小说正文中',
    suggestion: '直接删除',
  },
  {
    phrase: '换句话说',
    category: 'EXPOSITORY_TRANSITION',
    severity: 'HIGH',
    reason: '说明文解释腔',
    suggestion: '删除解释，用角色的行动来印证意图',
  },

  // 4. 空洞总结与上帝视角 (EMPTY_CONCLUSION)
  {
    phrase: '殊不知',
    category: 'EMPTY_CONCLUSION',
    severity: 'HIGH',
    reason: '传统评书陈词或廉价上帝视角剧透，打破限知视角的悬念感',
    suggestion: '删去该词，将阴谋与暗流隐于环境或次要角色的反常举止中',
  },
  {
    phrase: '命运的齿轮',
    category: 'EMPTY_CONCLUSION',
    severity: 'HIGH',
    reason: '网络流行烂梗，极其出戏',
    suggestion: '彻底删除，以沉稳冷静的笔触描绘当下的微小抉择',
  },
  {
    phrase: '谁也没有想到',
    category: 'EMPTY_CONCLUSION',
    severity: 'MEDIUM',
    reason: '上帝视角突兀介入',
    suggestion: '保留现场当事人的懵懂，事态突变时写突发响动或意外变故',
  },

  // 5. 公式化呼吸与生理反应 (BREATH_FORMULA)
  {
    phrase: '深吸了一口',
    category: 'BREATH_FORMULA',
    severity: 'MEDIUM',
    reason: '每遇紧张必深呼吸，极其机械',
    suggestion: '改为喉结上下滚动、屏住呼吸不敢喘气、胸口憋闷等生理细节',
  },
  {
    phrase: '倒吸一口凉气',
    category: 'BREATH_FORMULA',
    severity: 'HIGH',
    reason: '极端俗套的网文惊叹模板',
    suggestion: '写指尖发麻、后背冷汗渗出、或在场之人无人敢吭声的死寂',
  },
  {
    phrase: '倒吸一口气',
    category: 'BREATH_FORMULA',
    severity: 'HIGH',
    reason: '俗套的惊叹模板',
    suggestion: '用具体的动作僵硬、手中器具滑落落地砸碎写震惊',
  },

  // 6. 策划术语与引擎外露 (META_LEAK)
  {
    phrase: 'Flag',
    category: 'META_LEAK',
    severity: 'HIGH',
    reason: '游戏设计/剧本术语违规外露（除非第四面墙戏仿）',
    suggestion: '严禁出现在严肃正文中，写誓言或人物的不祥预感',
  },
  {
    phrase: '回收伏笔',
    category: 'META_LEAK',
    severity: 'HIGH',
    reason: '创作大纲术语外露',
    suggestion: '直接以因果揭晓情节呈现',
  },
  {
    phrase: '触发了',
    category: 'META_LEAK',
    severity: 'MEDIUM',
    reason: '带有浓重代码与机制味道（如非系统文特设）',
    suggestion: '改为触动、惊醒、引发、打破了寂静',
  },
];
