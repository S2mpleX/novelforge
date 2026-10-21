import React, { useState, useMemo } from 'react';
import { useSkillsStore } from '../useSkillsStore';
import { APP_CURRENT_VERSION } from '@/features/updater/services/UpdateService';
import { api } from '@/utils/tauriBridge';
import { alertDialog } from '@/utils/dialog';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Zap,
  Info,
  Scale,
  RefreshCw,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sliders,
} from 'lucide-react';

const AI_HEAVY_SAMPLE = `一句话总结：这不是一个简单的选择，而是一场关乎生死的宿命博弈。
不仅如此，主角嘴角勾起了一抹冷酷的弧度，眼中闪过一丝微不可察的杀意。面对强敌，他深吸了一口气——答案其实很简单，那就是力量。
空气仿佛凝固了。无论是初创者、中阶修士，还是顶尖大能，都能感受到那股压迫感。
这意味着，一场血战不可避免。说白了，他已经没有退路。`;

const CLEAN_SAMPLE = `灶膛里的松柴噼啪炸了一声，溅出几星火沫。
他没抬头，手里捏着半块发硬的玉米馍，粗糙的指腹顺着豁口一点点往下剥。
窗外落着细盐似的冷雪，青石板路早就冻得发亮。对面的老汉抽完最后一锅旱烟，在鞋底上磕了磕烟袋锅子，铜嘴碰着牛皮，发出笃笃的两声闷响。`;

const DRAMA_FLAT_SAMPLE = `第二天，林越来到了青云宗山门前。山门十分气派，高耸入云。
突然之间，几个不长眼的恶霸弟子跳了出来，为首的李管事冷笑道：“站住，交出通行令牌！”
林越心中感到极度愤怒与震惊，他深吸了一口气，拔出长剑。两边打了起来，林越轻松击败了他们。
李管事倒在地上求饶道：“我错了，林师兄饶命！”林越淡淡一笑：“罢了，我不与你计较。”两人相视一笑，恩怨尽消。
然而他并不知道，暗中正有一双血红的眼睛死死盯着他的后背，危险即将降临，命运的齿轮在这一刻开始转动……`;

export const SkillsManagerView: React.FC = () => {
  const {
    skills,
    activeSkillIds,
    toggleSkill,
    resetToDefaults,
    auditText,
    buildPolishingPrompt,
    buildColdReaderPrompt,
    buildSceneDramaturgePrompt,
  } = useSkillsStore();

  const [expandedSkillId, setExpandedSkillId] = useState<string | null>('lieflat-less-ai-tone');
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'negative' | 'prompt'>('rules');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'anti_ai' | 'dramaturgy' | 'architecture' | 'audit'>('all');

  // Playground state
  const [playgroundMode, setPlaygroundMode] = useState<'polish' | 'dramaturgy' | 'cold_reader'>('polish');
  const [testText, setTestText] = useState(AI_HEAVY_SAMPLE);
  const [auditResult, setAuditResult] = useState<ReturnType<typeof auditText> | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isLlmRunning, setIsLlmRunning] = useState(false);
  const [llmOutput, setLlmOutput] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);

  // Stats (Memoized to prevent unnecessary recalculations on testText change)
  const totalRules = useMemo(() => skills.reduce((acc, s) => acc + s.rules.length, 0), [skills]);
  const totalNegativeRules = useMemo(() => skills.reduce((acc, s) => acc + (s.negativeRules?.length || 0), 0), [skills]);

  const filteredSkills = useMemo(() => skills.filter((s) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'anti_ai') return s.category === 'polishing' || s.category === 'linguistics';
    if (selectedCategory === 'dramaturgy') return s.category === 'dramaturgy';
    if (selectedCategory === 'architecture') return s.category === 'architecture';
    if (selectedCategory === 'audit') return s.category === 'audit';
    return true;
  }), [skills, selectedCategory]);

  const handleRunAudit = () => {
    const res = auditText(testText);
    setAuditResult(res);
    setLlmOutput(null);
    setLlmError(null);
  };

  const handleCopyPrompt = () => {
    let p = '';
    if (playgroundMode === 'cold_reader') {
      p = buildColdReaderPrompt(testText);
    } else if (playgroundMode === 'dramaturgy') {
      p = buildSceneDramaturgePrompt({
        prevContext: testText,
        sceneGoal: '消除流水账与假和解，重塑真实张力与双导演进场',
      });
    } else {
      p = buildPolishingPrompt(testText);
    }
    navigator.clipboard.writeText(p);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleTestWithLlm = async () => {
    if (!testText.trim()) return;
    setIsLlmRunning(true);
    setLlmOutput(null);
    setLlmError(null);

    let systemPrompt = '你是一位顶级中文小说精修大师，严格遵守所装载的 Skills 规范，直接输出润色后的高质量正文。';
    let prompt = '';

    if (playgroundMode === 'cold_reader') {
      systemPrompt = '你处于完全隔离的盲审模式中，作为首次阅读的挑剔读者，严格执行 Cold Reader 诊断契约。只做带证据的诊断，绝不代写。';
      prompt = buildColdReaderPrompt(testText);
    } else if (playgroundMode === 'dramaturgy') {
      systemPrompt = '你是一位专业小说单场景戏剧导演 (Scene Dramaturge)，严格遵循双导演方案进场与情绪物象化守则。';
      prompt = buildSceneDramaturgePrompt({
        prevContext: testText,
        sceneGoal: '消除流水账与假和解，重塑真实张力与双导演进场',
      });
    } else {
      prompt = buildPolishingPrompt(testText);
    }

    try {
      const res = await api.executeLlmChat({
        system_prompt: systemPrompt,
        user_prompt: prompt,
        temperature: playgroundMode === 'cold_reader' ? 0.3 : 0.6,
        max_tokens: 2000,
      });
      setLlmOutput(res.trim());
    } catch (err: any) {
      console.error('LLM 测试失败:', err);
      setLlmError(err.message || String(err));
    } finally {
      setIsLlmRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-[#1c1917] text-ink dark:text-[#e7e5e4] overflow-y-auto">
      {/* 顶部统计与定位卡片 */}
      <div className="p-4 lg:p-6 border-b border-[#e7e5e4] dark:border-[#292524] bg-[#f5f0e6]/50 dark:bg-[#171412]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-600/10 text-primary dark:text-amber-400 border border-amber-600/20">
                <Sliders className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-serif font-bold text-ink dark:text-white">
                Agent Skills 技能管理中心
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-100 text-primary dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Local Engine v{APP_CURRENT_VERSION}
              </span>
            </div>
            <p className="text-xs text-ink-2 dark:text-[#a8a29e] mt-1 max-w-2xl">
              管理与配置 NovelForge AI 创作 Agent 所挂载的文学精修规范、语言学实证去 AI 味白名单以及文风滤镜。
            </p>
          </div>

          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d6d3d1] dark:border-[#44403c] text-xs text-[#57534e] dark:text-[#d6d3d1] hover:bg-white dark:hover:bg-[#292524] transition shadow-xs cursor-pointer"
            title="恢复默认推荐技能配置"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复默认推荐</span>
          </button>
        </div>

        {/* 四重关键指标概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white dark:bg-[#201c1a] border border-[#e7e5e4] dark:border-[#2e2a27] shadow-xs">
            <div className="text-[11px] text-ink-2 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>已挂载技能</span>
            </div>
            <div className="text-lg font-mono font-bold mt-1 text-ink dark:text-white">
              {activeSkillIds.length} <span className="text-xs font-normal text-ink-2">/ {skills.length}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#201c1a] border border-[#e7e5e4] dark:border-[#2e2a27] shadow-xs">
            <div className="text-[11px] text-ink-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>白名单检验规则</span>
            </div>
            <div className="text-lg font-mono font-bold mt-1 text-emerald-700 dark:text-emerald-400">
              {totalRules} <span className="text-xs font-normal text-ink-2">条</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#201c1a] border border-[#e7e5e4] dark:border-[#2e2a27] shadow-xs">
            <div className="text-[11px] text-ink-2 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>实证语料支撑</span>
            </div>
            <div className="text-lg font-mono font-bold mt-1 text-blue-700 dark:text-blue-400">
              283+ <span className="text-xs font-normal text-ink-2">万字</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-[#201c1a] border border-[#e7e5e4] dark:border-[#2e2a27] shadow-xs">
            <div className="text-[11px] text-ink-2 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-purple-600" />
              <span>反向禁改区防护</span>
            </div>
            <div className="text-lg font-mono font-bold mt-1 text-purple-700 dark:text-purple-400">
              {totalNegativeRules} <span className="text-xs font-normal text-ink-2">项伪AI味</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主体区域：两栏分栏展示（技能卡片列表 + 诊断试炼沙盒） */}
      <div className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧：已安装 Skills 列表与细则 (7 栏) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
              <span>已注册 Skills 列表</span>
              <span className="text-[10px] text-primary bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                可自由启用/停用
              </span>
            </h3>

            {/* 分类过滤器 */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-canvas dark:bg-[#201c1a] rounded-xl border border-[#e7e5e4] dark:border-[#2f2b28]">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-0.5 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-white dark:bg-[#2d2825] text-primary dark:text-amber-300 shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                全部 ({skills.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('anti_ai')}
                className={`px-2 py-0.5 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                  selectedCategory === 'anti_ai'
                    ? 'bg-white dark:bg-[#2d2825] text-primary dark:text-amber-300 shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                去AI味 (2)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('dramaturgy')}
                className={`px-2 py-0.5 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                  selectedCategory === 'dramaturgy'
                    ? 'bg-white dark:bg-[#2d2825] text-primary dark:text-amber-300 shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                戏剧导演 (2)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('architecture')}
                className={`px-2 py-0.5 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                  selectedCategory === 'architecture'
                    ? 'bg-white dark:bg-[#2d2825] text-primary dark:text-amber-300 shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                因果架构 (1)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('audit')}
                className={`px-2 py-0.5 text-[11px] rounded-lg font-medium transition cursor-pointer ${
                  selectedCategory === 'audit'
                    ? 'bg-white dark:bg-[#2d2825] text-primary dark:text-amber-300 shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                读者盲审 (1)
              </button>
            </div>
          </div>

          {filteredSkills.map((skill) => {
            const isEnabled = activeSkillIds.includes(skill.id);
            const isExpanded = expandedSkillId === skill.id;


            return (
              <div
                key={skill.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isEnabled
                    ? 'bg-white dark:bg-[#211d1a] border-amber-500/30 shadow-md shadow-amber-900/5'
                    : 'bg-[#faf8f5] dark:bg-[#1a1715] border-[#e7e5e4] dark:border-[#2a2623] opacity-75'
                }`}
              >
                {/* 技能卡片头部 */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                      className="mt-0.5 p-1 text-ink-2 hover:text-ink transition cursor-pointer"
                      title={isExpanded ? '收起规则' : '展开规则'}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-serif font-bold text-sm text-ink dark:text-white">
                          {skill.displayName}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#f5f5f4] dark:bg-[#292524] text-ink-2 border border-[#e7e5e4] dark:border-[#38332f]">
                          v{skill.version}
                        </span>
                        <span className="text-[10px] text-ink-2">by {skill.author}</span>
                      </div>

                      <p className="text-xs text-ink-2 dark:text-[#a8a29e] mt-1 line-clamp-2">
                        {skill.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {skill.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md text-[10px] bg-amber-50/70 dark:bg-amber-950/30 text-primary dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 开关 Toggle */}
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? 'bg-amber-600' : 'bg-stone-300 dark:bg-stone-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-[10px] text-ink-2 font-mono">
                      {isEnabled ? '已启用' : '已停用'}
                    </span>
                  </div>
                </div>

                {/* 展开的规则详情 */}
                {isExpanded && (
                  <div className="border-t border-[#e7e5e4] dark:border-[#2e2a27] bg-[#fbf9f4] dark:bg-[#1e1a18]">
                    {/* 子标签切换：规则清单 / 反向禁改区 / Prompt 碎片 */}
                    <div className="flex items-center gap-1 px-4 pt-3 border-b border-[#e7e5e4]/60 dark:border-[#2e2a27]">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('rules')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 cursor-pointer ${
                          activeSubTab === 'rules'
                            ? 'border-amber-600 text-primary dark:text-amber-400 bg-white/70 dark:bg-[#24201d]'
                            : 'border-transparent text-ink-2 hover:text-ink'
                        }`}
                      >
                        白名单检验规则 ({skill.rules.length})
                      </button>

                      {skill.negativeRules && skill.negativeRules.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveSubTab('negative')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 cursor-pointer flex items-center gap-1 ${
                            activeSubTab === 'negative'
                              ? 'border-purple-600 text-purple-700 dark:text-purple-400 bg-white/70 dark:bg-[#24201d]'
                              : 'border-transparent text-ink-2 hover:text-ink'
                          }`}
                        >
                          <Scale className="w-3 h-3 text-purple-600" />
                          <span>反向禁改区 ({skill.negativeRules.length})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveSubTab('prompt')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition border-b-2 cursor-pointer ${
                          activeSubTab === 'prompt'
                            ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-white/70 dark:bg-[#24201d]'
                            : 'border-transparent text-ink-2 hover:text-ink'
                        }`}
                      >
                        Prompt 规则碎片
                      </button>
                    </div>

                    <div className="p-4 max-h-80 overflow-y-auto space-y-3">
                      {activeSubTab === 'rules' && (
                        <div className="space-y-3">
                          {skill.rules.map((rule, idx) => (
                            <div
                              key={rule.id}
                              className="p-3 rounded-xl bg-white dark:bg-[#231f1c] border border-[#e7e5e4] dark:border-[#2f2b28] text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-serif font-bold text-ink dark:text-white flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-amber-100 text-primary text-[10px] flex items-center justify-center font-mono">
                                    {idx + 1}
                                  </span>
                                  {rule.name}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                                    rule.severity === 'HIGH'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-amber-100 text-primary border border-amber-200'
                                  }`}
                                >
                                  {rule.severity === 'HIGH' ? '高频重点' : '次级特征'}
                                </span>
                              </div>

                              <p className="text-ink-2 dark:text-[#a8a29e]">{rule.description}</p>

                              <div className="p-2 rounded bg-stone-50 dark:bg-[#1a1715] font-mono text-[11px] space-y-1 border border-stone-200/60 dark:border-stone-800">
                                <div className="text-rose-700 dark:text-rose-400 flex items-start gap-1">
                                  <span className="shrink-0 font-sans">❌ 典型:</span>
                                  <span>{rule.badExample}</span>
                                </div>
                                <div className="text-emerald-700 dark:text-emerald-400 flex items-start gap-1">
                                  <span className="shrink-0 font-sans">✅ 改写:</span>
                                  <span>{rule.goodExample}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSubTab === 'negative' && skill.negativeRules && (
                        <div className="space-y-3">
                          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-300 text-xs flex items-start gap-2">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <strong>实证语言学铁律：</strong>
                              下列特征在公共认知中常被误判为“AI味”，但 283 万字对照语料实测表明人类作家使用频率反而在 AI 数倍以上！本技能严禁盲目删改。
                            </div>
                          </div>

                          {skill.negativeRules.map((neg) => (
                            <div
                              key={neg.id}
                              className="p-3 rounded-xl bg-white dark:bg-[#231f1c] border border-purple-200/60 dark:border-purple-900/40 text-xs space-y-1.5"
                            >
                              <div className="font-serif font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-purple-600" />
                                <span>{neg.name}</span>
                              </div>
                              <p className="text-ink-2 dark:text-[#a8a29e]">{neg.reason}</p>
                              <div className="text-[11px] font-mono text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded border border-purple-100 dark:border-purple-900/30">
                                📊 实测证据：{neg.empiricalFact}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeSubTab === 'prompt' && (
                        <pre className="p-3 rounded-xl bg-[#1e1c19] text-[#e7e5e4] text-[11px] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                          {skill.systemPromptFragment}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 右侧：多技能联合诊断与改写试炼沙盒 (5 栏，保持置顶可见) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 lg:sticky lg:top-4 self-start">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>技能试炼与沙盒演练</span>
            </h3>

            {/* 样本快速载入 */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setTestText(AI_HEAVY_SAMPLE)}
                className="text-[10px] text-primary hover:underline cursor-pointer"
              >
                AI味
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => setTestText(DRAMA_FLAT_SAMPLE)}
                className="text-[10px] text-orange-700 hover:underline cursor-pointer"
              >
                流水账假高潮
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => setTestText(CLEAN_SAMPLE)}
                className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
              >
                白描
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e7e5e4] dark:border-[#2e2a27] bg-white dark:bg-[#201c1a] p-4 shadow-sm flex flex-col flex-1 space-y-3">
            {/* 模式选择 */}
            <div className="flex items-center gap-1 p-1 bg-canvas dark:bg-[#1a1715] rounded-xl border border-[#e7e5e4] dark:border-[#2f2b28]">
              <button
                type="button"
                onClick={() => setPlaygroundMode('polish')}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition cursor-pointer text-center ${
                  playgroundMode === 'polish'
                    ? 'bg-white dark:bg-[#2d2825] text-primary dark:text-amber-300 shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                去AI味润色
              </button>
              <button
                type="button"
                onClick={() => setPlaygroundMode('dramaturgy')}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition cursor-pointer text-center ${
                  playgroundMode === 'dramaturgy'
                    ? 'bg-white dark:bg-[#2d2825] text-primary dark:text-amber-300 shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                戏剧导演双方案
              </button>
              <button
                type="button"
                onClick={() => setPlaygroundMode('cold_reader')}
                className={`flex-1 py-1 text-[11px] rounded-lg font-medium transition cursor-pointer text-center ${
                  playgroundMode === 'cold_reader'
                    ? 'bg-white dark:bg-[#2d2825] text-primary dark:text-amber-300 shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                Cold Reader 盲审
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-2">待体检或演练的正文片段：</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="在此粘贴任意小说段落..."
                rows={6}
                className="w-full text-xs font-serif p-3 rounded-xl border border-[#d6d3d1] dark:border-[#38332f] bg-[#fcfbf9] dark:bg-[#1a1715] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {/* 操作按钮组 */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRunAudit}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>运行规则体检</span>
              </button>

              <button
                type="button"
                onClick={handleTestWithLlm}
                disabled={isLlmRunning}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="根据当前沙盒模式调用已绑定的真实大模型网关"
              >
                {isLlmRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span>
                  {playgroundMode === 'cold_reader'
                    ? '执行读者独立盲审'
                    : playgroundMode === 'dramaturgy'
                    ? '生成双方案与重塑'
                    : '大模型实测改写'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="p-2 rounded-xl border border-[#d6d3d1] dark:border-[#38332f] text-xs hover:bg-[#f5f5f4] dark:hover:bg-[#292524] transition text-[#57534e] cursor-pointer"
                title="复制当前模式组装的 Prompt"
              >
                {copiedPrompt ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* 诊断报告展示 */}
            {auditResult && (
              <div className="p-3.5 rounded-xl bg-[#fbf9f4] dark:bg-[#181513] border border-[#e7e5e4] dark:border-[#2e2a27] space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-serif">诊断评分:</span>
                    <span
                      className={`text-xl font-mono font-bold ${
                        auditResult.score >= 90
                          ? 'text-emerald-600'
                          : auditResult.score >= 70
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {auditResult.score} <span className="text-xs font-normal text-stone-400">/ 100</span>
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      auditResult.rating === 'EXCELLENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : auditResult.rating === 'GOOD'
                        ? 'bg-blue-100 text-blue-800'
                        : auditResult.rating === 'NEEDS_POLISH'
                        ? 'bg-amber-100 text-primary'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {auditResult.rating === 'EXCELLENT'
                      ? '文学白描质感出众'
                      : auditResult.rating === 'GOOD'
                      ? '自然度良好'
                      : auditResult.rating === 'NEEDS_POLISH'
                      ? '建议白名单精修'
                      : '典型严重 AI 味'}
                  </span>
                </div>

                <p className="text-xs text-[#57534e] dark:text-[#a8a29e]">{auditResult.summary}</p>

                {auditResult.issues.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                    <div className="text-[10px] font-bold text-ink-2 uppercase">
                      命中的规则特征 ({auditResult.issues.length} 处)：
                    </div>
                    {auditResult.issues.map((issue, i) => (
                      <div
                        key={i}
                        className="p-2 rounded bg-white dark:bg-[#201c19] border border-rose-200/60 dark:border-rose-900/40 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between text-rose-800 dark:text-rose-400 font-semibold">
                          <span>{issue.ruleName}</span>
                          <span className="text-[9px] text-ink-2 font-sans">[{issue.skillName}]</span>
                        </div>
                        <div className="text-ink-2 dark:text-[#a8a29e]">
                          匹配片段: <code className="text-rose-700 bg-rose-50 px-1 rounded">{issue.excerpt}</code>
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-400">💡 {issue.suggestion}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 大模型改写输出展示 */}
            {isLlmRunning && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-primary dark:text-amber-300 text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                <span>正在调用大模型网关，基于已启用的 Skills 规范改写中...</span>
              </div>
            )}

            {llmError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs">
                改写失败: {llmError} (请确保在模型设置中已配置好有效的服务商与 API Key)
              </div>
            )}

            {llmOutput && (
              <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 font-bold font-serif">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Skills 深度重塑成稿预览：</span>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      navigator.clipboard.writeText(llmOutput);
                      await alertDialog('已复制改写后的成稿！');
                    }}
                    className="text-[10px] text-emerald-700 hover:underline cursor-pointer"
                  >
                    复制成稿
                  </button>
                </div>
                <div className="font-serif leading-relaxed text-ink dark:text-[#e7e5e4] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {llmOutput}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
