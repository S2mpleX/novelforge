import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type {
  ReviewReport,
  StylePolishResponse,
  CollaborativeWorkflowResult,
} from '@/types';
import {
  Send,
  Square,
  Copy,
  PlusCircle,
  FileCheck2,
  Bot,
  Zap,
  Sparkles,
  ShieldCheck,
  Wand2,
  Layers,
  CheckCircle2,
  Check,
  RefreshCw,
  Bookmark,
  Sliders,
  Dice5,
  Trash2,
  AlertTriangle,
  Flame,
  Keyboard,
  FastForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTypewriterStream } from '@/utils/useTypewriterStream';

const PROMPT_PRESETS = [
  { label: '顺势续写', desc: '承接前文因果情绪，自然推进后续冲突', instruction: '根据前文剧情因果与人物当前状态，顺畅续写后续桥段，保持故事冲突与情绪张力。' },
  { label: '环境五感', desc: '刻画光影、气味、声响与空间压迫感', instruction: '重点刻画当前场景的环境细节、光影氛围与人物动作神态，运用视听嗅触等感官细节，增强文学质感。' },
  { label: '锋芒对话', desc: '人物对白言辞交锋，暗藏试探与心机', instruction: '聚焦出场人物对白，强化人物鲜明的声音与潜台词，言语间暗藏动机与心理博弈，避免直白扁平。' },
  { label: '内心微表情', desc: '捕捉眼神波动与不易察觉的生理战栗', instruction: '细腻刻画主角/对手在此时的微表情、瞳孔变化与深层心理活动，呈现其内心的两难挣扎与决断。' },
  { label: '情节反转', desc: '打破既有平静，引入意外又合理的突变', instruction: '在此处引入意料之外又合乎情理的情节突变或危机，打乱主角原有计划，剧烈提升情节紧张度。' },
  { label: '暗埋伏笔', desc: '埋设一处隐秘线索或特殊道具细节', instruction: '在此段落中不经意间埋下一处隐秘的线索、反常的细节或神秘物品，为后文重大揭秘做好前置伏笔。' },
  { label: '动作交锋', desc: '招式拆解明快凌厉，节奏紧凑冲击力强', instruction: '描写激烈紧凑的打斗/交锋过程，招式动作动词精准，节奏起伏明快，具有极强的视觉画面冲击力。' },
  { label: '章末钩子', desc: '在最关键处戛然而止，制造极强追更欲', instruction: '将情节推进至关键节点，并在此处制造一个悬念钩子（Cliffhanger），给读者留下强烈的追更期待。' },
];

interface StashedDraft {
  id: string;
  createdAt: string;
  text: string;
  summary: string;
}

export const AiAssistantPanel: React.FC = () => {
  const {
    activeNovel,
    activeChapter,
    editorContent,
    updateEditorContent,
    saveCurrentChapter,
    rightPanelOpen,
    activeProvider,
    loadProviders,
  } = useNovelStore();

  const [activeTab, setActiveTab] = useState<'STREAM_WRITE' | 'COLLABORATE' | 'CONTINUITY' | 'STYLE_POLISH' | 'TOOLBOX'>('STREAM_WRITE');

  // --- TYPEWRITER STREAMING ENGINE ---
  const {
    displayedText: streamResult,
    fullText: fullStreamResult,
    isTyping,
    speed: typewriterSpeed,
    enabled: typewriterEnabled,
    soundEnabled,
    toggleSound,
    setSpeed: setTypewriterSpeed,
    setEnabled: setTypewriterEnabled,
    pushChunk,
    markStreamDone,
    flushAll,
    reset: resetTypewriter,
  } = useTypewriterStream();

  // --- STREAM WRITE STATE ---
  const [instruction, setInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Generation controls
  const [targetLength, setTargetLength] = useState<number>(600);
  const [creativity, setCreativity] = useState<number>(0.7);
  const [styleMode, setStyleMode] = useState<string>('网文快节奏');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Draft Stash (候选灵感库)
  const [stashedDrafts, setStashedDrafts] = useState<StashedDraft[]>([]);
  const [showStashDrawer, setShowStashDrawer] = useState(false);

  // --- COLLABORATIVE WORKFLOW STATE ---
  const [workflowGoal, setWorkflowGoal] = useState('');
  const [workflowWordCount, setWorkflowWordCount] = useState(3000);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<CollaborativeWorkflowResult | null>(null);

  // --- CONTINUITY AUDIT STATE ---
  const [isAuditing, setIsAuditing] = useState(false);
  const [reviewReport, setReviewReport] = useState<ReviewReport | null>(null);

  // --- STYLE POLISH STATE ---
  const [polishInput, setPolishInput] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState<StylePolishResponse | null>(null);

  // --- TOOLBOX STATE ---
  const [nameCategory, setNameCategory] = useState<'XIANXIA' | 'URBAN' | 'FANTASY' | 'SCIFI'>('XIANXIA');
  const [generatedNames, setGeneratedNames] = useState<string[]>([]);
  const [auditWordsResults, setAuditWordsResults] = useState<string[]>([]);
  const [auditScanned, setAuditScanned] = useState(false);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Load existing latest review report when chapter changes
  useEffect(() => {
    if (activeChapter) {
      api.getLatestReviewReport(activeChapter.id).then((rep) => {
        if (rep) setReviewReport(rep);
      });
    }
  }, [activeChapter?.id]);

  // Listen for streaming chunks from Tauri backend
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    api.onStreamChunk((payload) => {
      if (activeChapter && payload.chapter_id === activeChapter.id) {
        if (payload.chunk) {
          pushChunk(payload.chunk);
        }
        if (payload.is_done) {
          markStreamDone(() => {
            setIsGenerating(false);
            if (payload.error) {
              setStatusMessage(`生成出错: ${payload.error}`);
            } else {
              setStatusMessage('正文流式创作完毕，请审阅或应用！');
            }
          });
        }
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, [activeChapter?.id, pushChunk, markStreamDone]);

  if (!rightPanelOpen) return null;

  // --- HANDLERS: STREAM WRITE ---
  const handleStartGeneration = async () => {
    if (!activeNovel || !activeChapter) return;
    if (!instruction.trim()) {
      setStatusMessage('请输入创作指令或选择快捷预设');
      return;
    }

    setIsGenerating(true);
    resetTypewriter();
    setStatusMessage('正文作家 Agent 正在流式写作中...');

    // Combine prompt with length, style, and creativity instructions
    const enhancedInstruction = [
      instruction.trim(),
      `【篇幅控制要求】：本次正文生成请大致控制在 ${targetLength} 字左右，节奏紧凑。`,
      `【文学风格调性】：遵循“${styleMode}”叙事口吻，严禁使用AI腔调和空洞解说，增强临场感与细节呼吸。`,
    ].join('\n');

    try {
      await api.generateStreamChapter({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        instruction: enhancedInstruction,
        current_content: editorContent,
      });
    } catch (e: any) {
      setIsGenerating(false);
      setStatusMessage(`请求失败: ${e.message || e}`);
    }
  };

  const handleStashCurrentDraft = () => {
    const textToStash = fullStreamResult || streamResult;
    if (!textToStash) return;
    const newDraft: StashedDraft = {
      id: 'stash_' + Date.now(),
      createdAt: new Date().toLocaleTimeString(),
      text: textToStash,
      summary: instruction.slice(0, 24) || '灵感草稿',
    };
    setStashedDrafts((prev) => [newDraft, ...prev]);
    setStatusMessage('已成功将当前片段存入候选草稿箱！');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleRemoveStashedDraft = (id: string) => {
    setStashedDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const handleApplyStashedDraft = async (text: string, mode: 'APPEND' | 'REPLACE') => {
    const formattedParagraphs = text
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    if (mode === 'APPEND') {
      const newContent = (editorContent || '') + formattedParagraphs;
      updateEditorContent(newContent);
      await saveCurrentChapter(true, 'AI_STASH_APPEND');
      setStatusMessage('草稿已追加至文末！');
    } else {
      if (!confirm('确定用此草稿替换章节正文吗？（原正文已存为历史版本）')) return;
      updateEditorContent(formattedParagraphs);
      await saveCurrentChapter(true, 'AI_STASH_REPLACE');
      setStatusMessage('正文已替换并保存快照！');
    }
  };

  // --- HANDLERS: WRITER TOOLBOX ---
  const handleGenerateNames = (cat: 'XIANXIA' | 'URBAN' | 'FANTASY' | 'SCIFI') => {
    setNameCategory(cat);
    const pools = {
      XIANXIA: [
        '楚昭月 (玄天剑宗首席)', '裴行之 (青云观弃徒)', '虞紫凝 (太阴古教圣女)', '陆沉 (万象宗外门)',
        '叶千寻 (问道阁行走)', '风凌雪 (极北冰墟之主)', '林惊羽 (洗剑池剑侍)', '顾清弦 (广陵琴仙)',
        '青渊斩龙剑 (天阶灵宝)', '九劫镇魂钟 (太古凶器)', '八荒覆海幡 (上清至宝)', '落霞照雪琴 (灵器)',
        '太初分光剑典 (地阶中品)', '大荒涅槃真诀 (残本天阶)', '归墟引星法 (古神禁术)', '九天玄火变 (离火真传)'
      ],
      URBAN: [
        '顾承泽 (远见资本执行董事)', '霍沉舟 (霍氏实业掌权人)', '沈知珩 (顶级跨国律政合伙人)', '温念初 (新锐艺术策展人)',
        '黎疏影 (跨国制药首席科研官)', '宋知微 (投行并购总监)', '陆云瞻 (云巅重工少东家)', '姜挽星 (顶流珠宝设计师)',
        '天枢创投 (百亿私募股权基金)', '华晟重工 (高端智能制造龙头)', '凌霄生物 (脑机接口独角兽)', '君合盟 (全球商业联盟)'
      ],
      FANTASY: [
        '莱昂·艾尔索普 (北方守夜者领主)', '塞拉菲娜·晨星 (烈阳教廷圣女)', '维克托·范·阿尔法 (皇家炼金大师)',
        '艾莲诺拉·圣心 (白银律法大主教)', '奥古斯特·黑铁 (高山矮人锻造王)', '伊索尔德 (迷雾森林游侠队长)',
        '碎星之誓 (秘银双手重剑)', '黎明之叹息 (精金附魔胸铠)', '深渊咏叹法典 (禁忌魔法全书)', '永恒烈阳冠冕 (传世圣器)'
      ],
      SCIFI: [
        '赛琳娜·零 (仿生人反抗同盟领袖)', '雷克斯·V (边缘区黑客信使)', '希维尔·暗网 (神经界面工程师)',
        '奥创先驱·凯尔 (空间站总督)', '方舟联合体 (近地轨道深空财阀)', '新黎明智能核心 (觉醒强人工智能)',
        '脉冲离子裁决者 (重型单兵电磁炮)', '量子纠缠神经突触 (第四代脑机植入体)'
      ],
    };

    // Shuffle and pick 6 random items
    const shuffled = [...pools[cat]].sort(() => 0.5 - Math.random()).slice(0, 6);
    setGeneratedNames(shuffled);
  };

  const handleScanAuditWords = () => {
    const raw = editorContent.replace(/<[^>]+>/g, '');
    const suspiciousKeywords = [
      '涉暴', '毒品', '血腥虐杀', '枪支走私', '反动政变', '极端主义', '淫秽露骨', '洗钱地下庄家', '违禁违规', '刑讯逼供', '走私军火'
    ];
    const found: string[] = [];
    suspiciousKeywords.forEach((kw) => {
      if (raw.includes(kw)) {
        found.push(kw);
      }
    });
    setAuditWordsResults(found);
    setAuditScanned(true);
    setStatusMessage(found.length > 0 ? `自查完成：发现 ${found.length} 处潜在敏感词！` : '自查完成：未发现高危敏感违规词！');
  };

  const handleAppendToEditor = async () => {
    const textToApply = fullStreamResult || streamResult;
    if (!textToApply) return;
    const formattedParagraphs = textToApply
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    const newContent = (editorContent || '') + formattedParagraphs;
    updateEditorContent(newContent);
    await saveCurrentChapter(true, 'AI_APPEND');
    setStatusMessage('已成功追加到正文末尾并保存快照！');
    resetTypewriter();
  };

  const handleReplaceEditor = async () => {
    const textToApply = fullStreamResult || streamResult;
    if (!textToApply) return;
    if (!confirm('确定要用 AI 生成的内容替换当前章节正文吗？（原正文已自动保存为历史版本，可随时回退）')) {
      return;
    }

    const formattedParagraphs = textToApply
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    updateEditorContent(formattedParagraphs);
    await saveCurrentChapter(true, 'AI_REPLACE');
    setStatusMessage('已替换正文并创建新版本快照！');
    resetTypewriter();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage('已复制到剪贴板！');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  // --- HANDLERS: COLLABORATIVE PIPELINE ---
  const handleRunWorkflow = async () => {
    if (!activeNovel || !activeChapter) return;
    if (!workflowGoal.trim()) {
      setStatusMessage('请输入本章剧情推进目标');
      return;
    }

    setIsWorkflowRunning(true);
    setStatusMessage('多 Agent 流水线调度中：编剧拆解场景 -> 作家创作正文 -> 逻辑审稿质检...');
    setWorkflowResult(null);

    try {
      const res = await api.runCollaborativeWorkflow({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        chapter_goal: workflowGoal.trim(),
        target_word_count: workflowWordCount,
      });
      setWorkflowResult(res);
      if (res.review_report) {
        setReviewReport(res.review_report);
      }
      setStatusMessage('协作创作流水线顺利完成！');
    } catch (e: any) {
      setStatusMessage(`协作流水线执行失败: ${e.message || e}`);
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  const handleApplyWorkflowDraft = async () => {
    if (!workflowResult?.generated_draft) return;
    const formattedParagraphs = workflowResult.generated_draft
      .split('\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join('');

    updateEditorContent(formattedParagraphs);
    await saveCurrentChapter(true, 'AI_COLLABORATIVE');
    setStatusMessage('已将协同定稿装载至编辑器！');
  };

  // --- HANDLERS: CONTINUITY AUDIT ---
  const handleRunAudit = async () => {
    if (!activeChapter) return;
    setIsAuditing(true);
    setStatusMessage('逻辑审稿 Agent 正在全面核查人物、世界法则与时间因果...');

    try {
      const rep = await api.runContinuityAudit(activeChapter.id);
      setReviewReport(rep);
      setStatusMessage(`审稿完成！综合健康度评分: ${rep.score} 分`);
    } catch (e: any) {
      setStatusMessage(`审稿执行失败: ${e.message || e}`);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleToggleFindingStatus = async (findingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'RESOLVED' ? 'OPEN' : 'RESOLVED';
    try {
      await api.updateFindingStatus(findingId, nextStatus);
      if (reviewReport) {
        setReviewReport({
          ...reviewReport,
          findings: reviewReport.findings.map((f) =>
            f.id === findingId ? { ...f, status: nextStatus as any } : f
          ),
        });
      }
    } catch (e) {
      console.error('更新问题状态失败:', e);
    }
  };

  // --- HANDLERS: STYLE POLISH ---
  const handleRunPolish = async () => {
    if (!activeNovel) return;
    const textToPolish = polishInput.trim() || editorContent?.replace(/<[^>]+>/g, '').slice(0, 1000);
    if (!textToPolish) {
      setStatusMessage('请选择或输入待润色的段落文本');
      return;
    }

    setIsPolishing(true);
    setStatusMessage('文学编辑 Agent 正在基于 Humanizer 守则打磨文笔...');
    try {
      const res = await api.runStylePolish(activeNovel.id, textToPolish);
      setPolishResult(res);
      setStatusMessage('文学润色完成！');
    } catch (e: any) {
      setStatusMessage(`文学润色失败: ${e.message || e}`);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <aside className="w-96 border-l border-[#ded5c4] bg-[#f3ede1]/95 backdrop-blur-xl flex flex-col shrink-0 select-none h-[calc(100vh-3.5rem)] shadow-sm">
      {/* Top Header & Model Info */}
      <div className="p-3.5 border-b border-[#ded5c4] flex items-center justify-between bg-[#eae2d3]/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-700 to-orange-700 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#2b2621]">AI 创作智囊团</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fdfbf7] border border-[#d5cbb8] text-[11px] text-[#6b6255]">
          <Zap className="w-3 h-3 text-amber-700" />
          <span className="max-w-[130px] truncate font-medium" title={activeProvider?.name}>
            {activeProvider ? activeProvider.name : '未配置模型'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 p-1.5 bg-[#e4dcce] border-b border-[#ded5c4] gap-1 text-center">
        <button
          onClick={() => setActiveTab('STREAM_WRITE')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'STREAM_WRITE'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          单章写作
        </button>
        <button
          onClick={() => setActiveTab('COLLABORATE')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'COLLABORATE'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          协同编排
        </button>
        <button
          onClick={() => setActiveTab('CONTINUITY')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'CONTINUITY'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          逻辑审稿
        </button>
        <button
          onClick={() => setActiveTab('STYLE_POLISH')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'STYLE_POLISH'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          文学润色
        </button>
        <button
          onClick={() => setActiveTab('TOOLBOX')}
          className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
            activeTab === 'TOOLBOX'
              ? 'bg-[#854d0e] text-white shadow-sm'
              : 'text-[#685f54] hover:text-[#231f1a] hover:bg-[#ded4c3]'
          }`}
        >
          作家锦囊
        </button>
      </div>

      {/* Status Bar */}
      {statusMessage && (
        <div className="px-3.5 py-2 bg-[#faecd8] border-b border-[#f0d4b2] text-[11px] text-amber-900 flex items-center gap-2 shrink-0 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: STREAM WRITE */}
      {activeTab === 'STREAM_WRITE' && (
        <div className="flex-1 flex flex-col min-h-0 p-3 overflow-hidden bg-[#f3ede1]/40">
          {/* Quick Action Presets */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#786f65] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-800" />
                高频创作触发动作
              </label>
              <button
                onClick={() => setShowAdvancedSettings((v) => !v)}
                className="text-[10px] text-amber-800 hover:text-amber-900 flex items-center gap-0.5"
              >
                <Sliders className="w-2.5 h-2.5" />
                {showAdvancedSettings ? '收起参数' : '生成参数'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1">
              {PROMPT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setInstruction(p.instruction)}
                  title={p.desc}
                  className="px-1.5 py-1 rounded text-[11px] text-center bg-[#fdfbf7] hover:bg-[#eae2d3] text-[#3d362e] hover:text-[#1a1714] border border-[#d5cbb8] transition truncate shadow-xs font-medium"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Generation Settings Collapsible */}
          {showAdvancedSettings && (
            <div className="p-2 mb-2 rounded-lg bg-[#efe7da] border border-[#dcd1be] text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6b6255] font-medium">篇幅预期:</span>
                <div className="flex items-center gap-1">
                  {[300, 600, 1200, 2500].map((len) => (
                    <button
                      key={len}
                      onClick={() => setTargetLength(len)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                        targetLength === len
                          ? 'bg-amber-800 text-white font-bold'
                          : 'bg-[#fdfbf7] text-[#6b6255] border border-[#d5cbb8]'
                      }`}
                    >
                      {len}字
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6b6255] font-medium">文风基调:</span>
                <select
                  value={styleMode}
                  onChange={(e) => setStyleMode(e.target.value)}
                  className="bg-[#fdfbf7] border border-[#d5cbb8] rounded px-1.5 py-0.5 text-[11px] text-[#2b2621]"
                >
                  <option value="网文快节奏">现代流行（快节奏爽文）</option>
                  <option value="古典仙侠风骨">古典仙侠（辞藻雅正有留白）</option>
                  <option value="硬核严谨纪实">冷峻硬核（重逻辑与细节）</option>
                  <option value="悬疑惊悚暗流">悬疑暗流（重氛围与感官）</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#6b6255] font-medium">
                  发散度 (Creativity): <strong className="font-mono">{creativity}</strong>
                </span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={creativity}
                  onChange={(e) => setCreativity(parseFloat(e.target.value))}
                  className="w-28 accent-amber-800 h-1"
                />
              </div>
            </div>
          )}

          {/* Prompt Instruction Input */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#786f65]">
                创作指令与剧情推进
              </label>
              {stashedDrafts.length > 0 && (
                <button
                  onClick={() => setShowStashDrawer((v) => !v)}
                  className="text-[10px] text-amber-800 hover:text-amber-900 font-semibold flex items-center gap-1"
                >
                  <Bookmark className="w-2.5 h-2.5" />
                  候选草稿箱 ({stashedDrafts.length})
                </button>
              )}
            </div>

            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="例如：写主角进入藏经阁第七层，发现失传古籍中的惊人秘密，与守阁长老产生言语交锋..."
              className="w-full h-18 bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg p-2 text-xs text-[#2b2621] placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none mb-2"
            />

            <button
              onClick={handleStartGeneration}
              disabled={isGenerating || !activeChapter}
              className="w-full py-2 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-40 mb-2 active:scale-98"
            >
              {isGenerating ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                  正文流式生成中...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  启动作家 Agent 流式写作
                </>
              )}
            </button>

            {/* Output stream display or Draft Stash drawer */}
            {showStashDrawer ? (
              <div className="flex-1 flex flex-col min-h-0 border border-[#ded5c4] rounded-lg bg-[#fdfbf7] p-2.5 shadow-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#ded5c4] mb-2">
                  <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5 text-amber-800" />
                    候选草稿暂存箱 ({stashedDrafts.length})
                  </span>
                  <button
                    onClick={() => setShowStashDrawer(false)}
                    className="text-[11px] text-[#786f65] hover:text-[#2b2621]"
                  >
                    返回写作
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {stashedDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="p-2 rounded-lg bg-[#fbf8f2] border border-[#dcd1be] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#8e8476]">
                        <span>{draft.createdAt}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(draft.text)}
                            className="hover:text-black"
                            title="复制"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveStashedDraft(draft.id)}
                            className="hover:text-rose-700"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-[#2b2621] line-clamp-3 font-serif bg-white/70 p-1 rounded">
                        {draft.text}
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          onClick={() => handleApplyStashedDraft(draft.text, 'APPEND')}
                          className="px-2 py-0.5 rounded bg-emerald-800/10 text-emerald-800 text-[10px] font-medium hover:bg-emerald-800/20"
                        >
                          追加到正文
                        </button>
                        <button
                          onClick={() => handleApplyStashedDraft(draft.text, 'REPLACE')}
                          className="px-2 py-0.5 rounded bg-amber-800/10 text-amber-800 text-[10px] font-medium hover:bg-amber-800/20"
                        >
                          替换正文
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 border border-[#ded5c4] rounded-lg bg-[#fdfbf7] p-2.5 shadow-xs">
                {/* 顶栏第一行：标题、字数与草稿动作 */}
                <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-[#ded5c4]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-semibold text-[#786f65] truncate">
                      实时正文草稿
                    </span>
                    <span className="text-[10px] text-[#8e8476] font-mono whitespace-nowrap bg-[#efe7da] px-1 py-0.2 rounded border border-[#dcd1be] shrink-0">
                      {streamResult.length}{fullStreamResult && fullStreamResult.length !== streamResult.length ? `/${fullStreamResult.length}` : ''} 字
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                    {/* 打字中随时可一键跳过 */}
                    {isTyping && (
                      <button
                        onClick={flushAll}
                        className="text-[10px] text-amber-900 bg-amber-800/10 hover:bg-amber-800/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium transition animate-pulse shrink-0 whitespace-nowrap"
                        title="立即跳过动画，呈现完整正文"
                      >
                        <FastForward className="w-2.5 h-2.5 shrink-0" />
                        跳过
                      </button>
                    )}
                    {streamResult && (
                      <>
                        <button
                          onClick={handleStashCurrentDraft}
                          className="text-[10px] text-amber-800 hover:text-amber-900 flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded hover:bg-amber-800/10 transition shrink-0 whitespace-nowrap"
                          title="存入候选草稿箱"
                        >
                          <Bookmark className="w-3 h-3 shrink-0" />
                          暂存
                        </button>
                        <button
                          onClick={() => handleCopy(fullStreamResult || streamResult)}
                          className="text-[10px] text-[#786f65] hover:text-[#231f1a] flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-[#eae2d3] transition shrink-0 whitespace-nowrap"
                          title="复制全文"
                        >
                          <Copy className="w-3 h-3 shrink-0" />
                          复制
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 顶栏第二行：专有拟真打字机控制条（实时速度无缝切换 + 机械音效） */}
                <div className="flex items-center justify-between px-2 py-1 mb-1.5 bg-[#efe7da]/70 rounded-md border border-[#dcd1be] text-[10px] shrink-0">
                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <button
                      onClick={() => setTypewriterEnabled(!typewriterEnabled)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition font-medium shrink-0 whitespace-nowrap ${
                        typewriterEnabled ? 'bg-amber-800/15 text-amber-900 font-semibold' : 'text-[#8e8476] hover:text-[#423d33]'
                      }`}
                      title={typewriterEnabled ? "已开启拟真作家打字机（点击切换为极速直出）" : "已开启极速直出模式（点击开启拟真打字机）"}
                    >
                      <Keyboard className="w-2.5 h-2.5 shrink-0" />
                      {typewriterEnabled ? '打字机' : '极速直出'}
                    </button>

                    {typewriterEnabled && (
                      <>
                        <span className="text-[9px] text-[#c5bba8] select-none">|</span>
                        <div className="flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                          {([
                            { id: 'slow', label: '沉思', tip: '沉思品味：逐字推敲 (约7~8字/s)' },
                            { id: 'normal', label: '作家', tip: '作家手速：自然词组心流 (约13~15字/s)' },
                            { id: 'fast', label: '泉涌', tip: '文思泉涌：快速成文 (约25~30字/s)' },
                          ] as const).map(({ id, label, tip }) => (
                            <button
                              key={id}
                              onClick={() => setTypewriterSpeed(id)}
                              className={`px-1.5 py-0.5 rounded transition shrink-0 whitespace-nowrap ${
                                typewriterSpeed === id
                                  ? 'bg-amber-800 text-white font-bold shadow-xs'
                                  : 'text-[#6b6255] hover:text-[#2b2621] hover:bg-white/60'
                              }`}
                              title={tip}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {typewriterEnabled && (
                    <div className="flex items-center shrink-0 whitespace-nowrap">
                      <button
                        onClick={toggleSound}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition shrink-0 whitespace-nowrap ${
                          soundEnabled ? 'text-amber-900 bg-amber-800/15 font-semibold' : 'text-[#a89f92] hover:text-[#6b6255]'
                        }`}
                        title={soundEnabled ? "机械按键音已开启（点击静音）" : "机械按键音已静音（点击开启）"}
                      >
                        {soundEnabled ? <Volume2 className="w-2.5 h-2.5 shrink-0" /> : <VolumeX className="w-2.5 h-2.5 shrink-0" />}
                        <span className="text-[9px]">{soundEnabled ? '音效开' : '静音'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto text-xs text-[#2b2621] whitespace-pre-wrap leading-relaxed select-text font-serif pr-1">
                  {streamResult ? (
                    <>
                      {streamResult}
                      {(isGenerating || isTyping) && (
                        <span 
                          className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#854d0e] animate-pulse align-middle rounded-xs shadow-xs" 
                          title="作家 Agent 正在码字中..."
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-[#a89f92] italic select-none">
                      点击上方启动后，Agent 将在此处实时流式输出生成的正文草稿...
                    </span>
                  )}
                </div>

                {streamResult && !isGenerating && !isTyping && (
                  <div className="pt-2 border-t border-[#ded5c4] grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={handleAppendToEditor}
                      className="py-1.5 px-2 rounded bg-emerald-800/10 hover:bg-emerald-800/20 text-emerald-800 border border-emerald-800/25 text-xs font-medium flex items-center justify-center gap-1 transition"
                    >
                      <PlusCircle className="w-3 h-3" />
                      追加到文末
                    </button>
                    <button
                      onClick={handleReplaceEditor}
                      className="py-1.5 px-2 rounded bg-amber-800/10 hover:bg-amber-800/20 text-amber-800 border border-amber-800/25 text-xs font-medium flex items-center justify-center gap-1 transition"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      替换正文
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COLLABORATIVE PIPELINE */}
      {activeTab === 'COLLABORATE' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f3ede1]/40">
          <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] text-xs text-[#2b2621] shadow-xs">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-amber-900">
              <Layers className="w-3.5 h-3.5 text-amber-700" />
              多 Agent 协作工作流 (Pipeline)
            </div>
            <p className="text-[11px] text-[#786f65] leading-relaxed">
              自动化流水线调度：由章节编剧 (Scene Planner) 拆解场景节拍，再由正文作家 (Prose Writer) 撰写草稿，最后由逻辑审稿 (Continuity Auditor) 自动出具质检报告。
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#786f65] block mb-1">
              本章剧情核心推进目标 *
            </label>
            <textarea
              value={workflowGoal}
              onChange={(e) => setWorkflowGoal(e.target.value)}
              placeholder="例如：揭开先驱者号主引擎失谐之谜，林远与安雅在引力雷区产生战术分歧，最终冒险跃迁。"
              rows={3}
              className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg p-2 text-xs text-[#2b2621] placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#786f65] block mb-1">
              期望篇幅 (字数)
            </label>
            <div className="flex items-center gap-2">
              {[2000, 3000, 4000].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setWorkflowWordCount(num)}
                  className={`px-2.5 py-1 rounded text-xs border transition ${
                    workflowWordCount === num
                      ? 'bg-amber-800/15 border-amber-800 text-amber-900 font-semibold shadow-xs'
                      : 'bg-[#fdfbf7] border-[#d5cbb8] text-[#6b6255] hover:text-[#2b2621]'
                  }`}
                >
                  {num} 字
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRunWorkflow}
            disabled={isWorkflowRunning || !activeChapter}
            className="w-full py-2.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-40"
          >
            {isWorkflowRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                多 Agent 流水线协作推进中...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                启动完整多 Agent 协同流水线
              </>
            )}
          </button>

          {/* Workflow Results Display */}
          {workflowResult && (
            <div className="space-y-3 pt-2 border-t border-[#ded5c4]">
              <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2b2621]">
                    编剧拆解的场景节拍 ({workflowResult.planned_scenes.length} 幕)
                  </span>
                </div>
                <div className="space-y-1.5">
                  {workflowResult.planned_scenes.map((s) => (
                    <div key={s.id} className="p-2 rounded bg-[#f7f2e7] border border-[#e3d9c7] text-xs">
                      <div className="font-semibold text-amber-900">
                        场次 {s.sequence}：{s.objective}
                      </div>
                      <div className="text-[11px] text-[#6b6255] mt-0.5">{s.outline}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#2b2621]">
                    生成的初稿草稿 ({workflowResult.generated_draft.length} 字)
                  </span>
                  <button
                    onClick={handleApplyWorkflowDraft}
                    className="text-xs px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-medium rounded transition flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3 h-3" />
                    装载至正文
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto text-xs text-[#2b2621] font-serif leading-relaxed whitespace-pre-wrap p-2 bg-[#f7f2e7] rounded border border-[#e3d9c7]">
                  {workflowResult.generated_draft}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTINUITY AUDIT */}
      {activeTab === 'CONTINUITY' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f3ede1]/40">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[#2b2621]">逻辑审稿与设定核查</h3>
              <p className="text-[11px] text-[#786f65]">核查人物性格、世界法则与时间线冲突</p>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={isAuditing || !activeChapter}
              className="px-3 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center gap-1 transition shadow-sm disabled:opacity-40"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              执行审稿
            </button>
          </div>

          {reviewReport ? (
            <div className="space-y-3">
              {/* Score Card */}
              <div className="p-3 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[11px] text-[#786f65]">本章综合合规评分</div>
                  <div className="text-2xl font-bold text-[#1f1d1a] mt-0.5">
                    {reviewReport.score} <span className="text-xs font-normal text-[#9e9383]">/ 100</span>
                  </div>
                </div>
                <div className="text-right max-w-[170px]">
                  <span className="text-[11px] text-amber-900 font-medium line-clamp-2">
                    {reviewReport.summary}
                  </span>
                </div>
              </div>

              {/* Findings List */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-[#786f65]">
                  审查发现与整改建议 ({reviewReport.findings.length})
                </div>

                {reviewReport.findings.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#786f65] border border-dashed border-[#ded5c4] rounded-lg bg-[#fdfbf7]">
                    未发现设定冲突或逻辑硬伤，剧情逻辑严密！
                  </div>
                ) : (
                  reviewReport.findings.map((f) => {
                    const isResolved = f.status === 'RESOLVED';
                    const severityColor =
                      f.severity === 'CRITICAL'
                        ? 'border-rose-300 bg-rose-50 text-rose-900'
                        : f.severity === 'MAJOR'
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-orange-200 bg-orange-50 text-orange-950';

                    return (
                      <div
                        key={f.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isResolved ? 'opacity-50 border-[#ded5c4] bg-[#eae3d4]' : severityColor
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70 border border-current">
                            {f.severity} · {f.category}
                          </span>
                          <button
                            onClick={() => handleToggleFindingStatus(f.id, f.status)}
                            className="text-[11px] text-[#6b6255] hover:text-[#1f1d1a] flex items-center gap-1"
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isResolved ? 'text-emerald-700' : ''}`} />
                            {isResolved ? '已解决' : '标记已改'}
                          </button>
                        </div>

                        <div className="text-xs font-semibold text-[#1f1d1a]">{f.title}</div>
                        <div className="text-[11px] text-[#3d362e] mt-1 leading-relaxed">
                          {f.description}
                        </div>

                        {f.evidence_quote && (
                          <div className="mt-1.5 p-1.5 rounded bg-white/60 border border-[#e3d9c7] text-[11px] text-[#6b6255] italic">
                            “{f.evidence_quote}”
                          </div>
                        )}

                        <div className="mt-1.5 text-[11px] text-amber-900 font-medium">
                          修改建议：{f.suggestion}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#786f65] border border-dashed border-[#ded5c4] rounded-lg bg-[#fdfbf7]">
              点击“执行审稿”对当前正文进行全面逻辑因果体检
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STYLE POLISH */}
      {activeTab === 'STYLE_POLISH' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f3ede1]/40">
          <div className="p-2.5 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] text-xs text-[#2b2621] shadow-xs">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-amber-900">
              <Wand2 className="w-3.5 h-3.5 text-amber-700" />
              Humanizer 文学精修守则
            </div>
            <p className="text-[11px] text-[#786f65] leading-relaxed">
              坚决剔除“AI 腔调”与空洞说明文套话，清退策划/引擎术语，增强微表情、对话留白与临场动作呼吸感。
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#786f65] block mb-1">
              待润色正文选段
            </label>
            <textarea
              value={polishInput}
              onChange={(e) => setPolishInput(e.target.value)}
              placeholder="粘贴或输入需要润色的段落（留空则默认截取当前正文前段）..."
              rows={4}
              className="w-full bg-[#fdfbf7] border border-[#d5cbb8] rounded-lg p-2 text-xs text-[#2b2621] placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none"
            />
          </div>

          <button
            onClick={handleRunPolish}
            disabled={isPolishing}
            className="w-full py-2.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-40"
          >
            {isPolishing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                文学编辑 Agent 精修润色中...
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                启动文学编辑润色
              </>
            )}
          </button>

          {polishResult && (
            <div className="space-y-3 pt-2 border-t border-[#ded5c4]">
              <div className="text-[11px] text-[#786f65] italic">
                {polishResult.summary}
              </div>

              {polishResult.revisions.map((rev, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#fdfbf7] border border-[#ded5c4] space-y-2 shadow-xs">
                  <div className="text-[11px] text-[#8e8476] line-through">
                    原文：{rev.original_text}
                  </div>
                  <div className="text-xs text-[#1f1d1a] font-serif leading-relaxed bg-[#f7f2e7] p-2.5 rounded border border-[#e3d9c7]">
                    精修：{rev.revised_text}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-900">
                    <span>理由：{rev.rationale}</span>
                    <button
                      onClick={() => handleCopy(rev.revised_text)}
                      className="text-[#786f65] hover:text-[#1f1d1a] flex items-center gap-0.5"
                    >
                      <Copy className="w-3 h-3" />
                      复制精修
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: WRITER TOOLBOX (起名大师、敏词自查、节奏锦囊) */}
      {activeTab === 'TOOLBOX' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5 bg-[#f3ede1]/40">
          {/* Card 1: Name Forge */}
          <div className="p-3 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Dice5 className="w-3.5 h-3.5 text-amber-800" />
                起名大师 · 灵感神兵殿
              </span>
              <button
                onClick={() => handleGenerateNames(nameCategory)}
                className="px-2 py-0.5 rounded bg-amber-800/10 text-amber-800 text-[10px] font-semibold hover:bg-amber-800/20 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                换一批
              </button>
            </div>

            {/* Category Pills */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'XIANXIA', label: '玄幻仙侠' },
                { id: 'URBAN', label: '现代都市' },
                { id: 'FANTASY', label: '西幻中世' },
                { id: 'SCIFI', label: '赛博科幻' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleGenerateNames(c.id as any)}
                  className={`py-1 rounded text-[10px] text-center transition font-medium ${
                    nameCategory === c.id
                      ? 'bg-amber-800 text-white font-bold shadow-xs'
                      : 'bg-[#efe7da] text-[#6b6255] hover:bg-[#e4dcce]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Name Results */}
            <div className="space-y-1.5 pt-1">
              {generatedNames.length === 0 ? (
                <div
                  onClick={() => handleGenerateNames('XIANXIA')}
                  className="py-4 text-center text-[11px] text-[#8e8476] border border-dashed border-[#dcd1be] rounded-lg cursor-pointer hover:bg-[#f5efe4]"
                >
                  点击“换一批”或选择分类生成名字与神兵法宝
                </div>
              ) : (
                generatedNames.map((name, i) => (
                  <div
                    key={i}
                    className="p-1.5 rounded bg-[#f7f2e7] hover:bg-[#f0e7d5] border border-[#ded5c4] flex items-center justify-between text-xs transition"
                  >
                    <span className="font-serif text-[#2b2621] select-all font-medium">
                      {name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setInstruction((prev) => (prev ? `${prev}，登场角色/道具包括：${name.split(' ')[0]}` : `登场角色/道具：${name.split(' ')[0]}`));
                          setActiveTab('STREAM_WRITE');
                          setStatusMessage(`已将【${name.split(' ')[0]}】填入创作指令！`);
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-amber-800/10 text-amber-800 hover:bg-amber-800/20"
                        title="填入指令"
                      >
                        填入
                      </button>
                      <button
                        onClick={() => handleCopy(name.split(' ')[0])}
                        className="p-1 text-[#786f65] hover:text-[#2b2621]"
                        title="复制名称"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Sensitive Words Audit */}
          <div className="p-3 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-800" />
                网文敏感合规自查
              </span>
              <button
                onClick={handleScanAuditWords}
                className="px-2 py-0.5 rounded bg-amber-800 text-white text-[10px] font-semibold hover:bg-amber-700 transition"
              >
                扫描本章正文
              </button>
            </div>
            <p className="text-[10px] text-[#8e8476] leading-relaxed">
              基于主流网络文学平台审核规则自查，排查高风险涉政、涉暴违规词根。
            </p>

            {auditScanned && (
              <div className="pt-1.5">
                {auditWordsResults.length === 0 ? (
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    安全：正文中未检出高危违禁关键词。
                  </div>
                ) : (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                    <div className="font-semibold text-[11px]">
                      预警：发现 {auditWordsResults.length} 个疑似敏感词：
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {auditWordsResults.map((kw, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-mono border border-rose-200"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Tension & Hook Guide */}
          <div className="p-3 rounded-xl bg-[#fdfbf7] border border-[#ded5c4] shadow-xs space-y-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-800" />
              黄金三章张力自测指南
            </span>
            <div className="text-[11px] text-[#6b6255] space-y-1 leading-relaxed">
              <p>• <strong>第1章 破局点：</strong>切忌大段说明文，开篇 300 字内必须给主角抛出危机或反常事件。</p>
              <p>• <strong>第2章 欲望线：</strong>主角面临的明确目标是什么？失败的毁灭性代价是什么？</p>
              <p>• <strong>第3章 强反转与金手指：</strong>底层规则破壁，爽点或命运转折降临，结尾设下巨大悬念钩子。</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
