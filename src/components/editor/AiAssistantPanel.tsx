import React, { useState, useEffect } from 'react';
import { useNovelStore } from '@/stores/useNovelStore';
import { api } from '@/utils/tauriBridge';
import type {
  ReviewReport,
  StylePolishResponse,
  CollaborativeWorkflowResult,
  OptimizeWritingPromptResult,
  PromptOptimizationAngle,
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
import { confirmDialog } from '@/utils/dialog';

const OPTIMIZER_ANGLES: { id: PromptOptimizationAngle; label: string; desc: string; icon: string }[] = [
  { id: 'DRAMA_CONFLICT', label: '戏剧博弈', desc: '动机对抗与言语机锋', icon: '⚡' },
  { id: 'SENSORY_DETAIL', label: '感官白描', desc: '临场光影与物象细节', icon: '🎨' },
  { id: 'PLOT_HOOK', label: '伏笔悬念', desc: '线索勾连与章末断章', icon: '🪝' },
  { id: 'CONCISE_PUNCHY', label: '快节奏推进', desc: '爽利推进与强情节对抗', icon: '🚀' },
];

const PROMPT_PRESETS = [
  { shortLabel: '顺推', label: '顺势续写', desc: '承接前文因果情绪，自然推进后续冲突', instruction: '根据前文剧情因果与人物当前状态，顺畅续写后续桥段，保持故事冲突与情绪张力。' },
  { shortLabel: '环境', label: '环境五感', desc: '刻画光影、气味、声响与空间压迫感', instruction: '重点刻画当前场景的环境细节、光影氛围与人物动作神态，运用视听嗅触等感官细节，增强文学质感。' },
  { shortLabel: '对话', label: '锋芒对白', desc: '人物对白言辞交锋，暗藏试探与心机', instruction: '聚焦出场人物对白，强化人物鲜明的声音与潜台词，言语间暗藏动机与心理博弈，避免直白扁平。' },
  { shortLabel: '微表情', label: '内心微澜', desc: '捕捉眼神波动与不易察觉的生理战栗', instruction: '细腻刻画主角/对手在此时的微表情、瞳孔变化与深层心理活动，呈现其内心的两难挣扎与决断。' },
  { shortLabel: '反转', label: '情节反转', desc: '打破既有平静，引入意外又合理的突变', instruction: '在此处引入意料之外又合乎情理的情节突变或危机，打乱主角原有计划，剧烈提升情节紧张度。' },
  { shortLabel: '伏笔', label: '暗埋伏笔', desc: '埋设一处隐秘线索或特殊道具细节', instruction: '在此段落中不经意间埋下一处隐秘的线索、反常的细节或神秘物品，为后文重大揭秘做好前置伏笔。' },
  { shortLabel: '交锋', label: '动作交锋', desc: '招式拆解明快凌厉，节奏紧凑冲击力强', instruction: '描写激烈紧凑的打斗/交锋过程，招式动作动词精准，节奏起伏明快，具有极强的视觉画面冲击力。' },
  { shortLabel: '钩子', label: '章末钩子', desc: '在最关键处戛然而止，制造极强追更欲', instruction: '将情节推进至关键节点，并在此处制造一个悬念钩子（Cliffhanger），给读者留下强烈的追更期待。' },
];

interface StashedDraft {
  id: string;
  createdAt: string;
  text: string;
  summary: string;
}

const formatTextToParagraphs = (rawText: string): string => {
  return rawText
    .split('\n')
    .filter((p) => p.trim())
    .map((p) => {
      const escaped = p
        .trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${escaped}</p>`;
    })
    .join('');
};

export const AiAssistantPanel: React.FC = () => {
  const {
    activeNovel,
    activeChapter,
    editorContent,
    updateEditorContent,
    saveCurrentChapter,
    activeProvider,
    activeModel,
    loadProviders,
    creationContext,
  } = useNovelStore();

  const [activeTab, setActiveTab] = useState<'STREAM_WRITE' | 'COLLABORATE' | 'CONTINUITY' | 'STYLE_POLISH' | 'TOOLBOX'>('STREAM_WRITE');
  const [showHierarchyContext, setShowHierarchyContext] = useState(false);

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

  // --- AI PROMPT OPTIMIZER STATE ---
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [promptOptimizerResult, setPromptOptimizerResult] = useState<OptimizeWritingPromptResult | null>(null);
  const [selectedOptimizerAngle, setSelectedOptimizerAngle] = useState<PromptOptimizationAngle>('DRAMA_CONFLICT');
  const [showPromptOptimizer, setShowPromptOptimizer] = useState(false);
  const [promptOptimizerTarget, setPromptOptimizerTarget] = useState<'STREAM_WRITE' | 'WORKFLOW_GOAL'>('STREAM_WRITE');
  const [optimizerError, setOptimizerError] = useState<string | null>(null);

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
    let isCancelled = false;
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
      if (isCancelled) {
        if (typeof fn === 'function') fn();
      } else {
        unlisten = fn;
      }
    }).catch((err) => {
      console.error('[AiAssistantPanel] Failed to attach stream listener:', err);
    });

    return () => {
      isCancelled = true;
      if (typeof unlisten === 'function') unlisten();
    };
  }, [activeChapter?.id, pushChunk, markStreamDone]);

  // --- HANDLERS: AI PROMPT OPTIMIZER ---
  const handleOptimizePrompt = async (
    targetField: 'STREAM_WRITE' | 'WORKFLOW_GOAL',
    angleOverride?: PromptOptimizationAngle
  ) => {
    const angleToUse = angleOverride || selectedOptimizerAngle;
    const currentPrompt = targetField === 'STREAM_WRITE' ? instruction : workflowGoal;

    if (!currentPrompt.trim()) {
      setStatusMessage('请先在输入框中输入创作粗纲或简要想法，再点击 AI 优化！');
      return;
    }

    setPromptOptimizerTarget(targetField);
    setShowPromptOptimizer(true);
    setIsOptimizingPrompt(true);
    setOptimizerError(null);
    setStatusMessage(`AI 提示词重构中（${OPTIMIZER_ANGLES.find((a) => a.id === angleToUse)?.label || '智能优化'}）...`);

    try {
      const res = await api.optimizeWritingPrompt({
        novel_id: activeNovel?.id,
        chapter_id: activeChapter?.id,
        raw_prompt: currentPrompt.trim(),
        target_length: targetLength,
        optimization_angle: angleToUse,
        style_mode: styleMode,
      });
      setPromptOptimizerResult(res);
      setStatusMessage('提示词重构完成！可查看增强要点并一键采纳。');
    } catch (err: any) {
      console.error('[PromptOptimizer] Failed to optimize writing prompt:', err);
      setOptimizerError(err?.message || String(err));
      setStatusMessage(`提示词优化失败: ${err?.message || err}`);
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  const handleApplyOptimizedPrompt = (mode: 'REPLACE' | 'APPEND') => {
    if (!promptOptimizerResult?.optimized_prompt) return;
    const text = promptOptimizerResult.optimized_prompt;

    if (promptOptimizerTarget === 'STREAM_WRITE') {
      if (mode === 'REPLACE') {
        setInstruction(text);
      } else {
        setInstruction((prev) => (prev ? `${prev}\n\n${text}` : text));
      }
    } else {
      if (mode === 'REPLACE') {
        setWorkflowGoal(text);
      } else {
        setWorkflowGoal((prev) => (prev ? `${prev}\n\n${text}` : text));
      }
    }

    setShowPromptOptimizer(false);
    setStatusMessage('已将优化后的创作指令填入输入框！');
  };

  const renderPromptOptimizerCard = (target: 'STREAM_WRITE' | 'WORKFLOW_GOAL') => {
    if (!showPromptOptimizer || promptOptimizerTarget !== target) return null;

    return (
      <div className="mb-2 rounded-lg border border-amber-800/30 dark:border-amber-600/30 bg-[#fcf9f2] dark:bg-[#201c18] p-2.5 shadow-xs space-y-2 text-xs animate-in fade-in">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#e6dcce] dark:border-[#38322a]">
          <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
            <span>AI 提示词深度重构</span>
            <span className="text-[10px] font-normal text-[#807567] dark:text-[#a09485]">
              ({target === 'STREAM_WRITE' ? '作家写作指令' : '全流程创作目标'})
            </span>
          </div>
          <button
            onClick={() => setShowPromptOptimizer(false)}
            className="text-[11px] text-[#807567] dark:text-[#a09485] hover:text-ink dark:hover:text-[#f3eee7] px-1 py-0.5 rounded hover:bg-[#efe7da] dark:hover:bg-[#2a241f] cursor-pointer"
            title="关闭面板"
          >
            ✕
          </button>
        </div>

        {/* Optimization Angle Selector */}
        <div>
          <div className="text-[10px] text-ink-2 dark:text-[#a09485] font-semibold mb-1 flex items-center justify-between">
            <span>重构视角与文学侧重：</span>
            <span className="text-[9px] text-primary dark:text-amber-400 font-normal">
              {OPTIMIZER_ANGLES.find((a) => a.id === selectedOptimizerAngle)?.desc}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {OPTIMIZER_ANGLES.map((angle) => {
              const isSelected = selectedOptimizerAngle === angle.id;
              return (
                <button
                  key={angle.id}
                  onClick={() => {
                    setSelectedOptimizerAngle(angle.id);
                    handleOptimizePrompt(target, angle.id);
                  }}
                  disabled={isOptimizingPrompt}
                  className={`py-1 px-1 rounded text-[10px] flex items-center justify-center gap-1 transition truncate cursor-pointer ${
                    isSelected
                      ? 'bg-amber-800 text-white font-bold shadow-xs'
                      : 'bg-[#f4ede0] hover:bg-[#ebe1cf] text-ink-2 border border-[#dacfc0] dark:bg-[#2a241f] dark:hover:bg-[#342e27] dark:text-[#a09485] dark:border-[#3d362e]'
                  }`}
                  title={angle.desc}
                >
                  <span>{angle.icon}</span>
                  <span className="truncate">{angle.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isOptimizingPrompt && (
          <div className="py-4 flex flex-col items-center justify-center gap-2 text-primary dark:text-amber-400 bg-amber-800/5 dark:bg-amber-950/20 rounded border border-dashed border-amber-800/20 dark:border-amber-600/30">
            <Sparkles className="w-4 h-4 animate-spin text-primary dark:text-amber-400" />
            <span className="text-[11px] font-medium animate-pulse">
              正在调用文学模型重构提示词，融入人物因果与感官细节...
            </span>
          </div>
        )}

        {/* Error State */}
        {optimizerError && !isOptimizingPrompt && (
          <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded text-rose-800 dark:text-rose-300 text-[11px] flex items-center justify-between">
            <span>优化失败: {optimizerError}</span>
            <button
              onClick={() => handleOptimizePrompt(target)}
              className="underline font-bold hover:text-rose-950 dark:hover:text-rose-100 ml-2 cursor-pointer"
            >
              重试
            </button>
          </div>
        )}

        {/* Result View */}
        {promptOptimizerResult && !isOptimizingPrompt && (
          <div className="space-y-2">
            {/* Suggested Tags */}
            {promptOptimizerResult.suggested_tags && promptOptimizerResult.suggested_tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-[#807567] dark:text-[#a09485]">文学标签:</span>
                {promptOptimizerResult.suggested_tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.2 rounded text-[10px] bg-amber-800/10 dark:bg-amber-400/15 text-primary dark:text-amber-300 border border-amber-800/20 dark:border-amber-400/30 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Enhancement Points */}
            {promptOptimizerResult.enhancement_points && promptOptimizerResult.enhancement_points.length > 0 && (
              <div className="bg-[#f5efe4] dark:bg-[#231e1a] p-2 rounded border border-line dark:border-[#38322a] text-[11px]">
                <span className="font-semibold text-amber-950 dark:text-amber-200 block mb-1">
                  ✨ 核心文学增强维度：
                </span>
                <ul className="space-y-0.5 text-[#544b40] dark:text-[#c4b59d]">
                  {promptOptimizerResult.enhancement_points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary dark:text-amber-400 font-bold shrink-0">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Cliffhanger Hooks */}
            {promptOptimizerResult.suggested_hooks && (
              <div className="bg-rose-50/80 dark:bg-rose-950/30 p-2 rounded border border-rose-200/80 dark:border-rose-800/40 text-[11px]">
                <span className="font-semibold text-rose-950 dark:text-rose-200 block mb-0.5 flex items-center gap-1">
                  <span>🎣 建议章末断章悬念 (Cliffhanger Hook)：</span>
                </span>
                <p className="text-rose-900 dark:text-rose-300 italic font-serif">
                  “{promptOptimizerResult.suggested_hooks}”
                </p>
              </div>
            )}

            {/* Formatted Optimized Prompt Textarea / Preview */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-ink-2 dark:text-[#a09485]">
                  重构后的高质量小说创作指令：
                </span>
                <button
                  onClick={() => handleCopy(promptOptimizerResult.optimized_prompt)}
                  className="text-[10px] text-primary dark:text-amber-400 hover:text-black dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
                >
                  <Copy className="w-2.5 h-2.5" />
                  复制指令
                </button>
              </div>
              <div className="p-2 rounded bg-white dark:bg-[#161412] border border-line dark:border-[#38322a] text-[11px] text-[#24201b] dark:text-[#ede6dc] font-serif leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
                {promptOptimizerResult.optimized_prompt}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#e6dcce] dark:border-[#38322a]">
              <button
                onClick={() => handleApplyOptimizedPrompt('REPLACE')}
                className="flex-1 py-1.5 px-2 rounded bg-amber-800 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition shadow-xs cursor-pointer active:scale-98"
              >
                <Check className="w-3 h-3" />
                采纳并替换入输入框
              </button>
              <button
                onClick={() => handleApplyOptimizedPrompt('APPEND')}
                className="py-1.5 px-2 rounded bg-surface-2 dark:bg-[#26211c] hover:bg-[#e2d8c5] dark:hover:bg-[#322c25] text-ink dark:text-[#ede6dc] border border-[#d2c6b3] dark:border-[#38322a] text-[11px] font-medium flex items-center justify-center gap-1 transition cursor-pointer active:scale-98"
                title="保留当前输入内容，将优化指令追加到文末"
              >
                <PlusCircle className="w-3 h-3" />
                追加
              </button>
              <button
                onClick={() => handleOptimizePrompt(target)}
                disabled={isOptimizingPrompt}
                className="p-1.5 rounded hover:bg-[#efe7da] dark:hover:bg-[#2a241f] text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#ede6dc] transition cursor-pointer"
                title="换一种表述重新优化"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

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

    // Combine prompt with tiered length instructions, style, and creativity
    const lengthConstraint =
      targetLength === 0
        ? `【篇幅与节奏准则（AI 自主动态把控）】：
请你作为资深长篇小说作家，完全依据当前剧情的戏剧冲突烈度、信息密度与情境需要，自主权衡并决定本次输出的最佳篇幅：
1. 若当前指令仅需微观过渡、单次对话博弈或局部动作反应，请自然生成 1~2 个精炼自然段（约 150~300 字），写透情境即止，绝不强行注水拖沓；
2. 若当前指令涉及一个独立的情节场景（如单场战斗交锋、谈判解密、环境探索），请自然展开至该情境自然收束（约 600~1500 字）；
3. 若当前指令涵盖全章大纲推进或高潮对决，请放开笔力充分铺陈起承转合、多维博弈与章末悬念钩子（约 2500~4000 字）；
【核心原则】：以“剧情因果自然闭环、张力饱满、留有呼吸感”为唯一标准，该长则长，该收则收，切忌为了凑字数而注水，也切忌仓促烂尾。`
        : targetLength <= 400
        ? `【篇幅与结构要求】：本次正文生成请紧贴上文仅顺推生成 1~2 个精炼自然段，字数严格控制在 ${targetLength} 字左右，节奏紧凑，点到即止，切忌擅自跨越过多剧情。`
        : targetLength >= 2200
        ? `【篇幅与结构要求】：本次请作为完整独立章节进行全篇创作，字数目标为 ${targetLength} 字左右。请铺陈完整起承转合、环境氛围、多轮博弈对白与章末伏笔钩子，情节充实饱满，严禁草草收尾。`
        : `【篇幅与结构要求】：本次正文生成请大致控制在 ${targetLength} 字左右，展开当前场景的情节冲突与细节互动。`;

    const enhancedInstruction = [
      instruction.trim(),
      lengthConstraint,
      `【文学风格调性】：遵循“${styleMode}”叙事口吻，严禁使用AI腔调和空洞解说，增强临场感与细节呼吸。`,
    ].join('\n');

    try {
      const computedMaxTokens =
        targetLength === 0
          ? 8192
          : Math.max(800, Math.min(16000, Math.ceil(targetLength * 2.2)));
      await api.generateStreamChapter({
        novel_id: activeNovel.id,
        chapter_id: activeChapter.id,
        instruction: enhancedInstruction,
        current_content: editorContent,
        temperature: creativity,
        max_tokens: computedMaxTokens,
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
    const formattedParagraphs = formatTextToParagraphs(text);

    if (mode === 'APPEND') {
      const newContent = (editorContent || '') + formattedParagraphs;
      updateEditorContent(newContent);
      await saveCurrentChapter(true, 'AI_STASH_APPEND');
      setStatusMessage('草稿已追加至文末！');
    } else {
      if (!await confirmDialog('确定用此草稿替换章节正文吗？（原正文已存为历史版本）')) return;
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
    const formattedParagraphs = formatTextToParagraphs(textToApply);

    const newContent = (editorContent || '') + formattedParagraphs;
    updateEditorContent(newContent);
    await saveCurrentChapter(true, 'AI_APPEND');
    setStatusMessage('已成功追加到正文末尾并保存快照！');
    resetTypewriter();
  };

  const handleReplaceEditor = async () => {
    const textToApply = fullStreamResult || streamResult;
    if (!textToApply) return;
    if (!await confirmDialog('确定要用 AI 生成的内容替换当前章节正文吗？（原正文已自动保存为历史版本，可随时回退）')) {
      return;
    }

    const formattedParagraphs = formatTextToParagraphs(textToApply);

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
    const formattedParagraphs = formatTextToParagraphs(workflowResult.generated_draft);

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
    <div className="w-full h-full flex-1 min-w-0 bg-surface-2 dark:bg-[#1c1917] flex flex-col select-none overflow-hidden">
      {/* Top Header & Model Info */}
      <div className="p-2.5 sm:p-3 border-b border-line flex items-center justify-between gap-2 bg-surface-2/50 shrink-0">
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-700 to-orange-700 flex items-center justify-center text-white shadow-sm shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-ink whitespace-nowrap">AI 创作智囊团</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface border border-line text-[11px] text-ink-2 shrink-0 min-w-0 max-w-[55%]">
          <Zap className="w-3 h-3 text-primary shrink-0" />
          <span
            className="truncate font-medium"
            title={`${activeProvider?.name || '未配置'}${activeModel ? ` (${activeModel.model_name})` : ''}`}
          >
            {activeProvider
              ? `${activeProvider.name}${activeModel ? ` · ${activeModel.model_name}` : ''}`
              : '未配置模型'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center p-1.5 bg-surface-3 border-b border-line gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { key: 'STREAM_WRITE', label: '单章写作' },
          { key: 'COLLABORATE', label: '协同编排' },
          { key: 'CONTINUITY', label: '逻辑审稿' },
          { key: 'STYLE_POLISH', label: '文学润色' },
          { key: 'TOOLBOX', label: '作家锦囊' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 min-w-[62px] px-2 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap text-center transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-[#854d0e] text-white shadow-xs'
                : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Bar */}
      {statusMessage && (
        <div className="px-3.5 py-2 bg-[#faecd8] border-b border-[#f0d4b2] text-[11px] text-primary flex items-center gap-2 shrink-0 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">{statusMessage}</span>
        </div>
      )}

      {/* TAB 1: STREAM WRITE */}
      {activeTab === 'STREAM_WRITE' && (
        <div className="flex-1 flex flex-col min-h-0 p-3 overflow-y-auto bg-surface-2/40 space-y-2.5">
          {/* V2.0 Hierarchical Continuity Context Card */}
          {creationContext && (
            <div className="mb-2 bg-surface border border-line rounded-xl overflow-hidden shadow-2xs font-serif shrink-0">
              <div
                onClick={() => setShowHierarchyContext((v) => !v)}
                className="px-2.5 py-1.5 bg-surface-2/50 flex items-center justify-between cursor-pointer hover:bg-surface-3/80 transition select-none text-[11px] gap-2"
              >
                <div className="flex items-center gap-1.5 text-[#5a5247] min-w-0 flex-1">
                  <Layers className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-semibold text-ink truncate">
                    创作层级定位：
                    {creationContext.part_title ? `${creationContext.part_title} · ` : ''}
                    {creationContext.volume_title ? `${creationContext.volume_title} · ` : ''}
                    第 {creationContext.chapter_number} 章
                    {creationContext.scene_title ? ` · 幕: ${creationContext.scene_title}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const snippet = `\n【当前层级规划目标与因果约束】\n- 章节目标：${creationContext.chapter_goal || '顺承推进'}\n${creationContext.scene_objective ? `- 当前场景目标：${creationContext.scene_objective}\n` : ''}${creationContext.associated_main_lines.length > 0 ? `- 主线因果：${creationContext.associated_main_lines.join('；')}\n` : ''}`;
                      setInstruction((prev) => prev ? `${prev}\n${snippet}` : snippet.trim());
                      setStatusMessage('已将当前层级目标与剧情因果注入写作指令！');
                    }}
                    className="text-[10px] text-primary hover:text-primary font-bold bg-amber-800/10 px-1.5 py-0.5 rounded border border-amber-800/20 whitespace-nowrap shrink-0"
                    title="将本场景与大纲剧情因果一键插入写作指令输入框"
                  >
                    + 注入上下文
                  </button>
                  <span className="text-[10px] text-ink-2 whitespace-nowrap shrink-0">
                    {showHierarchyContext ? '收起' : '展开'}
                  </span>
                </div>
              </div>

              {showHierarchyContext && (
                <div className="p-2.5 text-[11px] text-[#5a5247] space-y-2 bg-surface border-t border-line max-h-48 overflow-y-auto">
                  {creationContext.scene_title && (
                    <div className="bg-surface p-2 rounded-lg border border-[#e3d9c7]">
                      <strong className="text-emerald-900 block mb-0.5">当前场景细纲目标：</strong>
                      <p className="text-ink">{creationContext.scene_objective || '未设定具体场景目标'}</p>
                    </div>
                  )}

                  {creationContext.scene_beats && creationContext.scene_beats.length > 0 && (
                    <div>
                      <strong className="text-primary block mb-1">细粒度节拍进展 ({creationContext.scene_beats.length})：</strong>
                      <div className="space-y-1">
                        {creationContext.scene_beats.map((b) => (
                          <div key={b.id} className="flex items-center justify-between text-[10px] bg-[#f2ebe0] px-2 py-1 rounded border border-line">
                            <span>[{b.beat_type}] {b.title}</span>
                            <span className="text-ink-2">{b.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {creationContext.associated_main_lines.length > 0 && (
                    <div>
                      <strong className="text-rose-900 block mb-0.5">关联主线因果：</strong>
                      <ul className="list-disc list-inside text-[10px] text-ink-2 space-y-0.5">
                        {creationContext.associated_main_lines.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {creationContext.associated_character_arcs.length > 0 && (
                    <div>
                      <strong className="text-emerald-900 block mb-0.5">关联人物成长弧：</strong>
                      <ul className="list-disc list-inside text-[10px] text-ink-2 space-y-0.5">
                        {creationContext.associated_character_arcs.map((ca, idx) => (
                          <li key={idx}>{ca}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Action Presets */}
          <div className="mb-2 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-ink-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                高频创作触发动作
              </label>
              <button
                onClick={() => setShowAdvancedSettings((v) => !v)}
                className="text-[10px] text-primary hover:text-primary flex items-center gap-0.5"
              >
                <Sliders className="w-2.5 h-2.5" />
                {showAdvancedSettings ? '收起参数' : '生成参数'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1 w-full">
              {PROMPT_PRESETS.map((p) => (
                <button
                  key={p.shortLabel}
                  onClick={() => setInstruction(p.instruction)}
                  title={`${p.label}：${p.desc}`}
                  className="py-1 px-1 rounded text-[11px] text-center bg-surface hover:bg-surface-3 text-ink hover:text-[#1a1714] border border-line transition truncate shadow-xs font-medium cursor-pointer"
                >
                  {p.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Permanent Word Count & Length Mode Selector */}
          <div className="mb-2 p-1.5 rounded-lg bg-surface-2 dark:bg-[#201c18] border border-line dark:border-[#38322a] flex items-center justify-between gap-1 flex-wrap shrink-0">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[11px] font-semibold text-ink-2 dark:text-[#a09485] whitespace-nowrap">篇幅目标:</span>
              <div className="flex items-center gap-0.5 bg-surface dark:bg-[#1a1714] p-0.5 rounded-md border border-line dark:border-[#38322a]">
                {[
                  { label: '🤖 自适应', len: 0, tip: '让 AI 依据当前剧情烈度与事件自然节拍，自主权衡决定最佳篇幅 (不注水不草率)' },
                  { label: '一段话', len: 250, tip: '生成 1~2 个精炼段落 (约 250 字)' },
                  { label: '单场景', len: 800, tip: '展开当前场景冲突 (约 800 字)' },
                  { label: '半章', len: 1500, tip: '推演较长情节小节 (约 1500 字)' },
                  { label: '全章生成', len: 3000, tip: '完整独立章节起承转合 (约 3000 字)' },
                ].map((item) => (
                  <button
                    key={item.len}
                    type="button"
                    onClick={() => setTargetLength(item.len)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition whitespace-nowrap cursor-pointer ${
                      targetLength === item.len
                        ? 'bg-amber-800 text-white font-bold shadow-2xs'
                        : 'text-ink-2 hover:text-ink hover:bg-surface-3-hover'
                    }`}
                    title={item.tip}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Word Count Input */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <span className="text-[10px] text-ink-2">自定义:</span>
              <input
                type="number"
                min={50}
                max={8000}
                step={50}
                value={targetLength === 0 ? '' : targetLength}
                placeholder={targetLength === 0 ? '自适应' : '300'}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTargetLength(isNaN(val) ? 0 : Math.max(50, Math.min(8000, val)));
                }}
                className="w-16 px-1 py-0.5 text-[11px] font-mono text-center bg-surface dark:bg-[#1a1714] border border-line dark:border-[#38322a] rounded text-ink dark:text-[#ede6dc] focus:outline-hidden focus:border-amber-700 placeholder:text-primary dark:placeholder:text-amber-400 placeholder:font-sans placeholder:font-semibold"
                title="自定义 AI 单次生成目标字数 (50~8000 字)；选择【自适应】时由 AI 自主判断"
              />
              <span className="text-[10px] text-ink-2">{targetLength === 0 ? '模式' : '字'}</span>
            </div>
          </div>

          {/* Advanced Generation Settings Collapsible (文风与发散度) */}
          {showAdvancedSettings && (
            <div className="p-2 mb-2 rounded-lg bg-surface-2 dark:bg-[#201c18] border border-line dark:border-[#38322a] text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-ink-2 font-medium whitespace-nowrap">文风基调:</span>
                <select
                  value={styleMode}
                  onChange={(e) => setStyleMode(e.target.value)}
                  className="bg-surface dark:bg-[#1a1714] border border-line dark:border-[#38322a] rounded px-1.5 py-0.5 text-[11px] text-ink dark:text-[#ede6dc] max-w-[155px] truncate"
                >
                  <option value="网文快节奏">现代流行（快节奏爽文）</option>
                  <option value="古典仙侠风骨">古典仙侠（辞藻雅正有留白）</option>
                  <option value="硬核严谨纪实">冷峻硬核（重逻辑与细节）</option>
                  <option value="悬疑惊悚暗流">悬疑暗流（重氛围与感官）</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-ink-2 font-medium whitespace-nowrap">
                  发散度 (Creativity): <strong className="font-mono text-primary dark:text-amber-300">{creativity}</strong>
                </span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={creativity}
                  onChange={(e) => setCreativity(parseFloat(e.target.value))}
                  className="w-20 sm:w-28 accent-amber-800 h-1 shrink-0"
                />
              </div>
            </div>
          )}

          {/* Prompt Instruction Input */}
          <div className="flex flex-col shrink-0 min-h-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-ink-2 dark:text-[#a09485]">
                创作指令与剧情推进
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOptimizePrompt('STREAM_WRITE')}
                  disabled={isOptimizingPrompt || !instruction.trim()}
                  className="text-[10px] text-primary dark:text-amber-300 font-bold bg-gradient-to-r from-amber-600/15 to-amber-800/20 hover:from-amber-600/25 hover:to-amber-800/30 px-2 py-0.5 rounded border border-amber-800/30 dark:border-amber-400/30 flex items-center gap-1 transition shadow-2xs disabled:opacity-40 cursor-pointer"
                  title="运用小说戏剧博弈、多维感官白描与断章悬念，将粗糙想法重构为专业文学指令"
                >
                  <Sparkles className="w-2.5 h-2.5 text-primary dark:text-amber-400" />
                  AI 优化提示词
                </button>
                {stashedDrafts.length > 0 && (
                  <button
                    onClick={() => setShowStashDrawer((v) => !v)}
                    className="text-[10px] text-primary dark:text-amber-400 hover:text-primary font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Bookmark className="w-2.5 h-2.5" />
                    候选草稿箱 ({stashedDrafts.length})
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="例如：写主角进入藏经阁第七层，发现失传古籍中的惊人秘密，与守阁长老产生言语交锋..."
              className="w-full h-18 bg-surface dark:bg-[#1a1714] border border-line dark:border-[#38322a] rounded-lg p-2 text-xs text-ink dark:text-[#ede6dc] placeholder-[#9e9383] dark:placeholder-[#786e60] focus:outline-hidden focus:border-amber-700 resize-none mb-2"
            />

            {/* Prompt Optimizer Review Card */}
            {renderPromptOptimizerCard('STREAM_WRITE')}

            <button
              onClick={handleStartGeneration}
              disabled={isGenerating || !activeChapter}
              className="w-full py-2 rounded-lg bg-amber-800 hover:bg-amber-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition shadow-sm disabled:opacity-40 mb-2 active:scale-98 cursor-pointer"
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
          </div>

          {/* Output stream display or Draft Stash drawer */}
          {showStashDrawer ? (
            <div className="flex-1 min-h-[220px] flex flex-col border border-line dark:border-[#38322a] rounded-lg bg-surface dark:bg-[#1a1714] p-2.5 shadow-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-line dark:border-[#38322a] mb-2">
                <span className="text-xs font-semibold text-primary dark:text-amber-400 flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-primary dark:text-amber-400" />
                  候选草稿暂存箱 ({stashedDrafts.length})
                </span>
                <button
                  onClick={() => setShowStashDrawer(false)}
                  className="text-[11px] text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#ede6dc] cursor-pointer"
                >
                  返回写作
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {stashedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-2 rounded-lg bg-surface-2 dark:bg-[#231e1a] border border-line dark:border-[#38322a] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-ink-2 dark:text-[#a09485]">
                      <span>{draft.createdAt}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(draft.text)}
                          className="hover:text-black dark:hover:text-white cursor-pointer"
                          title="复制"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleRemoveStashedDraft(draft.id)}
                          className="hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-ink dark:text-[#ede6dc] line-clamp-3 font-serif bg-white/70 dark:bg-[#161412] p-1 rounded">
                      {draft.text}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        onClick={() => handleApplyStashedDraft(draft.text, 'APPEND')}
                        className="px-2 py-0.5 rounded bg-emerald-800/10 dark:bg-emerald-400/15 text-emerald-800 dark:text-emerald-300 text-[10px] font-medium hover:bg-emerald-800/20 cursor-pointer"
                      >
                        追加到正文
                      </button>
                      <button
                        onClick={() => handleApplyStashedDraft(draft.text, 'REPLACE')}
                        className="px-2 py-0.5 rounded bg-amber-800/10 dark:bg-amber-400/15 text-primary dark:text-amber-300 text-[10px] font-medium hover:bg-amber-800/20 cursor-pointer"
                      >
                        替换正文
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-[220px] flex flex-col border border-line dark:border-[#38322a] rounded-lg bg-surface dark:bg-[#1a1714] p-2.5 shadow-xs">
              {/* 顶栏第一行：标题、字数与草稿动作 */}
              <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-line dark:border-[#38322a]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-semibold text-ink-2 dark:text-[#a09485] truncate">
                    实时正文草稿
                  </span>
                  <span className="text-[10px] text-ink-2 dark:text-[#a09485] font-mono whitespace-nowrap bg-[#efe7da] dark:bg-[#25201c] px-1 py-0.2 rounded border border-line dark:border-[#38322a] shrink-0">
                    {streamResult.length}{fullStreamResult && fullStreamResult.length !== streamResult.length ? `/${fullStreamResult.length}` : ''} 字
                  </span>
                </div>

                  <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                    {/* 打字中随时可一键跳过 */}
                    {isTyping && (
                      <button
                        onClick={flushAll}
                        className="text-[10px] text-primary bg-amber-800/10 hover:bg-amber-800/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium transition animate-pulse shrink-0 whitespace-nowrap"
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
                          className="text-[10px] text-primary hover:text-primary flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded hover:bg-amber-800/10 transition shrink-0 whitespace-nowrap"
                          title="存入候选草稿箱"
                        >
                          <Bookmark className="w-3 h-3 shrink-0" />
                          暂存
                        </button>
                        <button
                          onClick={() => handleCopy(fullStreamResult || streamResult)}
                          className="text-[10px] text-ink-2 hover:text-ink flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-surface-3 transition shrink-0 whitespace-nowrap"
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
                <div className="flex items-center justify-between px-2 py-1 mb-1.5 bg-[#efe7da]/70 dark:bg-[#25201c] rounded-md border border-line dark:border-[#38322a] text-[10px] shrink-0">
                  <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                    <button
                      onClick={() => setTypewriterEnabled(!typewriterEnabled)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition font-medium shrink-0 whitespace-nowrap cursor-pointer ${
                        typewriterEnabled ? 'bg-amber-800/15 dark:bg-amber-400/15 text-primary dark:text-amber-300 font-semibold' : 'text-ink-2 dark:text-[#a09485] hover:text-[#423d33] dark:hover:text-[#ede6dc]'
                      }`}
                      title={typewriterEnabled ? "已开启拟真作家打字机（点击切换为极速直出）" : "已开启极速直出模式（点击开启拟真打字机）"}
                    >
                      <Keyboard className="w-2.5 h-2.5 shrink-0" />
                      {typewriterEnabled ? '打字机' : '极速直出'}
                    </button>

                    {typewriterEnabled && (
                      <>
                        <span className="text-[9px] text-[#c5bba8] dark:text-[#554b3f] select-none">|</span>
                        <div className="flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                          {([
                            { id: 'slow', label: '沉思', tip: '沉思品味：逐字推敲 (约7~8字/s)' },
                            { id: 'normal', label: '作家', tip: '作家手速：自然词组心流 (约13~15字/s)' },
                            { id: 'fast', label: '泉涌', tip: '文思泉涌：快速成文 (约25~30字/s)' },
                          ] as const).map(({ id, label, tip }) => (
                            <button
                              key={id}
                              onClick={() => setTypewriterSpeed(id)}
                              className={`px-1.5 py-0.5 rounded transition shrink-0 whitespace-nowrap cursor-pointer ${
                                typewriterSpeed === id
                                  ? 'bg-amber-800 text-white font-bold shadow-xs'
                                  : 'text-ink-2 dark:text-[#a09485] hover:text-ink dark:hover:text-[#ede6dc] hover:bg-white/60 dark:hover:bg-white/10'
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
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition shrink-0 whitespace-nowrap cursor-pointer ${
                          soundEnabled ? 'text-primary dark:text-amber-300 bg-amber-800/15 dark:bg-amber-400/15 font-semibold' : 'text-[#a89f92] dark:text-[#786e60] hover:text-ink-2 dark:hover:text-[#a09485]'
                        }`}
                        title={soundEnabled ? "机械按键音已开启（点击静音）" : "机械按键音已静音（点击开启）"}
                      >
                        {soundEnabled ? <Volume2 className="w-2.5 h-2.5 shrink-0" /> : <VolumeX className="w-2.5 h-2.5 shrink-0" />}
                        <span className="text-[9px]">{soundEnabled ? '音效开' : '静音'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto text-xs text-ink dark:text-[#ede6dc] whitespace-pre-wrap leading-relaxed select-text font-serif pr-1">
                  {streamResult ? (
                    <>
                      {streamResult}
                      {(isGenerating || isTyping) && (
                        <span 
                          className="inline-block w-1.5 h-3.5 ml-0.5 bg-[#854d0e] dark:bg-amber-500 animate-pulse align-middle rounded-xs shadow-xs" 
                          title="作家 Agent 正在码字中..."
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-[#a89f92] dark:text-[#786e60] italic select-none">
                      点击上方启动后，Agent 将在此处实时流式输出生成的正文草稿...
                    </span>
                  )}
                </div>

                {streamResult && !isGenerating && !isTyping && (
                  <div className="pt-2 border-t border-line dark:border-[#38322a] grid grid-cols-2 gap-2 mt-2 shrink-0">
                    <button
                      onClick={handleAppendToEditor}
                      className="py-1.5 px-2 rounded bg-emerald-800/10 dark:bg-emerald-400/15 hover:bg-emerald-800/20 dark:hover:bg-emerald-400/25 text-emerald-800 dark:text-emerald-300 border border-emerald-800/25 dark:border-emerald-400/30 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      追加到文末
                    </button>
                    <button
                      onClick={handleReplaceEditor}
                      className="py-1.5 px-2 rounded bg-amber-800/10 dark:bg-amber-400/15 hover:bg-amber-800/20 dark:hover:bg-amber-400/25 text-primary dark:text-amber-300 border border-amber-800/25 dark:border-amber-400/30 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <FileCheck2 className="w-3 h-3" />
                      替换正文
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* TAB 2: COLLABORATIVE PIPELINE */}
      {activeTab === 'COLLABORATE' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-2/40">
          <div className="p-2.5 rounded-lg bg-surface border border-line text-xs text-ink shadow-xs">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-primary">
              <Layers className="w-3.5 h-3.5 text-primary" />
              多 Agent 协作工作流 (Pipeline)
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed">
              自动化流水线调度：由章节编剧 (Scene Planner) 拆解场景节拍，再由正文作家 (Prose Writer) 撰写草稿，最后由逻辑审稿 (Continuity Auditor) 自动出具质检报告。
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-ink-2">
                本章剧情核心推进目标 *
              </label>
              <button
                type="button"
                onClick={() => handleOptimizePrompt('WORKFLOW_GOAL')}
                disabled={isOptimizingPrompt || !workflowGoal.trim()}
                className="text-[10px] text-primary font-bold bg-gradient-to-r from-amber-600/15 to-amber-800/20 hover:from-amber-600/25 hover:to-amber-800/30 px-2 py-0.5 rounded border border-amber-800/30 flex items-center gap-1 transition shadow-2xs disabled:opacity-40 cursor-pointer"
                title="运用小说戏剧博弈、多维感官白描与断章悬念重构全流程创作目标"
              >
                <Sparkles className="w-2.5 h-2.5 text-primary" />
                AI 优化目标指令
              </button>
            </div>
            <textarea
              value={workflowGoal}
              onChange={(e) => setWorkflowGoal(e.target.value)}
              placeholder="例如：揭开先驱者号主引擎失谐之谜，林远与安雅在引力雷区产生战术分歧，最终冒险跃迁。"
              rows={3}
              className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none mb-2"
            />
            {renderPromptOptimizerCard('WORKFLOW_GOAL')}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-ink-2 dark:text-[#a09485]">
                期望篇幅 (字数)
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-ink-2">自定义:</span>
                <input
                  type="number"
                  min={800}
                  max={8000}
                  step={500}
                  value={workflowWordCount === 0 ? '' : workflowWordCount}
                  placeholder={workflowWordCount === 0 ? '自适应' : '3000'}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setWorkflowWordCount(isNaN(val) ? 0 : Math.max(800, Math.min(8000, val)));
                  }}
                  className="w-16 px-1.5 py-0.5 text-[11px] font-mono text-center bg-surface dark:bg-[#1a1714] border border-line dark:border-[#38322a] rounded text-ink dark:text-[#ede6dc] placeholder:text-primary dark:placeholder:text-amber-400 placeholder:font-sans placeholder:font-semibold"
                  title="自定义全流程生成目标字数 (800~8000字)；选择【自适应】时由主编与作家 Agent 依情节自动调配"
                />
                <span className="text-[10px] text-ink-2">{workflowWordCount === 0 ? '模式' : '字'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { label: '🤖 自适应', val: 0 },
                { label: '1500 字', val: 1500 },
                { label: '2500 字', val: 2500 },
                { label: '3000 字', val: 3000 },
                { label: '4000 字', val: 4000 },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setWorkflowWordCount(item.val)}
                  className={`px-2 py-1 rounded text-xs border transition cursor-pointer ${
                    workflowWordCount === item.val
                      ? 'bg-amber-800/15 border-amber-800 text-primary dark:text-amber-300 font-semibold shadow-xs'
                      : 'bg-surface dark:bg-[#1a1714] border-line dark:border-[#38322a] text-ink-2 hover:text-ink'
                  }`}
                >
                  {item.label}
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
            <div className="space-y-3 pt-2 border-t border-line">
              <div className="p-2.5 rounded-lg bg-surface border border-line space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
                    编剧拆解的场景节拍 ({workflowResult.planned_scenes.length} 幕)
                  </span>
                </div>
                <div className="space-y-1.5">
                  {workflowResult.planned_scenes.map((s) => (
                    <div key={s.id} className="p-2 rounded bg-surface border border-[#e3d9c7] text-xs">
                      <div className="font-semibold text-primary">
                        场次 {s.sequence}：{s.objective}
                      </div>
                      <div className="text-[11px] text-ink-2 mt-0.5">{s.outline}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-line space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink">
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
                <div className="max-h-40 overflow-y-auto text-xs text-ink font-serif leading-relaxed whitespace-pre-wrap p-2 bg-surface rounded border border-[#e3d9c7]">
                  {workflowResult.generated_draft}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTINUITY AUDIT */}
      {activeTab === 'CONTINUITY' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-2/40">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-ink">逻辑审稿与设定核查</h3>
              <p className="text-[11px] text-ink-2">核查人物性格、世界法则与时间线冲突</p>
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
              <div className="p-3 rounded-xl bg-surface border border-line flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[11px] text-ink-2">本章综合合规评分</div>
                  <div className="text-2xl font-bold text-ink mt-0.5">
                    {reviewReport.score} <span className="text-xs font-normal text-ink-2">/ 100</span>
                  </div>
                </div>
                <div className="text-right max-w-[170px] sm:max-w-sm md:max-w-xl">
                  <span className="text-[11px] text-primary font-medium line-clamp-2">
                    {reviewReport.summary}
                  </span>
                </div>
              </div>

              {/* Findings List */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-ink-2">
                  审查发现与整改建议 ({reviewReport.findings.length})
                </div>

                {reviewReport.findings.length === 0 ? (
                  <div className="py-6 text-center text-xs text-ink-2 border border-dashed border-line rounded-lg bg-surface">
                    未发现设定冲突或逻辑硬伤，剧情逻辑严密！
                  </div>
                ) : (
                  reviewReport.findings.map((f) => {
                    const isResolved = f.status === 'RESOLVED';
                    const severityColor =
                      f.severity === 'CRITICAL'
                        ? 'border-rose-300 bg-rose-50 text-rose-900'
                        : f.severity === 'MAJOR'
                        ? 'border-amber-300 bg-amber-50 text-primary'
                        : 'border-orange-200 bg-orange-50 text-orange-950';

                    return (
                      <div
                        key={f.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isResolved ? 'opacity-50 border-line bg-[#eae3d4]' : severityColor
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/70 border border-current">
                            {f.severity} · {f.category}
                          </span>
                          <button
                            onClick={() => handleToggleFindingStatus(f.id, f.status)}
                            className="text-[11px] text-ink-2 hover:text-ink flex items-center gap-1"
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isResolved ? 'text-emerald-700' : ''}`} />
                            {isResolved ? '已解决' : '标记已改'}
                          </button>
                        </div>

                        <div className="text-xs font-semibold text-ink">{f.title}</div>
                        <div className="text-[11px] text-ink mt-1 leading-relaxed">
                          {f.description}
                        </div>

                        {f.evidence_quote && (
                          <div className="mt-1.5 p-1.5 rounded bg-white/60 border border-[#e3d9c7] text-[11px] text-ink-2 italic">
                            “{f.evidence_quote}”
                          </div>
                        )}

                        <div className="mt-1.5 text-[11px] text-primary font-medium">
                          修改建议：{f.suggestion}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-ink-2 border border-dashed border-line rounded-lg bg-surface">
              点击“执行审稿”对当前正文进行全面逻辑因果体检
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STYLE POLISH */}
      {activeTab === 'STYLE_POLISH' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface-2/40">
          <div className="p-2.5 rounded-lg bg-surface border border-line text-xs text-ink shadow-xs">
            <div className="font-semibold mb-1 flex items-center gap-1.5 text-primary">
              <Wand2 className="w-3.5 h-3.5 text-primary" />
              Humanizer 文学精修守则
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed">
              坚决剔除“AI 腔调”与空洞说明文套话，清退策划/引擎术语，增强微表情、对话留白与临场动作呼吸感。
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-2 block mb-1">
              待润色正文选段
            </label>
            <textarea
              value={polishInput}
              onChange={(e) => setPolishInput(e.target.value)}
              placeholder="粘贴或输入需要润色的段落（留空则默认截取当前正文前段）..."
              rows={4}
              className="w-full bg-surface border border-line rounded-lg p-2 text-xs text-ink placeholder-[#9e9383] focus:outline-hidden focus:border-amber-700 resize-none"
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
            <div className="space-y-3 pt-2 border-t border-line">
              <div className="text-[11px] text-ink-2 italic">
                {polishResult.summary}
              </div>

              {polishResult.revisions.map((rev, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-surface border border-line space-y-2 shadow-xs">
                  <div className="text-[11px] text-ink-2 line-through">
                    原文：{rev.original_text}
                  </div>
                  <div className="text-xs text-ink font-serif leading-relaxed bg-surface p-2.5 rounded border border-[#e3d9c7]">
                    精修：{rev.revised_text}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-primary">
                    <span>理由：{rev.rationale}</span>
                    <button
                      onClick={() => handleCopy(rev.revised_text)}
                      className="text-ink-2 hover:text-ink flex items-center gap-0.5"
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
        <div className="flex-1 overflow-y-auto p-3 space-y-3.5 bg-surface-2/40">
          {/* Card 1: Name Forge */}
          <div className="p-3 rounded-xl bg-surface border border-line shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Dice5 className="w-3.5 h-3.5 text-primary" />
                起名大师 · 灵感神兵殿
              </span>
              <button
                onClick={() => handleGenerateNames(nameCategory)}
                className="px-2 py-0.5 rounded bg-amber-800/10 text-primary text-[10px] font-semibold hover:bg-amber-800/20 flex items-center gap-1 transition"
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
                      : 'bg-[#efe7da] text-ink-2 hover:bg-surface-3-hover'
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
                  className="py-4 text-center text-[11px] text-ink-2 border border-dashed border-line rounded-lg cursor-pointer hover:bg-[#f5efe4]"
                >
                  点击“换一批”或选择分类生成名字与神兵法宝
                </div>
              ) : (
                generatedNames.map((name, i) => (
                  <div
                    key={i}
                    className="p-1.5 rounded bg-surface hover:bg-[#f0e7d5] border border-line flex items-center justify-between text-xs transition"
                  >
                    <span className="font-serif text-ink select-all font-medium">
                      {name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setInstruction((prev) => (prev ? `${prev}，登场角色/道具包括：${name.split(' ')[0]}` : `登场角色/道具：${name.split(' ')[0]}`));
                          setActiveTab('STREAM_WRITE');
                          setStatusMessage(`已将【${name.split(' ')[0]}】填入创作指令！`);
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-amber-800/10 text-primary hover:bg-amber-800/20"
                        title="填入指令"
                      >
                        填入
                      </button>
                      <button
                        onClick={() => handleCopy(name.split(' ')[0])}
                        className="p-1 text-ink-2 hover:text-ink"
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
          <div className="p-3 rounded-xl bg-surface border border-line shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-primary" />
                网文敏感合规自查
              </span>
              <button
                onClick={handleScanAuditWords}
                className="px-2 py-0.5 rounded bg-amber-800 text-white text-[10px] font-semibold hover:bg-amber-700 transition"
              >
                扫描本章正文
              </button>
            </div>
            <p className="text-[10px] text-ink-2 leading-relaxed">
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
          <div className="p-3 rounded-xl bg-surface border border-line shadow-xs space-y-2">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-primary" />
              黄金三章张力自测指南
            </span>
            <div className="text-[11px] text-ink-2 space-y-1 leading-relaxed">
              <p>• <strong>第1章 破局点：</strong>切忌大段说明文，开篇 300 字内必须给主角抛出危机或反常事件。</p>
              <p>• <strong>第2章 欲望线：</strong>主角面临的明确目标是什么？失败的毁灭性代价是什么？</p>
              <p>• <strong>第3章 强反转与金手指：</strong>底层规则破壁，爽点或命运转折降临，结尾设下巨大悬念钩子。</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
