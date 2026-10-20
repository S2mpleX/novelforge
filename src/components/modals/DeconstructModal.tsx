import React, { useState } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import {
  FileSearch,
  X,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  Play,
  Clock,
  FileText,
  Library,
  Flame,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import {
  DECONSTRUCT_DIMENSIONS,
  DeconstructEngine,
} from '@/features/deconstruct/DeconstructEngine';
import {
  DeconstructDimensionKey,
  DeconstructScale,
  DeconstructReport,
  ReusableSkillItem,
} from '@/features/deconstruct/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

function cleanHtmlToPlain(html: string): string {
  if (!html) return '';
  return html
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

const PRESET_SAMPLES = [
  {
    genre: '玄幻破局',
    title: '《逆命修真》黄金三章开局',
    text: `夜雨如注，打在青云宗外门的青石台阶上，发出噼啪的闷响。
少年林远抹了把脸上的血水与泥沙，死死攥紧掌心里破碎的命牌。
“三年之约，青云门退我婚事，废我灵脉，将我弃于荒山。”他冷冷抬起头，前方古殿雕梁画栋，正是七星阁与各方势力的演武台。
就在这时，胸口前挂着的一枚布满铜锈的九龙古鼎，忽然发出一阵灼热微颤。
一道苍老悠远的声音悄然从识海深处炸响：“小娃娃，天生至尊骨被夺又如何？老夫这里有一部《太虚混沌经》，敢修否？”`,
  },
  {
    genre: '硬核科幻',
    title: '《深空余波》跃迁拦截开篇',
    text: `警报红光将驾驶舱撕裂成暗红的血狱。
“舰长，第七曲率引擎过载率 142%，引力坍缩井即将闭合！”领航员的手指在全息矩阵上拉出急促的残影。
陈巡没有回答，他的目光凝视着全息主视界——三艘泛亚同盟的重巡洋舰正呈品字形封死跃迁走廊。
“他们不是来缉捕的，他们是来灭口的。”陈巡按下了主控台上的纳米自毁协议红色护盖，“启动脉冲光刃，调频至超空泡震荡模式，冲过去！”`,
  },
  {
    genre: '谍战悬疑',
    title: '《雨夜暗线》潜伏搜查开篇',
    text: `雨水顺着黑色礼帽的帽檐淌下来，落在破损皮鞋的尖端。
陆长生站在弄堂深处，看了一眼怀表：凌晨两点四十五分。
三楼窗口的煤油灯晃了三下，随后熄灭。那是约定的紧急脱离暗号——线人已经暴露。
他深吸一口冰冷的湿气，右手摸进大衣内侧，握紧了那把柯尔特手枪。楼道里传来了军靴踏过水洼的沉闷踩踏声，特务处的人比预想中提前了整整十分钟。`,
  },
];

export const DeconstructModal: React.FC<Props> = ({ isOpen, onClose, embedded = false }) => {
  const { activeProvider, activeModel, activeNovel, chapters, activeChapter, editorContent } = useNovelStore();
  const [sourceTitle, setSourceTitle] = useState<string>('');
  const [sourceText, setSourceText] = useState<string>('');
  const [selectedDims, setSelectedDims] = useState<DeconstructDimensionKey[]>([
    'structure',
    'golden',
    'pacing',
    'character',
    'reusable',
  ]);
  const [scale, setScale] = useState<DeconstructScale>('detailed');
  const [extraFocus, setExtraFocus] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [report, setReport] = useState<DeconstructReport | null>(null);
  const [streamMarkdown, setStreamMarkdown] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [adoptedFeedback, setAdoptedFeedback] = useState<string | null>(null);

  if (!isOpen && !embedded) return null;

  const toggleDim = (key: DeconstructDimensionKey) => {
    if (selectedDims.includes(key)) {
      if (selectedDims.length > 1) {
        setSelectedDims(selectedDims.filter((k) => k !== key));
      }
    } else {
      setSelectedDims([...selectedDims, key]);
    }
  };

  // 载入当前正文
  const handleLoadCurrentChapter = () => {
    if (!activeChapter) {
      setAdoptedFeedback('当前未打开任何章节！');
      setTimeout(() => setAdoptedFeedback(null), 2500);
      return;
    }
    const rawContent = editorContent || activeChapter.content || '';
    const cleanText = cleanHtmlToPlain(rawContent);
    if (!cleanText) {
      setAdoptedFeedback('当前章节暂无正文内容！');
      setTimeout(() => setAdoptedFeedback(null), 2500);
      return;
    }
    setSourceTitle(`《${activeNovel?.title || '本草'}》· ${activeChapter.title}`);
    setSourceText(cleanText);
    setScale('detailed');
    setAdoptedFeedback(`已成功载入当前章节《${activeChapter.title}》（${cleanText.length}字）！`);
    setTimeout(() => setAdoptedFeedback(null), 2500);
  };

  // 载入前三章（黄金三章开篇自检）
  const handleLoadFirstThreeChapters = () => {
    if (!chapters || chapters.length === 0) {
      setAdoptedFeedback('当前作品暂无已建章节！');
      setTimeout(() => setAdoptedFeedback(null), 2500);
      return;
    }
    const sorted = [...chapters].sort(
      (a, b) => (a.chapter_number || a.sequence || 0) - (b.chapter_number || b.sequence || 0)
    );
    const firstThree = sorted.slice(0, 3);
    const combined = firstThree
      .map((ch, idx) => {
        const text = ch.id === activeChapter?.id && editorContent ? editorContent : ch.content || '';
        return `【第 ${idx + 1} 章：${ch.title}】\n${cleanHtmlToPlain(text)}`;
      })
      .join('\n\n' + '='.repeat(30) + '\n\n');

    setSourceTitle(`《${activeNovel?.title || '本书'}》开篇黄金三章`);
    setSourceText(combined);
    setScale('detailed');
    if (!selectedDims.includes('golden')) {
      setSelectedDims([...selectedDims, 'golden']);
    }
    setAdoptedFeedback(`已载入开篇前 ${firstThree.length} 章正文（共 ${combined.length} 字），切换为黄金三章精拆！`);
    setTimeout(() => setAdoptedFeedback(null), 3000);
  };

  // 载入内置样章
  const handleLoadPresetSample = (idx: number) => {
    const s = PRESET_SAMPLES[idx];
    if (!s) return;
    setSourceTitle(s.title);
    setSourceText(s.text);
    setScale('detailed');
    setAdoptedFeedback(`已载入【${s.genre}】试炼样章！`);
    setTimeout(() => setAdoptedFeedback(null), 2500);
  };

  const handleStartDeconstruct = async () => {
    if (!sourceText.trim()) return;

    setIsRunning(true);
    setStreamMarkdown('');
    setReport(null);

    const { systemPrompt, userPrompt } = DeconstructEngine.assemblePrompt({
      title: sourceTitle || '竞品范文',
      sourceText,
      dimensions: selectedDims,
      scale,
      extraFocus,
    });

    try {
      if (activeProvider && activeModel) {
        // 使用配置的大模型进行深度拆解
        const fullOutput = await api.executeLlmChat({
          system_prompt: systemPrompt,
          user_prompt: userPrompt,
          temperature: 0.7,
        });

        setStreamMarkdown(fullOutput);
        const parsed = DeconstructEngine.parseReport(fullOutput, sourceTitle, sourceText.length);
        setReport(parsed);
      } else {
        // 无模型时自动降级走本地 0-Token 离线深度分析
        const parsed = DeconstructEngine.generateOfflineAnalysis(sourceTitle, sourceText);
        setStreamMarkdown(parsed.markdownContent);
        setReport(parsed);
      }
    } catch (e: any) {
      console.warn('调用大模型失败，优雅回退至本地离线拆解:', e);
      const parsed = DeconstructEngine.generateOfflineAnalysis(sourceTitle, sourceText);
      setStreamMarkdown(parsed.markdownContent);
      setReport(parsed);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyReport = async () => {
    const text = report ? report.markdownContent : streamMarkdown;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('复制失败:', e);
    }
  };

  const handleSaveToSkills = () => {
    if (!report || report.reusableSkills.length === 0) return;
    if (activeNovel?.id) {
      const key = `novelforge_notes_${activeNovel.id}`;
      const existing = localStorage.getItem(key) || '';
      const skillsText = report.reusableSkills
        .map(
          (s, idx) =>
            `\n【拆书套路 ${idx + 1}：${s.name}】(适用场景: ${s.scene || '通用场景'})\n实操步骤：${
              s.steps && s.steps.length > 0 ? s.steps.join(' ➔ ') : '基础节拍推进'
            }${
              s.checklist && s.checklist.length > 0 ? `\n核心核验清单：${s.checklist.join('；')}` : ''
            }`
        )
        .join('\n');
      localStorage.setItem(key, existing ? `${existing}\n${skillsText}` : skillsText);
      window.dispatchEvent(
        new CustomEvent('novelforge:notes-updated', { detail: { novelId: activeNovel.id } })
      );
    }
    setAdoptedFeedback(`已提炼出 ${report.reusableSkills.length} 条爆款写作套路，并存入当前作品便签本！`);
    setTimeout(() => setAdoptedFeedback(null), 3000);
  };

  // 存为世界观设定库法则
  const handleSaveSkillAsRule = async (skill: ReusableSkillItem) => {
    if (!activeNovel) return;
    try {
      await api.createWorldRule({
        novel_id: activeNovel.id,
        title: `剧作定律：${skill.name}`,
        rule_content: `【适用场景】${skill.scene || '通用剧作'}\n【推进节拍】\n${
          skill.steps ? skill.steps.join('\n') : ''
        }\n【自检核验】${skill.checklist ? skill.checklist.join('；') : ''}`,
        authority_level: 'EXTENDED',
      });
      window.dispatchEvent(new CustomEvent('novelforge:reload-story-bible'));
      setAdoptedFeedback(`已将【${skill.name}】存为世界观扩展法则！`);
      setTimeout(() => setAdoptedFeedback(null), 3000);
    } catch (e) {
      console.error('存为法则失败:', e);
    }
  };

  // 存为大纲阶段
  const handleSaveSkillAsPhase = async (skill: ReusableSkillItem) => {
    if (!activeNovel) return;
    try {
      const existingPhases = await api.listStoryPhases(activeNovel.id);
      await api.createStoryPhase({
        novel_id: activeNovel.id,
        title: skill.name,
        goal: `【实操步骤】${skill.steps?.join(' -> ') || ''} | 【核验清单】${skill.checklist?.join('；') || ''}`,
        order_index: (existingPhases.length || 0) + 1,
      });
      setAdoptedFeedback(`已将【${skill.name}】作为故事阶段加入大纲！`);
      setTimeout(() => setAdoptedFeedback(null), 3000);
    } catch (e) {
      console.error('存为大纲阶段失败:', e);
    }
  };

  const innerContent = (
    <div className={`w-full ${embedded ? 'h-full rounded-none border-0' : 'max-w-5xl h-[90vh] rounded-2xl border border-line dark:border-[#2e2a27] shadow-2xl animate-in fade-in zoom-in-95 duration-200'} bg-surface dark:bg-[#1a1714] flex flex-col overflow-hidden`}>
      {/* 顶部标题栏 */}
      <div className="px-5 py-3.5 border-b border-line dark:border-[#2e2a27] bg-surface-2 dark:bg-[#231f1b] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-800 text-white flex items-center justify-center shadow-xs">
            <FileSearch className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-ink dark:text-stone-100 flex items-center gap-2">
              拆书工坊 (Deconstruct Workshop)
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-primary dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                逆向复刻爆款套路
              </span>
            </h2>
            <p className="text-[11px] text-ink-2 dark:text-stone-400">
              粘贴竞品样章或爆款名篇，多维度提取卷章骨架、黄金三章开局、情绪爽点曲线与可复用打法
            </p>
          </div>
        </div>
        {!embedded && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-[#ded5c4]/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

        {/* 主体左右双栏 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-[#ded5c4] dark:divide-[#2e2a27]">
          {/* 左栏：输入与拆解维度配置 (5列) */}
          <div className="lg:col-span-5 flex flex-col h-full p-4 overflow-y-auto space-y-3.5 bg-[#faf5ec]/50 dark:bg-[#181513]/40">
            {/* 范文标题与快速载入工具栏 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  范文 / 竞品书名或自检章节
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleLoadCurrentChapter}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/40 text-primary dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                    title="一键载入当前正在编辑的章节正文进行自检"
                  >
                    <FileText className="w-2.5 h-2.5" />
                    <span>载入本章</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadFirstThreeChapters}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/40 text-primary dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                    title="一键提取本书开篇前三章，执行黄金三章开局深度自检"
                  >
                    <Library className="w-2.5 h-2.5" />
                    <span>黄金三章自检</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={sourceTitle}
                onChange={(e) => setSourceTitle(e.target.value)}
                placeholder="例如：《诡秘之主》第一卷开篇三章 / 本书开局自检"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />

              {/* 经典样章试炼胶囊 */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] text-stone-400 shrink-0 flex items-center gap-0.5">
                  <Flame className="w-2.5 h-2.5 text-amber-600" />
                  样章试炼:
                </span>
                {PRESET_SAMPLES.map((s, idx) => (
                  <button
                    key={s.genre}
                    type="button"
                    onClick={() => handleLoadPresetSample(idx)}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 transition cursor-pointer"
                  >
                    {s.genre}
                  </button>
                ))}
              </div>
            </div>

            {/* 范文正文粘贴 */}
            <div className="flex-1 flex flex-col min-h-[160px]">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  待拆解正文文本 (支持粘贴数千至数万字)
                </label>
                <span className="text-[11px] text-stone-400 font-mono">
                  {sourceText.length} 字
                </span>
              </div>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="请在此直接粘贴需要逆向拆解分析的竞品正文、或点击上方【载入本章/黄金三章自检】……"
                className="flex-1 w-full p-3 text-xs font-serif leading-relaxed rounded-xl border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 resize-none focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            {/* 拆解规模尺度 */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                拆解精细度与规模
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setScale('detailed')}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                    scale === 'detailed'
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                      : 'bg-white dark:bg-stone-900 border-line dark:border-[#38332e] text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="font-semibold text-xs">逐章精拆</div>
                  <div className="text-[10px] opacity-80 mt-0.5">1~5章深度优先</div>
                </button>
                <button
                  type="button"
                  onClick={() => setScale('pacing_block')}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                    scale === 'pacing_block'
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                      : 'bg-white dark:bg-stone-900 border-line dark:border-[#38332e] text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="font-semibold text-xs">情节块拆解</div>
                  <div className="text-[10px] opacity-80 mt-0.5">5~15章归纳规律</div>
                </button>
                <button
                  type="button"
                  onClick={() => setScale('macro')}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer ${
                    scale === 'macro'
                      ? 'bg-amber-800 text-white border-amber-800 shadow-xs'
                      : 'bg-white dark:bg-stone-900 border-line dark:border-[#38332e] text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <div className="font-semibold text-xs">宏观全卷</div>
                  <div className="text-[10px] opacity-80 mt-0.5">长篇大纲与主线</div>
                </button>
              </div>
            </div>

            {/* 拆解维度复选 */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                拆解维度选择 ({selectedDims.length} 项)
              </label>
              <div className="space-y-1">
                {DECONSTRUCT_DIMENSIONS.map((dim) => {
                  const isChecked = selectedDims.includes(dim.key);
                  return (
                    <label
                      key={dim.key}
                      onClick={() => toggleDim(dim.key)}
                      className={`flex items-start gap-2 p-2 rounded-lg border transition cursor-pointer ${
                        isChecked
                          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-stone-900 border-line dark:border-[#38332e] opacity-70'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-primary focus:ring-amber-500"
                      />
                      <div className="text-left">
                        <div className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                          {dim.label}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {dim.description}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 特别关注要求 */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                特别关注点 (选填)
              </label>
              <input
                type="text"
                value={extraFocus}
                onChange={(e) => setExtraFocus(e.target.value)}
                placeholder="例如：重点分析反派动机与打脸前的三层情绪压抑"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-line dark:border-[#38332e] bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>

            {/* 启动按钮 */}
            <button
              onClick={handleStartDeconstruct}
              disabled={isRunning || !sourceText.trim()}
              className="w-full py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>正在深度逆向拆解中...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>开始逆向拆书</span>
                </>
              )}
            </button>
          </div>

          {/* 右栏：拆书报告展示与反哺动作 (7列) */}
          <div className="lg:col-span-7 flex flex-col h-full p-4 overflow-hidden bg-white dark:bg-[#1a1714]">
            {/* 报告头部栏 */}
            <div className="flex items-center justify-between pb-2.5 border-b border-line dark:border-[#2e2a27] shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary dark:text-amber-500" />
                <span className="font-bold text-xs text-stone-800 dark:text-stone-200 font-serif">
                  {sourceTitle ? `《${sourceTitle}》拆解报告` : '拆解报告'}
                </span>
                {(streamMarkdown || report) && (
                  <span className="text-[10px] text-stone-400">
                    ({(streamMarkdown || report?.markdownContent || '').length} 字符)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {report && (
                  <button
                    onClick={handleSaveToSkills}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-primary dark:text-amber-300 hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
                    title="将本报告提炼的可复用套路沉淀至创作灵感便签"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>提炼套路卡</span>
                  </button>
                )}

                <button
                  onClick={handleCopyReport}
                  disabled={!streamMarkdown && !report}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-line dark:border-[#38332e] hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '已复制' : '复制报告'}</span>
                </button>
              </div>
            </div>

            {/* 反馈提示 */}
            {adoptedFeedback && (
              <div className="my-2 p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg">
                {adoptedFeedback}
              </div>
            )}

            {/* 报告内容区 */}
            <div className="flex-1 overflow-y-auto mt-3 p-3.5 rounded-xl border border-line/60 dark:border-[#38332e]/60 bg-surface dark:bg-[#151311] select-text space-y-4">
              {streamMarkdown || report ? (
                <>
                  <div className="text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-wrap text-stone-800 dark:text-stone-200">
                    {streamMarkdown || report?.markdownContent}
                  </div>

                  {/* 结构化提取出的套路卡片 */}
                  {report?.reusableSkills && report.reusableSkills.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-line dark:border-[#2e2a27] space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-primary dark:text-amber-400 flex items-center gap-1.5 font-sans">
                          <Sparkles className="w-3.5 h-3.5" />
                          提炼出的结构化爆款实操套路 ({report.reusableSkills.length})
                        </span>
                        <span className="text-[10px] text-stone-400 font-sans">
                          点击可一键反哺至当前小说世界法则或大纲
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2 font-sans">
                        {report.reusableSkills.map((skill, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-amber-900 dark:text-amber-300">
                                #{sIdx + 1} {skill.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveSkillAsRule(skill)}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-primary dark:text-amber-300 hover:bg-amber-100 flex items-center gap-0.5 cursor-pointer"
                                  title="存入世界观设定法则"
                                >
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span>存为法则</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveSkillAsPhase(skill)}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-primary dark:text-amber-300 hover:bg-amber-100 flex items-center gap-0.5 cursor-pointer"
                                  title="作为阶段节点加入大纲"
                                >
                                  <Layers className="w-2.5 h-2.5" />
                                  <span>存为大纲</span>
                                </button>
                              </div>
                            </div>
                            {skill.steps && skill.steps.length > 0 && (
                              <div className="text-[11px] text-stone-600 dark:text-stone-300 space-y-0.5">
                                {skill.steps.map((st, i) => (
                                  <div key={i}>{st}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-2">
                  <FileSearch className="w-10 h-10 opacity-30" />
                  <p className="text-xs">
                    请在左侧填入竞品范文，选定拆解维度后点击【开始逆向拆书】
                  </p>
                  <p className="text-[11px] opacity-70">
                    支持黄金三章分析、节奏爽点曲线、反派动机提炼与可复用打法手册
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );

  if (embedded) {
    return <div className="w-full h-full select-none font-sans">{innerContent}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      {innerContent}
    </div>
  );
};
