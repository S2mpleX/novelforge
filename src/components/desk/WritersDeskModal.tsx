import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Play,
  Users,
  Compass,
  GitBranch,
  Map as MapIcon,
  Plus,
  Dice5,
  FileText,
  Check,
  X,
  Bookmark,
  ShieldCheck,
  BookPlus,
} from 'lucide-react';
import { BookCoverView, detectPresetByGenre } from '@/components/common/BookCoverView';
import { toast } from '@/stores/useToastStore';
import { alertDialog } from '@/utils/dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'desk' | 'wizard';
  onOpenWordImport?: () => void;
  onOpenMap?: () => void;
}

// 灵感书名与金手指预设库（按题材分类）
const GENRE_INSPIRATION_PRESETS: Record<
  string,
  {
    names: string[];
    hooks: string[];
    defaultRule: { title: string; content: string };
    firstChapter: { title: string; content: string };
  }
> = {
  '玄幻修仙': {
    names: ['《万古问道录》', '《九霄剑主》', '《太虚飞升劫》', '《大乘道宗》', '《神魔九重天》'],
    hooks: ['天生重瞳残骨，逆境悟道', '随身老爷爷传授上古残卷', '万界因果推演神盘', '宗门废柴觉醒混沌灵脉'],
    defaultRule: {
      title: '天道灵气与心魔誓约',
      content: '天地灵气遵循五行循环，修士立下天道誓言后若有违背必遭九天雷劫反噬，因果不爽。',
    },
    firstChapter: {
      title: '第一章 寒潭孤剑，重明破晓',
      content: '<p>深秋，清虚山脚下的寒潭水冷得刺骨。</p><p>少年擦去剑锋上的泥浆，目光穿透破晓前的重重迷雾。三年前被宗门剥夺灵根的那一幕，至今如附骨之疽。</p><p>“既然天地不公，这规矩，便由我来重新改写。”他握紧剑柄，掌心隐隐浮现出一枚暗金色的古篆符文。</p>',
    },
  },
  '硬核科幻': {
    names: ['《深空跃迁纪元》', '《智械黎明协议》', '《星门观测日志》', '《反物质方舟》', '《光锥之外》'],
    hooks: ['孤舰搭载人类最后意识库', '跨光年引力波通讯异常', '戴森球外壁发现超古代遗迹', '高维空间坍塌避难所'],
    defaultRule: {
      title: '质能光速与曲率航行公理',
      content: '真空光速为宇宙物理常数不可突破；曲率跃迁必须经过星门引力平衡点进行能量缓冲。',
    },
    firstChapter: {
      title: '第一章 脉冲异动，极寒之眸',
      content: '<p>“报告指挥官，开普勒-452b 观测阵列捕获到非自然调制引力波，频宽覆盖全波段。”</p><p>幽暗的舰桥内，全息投影映照出冰冷的深空图景。沉睡了八十年的冷冻舱缓缓开启，气阀嘶鸣声打破了死一般的沉寂。</p><p>林远深吸一口带着机油味的再生空气，瞳孔逐渐聚焦在闪烁着赤红警报的中央视网膜视界中。</p>',
    },
  },
  '现代都市': {
    names: ['《隐龙都市旧事》', '《异能裁决事务所》', '《黄金眼传奇》', '《商道无双》', '《迷雾之城》'],
    hooks: ['退役兵王归隐旧街旧铺', '偶然继承古董鉴定透视眼', '地下异能者秩序管理者', '金融做空对决跨国财阀'],
    defaultRule: {
      title: '异能收敛与现代法治边界',
      content: '超凡力量在公众面前受到严格掩盖，凡涉及现实治安与金融秩序均受特事局监督。',
    },
    firstChapter: {
      title: '第一章 街角古巷，暴雨将至',
      content: '<p>暴雨敲击着老城区的青石板路，街角小茶馆的木门被狂风撞得吱呀作响。</p><p>陆辰洗净茶具，替对面那位神色匆匆的中年人倒了一杯热茶。茶汤澄澈，倒映出茶馆外几个悄然逼近的黑色风衣人影。</p><p>“陆先生，他们已经找到这里了。”中年人声音颤抖。陆辰笑了笑，轻轻合上茶盖：“无妨，茶还没凉。”</p>',
    },
  },
  '末日废土': {
    names: ['《废土火种手册》', '《最后的地表避难所》', '《辐射纪元》', '《装甲拓荒者》', '《第七黎明》'],
    hooks: ['随身携带全自动化地下基建图纸', '黑雨辐射后变异兽狂潮', '净水过滤核心争夺战', '遗落科技废墟深层探险'],
    defaultRule: {
      title: '酸性黑雨与聚落生存公理',
      content: '地表黑雨具有极强生物侵蚀性；任何聚落离开防辐射屏障与深井过滤净化系统不可存活超过四十八小时。',
    },
    firstChapter: {
      title: '第一章 钢铁遗骸，辐射风暴',
      content: '<p>防毒面具的橡胶边缘硌得脸颊生疼，盖革计数器的蜂鸣声在沙暴中尖锐回荡。</p><p>苏晨拉紧破旧的风衣，借着锈蚀的废弃步战车掩护蹲下身子。在他身后的拖斗里，装着刚从废弃科研所废墟中刨出来的最后两罐未受污染的纯净水。</p><p>天边，墨绿色的酸性辐射云正以遮天蔽日之势滚滚压来。</p>',
    },
  },
  '悬疑惊悚': {
    names: ['《诡夜低语集》', '《第七密室勘验》', '《夜幕档案局》', '《阴影中的注视者》', '《不可名状之书》'],
    hooks: ['旧宅遗留带血日记本', '深夜电台收到来自未来的连线', '精神病院封存的404号病例', '旧街当铺的诡异典当物'],
    defaultRule: {
      title: '理智侵蚀与异常接触禁忌',
      content: '接触超常现象会造成不可逆的认知畸变；凝视不可知之物将直接损耗理智阈值。',
    },
    firstChapter: {
      title: '第一章 泛黄的挂钟，停滞的秒针',
      content: '<p>午夜零点零分三十秒。墙上的老式摆钟发出怪异的卡顿声，停滞不前。</p><p>顾眠放下手中的解剖记录本，忽然听见阁楼地板上传来缓慢而沉重的拖曳声——那声音很轻，却每隔七秒精确重复一次。</p><p>但他清楚地记得，这栋老房子的阁楼早在二十年前就已经被水泥彻底封死了。</p>',
    },
  },
};

export const WritersDeskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialMode = 'desk',
  onOpenWordImport,
  onOpenMap,
}) => {
  const {
    novels,
    activeNovel,
    chapters,
    activeChapter,
    selectNovel,
    selectChapter,
    createNovel,
    createChapter,
    setActiveTab,
  } = useNovelStore();

  const [mode, setMode] = useState<'desk' | 'wizard'>(
    !activeNovel || novels.length === 0 ? 'wizard' : initialMode
  );

  // 向导表单状态
  const [selectedGenre, setSelectedGenre] = useState<string>('玄幻修仙');
  const [novelTitle, setNovelTitle] = useState<string>('');
  const [selectedHook, setSelectedHook] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 案头自启动偏好设置
  const [startupShowDesk, setStartupShowDesk] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('novelforge_startup_show_desk');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  });

  // 如果没有小说，强制进入向导模式
  useEffect(() => {
    if (!activeNovel && novels.length === 0) {
      setMode('wizard');
    }
  }, [activeNovel, novels.length]);

  // 题材切换时自动推荐书名与抓手
  useEffect(() => {
    const preset = GENRE_INSPIRATION_PRESETS[selectedGenre];
    if (preset) {
      if (!novelTitle || GENRE_INSPIRATION_PRESETS[Object.keys(GENRE_INSPIRATION_PRESETS).find(k => k !== selectedGenre) || '']?.names.includes(novelTitle)) {
        setNovelTitle(preset.names[0]);
      }
      setSelectedHook(preset.hooks[0]);
    }
  }, [selectedGenre]);

  if (!isOpen) return null;

  // 偏好变更持久化
  const handleToggleStartupPref = (enabled: boolean) => {
    setStartupShowDesk(enabled);
    try {
      localStorage.setItem('novelforge_startup_show_desk', enabled ? 'true' : 'false');
      toast.info('启动偏好已保存', enabled ? '下次打开软件将优先呈现文人案头' : '下次打开软件将直接进入编辑器');
    } catch {}
  };

  // 灵感骰子：随机换一个好书名
  const handleRollRandomTitle = () => {
    const preset = GENRE_INSPIRATION_PRESETS[selectedGenre];
    if (!preset) return;
    const available = preset.names.filter((n) => n !== novelTitle);
    const rolled = available[Math.floor(Math.random() * available.length)] || preset.names[0];
    setNovelTitle(rolled);
    toast.info('灵感骰子', `已为您换取好书名：${rolled}`);
  };

  // 1 键继续写作：直接进入正文编辑器心流
  const handleResumeWriting = (chapterToSelect?: any) => {
    const target = chapterToSelect || activeChapter || (chapters.length > 0 ? chapters[chapters.length - 1] : null);
    if (target) {
      selectChapter(target);
    }
    setActiveTab('EDITOR');
    onClose();
  };

  // 快速拟定下一章
  const handleCreateNextChapter = async () => {
    if (!activeNovel) return;
    try {
      const nextNum = chapters.length + 1;
      const newCh = await createChapter({
        title: `第${nextNum}章 新的征途与转折`,
        initial_content: '<p></p>',
      });
      selectChapter(newCh);
      setActiveTab('EDITOR');
      toast.success('新章节已就绪', `已创建【${newCh.title}】，开始执笔！`);
      onClose();
    } catch (e: any) {
      toast.error('创建章节失败', e?.message || '未知错误');
    }
  };

  // 3 步新书向导提交
  const handleCreateNovelWithWizard = async () => {
    const finalTitle = novelTitle.trim().replace(/^《|》$/g, '');
    if (!finalTitle) {
      await alertDialog('请输入作品名称！');
      return;
    }

    setIsSubmitting(true);
    try {
      const preset = GENRE_INSPIRATION_PRESETS[selectedGenre];
      const defaultCover = detectPresetByGenre(selectedGenre);

      // 1. 创建小说项目
      const newNovel = await createNovel({
        title: finalTitle,
        description: `【核心抓手/金手指】：${selectedHook}。\n基于 ${selectedGenre} 题材构建的长篇小说，包含严密的世界观法则与起承转合结构。`,
        genre_profile: selectedGenre,
        chapter_target_length: 3000,
        cover_url: defaultCover.id,
      });

      // 2. 注入第一条权威公理法则 (Canon)
      if (preset?.defaultRule) {
        try {
          await api.createWorldRule({
            novel_id: newNovel.id,
            title: preset.defaultRule.title,
            rule_content: preset.defaultRule.content,
            authority_level: 'CANON',
          });
        } catch {}
      }

      // 3. 自动建立第一章黄金开篇
      const firstChData = preset?.firstChapter || {
        title: '第一章 破晓之战',
        content: '<p>晨曦穿透厚重的云层，天地初开。</p>',
      };

      const firstChapter = await createChapter({
        title: firstChData.title,
        initial_content: firstChData.content,
      });

      // 选中新章节并直接送入正文写作
      await selectChapter(firstChapter);
      setActiveTab('EDITOR');
      toast.success('长篇启航成功！', `《${finalTitle}》骨架已筑成，第一章已就绪！`);
      onClose();
    } catch (err: any) {
      await alertDialog(`启航新书失败: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 载入试炼样板长篇（专供新手体验）
  const handleLoadSampleNovel = async () => {
    setIsSubmitting(true);
    try {
      const sampleTitle = `凡人修仙录：九霄问道 (试炼样板)`;
      const sampleNovel = await createNovel({
        title: sampleTitle,
        description: '【试炼样板书】：内置完整世界观法则、门派地图沙盘、多角色人设拓扑与黄金前三章示范正文。供创作者把玩全套长篇小说协同生产力。',
        genre_profile: '玄幻修仙',
        chapter_target_length: 3000,
      });

      // 写入世界法则
      await api.createWorldRule({
        novel_id: sampleNovel.id,
        title: '天道灵气与心魔誓约',
        rule_content: '修士立下天道誓言后若有违背必遭九天雷劫反噬，因果不爽。',
        authority_level: 'CANON',
      });

      // 写入第一章与第二章
      const ch1 = await createChapter({
        title: '第一章 寒潭孤剑，重明破晓',
        initial_content: '<p>深秋，清虚山脚下的寒潭水冷得刺骨。</p><p>少年擦去剑锋上的泥浆，目光穿透破晓前的重重迷雾。三年前被宗门剥夺灵根的那一幕，至今如附骨之疽。</p><p>“既然天地不公，这规矩，便由我来重新改写。”他握紧剑柄，掌心隐隐浮现出一枚暗金色的古篆符文。</p>',
      });

      await createChapter({
        title: '第二章 古刹异宝，暗流涌动',
        initial_content: '<p>夜色更浓，破败的古刹中透出一丝微弱的青芒。</p><p>林远隐在断梁之后，屏气凝神。不远处，三名身着黑袍的修士正围拢在一具石棺前，低声吟诵着晦涩的密咒。</p>',
      });

      await selectChapter(ch1);
      setActiveTab('EDITOR');
      toast.success('试炼长篇装载就绪！', '已载入《凡人修仙录》全套设定与章节，快去体验吧！');
      onClose();
    } catch (e: any) {
      await alertDialog(`载入试炼样板失败: ${e?.message || e}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 计算智能创作指南针建议
  const getSmartCompassAdvice = () => {
    if (!activeNovel) {
      return {
        text: '案头尚无创作工程，建议立即通过下方向导开启一本新长篇！',
        btnText: '开启新书',
        action: () => setMode('wizard'),
      };
    }
    if (chapters.length === 0) {
      return {
        text: '当前长篇尚未开笔，建议立即拟定第 1 章，构建黄金三章开局冲突！',
        btnText: '✍ 拟定第 1 章',
        action: handleCreateNextChapter,
      };
    }

    const latestChapter = activeChapter || chapters[chapters.length - 1];
    const words = latestChapter?.word_count || 0;

    if (words < 1200) {
      return {
        text: `《${latestChapter.title}》目前仅撰写了 ${words} 字，建议继续推进本章核心冲突与戏剧节拍！`,
        btnText: '▶ 继续执笔',
        action: () => handleResumeWriting(latestChapter),
      };
    }

    if (words >= 2500) {
      return {
        text: `《${latestChapter.title}》已达 ${words} 字（篇幅饱满），建议提取正文野生角色入库，或拟定下一章！`,
        btnText: '✍ 拟定下一章',
        action: handleCreateNextChapter,
      };
    }

    return {
      text: `《${latestChapter.title}》正在推进中（${words}字），建议乘胜追击，完成章末断章悬念！`,
      btnText: '▶ 继续写作',
      action: () => handleResumeWriting(latestChapter),
    };
  };

  const compass = getSmartCompassAdvice();
  const currentTargetChapter = activeChapter || (chapters.length > 0 ? chapters[chapters.length - 1] : null);
  const totalNovelWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-4xl bg-surface dark:bg-[#1c1815] border border-line dark:border-[#3a332c] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-3.5 border-b border-line dark:border-[#322c26] bg-surface-2 dark:bg-[#221e1a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-700 via-amber-800 to-yellow-800 text-amber-100 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold font-serif text-ink dark:text-[#ede6dc] tracking-wide">
                  文人案头 · 创作启航中心 (Writer's Desk)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 font-semibold border border-amber-800/20 font-mono">
                  {mode === 'desk' ? '案头速览' : '新书启程'}
                </span>
              </div>
              <p className="text-[11px] text-ink-2 dark:text-[#a09485]">
                告别复杂面板迷思：聚焦当下主线任务，一键沉入长篇创作心流
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeNovel && (
              <div className="flex items-center bg-surface-3 dark:bg-[#2b2520] p-0.5 rounded-lg border border-line dark:border-[#38312a] text-xs">
                <button
                  type="button"
                  onClick={() => setMode('desk')}
                  className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                    mode === 'desk'
                      ? 'bg-white dark:bg-[#181412] text-primary dark:text-amber-300 shadow-2xs font-bold'
                      : 'text-ink-2 dark:text-[#9e9486] hover:text-ink'
                  }`}
                >
                  案头速览
                </button>
                <button
                  type="button"
                  onClick={() => setMode('wizard')}
                  className={`px-3 py-1 rounded-md font-medium transition cursor-pointer ${
                    mode === 'wizard'
                      ? 'bg-white dark:bg-[#181412] text-primary dark:text-amber-300 shadow-2xs font-bold'
                      : 'text-ink-2 dark:text-[#9e9486] hover:text-ink'
                  }`}
                >
                  开启新书
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-2 dark:text-[#a09485] hover:text-ink hover:bg-surface-3-hover dark:hover:bg-[#2b2520] transition cursor-pointer"
              title="关闭案头 (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-canvas dark:bg-[#151210]">
          {/* ======================================================== */}
          {/* MODE 1: DESK (已有作品时的案头速览与执笔直达)              */}
          {/* ======================================================== */}
          {mode === 'desk' && activeNovel && (
            <div className="space-y-6">
              {/* 核心主任务英雄卡 (Writer's Desk Hero Card) */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-surface to-surface-2 dark:from-[#201c18] dark:to-[#1a1614] border border-line dark:border-[#3a332c] shadow-md flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                {/* 装饰底纹水印 */}
                <div className="absolute right-0 bottom-0 opacity-5 dark:opacity-10 pointer-events-none translate-x-10 translate-y-10">
                  <BookOpen className="w-72 h-72 text-primary" />
                </div>

                {/* 左侧实体 3D 书籍封面 */}
                <div className="shrink-0">
                  <BookCoverView novel={activeNovel} size="md" className="shadow-lg" />
                </div>

                {/* 中间信息与继续写作大按钮 */}
                <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-800/10 dark:bg-amber-400/10 text-primary dark:text-amber-300 font-semibold border border-amber-800/20">
                      {activeNovel.genre_profile || '长篇通俗'}
                    </span>
                    <span className="text-ink-2 dark:text-[#9e9486]">
                      总计 {totalNovelWords.toLocaleString()} 字 · 共 {chapters.length} 章
                    </span>
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold font-serif text-ink dark:text-[#f3eee7] truncate tracking-tight">
                      《{activeNovel.title}》
                    </h1>
                    <p className="text-xs text-ink-2 dark:text-[#a09485] mt-1 line-clamp-2 leading-relaxed">
                      {activeNovel.description || '暂无作品设定梗概。可随时在世界观与大纲面板中丰富。'}
                    </p>
                  </div>

                  {/* 核心主行动大按钮：继续上次写作 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleResumeWriting(currentTargetChapter)}
                      className="w-full md:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-700 via-amber-800 to-yellow-800 hover:from-amber-600 hover:to-amber-700 text-white font-serif font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-amber-950/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                    >
                      <Play className="w-4 h-4 fill-current group-hover:translate-x-0.5 transition-transform" />
                      <span>
                        继续执笔写作：
                        {currentTargetChapter ? `《${currentTargetChapter.title}》` : '第一章'}
                      </span>
                      {currentTargetChapter && (
                        <span className="text-xs font-mono opacity-80 font-normal">
                          ({currentTargetChapter.word_count || 0}字)
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 智能创作指南针徽标 (Smart Action Compass) */}
              <div className="p-4 rounded-xl bg-amber-800/8 dark:bg-amber-400/8 border border-amber-800/20 dark:border-amber-400/20 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-800/15 dark:bg-amber-400/15 flex items-center justify-center text-primary dark:text-amber-400 shrink-0">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-amber-400 block font-mono">
                      NEXT BEST ACTION · 今日创作指南针
                    </span>
                    <p className="text-xs text-ink dark:text-[#ede6dc] font-medium mt-0.5">
                      {compass.text}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={compass.action}
                  className="px-3.5 py-1.5 rounded-lg bg-primary dark:bg-amber-700 text-white font-bold text-xs hover:bg-primary/90 transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>{compass.btnText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 四大核心快捷分流通道 */}
              <div>
                <span className="text-xs font-bold text-ink-2 dark:text-[#a09485] font-serif block mb-3">
                  长篇生产力常用快捷通道
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    onClick={handleCreateNextChapter}
                    className="p-3.5 rounded-xl bg-surface dark:bg-[#1e1a17] hover:bg-surface-2 dark:hover:bg-[#25201c] border border-line dark:border-[#362f28] hover:border-amber-800/40 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-amber-800/10 text-primary dark:text-amber-400">
                        <Plus className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-2 group-hover:translate-x-0.5 transition opacity-0 group-hover:opacity-100" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-serif text-ink dark:text-[#ede6dc]">
                        拟定下一章
                      </div>
                      <div className="text-[11px] text-ink-2 dark:text-[#9e9486] mt-0.5">
                        开立第 {chapters.length + 1} 章并开写
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      if (onOpenMap) onOpenMap();
                      else {
                        setActiveTab('WORLD');
                        onClose();
                      }
                    }}
                    className="p-3.5 rounded-xl bg-surface dark:bg-[#1e1a17] hover:bg-surface-2 dark:hover:bg-[#25201c] border border-line dark:border-[#362f28] hover:border-blue-800/40 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-blue-800/10 text-blue-700 dark:text-blue-400">
                        <MapIcon className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-2 group-hover:translate-x-0.5 transition opacity-0 group-hover:opacity-100" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-serif text-ink dark:text-[#ede6dc]">
                        架空世界沙盘
                      </div>
                      <div className="text-[11px] text-ink-2 dark:text-[#9e9486] mt-0.5">
                        地标定标与行军因果
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('CHARACTERS');
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-surface dark:bg-[#1e1a17] hover:bg-surface-2 dark:hover:bg-[#25201c] border border-line dark:border-[#362f28] hover:border-rose-800/40 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-rose-800/10 text-rose-700 dark:text-rose-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-2 group-hover:translate-x-0.5 transition opacity-0 group-hover:opacity-100" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-serif text-ink dark:text-[#ede6dc]">
                        角色人设拓扑
                      </div>
                      <div className="text-[11px] text-ink-2 dark:text-[#9e9486] mt-0.5">
                        人设档案与关系拉线
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setActiveTab('PLOTS');
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-surface dark:bg-[#1e1a17] hover:bg-surface-2 dark:hover:bg-[#25201c] border border-line dark:border-[#362f28] hover:border-indigo-800/40 transition cursor-pointer flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-lg bg-indigo-800/10 text-indigo-700 dark:text-indigo-400">
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-2 group-hover:translate-x-0.5 transition opacity-0 group-hover:opacity-100" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-serif text-ink dark:text-[#ede6dc]">
                        剧情大纲矩阵
                      </div>
                      <div className="text-[11px] text-ink-2 dark:text-[#9e9486] mt-0.5">
                        阶段大纲与伏笔追踪
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部书架切换通道 */}
              {novels.length > 1 && (
                <div className="p-4 rounded-xl bg-surface dark:bg-[#1e1a17] border border-line dark:border-[#322c26] flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-primary dark:text-amber-400" />
                    <span className="text-ink-2 dark:text-[#a09485]">书架其他在更作品：</span>
                    <select
                      value={activeNovel.id}
                      onChange={(e) => {
                        const target = novels.find((n) => n.id === e.target.value);
                        if (target) selectNovel(target);
                      }}
                      className="bg-surface-2 dark:bg-[#26201b] border border-line dark:border-[#3a322a] rounded-lg px-2.5 py-1 text-ink dark:text-[#ede6dc] font-serif font-bold outline-none cursor-pointer"
                    >
                      {novels.map((n) => (
                        <option key={n.id} value={n.id}>
                          《{n.title}》· {n.genre_profile || '通俗'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('wizard')}
                      className="text-primary dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>开启另一本长篇</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MODE 2: WIZARD (新书启程 3 步互动向导)                     */}
          {/* ======================================================== */}
          {mode === 'wizard' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-amber-800/10 dark:bg-amber-400/10 border border-amber-800/20 text-xs text-primary dark:text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  <strong>长篇小说 3 步立项向导：</strong>
                  只需拟定书名与核心金手指，系统将自动构建作品骨架、注入世界公理法则并铺就第一章，助你一秒下笔开写！
                </span>
              </div>

              {/* Step 1: 题材与书名 */}
              <div className="p-5 rounded-2xl bg-surface dark:bg-[#201c18] border border-line dark:border-[#38312a] space-y-4">
                <div className="flex items-center justify-between border-b border-line dark:border-[#322c26] pb-2">
                  <span className="font-bold text-xs text-ink dark:text-[#ede6dc] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-800 text-white flex items-center justify-center text-xs font-mono">1</span>
                    确定题材定位与作品书名
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-2 dark:text-[#a09485] block mb-2">选择核心流派</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(GENRE_INSPIRATION_PRESETS).map((g) => {
                      const isSel = selectedGenre === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setSelectedGenre(g)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                            isSel
                              ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                              : 'bg-surface-2 dark:bg-[#28221d] border-line dark:border-[#38312a] text-ink dark:text-[#ede6dc] hover:border-amber-800/40'
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-ink-2 dark:text-[#a09485]">拟定作品书名</label>
                    <button
                      type="button"
                      onClick={handleRollRandomTitle}
                      className="text-[11px] text-primary dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      title="随机换取好书名"
                    >
                      <Dice5 className="w-3.5 h-3.5" />
                      <span>换一个好书名 (灵感骰子)</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={novelTitle}
                    onChange={(e) => setNovelTitle(e.target.value)}
                    placeholder="输入或选择书名，例如《万界登峰录》"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line dark:border-[#38312a] bg-surface-2 dark:bg-[#1a1614] text-ink dark:text-[#ede6dc] font-serif font-bold text-sm outline-none focus:border-amber-800"
                  />
                </div>
              </div>

              {/* Step 2: 核心金手指与开局抓手 */}
              <div className="p-5 rounded-2xl bg-surface dark:bg-[#201c18] border border-line dark:border-[#38312a] space-y-3">
                <div className="flex items-center justify-between border-b border-line dark:border-[#322c26] pb-2">
                  <span className="font-bold text-xs text-ink dark:text-[#ede6dc] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-800 text-white flex items-center justify-center text-xs font-mono">2</span>
                    选定核心脑洞 / 爽点金手指
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-2 dark:text-[#a09485] block mb-2">流派经典抓手推荐（点击填入）</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GENRE_INSPIRATION_PRESETS[selectedGenre]?.hooks.map((hook) => {
                      const isSel = selectedHook === hook;
                      return (
                        <div
                          key={hook}
                          onClick={() => setSelectedHook(hook)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            isSel
                              ? 'bg-amber-800/10 dark:bg-amber-400/10 border-amber-800 text-primary dark:text-amber-300 font-bold'
                              : 'bg-surface-2 dark:bg-[#28221d] border-line dark:border-[#38312a] text-ink dark:text-[#ede6dc] hover:border-amber-800/40'
                          }`}
                        >
                          <span>{hook}</span>
                          {isSel && <Check className="w-3.5 h-3.5 shrink-0 text-amber-800 dark:text-amber-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    value={selectedHook}
                    onChange={(e) => setSelectedHook(e.target.value)}
                    placeholder="或手动输入你的独家创意脑洞..."
                    className="w-full px-3 py-2 rounded-xl border border-line dark:border-[#38312a] bg-surface-2 dark:bg-[#1a1614] text-xs text-ink dark:text-[#ede6dc] outline-none"
                  />
                </div>
              </div>

              {/* Step 3: 一键立项提交 */}
              <div className="p-5 rounded-2xl bg-surface dark:bg-[#201c18] border border-line dark:border-[#38312a] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-xs text-ink dark:text-[#ede6dc] block font-serif">
                    准备启程：《{novelTitle || '新书'}》· {selectedGenre}
                  </span>
                  <span className="text-[11px] text-ink-2 dark:text-[#a09485] mt-0.5 block">
                    将自动生成第一章《{GENRE_INSPIRATION_PRESETS[selectedGenre]?.firstChapter.title}》并直接开启写作
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCreateNovelWithWizard}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-serif font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <BookPlus className="w-4 h-4" />
                  <span>{isSubmitting ? '正在构建世界与章节...' : '🚀 启航新长篇，开启执笔'}</span>
                </button>
              </div>

              {/* 免码字快速体验 / 搬家通道 */}
              <div className="pt-2 border-t border-line dark:border-[#322c26] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleLoadSampleNovel}
                  disabled={isSubmitting}
                  className="p-3 rounded-xl bg-surface-2 dark:bg-[#221c17] hover:bg-surface-3 dark:hover:bg-[#2a241e] border border-line dark:border-[#38312a] text-left transition cursor-pointer flex items-center gap-3"
                >
                  <div className="p-2 rounded-lg bg-emerald-800/10 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink dark:text-[#ede6dc]">
                      一键载入《凡人修仙录》样板
                    </div>
                    <div className="text-[11px] text-ink-2 dark:text-[#9e9486]">
                      内置完整世界法则、人物人设与前 2 章
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenWordImport) onOpenWordImport();
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-surface-2 dark:bg-[#221c17] hover:bg-surface-3 dark:hover:bg-[#2a241e] border border-line dark:border-[#38312a] text-left transition cursor-pointer flex items-center gap-3"
                >
                  <div className="p-2 rounded-lg bg-blue-800/10 text-blue-700 dark:text-blue-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink dark:text-[#ede6dc]">
                      导入已有 Word (.docx) 稿件
                    </div>
                    <div className="text-[11px] text-ink-2 dark:text-[#9e9486]">
                      智能切分既有章节，无缝搬家至本地
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Preference Bar */}
        <div className="px-6 py-2.5 border-t border-line dark:border-[#322c26] bg-surface-2 dark:bg-[#201c18] flex items-center justify-between text-xs text-ink-2 dark:text-[#a09485] shrink-0">
          <label className="flex items-center gap-2 cursor-pointer hover:text-ink transition select-none">
            <input
              type="checkbox"
              checked={startupShowDesk}
              onChange={(e) => handleToggleStartupPref(e.target.checked)}
              className="rounded border-line text-amber-800 focus:ring-0 cursor-pointer"
            />
            <span className="text-[11px]">每次启动软件时优先呈现文人案头 (推荐，随时可按 Esc 进入编辑器)</span>
          </label>

          <span className="text-[10px] opacity-75 font-mono">
            快捷键：按 Enter 执笔 · Esc 退出
          </span>
        </div>
      </div>
    </div>
  );
};
